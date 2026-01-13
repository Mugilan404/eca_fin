const express = require("express");
const router = express.Router();
const authcontroller = require("../controllers/authcontroller");

router.post("/register", authcontroller.register);
router.post("/student/login", authcontroller.studentLogin);
router.post("/admin-login", authcontroller.adminLogin);

module.exports = router;
