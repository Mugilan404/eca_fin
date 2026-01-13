const multer = require("multer");

const storage = multer.diskStorage({
  destination: "backend/uploads/csv",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

module.exports = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "text/csv") {
      cb(new Error("Only CSV allowed"));
    }
    cb(null, true);
  }
});
