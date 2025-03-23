const express = require("express");
const router = express.Router();
const {
 create,list
} = require("../controllers/rooms");

router.post("/register", create);
router.post("/list", list);
// router.post("/delete", deleteHotel);
// router.get("/recent", getLastFiveHotels);


module.exports = router;
