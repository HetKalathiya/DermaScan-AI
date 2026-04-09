const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // restrict in production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Clients can listen to these emitted events broadcasted from controllers:
    // new_scan, high_risk_alert, doctor_verified, new_subscription, scan_batch

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getSocketIO = () => {
  if (!io) {
    logger.error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getSocketIO };
