const express = require('express');
const router = express.Router();
const phonepeController = require('../controllers/phonepe');

// Create UPI intent
router.post('/create-upi-intent', phonepeController.createUpiIntent);

// Payment callback (redirect mode POST)
router.post('/payment-callback', phonepeController.paymentCallback);

// Check payment status
router.get('/payment-status/:transactionId', phonepeController.getPaymentStatus);

module.exports = router;
