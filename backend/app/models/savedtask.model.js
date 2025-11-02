// models/savedTask.models.js
const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  estimatedTime: {
    type: String
  },
  category: {
    type: String,
    enum: ['writing', 'research', 'development', 'analysis', 'planning'],
    default: 'planning'
  }
}, { _id: false });

const savedTaskSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  originalPrompt: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  tasks: [taskItemSchema],
  progress: {
    completed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  dueDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Update progress when tasks are modified
savedTaskSchema.pre('save', function(next) {
  if (this.isModified('tasks')) {
    const completedTasks = this.tasks.filter(task => task.completed).length;
    this.progress.completed = completedTasks;
    this.progress.total = this.tasks.length;
    this.progress.percentage = this.tasks.length > 0 ? Math.round((completedTasks / this.tasks.length) * 100) : 0;
    this.isCompleted = this.progress.percentage === 100;
  }
  next();
});

const SavedTask = mongoose.model('SavedTask', savedTaskSchema);

module.exports = SavedTask;