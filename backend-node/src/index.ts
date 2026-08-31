import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import surveyRoutes from './routes/surveyRoutes';
import integrationRoutes from './routes/integrationRoutes';
import analysisRoutes from './routes/analysisRoutes';
import reportRoutes from './routes/reportRoutes';
import { mlClient } from './services/mlClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with credentials for httpOnly cookie support
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Service Health check
app.get('/api/health', async (req, res) => {
  const mlHealthy = await mlClient.healthCheck();
  res.json({
    status: 'healthy',
    service: 'SearchSea App Layer (Node.js/Express)',
    mlServiceHealthy: mlHealthy,
    database: 'SQLite (Prisma)',
    auth: 'JWT (httpOnly cookie)',
    powerBi: 'App-owns-data REST proxy'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 SearchSea Node.js API running on http://localhost:${PORT}`);
});
