// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Then load from root .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Debug environment loading
console.log(`🔧 Environment check: SUPABASE_URL=${process.env.SUPABASE_URL ? 'loaded' : 'missing'}`);

// Environment loaded successfully

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler.js';
import captureRoutes from './routes/capture.js';
import transcriptionRoutes from './routes/transcription.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import extensionRoutes from './routes/extension.js';
import aiRoutes from './routes/ai.js';
import distributionRoutes from './routes/distribution.js';
// import { aiWorker } from './workers/aiWorker.js'; // Optional - requires Redis

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Cathcr API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/capture', captureRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/distribution', distributionRoutes);

// API Testing Routes
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Testing Endpoint',
    timestamp: new Date().toISOString(),
    availableRoutes: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/refresh',
        'GET /api/auth/me'
      ],
      capture: [
        'POST /api/capture',
        'GET /api/capture',
        'GET /api/capture/:id',
        'PUT /api/capture/:id',
        'DELETE /api/capture/:id',
        'POST /api/capture/transcribe',
        'POST /api/capture/sync',
        'GET /api/capture/queue/status'
      ],
      transcription: [
        'POST /api/transcription/audio',
        'POST /api/transcription/batch'
      ],
      rooms: [
        'GET /api/rooms',
        'POST /api/rooms',
        'GET /api/rooms/:roomId',
        'GET /api/rooms/:roomId/messages'
      ],
      extension: [
        'POST /api/extension/auth',
        'POST /api/extension/sync',
        'GET /api/extension/captures',
        'GET /api/extension/health',
        'POST /api/extension/connect',
        'POST /api/extension/disconnect'
      ],
      ai: [
        'POST /api/ai/categorize',
        'POST /api/ai/enhance',
        'POST /api/ai/batch-categorize',
        'GET /api/ai/user-patterns',
        'POST /api/ai/feedback'
      ],
      distribution: [
        'GET /api/distribution/extension/download',
        'GET /api/distribution/extension/version',
        'GET /api/distribution/extension/install-guide',
        'GET /api/distribution/extension/update-check',
        'GET /api/distribution/extension/stats',
        'POST /api/distribution/extension/feedback'
      ],
      testing: [
        'GET /api/test',
        'GET /health'
      ]
    }
  });
});

// TODO: Add /api/google, /api/payments routes when needed

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

server.listen(PORT, () => {
  console.log(`🧠 Cathcr API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`✨ Ready to capture thoughts!`);
});
