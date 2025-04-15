const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    contestName: {
      type: String,
      default: "",
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }],
    subjectImage: {
      type: String,
      default: "",
    },
    treasureLocation: {
      speed: {
        type: Number,
        default: 0,
      },
      heading: {
        type: Number,
        default: 0,
      },
      altitude: {
        type: Number,
        default: 0,
      },
      accuracy: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      altitudeAccuracy: {
        type: Number,
        default: 0,
      }
    },
    playZone: {
      lat: {
        type: Number,
        required: true,
      },
      lon: {
        type: Number,
        required: true,
      },
      radius: {
        type: Number,
        required: true,
      },
    },
    address: {
      display_name: String,
      category: String,
      postcode: String,
      city: String,
      state: String,
      country: String,
    },
    hint_image_1: {
      type: String,
      default: "",
    },
    hint_image_2: {
      type: String,
      default: "",
    },
    hint_image_3: {
      type: String,
      default: "",
    },
    secretCode: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    maxParticipants: {
      type: Number,
      default: 4
    },
    duration: {
      type: Number,
      default: 60
    },
    entryFee: {
      type: Number,
      default: 0
    },
    startDate: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    prizePool: {
      type: Number,
      default: 0
    },
    contestType: {
      type: String,
      enum: ['standard', 'premium'],
      default: 'standard'
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    // AR feature fields
    arEnabled: {
      type: Boolean,
      default: false
    },
    arAnchorType: {
      type: String,
      enum: ['withAnchor', 'withoutAnchor'],
      default: 'withAnchor'
    },
    arObjectType: {
      type: String,
      enum: ['2DText', '3DObjects'],
      default: '2DText'
    },
    // End condition for the contest
    endCondition: {
      type: String,
      enum: ['treasureFound', 'fixedTime'],
      default: 'treasureFound'
    },
    // AR data for rendering AR experience
    arData: {
      type: {
        type: String,
        enum: ['anchor', 'noAnchor'],
        default: 'anchor'
      },
      render: {
        type: String,
        enum: ['2d', '3d'],
        default: '2d'
      },
      anchor: {
        type: String,
        default: ''
      },
      model: {
        type: String,
        default: ''
      },
      position: {
        type: Object,
        default: null
      },
      rotation: {
        type: Object,
        default: null
      }
    }
  },
  { timestamps: true }
);

const Contest = mongoose.model("contest", ContestSchema);

module.exports = Contest;
