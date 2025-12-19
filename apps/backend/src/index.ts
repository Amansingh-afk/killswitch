import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { positionsRoutes } from './routes/positions';
import { riskRoutes } from './routes/risk';
import { balanceRoutes } from './routes/balance';
import { startMonitoring } from './workers/monitor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || '',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/positions', positionsRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/balance', balanceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  const enableMonitoring = process.env.ENABLE_MONITORING === 'true';
  if (enableMonitoring) {
    console.log('Starting Risk Engine Monitoring');
    startMonitoring().catch(() => {
    });
  }
});

