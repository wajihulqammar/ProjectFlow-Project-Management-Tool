// users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (search) filter.$text = { $search: search };
    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(parseInt(limit));
    res.json({ users });
  } catch (err) { next(err); }
});

router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });
    const users = await User.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('name email avatar avatarColor jobTitle').limit(10);
    res.json({ users });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;