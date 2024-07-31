const mongoose = require("mongoose");

// Define the schema for a Place with coordinates
const PlaceSchema = new mongoose.Schema(
  {
    id: {
      type: String, // Define the type of the 'id' field
      required: true, // Mark the 'id' field as required
      unique: true, // Ensure the 'id' field is unique
    },
    coords: {
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
        required: true,
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
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the model from the schema
const Places = mongoose.model("Places", PlaceSchema);

// Export the model for use in other parts of the application
module.exports = Places;
