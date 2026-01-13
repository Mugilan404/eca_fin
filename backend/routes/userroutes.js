const express = require("express");
const router = express.Router();
const { getUserByEmail } = require("../controllers/usercontroller");

// Fetch user by email
router.get("/by-email/:email", getUserByEmail);

module.exports = router;
