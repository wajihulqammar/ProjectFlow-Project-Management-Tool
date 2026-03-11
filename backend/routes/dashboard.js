const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Get all project IDs user belongs to
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isArchived: false
    }).distinct('_id');

    const [
      totalProjects,
      activeProjects,
      myTasks,
      overdueTasks,
      completedThisWeek,
      recentActivity,
      upcomingTasks
    ] = await Promise.all([

      Project.countDocuments({
        $or: [{ owner: userId }, { 'members.user': userId }],
        isArchived: false
      }),

      Project.countDocuments({
        $or: [{ owner: userId }, { 'members.user': userId }],
        status: { $in: ['active', 'planning'] },
        isArchived: false
      }),

      // Tasks assigned to me
      Task.countDocuments({
        project: { $in: userProjects },
        assignees: userId,
        isArchived: false,
        status: { $nin: ['done', 'cancelled'] }
      }),

      // All overdue tasks in my projects
      Task.countDocuments({
        project: { $in: userProjects },
        dueDate: { $lt: now },
        status: { $nin: ['done', 'cancelled'] },
        isArchived: false
      }),

      // Completed this week across my projects
      Task.countDocuments({
        project: { $in: userProjects },
        status: 'done',
        completedAt: { $gte: weekAgo }
      }),

      // Recent activity across my projects
      Activity.find({ project: { $in: userProjects } })
        .populate('actor', 'name avatar avatarColor')
        .populate('project', 'name color emoji')
        .populate('task', 'title taskNumber')
        .sort({ createdAt: -1 })
        .limit(15),

      // Upcoming tasks assigned to me
      Task.find({
        project: { $in: userProjects },
        assignees: userId,
        dueDate: { $gte: now, $lte: weekAhead },
        status: { $nin: ['done', 'cancelled'] },
        isArchived: false
      })
        .populate('project', 'name color emoji')
        .sort({ dueDate: 1 })
        .limit(10)
    ]);

    // Priority distribution across all tasks in user's projects
    const priorityDist = await Task.aggregate([
      {
        $match: {
          project: { $in: userProjects },
          isArchived: false,
          status: { $nin: ['done', 'cancelled'] }
        }
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Completion trend last 7 days
    const trend = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);
        return Task.countDocuments({
          project: { $in: userProjects },
          status: 'done',
          completedAt: { $gte: start, $lte: end }
        }).then(count => ({ date: start.toISOString().split('T')[0], count }));
      })
    );

    // Projects with live progress
    const myProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isArchived: false,
      status: { $ne: 'archived' }
    })
      .populate('members.user', 'name avatar avatarColor')
      .sort({ updatedAt: -1 })
      .limit(6);

    const projectsWithProgress = await Promise.all(myProjects.map(async (p) => {
      const [total, completed, overdue] = await Promise.all([
        Task.countDocuments({ project: p._id, isArchived: false }),
        Task.countDocuments({ project: p._id, status: 'done', isArchived: false }),
        Task.countDocuments({
          project: p._id,
          dueDate: { $lt: now },
          status: { $nin: ['done', 'cancelled'] },
          isArchived: false
        })
      ]);
      return {
        ...p.toObject(),
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        completionPercentage: total === 0 ? 0 : Math.round((completed / total) * 100)
      };
    }));

    res.json({
      stats: { totalProjects, activeProjects, myTasks, overdueTasks, completedThisWeek },
      recentActivity,
      upcomingTasks,
      priorityDistribution: priorityDist,
      completionTrend: trend.reverse(),
      projects: projectsWithProgress
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;