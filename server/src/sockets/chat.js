const Message = require('../models/Message');

const chatSocket = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    console.log(`Socket connected to /chat: ${socket.id}`);

    socket.on('joinConsultation', (consultationId) => {
      socket.join(consultationId);
      console.log(`Socket ${socket.id} joined consultation ${consultationId}`);
    });

    socket.on('sendMessage', async ({ consultationId, senderId, text }) => {
      try {
        const message = new Message({ consultationId, senderId, text });
        await message.save();

        chatNamespace.to(consultationId).emit('receiveMessage', message);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('typing', ({ consultationId, senderId }) => {
      socket.to(consultationId).emit('typing', { senderId });
    });

    socket.on('stopTyping', ({ consultationId, senderId }) => {
      socket.to(consultationId).emit('stopTyping', { senderId });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected from /chat: ${socket.id}`);
    });
  });
};

module.exports = chatSocket;
