const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");
const jwt = require("jsonwebtoken");
const usernameGenerator = require("username-generator");

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Handle Google OAuth login/signup from mobile app
exports.googleAuthHandler = async (req, res) => {
  try {
    const { email, googleId, firstName, lastName, profileImage } = req.body;

    // Validate required fields
    if (!email || !googleId) {
      return res.status(400).json({
        message: "Email and Google ID are required"
      });
    }

    // Check if user exists
    let user = await Users.findOne({ email });

    if (user) {
      // Update existing user's google ID if needed
      if (user.googleId !== googleId) {
        user.googleId = googleId;
        // Update profile image if provided
        if (profileImage) {
          user.profileImage = profileImage;
        }
        await user.save();
      }
    } else {
      // Generate a random readable username
      const generatedUsername = usernameGenerator.generateUsername();
      
      // Create new user
      user = await Users.create({
        id: uuidv4(),
        email,
        googleId,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImage: profileImage || '',
        role: 'user',
        username: generatedUsername
      });
    }

    // Generate JWT token
    const token = signToken(user._id);

    // Return user info and token
    res.status(200).json({
      message: "Authentication successful",
      token,
      user
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      message: "Authentication failed",
      error: error.message
    });
  }
};

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    // Get token from auth header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        isValid: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await Users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        isValid: false,
        message: 'User no longer exists'
      });
    }

    // Token is valid
    return res.status(200).json({
      isValid: true,
      user
    });
  } catch (error) {
    return res.status(401).json({
      isValid: false,
      message: 'Invalid token'
    });
  }
}; 