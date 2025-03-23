const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createPlaces,
  listPlaces,
  getPlaceByDistrict,
  deletePlaces,
  getLastFivePlaces,
  searchPlaceByKeyword,
  createContest,
  listContestById,
  listContest
} = require("../controllers/places");

// Public routes - no authentication required
router.get("/recent", getLastFivePlaces);
router.post("/search", searchPlaceByKeyword);
router.post("/list", listPlaces);
router.post("/getPlaceByDistrict", getPlaceByDistrict);
router.post("/listContest", listContest);
router.post("/listById", listContestById);

// Protected routes - require authentication
router.use(protect);

// User authenticated routes
router.post("/register", createPlaces);
router.post("/createContest", createContest);

// Admin only routes
router.use(restrictTo('admin'));
router.post("/delete", deletePlaces);

module.exports = router;
