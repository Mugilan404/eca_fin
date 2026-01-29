const express = require("express");
const router = express.Router();

const batchController = require("../controllers/batchcontroller");
const authMiddleware = require("../middlewares/authmiddleware");

/* CREATE */
router.post("/create", batchController.createBatch);

/* ALL */
router.get("/", batchController.getBatches);

/* MATERIAL BATCHES */
router.get("/materials", batchController.getMaterialBatches);

/* TEST BATCHES */
router.get("/tests", batchController.getTestBatches);

/* USER BATCHES */
router.get("/my-batches", authMiddleware, batchController.getMyBatches);

/* User accessible batches */
router.get(
  "/user-batches/:email", // optional but recommended
  batchController.getUserAccessibleBatches
);
router.delete("/revoke", batchController.RevokeAccess);
module.exports = router;
