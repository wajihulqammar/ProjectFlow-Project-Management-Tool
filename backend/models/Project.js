const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [150, 'Project name cannot exceed 150 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  emoji: {
    type: String,
    default: '📋'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  visibility: {
    type: String,
    enum: ['private', 'team', 'public'],
    default: 'team'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  columns: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#6b7280' },
    order: { type: Number, default: 0 },
    limit: { type: Number, default: null },
    isDefault: { type: Boolean, default: false }
  }],
  settings: {
    allowMemberInvite: { type: Boolean, default: true },
    taskNumbering: { type: Boolean, default: true },
    defaultView: { type: String, enum: ['kanban', 'list', 'calendar', 'gantt'], default: 'kanban' }
  },
  metrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    overdueTasks: { type: Number, default: 0 }
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isFavorited: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  if (this.metrics.totalTasks === 0) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.totalTasks) * 100);
});

// Virtual for health status
projectSchema.virtual('health').get(function() {
  if (this.status === 'completed') return 'completed';
  if (this.metrics.overdueTasks > 0) return 'at_risk';
  if (this.dueDate && new Date(this.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) return 'warning';
  return 'on_track';
});

// Pre-save: Add default columns if new
projectSchema.pre('save', function(next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: 'backlog', name: 'Backlog', color: '#6b7280', order: 0, isDefault: true },
      { id: 'todo', name: 'To Do', color: '#3b82f6', order: 1, isDefault: true },
      { id: 'inprogress', name: 'In Progress', color: '#f59e0b', order: 2, isDefault: true },
      { id: 'review', name: 'In Review', color: '#8b5cf6', order: 3, isDefault: true },
      { id: 'done', name: 'Done', color: '#10b981', order: 4, isDefault: true }
    ];
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);