const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      // required: true,
    },
    userName: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
    },
    status: {
      type: Boolean,
    },
    firstName: {
      type: String,
      // required: true,
    },
    lastName: {
      type: String,
      // required: true,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    zip: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    age: {
      type: Number,
    },
    yearOfBirth: {
      type: Number
    }
  },
  { timestamps: true }
);

const Users = mongoose.model("users", UsersSchema);

module.exports = Users;
