// models/contest.js (UPDATED)
const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    // Basic Info
    id: {
      type: String,
      required: true,
      unique: true,
    },

    // Step 1: Hunt Type
    huntType: {
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: String,
      icon: String,
    },

    // Step 2: Entry Fee & Visibility
    entryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // Step 3: Location & Treasure
    useVerifiedLocation: {
      type: Boolean,
      default: false,
    },
    verifiedLocationId: {
      type: String,
      default: null,
    },
    treasureLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: Number,
      altitude: Number,
      speed: Number,
      heading: Number,
    },

    // Treasure Photo (PUBLIC - shown in listings)
    treasurePhoto: {
      url: { type: String, required: true },
      filename: String,
      mimetype: String,
      size: Number,
    },

    // Context Photos (for marketing/fraud prevention)
    contextPhotos: [
      {
        url: String,
        filename: String,
        mimetype: String,
        size: Number,
      },
    ],

    searchRadius: {
      type: Number,
      required: true,
      min: 50,
      max: 5000,
      default: 200,
    },

    // Random circle center (security feature)
    circleCenter: {
      latitude: Number,
      longitude: Number,
    },

    // Address/Location details
    address: {
      displayname: String,
      category: String,
      postcode: String,
      city: String,
      state: String,
      country: String,
    },

    // Step 4: Clues & Verification
    initialClue: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 150,
    },

    proximityClues: [
      {
        distance: { type: Number},
        clue: { type: String},
      },
      // {
      //   distance: { type: Number, required: true },
      //   clue: { type: String, required: true },
      // },
    ],

    verificationMethod: {
      type: String,
      enum: ["code", "ar"],
      required: true,
    },

    // Secret Code (for non-AR hunts)
    secretCode: {
      type: String,
      default: null,
    },

    // AR Configuration (for AR Image hunts)
    arConfig: {
      // AR Anchor Image (PRIVATE - never exposed to players)
      anchorImage: {
        url: String,
        filename: String,
        mimetype: String,
        size: Number,
      },

      // AR Success Text
      arText: {
        type: String,
        default: "Treasure Found!",
      },

      // Verification flag
      verified: {
        type: Boolean,
        default: false,
      },
    },

    // Calculated Difficulty
    calculatedDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // Step 5: Name & Schedule
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    startImmediately: {
      type: Boolean,
      default: true,
    },

    scheduledDateTime: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number, // in hours
      required: true,
      min: 1,
      max: 168, // 1 week max
      default: 24,
    },

    // Contest Status
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "completed", "cancelled"],
      default: "draft",
    },

    // Creator Info
    creatorId: {
      type: String,
      required: true,
      index: true,
    },

    // Participants
    participants: [
      {
        userId: String,
        joinedAt: Date,
        status: {
          type: String,
          enum: ["joined", "playing", "completed", "abandoned"],
          default: "joined",
        },
        _id: false,
      },
    ],

    maxParticipants: {
      type: Number,
      default: 100,
    },

    // Prize Pool (calculated based on entry fee)
    prizePool: {
      type: Number,
      default: 0,
    },

    // Winner
    winner: {
      userId: String,
      completedAt: Date,
      verificationProof: String,
    },

    // Metadata
    views: {
      type: Number,
      default: 0,
    },

    ratings: [
      {
        userId: String,
        rating: Number,
        comment: String,
        createdAt: Date,
      },
    ],

    // Legacy fields (for backward compatibility)
    contestName: String, // Map to 'name'
    subjectImage: String, // Map to 'treasurePhoto.url'
    difficulty: String, // Map to 'calculatedDifficulty'
    startDate: String,
    startTime: String,
    contestType: String,
    hintimage1: String,
    hintimage2: String,
    hintimage3: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ContestSchema.index({ creatorId: 1, status: 1 });
ContestSchema.index({ status: 1, startImmediately: 1 });
ContestSchema.index({
  "treasureLocation.latitude": 1,
  "treasureLocation.longitude": 1,
});
ContestSchema.index({ visibility: 1, status: 1 });
ContestSchema.index({
  "circleCenter.latitude": 1,
  "circleCenter.longitude": 1,
});

// Virtual for active status
ContestSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// Pre-save middleware
ContestSchema.pre("save", function (next) {
  // Calculate prize pool based on entry fee and participants
  if (this.entryFee > 0) {
    const totalCollection = this.entryFee * this.participants.length;
    this.prizePool = Math.floor(totalCollection * 0.8); // 80% to winner, 20% platform fee
  }

  // Auto-activate if startImmediately is true
  if (this.startImmediately && this.status === "draft") {
    this.status = "active";
  }

  next();
});

const Contest = mongoose.model("contest", ContestSchema);
module.exports = Contest;
