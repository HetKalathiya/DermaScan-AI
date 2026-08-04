const Notification = require('../models/Notification');

// GET /api/notifications — get all for logged-in user
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ created_at: -1 })
            .limit(50);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        res.json({ success: true, data: notifications, unreadCount });
    } catch (err) {
        next(err);
    }
};

// PUT /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { is_read: true }
        );
        res.json({ success: true, message: 'Marked as read' });
    } catch (err) {
        next(err);
    }
};

// PUT /api/notifications/read-all — mark all as read
const markAllRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, is_read: false },
            { is_read: true }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/notifications/:id — delete one
const deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getNotifications, markAsRead, markAllRead, deleteNotification };
