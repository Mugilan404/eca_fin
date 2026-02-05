const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

router.post("/create", classController.createClass);
router.delete("/:id", classController.deleteClass);
//router.get("/", classController.getAllClasses);
router.get("/batch/:batchId", classController.getClassById);
module.exports = router;