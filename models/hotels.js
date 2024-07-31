const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    type: {
      type: String,
    },
    address: {
      type: String,
    },
    status: {
      type: Boolean,
    },
    description: {
      type: String,
    },
    price: {
      type: String,
    },
    image: {
      type: String,
    },
    address: {
      type: String,
    },
    placeId: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    districtId: {
      type: String,
    },
    hotelName: {
      type: String,
    },
    totalRooms: {
      type: Number,
    },
    availableRooms: {
      type: Number,
    },
    engagedRooms: {
      type: Number,
      default: 0,
    },
    
  },
  { timestamps: true }
);

const Hotels = mongoose.model("hotels", HotelSchema);

module.exports = Hotels;
