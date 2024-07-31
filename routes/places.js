const express = require("express");
const router = express.Router();
const {
    createPlaces, listPlaces, getPlaceByDistrict, deletePlaces, getLastFivePlaces ,searchPlaceByKeyword
} = require("../controllers/places");

router.post("/register", createPlaces);
router.post("/list", listPlaces);
router.post("/getPlaceByDistrict", getPlaceByDistrict);
router.post("/delete", deletePlaces);
router.get("/recent", getLastFivePlaces);
router.post("/search", searchPlaceByKeyword);

module.exports = router;
