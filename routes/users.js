const express = require("express");
const router = express.Router();
const {
  createUsers,
  userLogin,
  updateUser,
  getMe,
  getAllUsers,
  getUser,
  deleteUser
} = require("../controllers/users");
const { 
  googleAuthHandler, 
  verifyToken,
  refreshToken,
  logout
} = require("../controllers/auth");
const { protect, restrictTo } = require("../middleware/auth");

// Public routes - no authentication required
router.post("/register", createUsers);
router.post("/login", userLogin);
router.post("/google-auth", googleAuthHandler);
router.post("/verify-token", verifyToken);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes - require authentication
router.use(protect);

router.get("/me", getMe);
router.put("/update/:id", updateUser);

// Admin routes - require admin role
router.get("/all", restrictTo("admin"), getAllUsers);
router.get("/:id", restrictTo("admin"), getUser);
router.delete("/:id", restrictTo("admin"), deleteUser);

// Admin only routes
// router.use(restrictTo('admin'));
// Add admin-only routes here if needed

module.exports = router;
