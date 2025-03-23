const jwt = require('jsonwebtoken');
const Users = require('../models/users');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await Users.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token. Please log in again!'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Your token has expired! Please log in again.'
      });
    }
    
    res.status(500).json({
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Middleware to restrict access by role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
}; 