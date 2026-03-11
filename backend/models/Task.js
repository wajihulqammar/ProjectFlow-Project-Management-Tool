const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  description: {
    type: String,
    maxlength: [10000, 'Description cannot exceed 10000 characters'],
    default: ''
  },
  taskNumber: {
    type: Number
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  column: {
    type: String,
    required: true,
    default: 'backlog'
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'inprogress', 'review', 'done', 'cancelled'],
    default: 'backlog'
  },
  priority: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'urgent'],
    default: 'none'
  },
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'improvement', 'epic', 'story'],
    default: 'task'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  estimatedHours: {
    type: Number,
    min: 0
  },
  loggedHours: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  labels: [{
    name: String,
    color: String
  }],
  checklist: [{
    id: { type: String },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    order: { type: Number, default: 0 }
  }],
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  dependencies: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['blocks', 'blocked_by', 'relates_to'], default: 'relates_to' }
  }],
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for fast querying
taskSchema.index({ project: 1, column: 1, order: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ creator: 1 });
taskSchema.index({ title: 'text', description: 'text' });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'done' || this.status === 'cancelled') return false;
  return new Date(this.dueDate) < new Date();
});

// Virtual for checklist progress
taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return null;
  const completed = this.checklist.filter(item => item.completed).length;
  return {
    completed,
    total: this.checklist.length,
    percentage: Math.round((completed / this.checklist.length) * 100)
  };
});

// Auto-generate task number per project
taskSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Task = this.constructor;
    const lastTask = await Task.findOne({ project: this.project }).sort({ taskNumber: -1 });
    this.taskNumber = lastTask ? (lastTask.taskNumber || 0) + 1 : 1;
  }
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);