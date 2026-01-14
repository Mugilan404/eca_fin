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

/* ===== GET MY TEST ATTEMPTS ===== */
router.get(
  "/my-attempts",
  authmiddleware,
  attemptcontroller.getMyAttempts
);

module.exports = router;
