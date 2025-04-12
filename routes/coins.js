const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const coinController = require('../controllers/coinController');
const coinSecurity = require('../middleware/coinSecurity');
const rateLimit = require('express-rate-limit');

// Additional security middleware for money-related operations
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Max 20 requests per hour per IP
  message: 'Too many coin transactions from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Extra security for critical endpoints
const criticalTransactionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hour window
  max: 10, // Max 10 requests per 24 hours per IP
  message: 'Too many critical coin operations from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply audit logging to all coin-related routes
router.use(coinSecurity.auditLogger);

// User routes - all require authentication
router.get('/balance', protect, coinController.getBalance);
router.get('/transactions', protect, transactionLimiter, coinController.getTransactionHistory);

// Recharge routes - with additional security middleware
router.post(
  '/recharge/initiate', 
  protect, 
  transactionLimiter, 
  coinSecurity.validateRechargeInput, 
  coinSecurity.verifyCsrfToken,
  coinController.initiateRecharge
);

router.post(
  '/recharge/complete', 
  protect, 
  criticalTransactionLimiter, 
  coinSecurity.validateCompleteRecharge,
  coinSecurity.verifyTransactionOwnership,
  coinSecurity.preventDuplicateProcessing,
  coinSecurity.verifyCsrfToken,
  coinController.completeRecharge
);

// Spending routes - with additional security middleware
router.post(
  '/spend', 
  protect, 
  transactionLimiter, 
  coinSecurity.validateSpendInput,
  coinSecurity.verifyCsrfToken,
  coinController.spendCoins
);

// Admin routes - restricted to admin role with enhanced security
router.post(
  '/admin/give', 
  protect, 
  restrictTo('admin'), 
  criticalTransactionLimiter, 
  coinSecurity.validateRechargeInput,
  coinSecurity.verifyCsrfToken,
  coinController.giveCoinsToUser
);

module.exports = router; 