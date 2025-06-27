const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');

// Step 1: Initiate Transaction
router.post('/initiate', paymentController.initiatePayment);

// Step 2: Get Order Status
router.get('/status/:transactionId', paymentController.getPaymentStatus);

// Step 3: Create UPI Intent
router.post('/upi-intent', paymentController.createUpiIntent);

// Handle success redirect from PhonePe
// router.get('/success', paymentController.handlePaymentSuccess);

// Step 3: Handle Webhook Callback
router.post('/callback', paymentController.handleWebhook );

module.exports = router;