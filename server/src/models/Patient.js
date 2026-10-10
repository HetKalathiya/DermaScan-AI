const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PatientSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  skin_type: { type: String, default: 'Type II - Fair' },
  primary_concern: { type: mongoose.Schema.Types.Mixed, default: [] },
  had_skin_cancer: { type: Boolean, default: false },
  medical_history: { type: Array, default: [] },
  allergies: { type: String, default: '' },
  skincare_notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Patient', PatientSchema);
