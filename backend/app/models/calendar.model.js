const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
  submissionNumber: { type: Number, required: true, min: 1, max: 3 },
  deadline: { type: Date, required: true },
});

const calendarSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  deadlines: [deadlineSchema],
}, { timestamps: true });

module.exports = mongoose.model('Calendar', calendarSchema);