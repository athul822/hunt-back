const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to create a refresh token
refreshTokenSchema.statics.createToken = function(user) {
  // Generate a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Set expiry (from environment variable or default to 30 days)
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '30d';
  const expiresAt = new Date();
  
  // Convert the string expiry time to milliseconds
  const timeUnit = expiresIn.slice(-1);
  const timeValue = parseInt(expiresIn.slice(0, -1));
  
  if (timeUnit === 'd') {
    expiresAt.setDate(expiresAt.getDate() + timeValue);
  } else if (timeUnit === 'h') {
    expiresAt.setHours(expiresAt.getHours() + timeValue);
  }
  
  return this.create({
    token: refreshToken,
    user: user._id,
    expiresAt
  });
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken; 