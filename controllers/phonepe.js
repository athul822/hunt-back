const crypto = require('crypto');
const axios = require('axios');

// PhonePe Configuration
const PHONEPE_CONFIG = {
  clientId: process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_MERCHANT_ID || 'your_client_id',
  clientSecret: process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_SALT_KEY || 'your_client_secret',
  version: process.env.PHONEPE_VERSION || '1',
  environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

// Generate SHA256 hash in the format required by PhonePe
const generateHash = (payload, endpoint, salt) => {
  const str = payload + endpoint + salt;
  return crypto.createHash('sha256').update(str).digest('hex') + '###1';
};

// Generate a unique transaction ID
const generateTransactionId = () =>
  `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * POST /api/phonepe/create-upi-intent
 * Creates a UPI Intent URL that can be opened in the PhonePe app.
 */
exports.createUpiIntent = async (req, res) => {
  try {
    const {
      amount,
      merchantUserId,
      callbackUrl,
      merchantOrderId,
      mobileNumber
    } = req.body;

    // Basic validation
    if (!amount || !merchantUserId) {
      return res
        .status(400)
        .json({ success: false, message: 'Amount and merchantUserId are required' });
    }

    const transactionId = merchantOrderId || generateTransactionId();

    // Construct the payment payload expected by PhonePe
    const paymentPayload = {
      merchantId: PHONEPE_CONFIG.clientId,
      merchantTransactionId: transactionId,
      merchantUserId,
      amount: amount * 100, // rupees ➜ paise
      redirectUrl:
        callbackUrl || `${req.protocol}://${req.get('host')}/api/phonepe/payment-callback`,
      redirectMode: 'POST',
      callbackUrl:
        callbackUrl || `${req.protocol}://${req.get('host')}/api/phonepe/payment-callback`,
      mobileNumber: mobileNumber || '',
      paymentInstrument: {
        type: 'UPI_INTENT',
        targetApp: 'com.phonepe.app'
      }
    };

    // Base64 encode the payload as required by PhonePe
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const endpoint = '/pg/v1/pay';
    const hash = generateHash(base64Payload, endpoint, PHONEPE_CONFIG.clientSecret);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-VERIFY': hash,
      accept: 'application/json'
    };

    // Make API request to PhonePe
    const response = await axios.post(
      `${PHONEPE_CONFIG.baseUrl}${endpoint}`,
      { request: base64Payload },
      { headers }
    );

    // Handle PhonePe response
    if (response.data && response.data.success) {
      const instrumentResponse = response.data.data.instrumentResponse || {};
      const upiIntentUrl =
        instrumentResponse.intentUrl || instrumentResponse.upiIntent || instrumentResponse;

      return res.json({
        success: true,
        data: {
          transactionId,
          upiIntentUrl,
          amount,
          merchantUserId
        },
        message: 'UPI intent created successfully'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Failed to create UPI intent',
      error: response.data
    });
  } catch (error) {
    console.error('Error creating UPI intent:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.response?.data || error.message
    });
  }
};

/**
 * POST /api/phonepe/payment-callback
 * Handles the redirect/callback from PhonePe after a payment attempt.
 */
exports.paymentCallback = async (req, res) => {
  try {
    console.log('Payment callback received:', req.body);
    // TODO: verify checksum & update DB if required
    res.json({ success: true, message: 'Callback received' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
};

/**
 * GET /api/phonepe/payment-status/:transactionId
 * Fetches the current status of a transaction from PhonePe.
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.clientId}/${transactionId}`;
    const hash = generateHash('', endpoint, PHONEPE_CONFIG.clientSecret);

    const headers = {
      'Content-Type': 'application/json',
      'X-VERIFY': hash,
      'X-MERCHANT-ID': PHONEPE_CONFIG.clientId,
      accept: 'application/json'
    };

    const response = await axios.get(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, { headers });

    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error checking payment status:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.response?.data || error.message
    });
  }
};