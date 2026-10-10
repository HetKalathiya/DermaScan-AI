const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ScanSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  patient_id: { type: String, ref: 'User', required: true },
  image_url: { type: String, required: true },
  // Bug #1 Fix: Accept both lowercase (DB canonical) and Title Case (legacy)
  result: {
    type: String,
    enum: ['benign', 'malignant', 'pending', 'Benign', 'Malignant', 'Pending', 'Unknown', 'unknown'],
    default: 'pending'
  },
  condition: { type: String },
  risk_level: { type: Number, min: 0, max: 100, default: 0 },
  // Bug #2 Fix: Added confidence field that was being silently dropped
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  // Bug #6 Fix: Added consulted field for doctor review tracking
  consulted: { type: Boolean, default: false },
  // AI Model telemetry & diagnostic metadata
  top_diagnosis: { type: mongoose.Schema.Types.Mixed },
  probabilities: { type: mongoose.Schema.Types.Mixed },
  recommendation: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Scan', ScanSchema);

