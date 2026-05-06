import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';

import { User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// ── TOKEN HELPER ─────────────────────────
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── SIGNUP ─────────────────────────
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ where: { email } });
      if (existing) return next(createError('Email already in use', 409));

      // ❌ REMOVE role from user input → always member
      const user = await User.create({
        name,
        email,
        password,
        role: 'member',
      });

      const token = signToken(user.id);

      res.status(201).json({
        success: true,
        token,
        user, // password already removed via model toJSON
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── LOGIN ─────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user || !(await user.comparePassword(password))) {
        return next(createError('Invalid email or password', 401));
      }

      if (user.isActive !== undefined && !user.isActive) {
        return next(createError('Account is deactivated', 403));
      }

      const token = signToken(user.id);

      res.json({
        success: true,
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET CURRENT USER ─────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// ── CHANGE PASSWORD ─────────────────────────
router.patch(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!(await user.comparePassword(currentPassword))) {
        return next(createError('Current password is incorrect', 401));
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;