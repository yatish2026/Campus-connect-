import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';
import Message from './models/message.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
// Validate required environment variables early to provide a clear error during deploy/startup
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please copy backend/.env.example to backend/.env and fill the values, or set the environment variables in your hosting platform.');
  // exit with non-zero code so deploys fail fast and do not start with missing secrets
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend'in çalıştığı URL
    credentials: true,
  })
);
// {
//   origin: "http://localhost:5173", // replace with your frontend URL
//   credentials: true,
// }

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Health endpoint for platform health checks
app.get('/api/health', async (req, res) => {
  try {
    // Use mongoose connection state if available
    const mongoose = (await import('mongoose')).default;
    const state = mongoose.connection && mongoose.connection.readyState;
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbConnected = state === 1;
    return res.json({ ok: true, dbConnected, readyState: state });
  } catch (err) {
    return res.json({ ok: true, dbConnected: false, error: String(err) });
  }
});

//!Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/connections", connectionRoutes);
import messageRoute from './routes/message.route.js';
app.use('/api/messages', messageRoute);
import clubRoute from './routes/club.route.js';
app.use('/api/clubs', clubRoute);
import searchRoute from './routes/search.route.js';
app.use('/api/search', searchRoute);
// Interview-prep routes removed

import fs from 'fs';

app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../../frontend/dist", "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  // If frontend isn't built, return a helpful message instead of throwing ENOENT.
  console.warn('Frontend build not found at', indexPath);
  return res.status(200).send(`
    <html>
      <head><title>ProConnect - Not Built</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h1>Frontend not built</h1>
        <p>The server is running but the frontend build is missing.</p>
        <p>Run <code>cd frontend && npm install && npm run build</code> locally, or ensure your deployment build step builds the frontend.</p>
      </body>
    </html>
  `);
});

// create http server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // for dev: tighten in production
    methods: ['GET', 'POST']
  }
});

// in-memory map of userId -> socketId (multiple sockets per user can be an array)
const onlineUsers = new Map();

io.use((socket, next) => {
  // optional: token in query: ?token=...
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next();
  try {
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set — socket auth skipped');
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    return next();
  }
});

io.on('connection', (socket) => {
  const uid = socket.userId;
  if (uid) {
    // mark online
    onlineUsers.set(uid.toString(), socket.id);
    // update DB
    User.findByIdAndUpdate(uid, { isOnline: true }, { new: true }).exec();
    // broadcast online status
      // emit the userId string (client expects a simple id)
      io.emit('userOnline', String(uid));

    // join a room for the user for private emits
    socket.join(uid.toString());
  }

  // handle sendMessage from client
  socket.on('sendMessage', async (payload) => {
    // payload: { senderId, receiverId, text }
    try {
      // If the client already sent the message via HTTP and included the saved record
      // (e.g. has _id), avoid creating a duplicate. Use the provided payload as 'saved'.
      let saved = payload;
      if (!payload || !payload._id) {
        saved = await Message.create({
          senderId: payload.senderId,
          receiverId: payload.receiverId,
          text: payload.text
        });
      }

      // emit to receiver if online
      const recvSocketId = onlineUsers.get(String(saved.receiverId));
      if (recvSocketId) {
        io.to(recvSocketId).emit('receiveMessage', saved);
      }

      // also emit to sender (ack)
      if (socket.userId) io.to(socket.id).emit('messageSent', saved);
    } catch (err) {
      console.error('sendMessage error', err);
    }
  });

  // handle mark as read from client
  socket.on('markAsRead', async ({ messageIds }) => {
    try {
      await Message.updateMany({ _id: { $in: messageIds } }, { $set: { isRead: true } });
      // fetch senders from messages and notify them
      const msgs = await Message.find({ _id: { $in: messageIds } });
      for (const m of msgs) {
        const senderSocketId = onlineUsers.get(String(m.senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageRead', { messageId: m._id, reader: uid });
        }
      }
    } catch (err) {
      console.error('markAsRead error', err);
    }
  });

  // typing indicator (optional)
  socket.on('typing', ({ to, isTyping }) => {
    const recvSocketId = onlineUsers.get(to.toString());
    if (recvSocketId) io.to(recvSocketId).emit('typing', { from: socket.userId, isTyping });
  });

  socket.on('disconnect', async () => {
    if (uid) {
      // remove mapping
      onlineUsers.delete(uid.toString());
      // update lastSeen + offline
      await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen: new Date() }).exec();
      // broadcast offline
  io.emit('userOffline', String(uid));
    }
  });
});

// start server after connecting to DB
const start = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.warn('Server starting in degraded mode without MongoDB. Some routes will fail until DB is available.');
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server', err);
  // don't exit here; let nodemon keep running and allow edits to fix the issue
});
