const express = require("express");
const router = express.Router();
const {
 createUsers,userLogin
} = require("../controllers/users");

router.post("/register", createUsers);
router.post("/login", userLogin);


module.exports = router;
