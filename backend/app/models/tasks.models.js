const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  description: String,
  difficulty: String,
  order: Number,
  tips: String,
  isCompleted: { type: Boolean, default: false }
});

const aiTaskSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  goal: String,
  tasks: [taskSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AITask", aiTaskSchema);
