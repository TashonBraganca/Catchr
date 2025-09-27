import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import captureRoutes from './routes/capture.js';
import transcriptionRoutes from './routes/transcription.js';
// Load environment variables
dotenv.config();
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
app.use('/api/capture', captureRoutes);
app.use('/api/transcription', transcriptionRoutes);
// TODO: Add /api/google, /api/payments routes
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
//# sourceMappingURL=index.js.map