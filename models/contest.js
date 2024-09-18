const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    contestName: {
      type: String,
      default: "",
    },
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
      road: String,
      city: String,
      county: String,
      state: String,
      postcode: String,
      country: String,
      country_code: String,
      display_name: String,
      category: String,
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
  },
  { timestamps: true }
);

const Contest = mongoose.model("contest", ContestSchema);

module.exports = Contest;
