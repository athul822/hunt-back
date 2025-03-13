const express = require("express");
const router = express.Router();
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

router.post("/register", createPlaces);
router.post("/list", listPlaces);
router.post("/listById", listContestById);
router.post("/listContest", listContest);
router.post("/getPlaceByDistrict", getPlaceByDistrict);
router.post("/delete", deletePlaces);
router.get("/recent", getLastFivePlaces);
router.post("/search", searchPlaceByKeyword);
router.post("/createContest", createContest);

module.exports = router;
