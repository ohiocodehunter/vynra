import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import videoRoutes from './routes/video';
import userRoutes from './routes/users';
import playlistRoutes from './routes/playlists';
import commentRoutes from './routes/comments';
import studioRoutes from './routes/studio';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow all origins — mobile apps (React Native APK) don't send browser-style
// Origin headers, so a strict origin whitelist would block them silently.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any react-native / expo origin
    if (origin.startsWith('exp://') || origin.startsWith('exps://')) return callback(null, true);
    return callback(null, true); // permissive for now — lock down per-domain in production if needed
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json());

// Serve static files for local uploads (if R2 is not used)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/studio', studioRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Vynra Backend is running smoothly.' });
});

// Socket.IO for real-time features (comments, views, etc)
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vynra';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (IPv4)`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
app.use('/api/notifications', notificationRoutes);
