const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    checkIn: {
      type: String,
    },
    checkOut: {
      type: String,
    },
    noOfRooms: {
      type: String,
    },
    noOfPeople: {
      type: String,
    },
    type: {
      type: String,
    },
    price: {
      type: String,
    },
    userId: {
      type: String,
    },
    hotelId: {
      type: String,
    },
    hotelName: {
      type: String,
    },
  },
  { timestamps: true }
);

const Rooms = mongoose.model("rooms", RoomSchema);

module.exports = Rooms;
