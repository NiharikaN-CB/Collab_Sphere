const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  deleteAccount
} = require('../controllers/authController');

const {
  authenticateToken
} = require('../middleware/auth');

const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate
} = require('../middleware/validation');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.post('/refresh', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);
router.delete('/account', authenticateToken, deleteAccount);

module.exports = router;
