const express = require("express");
const router = express.Router();
const {
 createHotels,listHotels,deleteHotel,getLastFiveHotels
} = require("../controllers/hotels");

router.post("/register", createHotels);
router.post("/list", listHotels);
router.post("/delete", deleteHotel);
router.get("/recent", getLastFiveHotels);


module.exports = router;
