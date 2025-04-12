const mongoose = require("mongoose");

const CoinTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['recharge', 'purchase', 'refund', 'gift', 'reward'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    paymentId: {
      type: String,
      sparse: true
    },
    paymentMethod: {
      type: String,
      sparse: true
    },
    description: {
      type: String
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for query optimization
CoinTransactionSchema.index({ user: 1, createdAt: -1 });
CoinTransactionSchema.index({ status: 1 });

const CoinTransaction = mongoose.model("CoinTransaction", CoinTransactionSchema);

module.exports = CoinTransaction; 