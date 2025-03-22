const express = require("express");
const router = express.Router();
const {
 createUsers,userLogin, updateUser
} = require("../controllers/users");

router.post("/register", createUsers);
router.post("/login", userLogin);
router.put("/update/:id", updateUser);

module.exports = router;
