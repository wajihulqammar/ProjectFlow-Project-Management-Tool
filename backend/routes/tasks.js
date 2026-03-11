const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/auth');

const logActivity = async (type, actor, projectId, taskId, extra = {}) => {
  try {
    await Activity.create({ type, actor, project: projectId, task: taskId, ...extra });
  } catch (e) {}
};

const checkProjectAccess = async (req, res, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return null; }
  const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
  const isOwner = project.owner.toString() === req.user._id.toString();
  if (!isMember && !isOwner) { res.status(403).json({ error: 'Access denied' }); return null; }
  return project;
};

// GET /api/tasks - Get tasks for a project
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { projectId, column, status, assignee, priority, type, search, page = 1, limit = 100, dueDate } = req.query;

    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await checkProjectAccess(req, res, projectId);
    if (!project) return;

    const filter = { project: projectId, isArchived: false };
    if (column) filter.column = column;
    if (status) filter.status = status;
    if (assignee) filter.assignees = assignee;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };
    if (dueDate === 'overdue') filter.dueDate = { $lt: new Date() };
    else if (dueDate === 'today') {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      filter.dueDate = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar avatarColor')
      .populate('creator', 'name email avatar avatarColor')
      .populate('parentTask', 'title taskNumber')
      .sort({ column: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({ tasks, total });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - Create task
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const project = await checkProjectAccess(req, res, req.body.project);
    if (!project) return;

    const { title, description, column, priority, type, assignees, dueDate, startDate, estimatedHours, points, tags, parentTask } = req.body;

    // Get max order in column
    const maxOrderTask = await Task.findOne({ project: req.body.project, column: column || 'backlog' })
      .sort({ order: -1 }).select('order');
    const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      title, description,
      project: req.body.project,
      column: column || 'backlog',
      status: column || 'backlog',
      priority, type, assignees, dueDate, startDate, estimatedHours, points, tags, parentTask,
      creator: req.user._id,
      order
    });

    await task.populate([
      { path: 'assignees', select: 'name email avatar avatarColor' },
      { path: 'creator', select: 'name email avatar avatarColor' }
    ]);

    await logActivity('task_created', req.user._id, task.project, task._id, {
      description: `Created task "${title}"`
    });

    const io = req.app.get('io');
    io?.to(`project:${task.project}`).emit('task:created', { task });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar avatarColor jobTitle')
      .populate('creator', 'name email avatar avatarColor')
      .populate('parentTask', 'title taskNumber')
      .populate('subtasks', 'title status priority taskNumber')
      .populate('watchers', 'name email avatar avatarColor')
      .populate('dependencies.task', 'title taskNumber status');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await checkProjectAccess(req, res, task.project);
    if (!project) return;

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await checkProjectAccess(req, res, task.project);
    if (!project) return;

    const allowedFields = ['title', 'description', 'column', 'status', 'priority', 'type', 'assignees', 'dueDate', 'startDate', 'estimatedHours', 'loggedHours', 'points', 'tags', 'labels', 'checklist', 'order', 'parentTask'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Sync status with column
    if (updates.column && !updates.status) updates.status = updates.column;
    if (updates.status === 'done' && !task.completedAt) updates.completedAt = new Date();
    if (updates.status && updates.status !== 'done') updates.completedAt = null;

    const before = { status: task.status, column: task.column, priority: task.priority };
    const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('assignees', 'name email avatar avatarColor')
      .populate('creator', 'name email avatar avatarColor');

    // Log what changed
    if (before.status !== updated.status) {
      await logActivity('status_changed', req.user._id, task.project, task._id, {
        metadata: { before: { status: before.status }, after: { status: updated.status } },
        description: `Changed status from "${before.status}" to "${updated.status}"`
      });
    }
    if (updates.column && before.column !== updates.column) {
      await logActivity('task_moved', req.user._id, task.project, task._id, {
        metadata: { before: { column: before.column }, after: { column: updates.column } },
        description: `Moved task to "${updates.column}"`
      });
    }

    const io = req.app.get('io');
    io?.to(`project:${task.project}`).emit('task:updated', { task: updated });

    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/reorder - Reorder tasks in kanban
router.patch('/reorder', authenticate, async (req, res, next) => {
  try {
    const { tasks, projectId } = req.body;
    // tasks: [{ id, column, order }]
    await Promise.all(tasks.map(({ id, column, order }) =>
      Task.findByIdAndUpdate(id, { column, status: column, order })
    ));

    const io = req.app.get('io');
    io?.to(`project:${projectId}`).emit('tasks:reordered', { tasks });

    res.json({ message: 'Tasks reordered' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await checkProjectAccess(req, res, task.project);
    if (!project) return;

    await Promise.all([
      Comment.deleteMany({ task: task._id }),
      task.deleteOne()
    ]);

    await logActivity('task_deleted', req.user._id, task.project, task._id, {
      description: `Deleted task "${task.title}"`
    });

    const io = req.app.get('io');
    io?.to(`project:${task.project}`).emit('task:deleted', { taskId: task._id });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id/comments
router.get('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comments = await Comment.find({ task: req.params.id })
      .populate('author', 'name email avatar avatarColor')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, [
  body('content').trim().notEmpty().withMessage('Comment content required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await Comment.create({
      content: req.body.content,
      task: task._id,
      project: task.project,
      author: req.user._id,
      mentions: req.body.mentions || []
    });

    await comment.populate('author', 'name email avatar avatarColor');
    
    await Task.findByIdAndUpdate(task._id, { $inc: { commentCount: 1 } });

    await logActivity('comment_added', req.user._id, task.project, task._id, {
      comment: comment._id,
      description: `Commented on task "${task.title}"`
    });

    const io = req.app.get('io');
    io?.to(`project:${task.project}`).emit('comment:added', { comment, taskId: task._id });

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:id/watch
router.post('/:id/watch', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isWatching = task.watchers.includes(req.user._id);
    if (isWatching) {
      task.watchers = task.watchers.filter(w => w.toString() !== req.user._id.toString());
    } else {
      task.watchers.push(req.user._id);
    }
    await task.save();

    res.json({ isWatching: !isWatching });
  } catch (err) {
    next(err);
  }
});

module.exports = router;