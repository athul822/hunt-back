const Payment = require('../models/payment');
const { randomUUID } = require('crypto');
const crypto = require('crypto');
const axios = require('axios');
const { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest, UpiIntentPayRequestBuilder } = require('pg-sdk-node');

// PhonePe API Configuration
const PHONEPE_BASE_URL = process.env.PHONEPE_ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/hermes';

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT'
// Callback URL for UPI intent and other PhonePe redirects
const CALLBACK_URL = process.env.PHONEPE_CALLBACK_URL || 'https://www.iorbit-tech.com/api/payment/callback'
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || 1;

// Generate checksum for PhonePe API
const generateChecksum = (payload, endpoint) => {
  const string = payload + endpoint + SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  return sha256 + '###' + SALT_INDEX;
};

// Verify callback checksum
const verifyChecksum = (payload, checksum) => {
  const [hash, saltIndex] = checksum.split('###');
  const expectedHash = crypto.createHash('sha256').update(payload + SALT_KEY).digest('hex');
  return hash === expectedHash && saltIndex === SALT_INDEX.toString();
};

// Initiate a new payment
exports.initiatePayment = async (req, res) => {
  const {
    amount,
    userId,
    customerName,
    customerPhone,
    customerEmail,
    productInfo = 'Payment'
  } = req.body;
  console.log('Payment initiation request:', req.body);
  // Validation
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const orderId = `ORDER_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const merchantTransactionId = `TXN_${Date.now()}_${randomUUID().slice(0, 8)}`;

  try {
    // Create a new payment record in the database
    const payment = new Payment({
      orderId,
      merchantTransactionId,
      amount,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      productInfo,
      status: 'PENDING',
      createdAt: new Date()
    });

    await payment.save();

    // Create the payment request payload for PhonePe
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: userId,
      amount: Math.round(amount * 100), // Convert to paise and ensure integer
      redirectUrl: `https://www.iorbit-tech.com/api/payment/callback`,
      redirectMode: 'POST',
      callbackUrl: `https://www.iorbit-tech.com/api/payment/webhook`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Add optional fields if provided
    if (customerPhone) {
      paymentPayload.mobileNumber = customerPhone;
    }

    // Generate base64 payload and checksum
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const checksum = generateChecksum(base64Payload, '/pg/v1/pay');

    // For React Native SDK integration, return the payload and checksum
    res.status(200).json({
      success: true,
      orderId,
      transactionId: merchantTransactionId,
      paymentRequest: paymentPayload,
      checksum,
      amount,
      // Also provide redirect URL for web fallback
      redirectUrl: `${PHONEPE_BASE_URL}/pg/v1/pay`,
      payload: base64Payload
    });

  } catch (err) {
    console.error('Payment initiation failed:', err);

    // Clean up failed payment record
    try {
      await Payment.deleteOne({ orderId });
    } catch (cleanupErr) {
      console.error('Failed to clean up payment record:', cleanupErr);
    }

    res.status(500).json({
      success: false,
      error: 'Payment initiation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  console.log('Request body:', req.params);
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  try {
    // First check our database
    const payment = await Payment.findOne({
      $or: [
        { merchantTransactionId: transactionId },
        { orderId: transactionId }
      ]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check status with PhonePe
    const endpoint = `/pg/v1/status/${MERCHANT_ID}/${payment.merchantTransactionId}`;
    const checksum = generateChecksum('', endpoint);

    const response = await axios.get(`${PHONEPE_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': MERCHANT_ID
      }
    });

    const phonepeResponse = response.data;

    // Update payment status in database
    if (phonepeResponse.success && phonepeResponse.data) {
      const phonepeData = phonepeResponse.data;

      payment.status = phonepeData.state === 'COMPLETED' ? 'SUCCESS' :
        phonepeData.state === 'FAILED' ? 'FAILURE' :
          phonepeData.state === 'CANCELLED' ? 'CANCELLED' : 'PENDING';

      payment.phonepeTransactionId = phonepeData.transactionId;
      payment.paymentMethod = phonepeData.paymentInstrument?.type || null;
      payment.paymentDetails = phonepeData;
      payment.updatedAt = new Date();

      await payment.save();
    }

    res.status(200).json({
      success: true,
      orderId: payment.orderId,
      transactionId: payment.merchantTransactionId,
      status: payment.status,
      amount: payment.amount,
      paymentDetails: phonepeResponse.data || null
    });

  } catch (err) {
    console.error('Status check failed:', err);

    // If PhonePe API fails, return database status
    try {
      const payment = await Payment.findOne({
        $or: [
          { merchantTransactionId: transactionId },
          { orderId: transactionId }
        ]
      });

      if (payment) {
        res.status(200).json({
          success: true,
          orderId: payment.orderId,
          transactionId: payment.merchantTransactionId,
          status: payment.status,
          amount: payment.amount,
          note: 'Status from database (PhonePe API unavailable)'
        });
      } else {
        res.status(404).json({ error: 'Payment not found' });
      }
    } catch (dbErr) {
      res.status(500).json({
        success: false,
        error: 'Failed to get payment status',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
};

// Handle redirect callback from PhonePe (for web fallback)
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { code, merchantId, transactionId, providerReferenceId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Get payment status from PhonePe
    const endpoint = `/pg/v1/status/${MERCHANT_ID}/${transactionId}`;
    const checksum = generateChecksum('', endpoint);

    const response = await axios.get(`${PHONEPE_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': MERCHANT_ID
      }
    });

    const phonepeResponse = response.data;

    // Update payment in database
    const payment = await Payment.findOne({ merchantTransactionId: transactionId });

    if (payment && phonepeResponse.success && phonepeResponse.data) {
      const phonepeData = phonepeResponse.data;

      payment.status = phonepeData.state === 'COMPLETED' ? 'SUCCESS' :
        phonepeData.state === 'FAILED' ? 'FAILURE' :
          phonepeData.state === 'CANCELLED' ? 'CANCELLED' : 'PENDING';

      payment.phonepeTransactionId = phonepeData.transactionId;
      payment.paymentMethod = phonepeData.paymentInstrument?.type || null;
      payment.paymentDetails = phonepeData;
      payment.updatedAt = new Date();

      await payment.save();
    }

    // Redirect to frontend with status
    const frontendUrl = `${process.env.FRONTEND_URL}/payment-result?orderId=${payment?.orderId}&status=${payment?.status}&transactionId=${transactionId}`;
    res.redirect(frontendUrl);

  } catch (err) {
    console.error('Payment callback error:', err);
    const errorUrl = `${process.env.FRONTEND_URL}/payment-result?error=callback_failed`;
    res.redirect(errorUrl);
  }
};

// Handle webhook callback from PhonePe
exports.handleWebhook = async (req, res) => {
  try {
    // Verify the webhook signature
    const receivedChecksum = req.headers['x-verify'];
    const payload = JSON.stringify(req.body);

    if (!receivedChecksum || !verifyChecksum(payload, receivedChecksum)) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const { response } = req.body;

    if (!response) {
      return res.status(400).send('Invalid webhook data');
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    const { merchantTransactionId, state, transactionId } = decodedResponse;

    // Update payment status in database
    const payment = await Payment.findOne({ merchantTransactionId });

    if (payment) {
      const oldStatus = payment.status;

      payment.status = state === 'COMPLETED' ? 'SUCCESS' :
        state === 'FAILED' ? 'FAILURE' :
          state === 'CANCELLED' ? 'CANCELLED' : 'PENDING';

      payment.phonepeTransactionId = transactionId;
      payment.paymentDetails = decodedResponse;
      payment.updatedAt = new Date();

      await payment.save();

      // Log status change
      console.log(`Payment ${merchantTransactionId} status changed from ${oldStatus} to ${payment.status}`);

      // Here you can add additional business logic:
      // - Send email notifications
      // - Update order status
      // - Trigger other microservices
      // - Send push notifications to mobile app

      if (payment.status === 'SUCCESS') {
        // Handle successful payment
        console.log(`Payment successful for order ${payment.orderId}, amount: ${payment.amount}`);
        // Add your success logic here
      } else if (payment.status === 'FAILURE') {
        // Handle failed payment
        console.log(`Payment failed for order ${payment.orderId}`);
        // Add your failure logic here
      }
    } else {
      console.error(`Payment not found for transaction ID: ${merchantTransactionId}`);
    }

    res.status(200).send('OK');

  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(500).send('Webhook error');
  }
};

// Create UPI Intent payment link using PhonePe PG SDK
exports.createUpiIntent = async (req, res) => {
  const { amount, userId, deviceOS, merchantCallBackScheme, targetApp, expireAfter } = req.body;
  console.log('Request body:', req.body);
  // Validation
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const merchantOrderId = `ORDER_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const env = process.env.PHONEPE_ENV === 'PROD' ? Env.PRODUCTION : Env.SANDBOX;
    const clientId = process.env.PHONEPE_PG_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_PG_CLIENT_SECRET;
    const clientVersion = parseInt(process.env.PHONEPE_PG_CLIENT_VERSION || '1', 10);

    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

    const metaInfo = MetaInfo.builder().udf1(userId.toString()).build();

    const request = new UpiIntentPayRequestBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(amount * 100))      // paise
      .metaInfo(metaInfo)
      .deviceOS(deviceOS)
      .expireAfter(expireAfter)
      .merchantCallBackScheme(merchantCallBackScheme)
      .targetApp(targetApp)
      .build();

    // if (deviceOS) builder.deviceOS(deviceOS);
    // if (merchantCallBackScheme) builder.merchantCallBackScheme(merchantCallBackScheme);
    // else builder.merchantCallBackScheme('https'); // default merchantCallBackScheme
    // if (targetApp) builder.targetApp(targetApp);
    // if (expireAfter) builder.expireAfter(expireAfter);

    // const request = builder.build();

    const pgResponse = await client.pay(request);
    console.log('PhonePe PG response:', pgResponse);

    if (pgResponse && pgResponse.redirectUrl) {
      return res.status(200).json({
        success: true,
        orderId: merchantOrderId,
        amount,
        redirectUrl: pgResponse.redirectUrl,
      });
    }

    return res.status(500).json({ success: false, error: 'Failed to create UPI intent URL' });
  } catch (err) {
    console.error('UPI intent creation failed:', err);
    return res.status(500).json({
      success: false,
      error: 'UPI intent creation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  }
};

// Utility function to get all payments for a user = req.body;\n\n  // Basic validation\n  if (!amount || amount <= 0) {\n    return res.status(400).json({ error: 'Valid amount is required' });\n  }\n  if (!userId) {\n    return res.status(400).json({ error: 'User ID is required' });\n  }\n\n  try {\n    const merchantOrderId = `ORDER_${Date.now()}_${randomUUID().slice(0, 8)}`;\n    const env = process.env.PHONEPE_ENV === 'PROD' ? Env.PRODUCTION : Env.SANDBOX;\n    const clientId = process.env.PHONEPE_PG_CLIENT_ID;\n    const clientSecret = process.env.PHONEPE_PG_CLIENT_SECRET;\n    const clientVersion = parseInt(process.env.PHONEPE_PG_CLIENT_VERSION || '1', 10);\n\n    const client = StandardCheckoutClient.getInstance(\n      clientId,\n      clientSecret,\n      clientVersion,\n      env\n    );\n\n    const metaInfo = MetaInfo.builder()\n      .udf1(userId.toString())\n      .build();\n\n    const request = UpiIntentPayRequestBuilder.builder()\n      .merchantOrderId(merchantOrderId)\n      .amount(Math.round(amount * 100)) // convert to paise\n      .redirectUrl(`https://www.iorbit-tech.com/api/payment/callback`)\n      .metaInfo(metaInfo)\n      .build();\n\n    const pgResponse = await client.pay(request);\n\n    if (pgResponse && pgResponse.redirectUrl) {\n      return res.status(200).json({\n        success: true,\n        orderId: merchantOrderId,\n        amount,\n        redirectUrl: pgResponse.redirectUrl\n      });\n    }\n\n    return res.status(500).json({ success: false, error: 'Failed to create UPI intent URL' });\n  } catch (err) {\n    console.error('UPI intent creation failed:', err);\n    return res.status(500).json({\n      success: false,\n      error: 'UPI intent creation failed',\n      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'\n    });\n  }\n};\n\n// Utility function to get all payments for a user
exports.getUserPayments = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  try {
    const query = { userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-paymentDetails'); // Exclude sensitive payment details

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Failed to get user payments:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get payments',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};