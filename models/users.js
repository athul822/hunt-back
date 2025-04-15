const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // Allows multiple documents where googleId is not set
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    username: {
      type: String,
    },
    gender: {
      type: String,
    },
    dob: {
      type: Date,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zip: {
      type: String,
    },
    mobile: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    coinBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    coinTransactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoinTransaction'
    }],
    // New fields for hunt tracking
    huntsCreated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'contest'
    }],
    huntsParticipated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'contest'
    }],
    totalHuntsCreated: {
      type: Number,
      default: 0
    },
    successfulHunts: {
      type: Number,
      default: 0
    },
    // Track completed treasures
    completedTreasures: [{
      treasureId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contest',
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Track completed contests
    completedContests: [{
      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contest',
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      position: {
        type: Number,
        default: null
      },
      reward: {
        type: Number,
        default: 0
      }
    }],
    huntingStats: {
      type: {
        winRate: {
          type: Number,
          default: 0
        },
        averageCompletionTime: {
          type: Number,
          default: 0
        },
        totalParticipations: {
          type: Number,
          default: 0
        },
        rank: {
          type: String,
          default: 'Beginner'
        }
      },
      default: {
        winRate: 0,
        averageCompletionTime: 0,
        totalParticipations: 0,
        rank: 'Beginner'
      }
    }
  },
  { timestamps: true }
);

const Users = mongoose.model("users", UsersSchema);

module.exports = Users;
