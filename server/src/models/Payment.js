const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PaymentSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
