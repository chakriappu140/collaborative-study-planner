// backend/server.js (UPDATED for Socket.IO)
import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO and attach it to the HTTP server
const io = new Server(server, {
  cors: {
    origin: '*', // We'll update this for production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Middleware to inject `io` into every request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/tasks', taskRoutes);
app.use('/api/groups/:groupId/calendar', calendarRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Handle Socket.IO connections and events
io.on('connection', (socket) => {
  console.log('🔗 A user connected with id:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group room: ${groupId}`);
  });

  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.id} left group room: ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected with id:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Start the server using `server.listen` instead of `app.listen`
server.listen(PORT, () => {
  console.log(`✅ Server running in development mode on port ${PORT}`);
});
