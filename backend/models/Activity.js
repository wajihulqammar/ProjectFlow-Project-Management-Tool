const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'project_created', 'project_updated', 'project_deleted', 'project_archived',
      'task_created', 'task_updated', 'task_deleted', 'task_moved', 'task_assigned',
      'task_completed', 'task_reopened', 'task_due_changed',
      'comment_added', 'comment_edited', 'comment_deleted',
      'member_added', 'member_removed', 'member_role_changed',
      'checklist_completed', 'attachment_added', 'status_changed', 'priority_changed'
    ],
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  metadata: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    extra: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String
  },
  isRead: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);