const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User account is not active'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.isAdmin) {
      return next();
    }
    
    if (req.user._id.toString() === resourceUserId.toString()) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only modify your own resources'
    });
  };
};

// Middleware to check if user is project member or admin
const requireProjectMemberOrAdmin = (project) => {
  return (req, res, next) => {
    if (req.user.isAdmin) {
      return next();
    }
    
    const isMember = project.teamMembers.some(member => 
      member.user.toString() === req.user._id.toString() && 
      member.status === 'Active'
    );
    
    if (isMember) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Access denied',
      message: 'You must be a project member to perform this action'
    });
  };
};

// Middleware to check if user is project creator or admin
const requireProjectCreatorOrAdmin = (project) => {
  return (req, res, next) => {
    if (req.user.isAdmin) {
      return next();
    }
    
    if (project.creator.toString() === req.user._id.toString()) {
      return next();
    }
    
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only project creators can perform this action'
    });
  };
};

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (user.status !== 'Active') {
      return next(new Error('Authentication error: User account is not active'));
    }

    // Add user to socket
    socket.user = user;
    
    // Update user's last active time
    await user.updateLastActive();
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token has expired'));
    }

    console.error('Socket auth error:', error);
    return next(new Error('Authentication error: Authentication failed'));
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'Active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting for authentication endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireProjectMemberOrAdmin,
  requireProjectCreatorOrAdmin,
  authenticateSocket,
  optionalAuth,
  authRateLimit
};
