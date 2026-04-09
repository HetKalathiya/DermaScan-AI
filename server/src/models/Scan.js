const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ScanSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  patient_id: { type: String, ref: 'Patient', required: true },
  image_url: { type: String, required: true },
  result: { type: String, enum: ['benign', 'malignant', 'pending'], default: 'pending' },
  condition: { type: String },
  risk_level: { type: Number, min: 0, max: 100 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Scan', ScanSchema);
