const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { projectId, taskId, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (taskId) filter.task = taskId;

    const activities = await Activity.find(filter)
      .populate('actor', 'name email avatar avatarColor')
      .populate('project', 'name color emoji')
      .populate('task', 'title taskNumber')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ activities });
  } catch (err) { next(err); }
});

module.exports = router;