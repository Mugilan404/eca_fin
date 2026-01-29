const express = require("express");
const router = express.Router();

const {
  grantAccess,
  getEnrollDetails,
} = require("../controllers/accessController");
// Admin-only (add auth middleware later if needed)
router.post("/grant", grantAccess);
router.get("/enroll/:enrollId", getEnrollDetails);
 // to be implemented
module.exports = router;
