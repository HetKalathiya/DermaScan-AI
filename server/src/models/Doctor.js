const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const DoctorSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  specialization: { type: String, default: 'Dermatologist' },
  license_number: { type: String },
  hospital_name: { type: String },
  verified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
