import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { sequelize } from './models/index.js';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';

// middleware
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= LOGGER ================= */

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url}`
    );
    next();
  });
}

/* ================= HEALTH CHECK ================= */

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
  });
});

/* ================= ROUTES ================= */

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* ================= ERROR HANDLERS ================= */

app.use(notFound);
app.use(errorHandler);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // DB connection
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Auto create/sync tables
    await sequelize.sync({ alter: true });
    console.log('✅ DB synced');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
};

start();
