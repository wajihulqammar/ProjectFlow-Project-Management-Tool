const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

// PUT /api/comments/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

    comment.content = req.body.content || comment.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('author', 'name email avatar avatarColor');

    res.json({ comment });
  } catch (err) { next(err); }
});

// DELETE /api/comments/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });

    await Task.findByIdAndUpdate(comment.task, { $inc: { commentCount: -1 } });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
});

// POST /api/comments/:id/react
router.post('/:id/react', authenticate, async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const reaction = comment.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      const idx = reaction.users.indexOf(req.user._id);
      if (idx === -1) reaction.users.push(req.user._id);
      else reaction.users.splice(idx, 1);
      if (reaction.users.length === 0) {
        comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      comment.reactions.push({ emoji, users: [req.user._id] });
    }

    await comment.save();
    res.json({ reactions: comment.reactions });
  } catch (err) { next(err); }
});

module.exports = router;