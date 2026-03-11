const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

// Helper to log activity
const logActivity = async (type, actor, projectId, extra = {}) => {
  try {
    await Activity.create({ type, actor, project: projectId, ...extra });
  } catch (e) {}
};

// GET /api/projects - Get all projects for user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const filter = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ],
      isArchived: false
    };

    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner', 'name email avatar avatarColor')
        .populate('members.user', 'name email avatar avatarColor')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(filter)
    ]);

    // Add task counts
    const projectsWithMetrics = await Promise.all(projects.map(async (project) => {
      const obj = project.toObject();
      const [total, completed, overdue] = await Promise.all([
        Task.countDocuments({ project: project._id, isArchived: false }),
        Task.countDocuments({ project: project._id, status: 'done', isArchived: false }),
        Task.countDocuments({ 
          project: project._id, 
          dueDate: { $lt: new Date() }, 
          status: { $nin: ['done', 'cancelled'] },
          isArchived: false
        })
      ]);
      obj.metrics = { totalTasks: total, completedTasks: completed, overdueTasks: overdue };
      obj.completionPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      obj.isFavorited = project.isFavorited?.some(id => id.toString() === req.user._id.toString());
      return obj;
    }));

    res.json({
      projects: projectsWithMetrics,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - Create project
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 150 }),
  body('description').optional().isLength({ max: 2000 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('visibility').optional().isIn(['private', 'team', 'public'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, description, priority, visibility, color, emoji, startDate, dueDate, tags } = req.body;

    const project = await Project.create({
      name,
      description,
      priority,
      visibility,
      color,
      emoji,
      startDate,
      dueDate,
      tags,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    await project.populate('owner', 'name email avatar avatarColor');
    await logActivity('project_created', req.user._id, project._id, {
      description: `Created project "${name}"`
    });

    // Emit socket event
    const io = req.app.get('io');
    io?.emit('project:created', { project, userId: req.user._id });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar avatarColor')
      .populate('members.user', 'name email avatar avatarColor jobTitle');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    if (!isMember && !isOwner && project.visibility === 'private') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ project: project._id, isArchived: false }),
      Task.countDocuments({ project: project._id, status: 'done', isArchived: false }),
      Task.countDocuments({ project: project._id, dueDate: { $lt: new Date() }, status: { $nin: ['done', 'cancelled'] }, isArchived: false })
    ]);

    const obj = project.toObject();
    obj.metrics = { totalTasks, completedTasks, overdueTasks };
    obj.completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    obj.isFavorited = project.isFavorited?.some(id => id.toString() === req.user._id.toString());

    res.json({ project: obj });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!isOwner && (!member || !['manager'].includes(member.role))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const allowedFields = ['name', 'description', 'status', 'priority', 'visibility', 'color', 'emoji', 'startDate', 'dueDate', 'tags', 'columns', 'settings'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const before = { name: project.name, status: project.status };
    const updated = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('owner', 'name email avatar avatarColor')
      .populate('members.user', 'name email avatar avatarColor');

    await logActivity('project_updated', req.user._id, project._id, {
      metadata: { before, after: updates },
      description: `Updated project "${updated.name}"`
    });

    const io = req.app.get('io');
    io?.to(`project:${req.params.id}`).emit('project:updated', { project: updated });

    res.json({ project: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete this project' });
    }

    await Promise.all([
      Task.deleteMany({ project: project._id }),
      Activity.deleteMany({ project: project._id }),
      project.deleteOne()
    ]);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/members - Add member
router.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ error: 'Only owner can add members' });

    const alreadyMember = project.members.some(m => m.user.toString() === userId);
    if (alreadyMember) return res.status(409).json({ error: 'User is already a member' });

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar avatarColor');

    await logActivity('member_added', req.user._id, project._id, {
      description: `Added new member to project`
    });

    const io = req.app.get('io');
    io?.to(`project:${req.params.id}`).emit('project:member_added', { userId, role });

    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();
    if (!isOwner && !isSelf) return res.status(403).json({ error: 'Insufficient permissions' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/favorite
router.post('/:id/favorite', authenticate, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const idx = project.isFavorited.indexOf(req.user._id);
    if (idx === -1) {
      project.isFavorited.push(req.user._id);
    } else {
      project.isFavorited.splice(idx, 1);
    }
    await project.save();

    res.json({ isFavorited: project.isFavorited.includes(req.user._id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;