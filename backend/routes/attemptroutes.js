const express = require("express");
const router = express.Router();

const attemptcontroller = require("../controllers/attemptcontroller");
const authmiddleware = require("../middlewares/authmiddleware");

// Student starts test attempt
router.post(
  "/start",
  authmiddleware,
  attemptcontroller.startAttempt
);

module.exports = router;
