const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient'], default: 'patient' },
  name: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
