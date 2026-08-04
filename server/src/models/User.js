const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient', 'admin'], default: 'patient' },
  name: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other', ''] },
  phone: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
