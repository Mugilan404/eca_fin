const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Admin can post notification
router.post("/", notificationController.createNotification);

// Public fetch notifications
router.get("/", notificationController.getNotifications);
router.get("/top3", notificationController.getTop3Notifications);
router.get("/top10", notificationController.getTop10Notifications);
module.exports = router;
