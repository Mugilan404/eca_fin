const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationcontroller");
const uploadPopup = require("../middlewares/uploadPopup");
// Admin can post notification
router.post("/", notificationController.createNotification);
// Admin can create popup
router.post("/create-popup", uploadPopup.single("image"), notificationController.createPopup);
// Public fetch notifications
router.get("/", notificationController.getNotifications);
router.get("/top3", notificationController.getTop3Notifications);
router.get("/top10", notificationController.getTop10Notifications);
router.get("/get-popup", notificationController.getPopup);
router.get("/:id", notificationController.getAllNotifications);
router.delete("/:id", notificationController.deleteNotification);
module.exports = router;
