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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-org-id', 'x-user-name']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static('public'));

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

// Root Landing & Status Page (Prevents "Cannot GET /" white page)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quadrace CRM Backend API & Solomon AI</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #0F2B1D; color: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #153B27; border: 2px solid #C59B27; padding: 40px; border-radius: 24px; max-width: 540px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(52, 211, 153, 0.15); color: #34D399; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; border: 1px solid rgba(52, 211, 153, 0.3); }
        .dot { width: 8px; height: 8px; background: #34D399; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        h1 { font-size: 28px; font-weight: 900; margin-bottom: 10px; }
        h1 span { color: #C59B27; }
        p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; padding: 14px 28px; background: #C59B27; color: #0F2B1D; text-decoration: none; font-weight: 800; font-size: 14px; border-radius: 12px; transition: transform 0.2s, background 0.2s; box-shadow: 0 4px 12px rgba(197, 155, 39, 0.3); }
        .btn:hover { background: #D4AF37; transform: translateY(-2px); }
        .links { margin-top: 24px; font-size: 12px; color: #94a3b8; display: flex; justify-content: center; gap: 16px; }
        .links a { color: #E6C280; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span class="dot"></span> API Server & WebSocket Engine Online</div>
        <h1>QUADRACE <span>CRM</span></h1>
        <p>Solomon AI 2.0 Backend & Real-Time Socket.io Server is running active on <strong>Port 5000</strong>.</p>
        <a href="http://localhost:3000" class="btn">Open Main Web Application & Dashboard (Port 3000) →</a>
        <div class="links">
          <a href="/health" target="_blank">API Health Status</a>
          <span>•</span>
          <a href="http://localhost:3000/inbox">Live Inbox Workspace</a>
          <span>•</span>
          <a href="http://localhost:5173" target="_blank">Widget Preview</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

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
