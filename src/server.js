import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Database
connectDB();

const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Socket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_consultation', (consultationId) => {
    socket.join(consultationId);
    console.log(`User ${socket.id} joined consultation ${consultationId}`);
  });

  socket.on('send_message', async (data) => {
    const { consultationId, senderId, text, attachments } = data;
    
    // In production, save to DB here
    const Consultation = (await import('./models/Consultation.js')).default;
    await Consultation.findByIdAndUpdate(consultationId, {
      $push: { messages: { sender: senderId, text, attachments } }
    });

    io.to(consultationId).emit('receive_message', {
      consultationId,
      sender: senderId,
      text,
      attachments,
      timestamp: new Date(),
    });
  });

  // Signaling for WebRTC (Audio/Video Calls)
  socket.on('call_signal', (data) => {
    console.log(`Signal (${data.type}) from ${socket.id} to room ${data.consultationId}`);
    socket.to(data.consultationId).emit('call_signal', data);
  });

  socket.on('reject_call', (data) => {
    console.log(`Call rejected by ${socket.id} in room ${data.consultationId}`);
    socket.to(data.consultationId).emit('reject_call');
  });

  socket.on('end_call', (data) => {
    console.log(`Call ended by ${socket.id} in room ${data.consultationId}`);
    socket.to(data.consultationId).emit('end_call');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
});

export { io };
