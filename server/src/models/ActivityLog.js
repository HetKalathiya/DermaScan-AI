const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ActivityLogSchema = new mongoose.Schema({
  _id:        { type: String, default: uuidv4 },
  type:       { type: String, enum: ['scan', 'alert', 'doctor', 'subscription', 'user'], required: true },
  message:    { type: String, required: true },
  actor:      { type: String, ref: 'User', default: null },   // User who triggered the action (nullable for system logs)
  actor_name: { type: String, default: 'System' },            // String fallback for display
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
