import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// ✅ FIXED: explicit file import
import { sequelize } from './models/index.js';

// ❌ remove require
// const routes = require(...)

// ✅ use import instead
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';

// middleware
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ success: true });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ DB synced');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();