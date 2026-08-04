const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ConsultationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  patient_id: { type: String, ref: 'User' },
  doctor_id: { type: String, ref: 'Doctor' },
  claimed_by: { type: String, ref: 'User', default: null },
  image_data: { type: String },
  status: { type: String, default: 'pending' },
  diagnosis: { type: String },
  treatment: { type: String },
  follow_up: { type: String },
  appointment_date: { type: String },
  appointment_time: { type: String },
  message: { type: String },
  // Structured AI result fields — no more fragile regex parsing on frontend
  ai_condition: { type: String, default: 'Unknown' },
  ai_confidence: { type: Number, default: 0 },
  ai_result: { type: String, enum: ['benign', 'malignant', 'pending', 'unknown'], default: 'unknown' },
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
