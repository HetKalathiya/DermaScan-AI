const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ConsultationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  patient_id: { type: String, ref: 'User' },
  doctor_id: { type: String, ref: 'Doctor' },
  image_data: { type: String },
  status: { type: String, default: 'pending' },
  diagnosis: { type: String },
  appointment_date: { type: String },
  appointment_time: { type: String },
  message: { type: String },
  created_at: { type: Date, default: Date.now }
});

ConsultationSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Consultation', ConsultationSchema);
