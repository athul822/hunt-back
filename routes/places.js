const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const {
  createPlaces,
  getPlaceByDistrict,
  deletePlaces,
  getLastFivePlaces,
  searchPlaceByKeyword,
  createContest,
  listContestById,
  listContest,
  getMyContests,
  joinContest,
  completeTreasure,
  userCompletedTreasures,
  contestLeaderboard,
  userContestCompletedTreasures,
  completeContest
} = require("../controllers/places");

// Public routes - no authentication required
router.get("/recent", getLastFivePlaces);
router.post("/search", searchPlaceByKeyword);
router.post("/getPlaceByDistrict", getPlaceByDistrict);

// Protected routes - require authentication
router.use(protect);

// User authenticated routes
// router.post("/register", createPlaces);
router.post("/createContest", createContest);
router.post("/list", listContest);
router.post("/listContest", listContest);
router.post("/listContestById", listContestById);
router.get("/myContests", getMyContests);
router.post("/joinContest", joinContest);

// Treasure and contest completion routes
router.post("/completeTreasure", completeTreasure);
router.post("/userCompletedTreasures", userCompletedTreasures);
router.post("/contestLeaderboard", contestLeaderboard);
router.post("/userContestCompletedTreasures", userContestCompletedTreasures);
router.post("/completeContest", completeContest);

// Admin only routes
router.use(restrictTo('admin'));
router.post("/delete", deletePlaces);

module.exports = router;
