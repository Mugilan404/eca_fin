const express = require("express");
const router = express.Router();
const multer = require("multer");

const testController = require("../controllers/testcontroller");
const authMiddleware = require("../middlewares/authmiddleware");

/* ===== Multer (CSV Upload) ===== */
const upload = multer({
  dest: "backend/uploads/csv/"
});

/* ===== CREATE TEST + QUESTIONS ===== */
router.post(
  "/",
  authMiddleware,
  upload.single("questions_csv"),
  testController.createTest
);

router.get("/batch/:batchId", authMiddleware, testController.getTestsByBatch);

module.exports = router;
