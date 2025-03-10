import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { apiRouter } from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { validateApiKey } from './middleware/auth';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json());

// Health check route (no API key required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes with API key validation
app.use('/api', validateApiKey, apiRouter);

// Error handling
app.use(errorHandler);

// Export the app instance
export default app;

// Only listen if this file is run directly, not imported as a module
if (import.meta.url === new URL(import.meta.url).href) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
