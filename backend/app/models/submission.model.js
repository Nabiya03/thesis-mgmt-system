// const mongoose = require('mongoose');

// const submissionSchema = new mongoose.Schema({
//   projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   fileUrl: { type: String, required: true },
//   grade: { type: String },
//   feedback: { type: String },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Submission', submissionSchema);

const mongoose = require('mongoose');

// Grading by one supervisor
const gradingSchema = new mongoose.Schema({
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supervisorRole: { type: String, enum: ['supervisor_first', 'supervisor_second'], required: true },
  marks: { type: Number, required: true }, // e.g., 75
  grade: { type: String, enum: ['A*', 'A', 'B', 'C', 'D', 'F', 'G'], required: true }, // e.g., 'A'
  summativeAssessment: [
    {
      category: { type: String },
      grade: { type: String, enum: ['A*', 'A', 'B', 'C', 'D', 'F', 'G'] }
    }
  ],
  justification: { type: String },
  formativeFeedback: { type: String }
}, { _id: false });

// A single submission entry
const singleSubmissionSchema = new mongoose.Schema({
  s3Key: { type: String, required: true }, 
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: {type: String},
  grading: {
    type: [gradingSchema],
    validate: [gradingLimit, 'Maximum of 2 supervisor gradings allowed.']
  },
  finalGrade: { type: String }, // To be calculated from average of marks
  finalMarks: { type: Number }, // Optional: numeric average
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

function gradingLimit(val) {
  return val.length <= 2;
}



// Main Submission Record
const submissionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 
  submissions: {
    type: [singleSubmissionSchema],
    validate: [submissionLimit, 'Maximum of 3 submissions allowed.']
  },
  overallFinalGrade: { type: String }, // New: final grade after all submissions
  overallFinalMarks: { type: Number }, // Optional: numeric average
}, { timestamps: true });

function submissionLimit(val) {
  return val.length <= 3;
}

module.exports = mongoose.model('Submission', submissionSchema);
// This schema allows for multiple submissions per student per project, with each submission
// containing multiple grading entries from supervisors. The grading entries are limited to two,
// and each submission can have a maximum of three submissions. The final grade can be calculated
// based on the average of the marks given by the supervisors. Each submission also includes a file URL
// and a teacher ID for tracking who graded the submission. The schema is designed to be flexible and extensible.