const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ActivityLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  type: { type: String, enum: ['scan', 'alert', 'doctor', 'subscription'], required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
