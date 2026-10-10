const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient', 'admin'], default: 'patient' },
  name: { type: String },
  age: { type: Number },
  dob: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other', 'Male', 'Female', 'Other', 'Intersex', 'Prefer not to say', ''] },
  phone: { type: String },
  country: { type: String },
  location: { type: String },
  bio: { type: String, default: '' },
  blood_group: { type: String, default: '' },
  emergency_contact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  two_factor_enabled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
