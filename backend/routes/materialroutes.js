const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialcontroller");
const verifyToken = require("../middlewares/authmiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const optionalAuth = require("../middlewares/optionalAuth");

/* ============================
   MULTER STORAGE CONFIG
============================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/materials");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const batchId = req.body.batch_id || "NA";
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${batchId}_${Date.now()}_${base}${ext}`);
  }
});

/* ============================
   FILE FILTER
============================ */
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/* ============================
   ROUTES
============================ */

// 🔐 Upload material (PROTECTED — UNCHANGED)
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  materialController.uploadMaterial
);

// 🔓 Fetch materials by batch (PUBLIC)
router.get(
  "/batch/:batchId",
  materialController.getMaterialsByBatch
);

router.get(
  "/access/:materialId",
  optionalAuth,
  materialController.checkMaterialAccess
);

module.exports = router;
