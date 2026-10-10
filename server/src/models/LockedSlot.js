const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LockedSlotSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  doctor_id: { type: String, ref: 'Doctor', required: true, index: true },
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  time: { type: String }, // e.g., '09:00 AM' (can be null/empty if is_full_day is true)
  is_full_day: { type: Boolean, default: false },
  reason: { type: String, default: 'Unavailable' },
  created_at: { type: Date, default: Date.now }
});

// Composite index to quickly lookup locks for a doctor on a specific date
LockedSlotSchema.index({ doctor_id: 1, date: 1 });

LockedSlotSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('LockedSlot', LockedSlotSchema);
