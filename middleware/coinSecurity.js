const { body, validationResult } = require('express-validator');
const CoinTransaction = require('../models/coinTransaction');

// Validate transaction amounts and parameters
exports.validateRechargeInput = [
  body('amount')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
    .isFloat({ max: 1000000 }).withMessage('Amount exceeds maximum allowed'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateSpendInput = [
  body('amount')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('itemId')
    .notEmpty().withMessage('Item ID is required'),
  body('itemType')
    .notEmpty().withMessage('Item type is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateCompleteRecharge = [
  body('transactionId')
    .notEmpty().withMessage('Transaction ID is required')
    .isMongoId().withMessage('Invalid transaction ID format'),
  body('paymentId')
    .notEmpty().withMessage('Payment ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Verify that the transaction belongs to the requesting user
exports.verifyTransactionOwnership = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const userId = req.user._id;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await CoinTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if transaction belongs to the user
    if (transaction.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to access this transaction' });
    }

    next();
  } catch (error) {
    console.error('Transaction ownership verification error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Prevent duplicate transaction processing
exports.preventDuplicateProcessing = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const transaction = await CoinTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.status(400).json({ message: 'This transaction has already been processed' });
    }

    next();
  } catch (error) {
    console.error('Duplicate processing check error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// CSRF protection check
exports.verifyCsrfToken = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];
  const storedToken = req.session?.csrfToken;
  
  // In a production environment, you would validate against a stored token
  // This is a simplified version that checks for the presence of the header
  if (!csrfToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }
  
  next();
};

// Log all coin transactions for audit purposes
exports.auditLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    const logData = {
      timestamp: new Date(),
      userId: req.user?._id || 'unauthenticated',
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestBody: JSON.stringify(req.body),
      responseStatus: res.statusCode,
      responseBody: body
    };
    
    // In a real implementation, you would store this in a secure audit log
    console.log('COIN TRANSACTION AUDIT:', JSON.stringify(logData));
    
    originalSend.call(this, body);
    return this;
  };
  
  next();
}; 