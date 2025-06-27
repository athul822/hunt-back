const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Order and Transaction IDs
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantTransactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phonepeTransactionId: {
    type: String,
    default: null,
    index: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILURE', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  paymentMethod: {
    type: String,
    default: null
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    default: null
  },
  customerPhone: {
    type: String,
    default: null
  },
  customerEmail: {
    type: String,
    default: null
  },
  
  // Product Information
  productInfo: {
    type: String,
    default: 'Payment'
  },
  
  // PhonePe Response Data
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ merchantTransactionId: 1, status: 1 });

// Pre-save middleware to update updatedAt
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
paymentSchema.methods.isCompleted = function() {
  return this.status === 'SUCCESS';
};

paymentSchema.methods.isPending = function() {
  return this.status === 'PENDING';
};

paymentSchema.methods.isFailed = function() {
  return this.status === 'FAILURE' || this.status === 'CANCELLED';
};

// Static methods
paymentSchema.statics.findByUserId = function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { userId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

paymentSchema.statics.findPendingPayments = function(olderThanMinutes = 30) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  return this.find({
    status: 'PENDING',
    createdAt: { $lt: cutoffTime }
  });
};

module.exports = mongoose.model('Payment', paymentSchema);