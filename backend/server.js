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
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import directMessageRoutes from './routes/directMessageRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import path from "path";
import fs from "fs";

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Middleware
app.use(express.json());
app.use(cors());

// Make Socket.IO instance available to all routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/tasks', taskRoutes);
app.use('/api/groups/:groupId/calendar', calendarRoutes);
app.use("/api/groups/:groupId/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups/:groupId/files", fileRoutes);
app.use("/api/messages/direct", directMessageRoutes);

// Serve uploaded files statically
const __dirname = path.resolve();
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Socket.IO connections
io.on('connection', (socket) => {
    console.log('🔗 A user connected with id:', socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) {
        // Join the user into a private room named after their user ID
        socket.join(userId);
        console.log(`🔗 User ${userId} connected and joined their private room.`);
    }

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

server.listen(PORT, () => {
    console.log(`✅ Server running in development mode on port ${PORT}`);
});