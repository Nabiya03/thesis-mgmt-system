const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');


const commentSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['student', 'supervisor', 'admin'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  editedAt: { type: Date },
  isEdited: { type: Boolean, default: false }
}, { _id: false });



const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  supervisor_first: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supervisor_second: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  third_marker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },
  progess: {type : Number},
  department: { type: String },
  type: { type: String, enum: ['Research and development', 'Applied'], required: true }, // Updated enum
  status: { type: String, enum: ['assigned', 'available'], default: 'available' },
  appliedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  thirdMarkerRequired: { type: Boolean, default: false },
   comments: { type: [commentSchema], default: [] },
  adminDiscussion: { type: [commentSchema], default: [] },   // Admin ↔ Supervisors
  startDate: { type: Date },
  endDate: { type: Date },

    // New field for 3 deadlines
  deadlines: {
    first: { type: Date },
    second: { type: Date },
    third: { type: Date }
  },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Project', projectSchema);