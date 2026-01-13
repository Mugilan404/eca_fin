const express = require("express");
const router = express.Router();
const { grantAccess } = require("../controllers/accesscontroller");

router.post("/grant", grantAccess);

module.exports = router;
