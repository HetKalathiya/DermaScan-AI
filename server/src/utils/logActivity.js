const ActivityLog = require('../models/ActivityLog');

const logActivity = async (actor, action, targetModel, targetId, req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const log = new ActivityLog({
      actor,
      action,
      targetModel,
      targetId,
      ipAddress
    });
    await log.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = logActivity;
