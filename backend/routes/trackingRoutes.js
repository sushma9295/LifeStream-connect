const express = require("express");
const { getTrackingInfo, updateDonorTracking } = require("../controllers/trackingController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/:requestId", verifyToken, getTrackingInfo);
router.put("/update", verifyToken, updateDonorTracking);

module.exports = router;
