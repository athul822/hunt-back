const express = require("express");
const router = express.Router();
const {
  createUsers,
  userLogin,
  updateUser,
  getMe
} = require("../controllers/users");
const { 
  googleAuthHandler, 
  verifyToken 
} = require("../controllers/auth");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes
router.post("/register", createUsers);
router.post("/login", userLogin);
router.post("/google-auth", googleAuthHandler);
router.post("/verify-token", verifyToken);

// Protected routes - require authentication
router.use(protect);

router.get("/me", getMe);
router.put("/update/:id", updateUser);

// Admin only routes
// router.use(restrictTo('admin'));
// Add admin-only routes here if needed

module.exports = router;
