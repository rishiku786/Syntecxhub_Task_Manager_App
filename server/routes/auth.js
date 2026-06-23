const express = require('express');
const { body } = require('express-validator');
const { register, login, refresh, logout, me } = require('../controllers/authController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Register Route
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  validate,
  register
);

// Login Route
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

// Token Refresh Route
router.post('/refresh', refresh);

// Logout Route
router.post('/logout', logout);

// Get Self Profile Route
router.get('/me', protect, me);

module.exports = router;
