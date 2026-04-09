const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ReviewSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  scan_id: { type: String, ref: 'Scan', required: true },
  doctor_id: { type: String, ref: 'Doctor' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', ReviewSchema);
