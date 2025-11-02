const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, unique: true, sparse: true },
  department: { type: String },
  role: { type: String, enum: ['admin', 'supervisor', 'student'], required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);