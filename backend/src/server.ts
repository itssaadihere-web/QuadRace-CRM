import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';
import { setupChatSockets } from './sockets/chat';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for Desktop Dashboard, Mobile App, and Web Widget
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-org-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup Sockets
setupChatSockets(io);

// Mount API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Quadrace CRM API',
    agent: 'Solomon AI 2.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Quadrace CRM & Solomon AI Backend Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io live chat engine active on ws://localhost:${PORT}`);
});
