const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['consultation_completed', 'appointment_confirmed', 'new_message', 'general'],
        default: 'general'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '/dashboard' },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
