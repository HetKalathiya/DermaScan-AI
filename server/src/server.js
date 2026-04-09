require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Connect Database
connectDB();

// Init Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
