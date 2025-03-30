const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usernameGenerator = require("username-generator");

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createUsers = async (req, res) => {
  try {
    console.log(req.body);
    const { email, googleId, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Check if user already exists with this email
    let user = await Users.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, update the user with googleId
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      // Generate JWT token
      const token = signToken(user._id);

      return res.json({
        message: "User login successful",
        token,
        user,
      });
    }

    // Generate a random readable username if not provided
    const generatedUsername =
      req.body.username || usernameGenerator.generateUsername();

    // Create new user
    // Add a unique ID if not provided
    const newUserData = {
      ...req.body,
      id: req.body.id || uuidv4(),
      username: generatedUsername,
    };

    // Create the user
    const newUser = await Users.create(newUserData);

    // Generate JWT token
    const token = signToken(newUser._id);

    // Send success response
    res.json({
      message: "User registration successful",
      token,
      user: newUser,
    });
  } catch (error) {
    // Handle errors
    console.error("Error in user registration:", error);
    res.status(500).json({
      message: "Unable to register new user",
      error: error.message,
    });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, googleId } = req.body;

    // Check if email exists
    if (!email) {
      return res.status(400).json({
        message: "Please provide email",
      });
    }

    // Find user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "User not found. Please register first.",
      });
    }

    // If googleId is provided, update it if needed
    if (googleId && user.googleId !== googleId) {
      user.googleId = googleId;
      await user.save();
    }

    // Generate token
    const token = signToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({
      message: "Unable to login",
      error: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Remove protected fields from the update request
    const { id, email, role, googleId, ...updateData } = req.body;
    console.log(updateData, "updateData", req.params.id);
    
    // Find and update the user by custom id field instead of _id
    const updatedUser = await Users.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Unable to update user details",
      error: error.message,
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);

    res.status(200).json({
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      message: "Unable to retrieve user profile",
      error: error.message,
    });
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find();
    
    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "Unable to retrieve users",
      error: error.message,
    });
  }
};

// Get specific user by ID
exports.getUser = async (req, res) => {
  try {
    const user = await Users.findOne({ id: req.params.id });
    
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    
    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      message: "Unable to retrieve user",
      error: error.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await Users.findOneAndDelete({ id: req.params.id });
    
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    
    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Unable to delete user",
      error: error.message,
    });
  }
};
