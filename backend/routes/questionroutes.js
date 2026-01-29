const express = require("express");
const router = express.Router();
const multer = require("multer");
const questionController = require("../controllers/questioncontroller");
const auth = require("../middlewares/authmiddleware");

const upload = multer({ dest: "backend/uploads/csv" });
// temp upload (memory)
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// upload multiple images
router.post(
  "/upload-images",
  auth,
  uploadImages.array("images", 50),
  questionController.uploadQuestionImages
);
router.post(
  "/upload/:test_id",
  auth,
  upload.single("questions_csv"),
  questionController.uploadQuestionsCSV
);

// 🔐 Protected route
router.get("/test/:testId", auth, questionController.getQuestionsByTest);

module.exports = router;
