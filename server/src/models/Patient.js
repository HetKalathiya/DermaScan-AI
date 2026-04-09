const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PatientSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  medical_history: { type: Array, default: [] },
});

module.exports = mongoose.model('Patient', PatientSchema);
