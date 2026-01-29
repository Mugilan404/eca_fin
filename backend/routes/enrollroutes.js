const express = require("express");
const router = express.Router();
const upload = require("../middlewares/paymentupload");
const auth = require("../middlewares/authmiddleware");
const controller = require("../controllers/enrollcontroller");

router.get("/batch/:batchId", auth, controller.getBatchById);

router.get(
  "/admin/fetchenroll",
  auth,
  controller.getEnroll
);
router.get(
  "/admin/requests",
  auth,
  controller.getEnrollRequests
);
// Admin – fetch enroll details
router.get("/:enrollId", controller.getEnrollDetails);
/* ===== ADMIN UPDATE STATUS ===== */
router.post(
  "/admin/update-status",
  auth,
  controller.updateEnrollStatus
);
router.post(
  "/submit",
  auth,
  upload.single("payment"),
  controller.submitEnrollment
);
module.exports = router;
