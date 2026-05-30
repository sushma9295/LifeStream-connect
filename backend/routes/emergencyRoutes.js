const express = require("express");
const {
  createEmergency,
  getActiveEmergencies,
  respondToEmergency,
  resolveEmergency,
} = require("../controllers/emergencyController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", verifyToken, createEmergency);
router.get("/active", verifyToken, getActiveEmergencies);
router.put("/:id/respond", verifyToken, respondToEmergency);
router.put("/:id/resolve", verifyToken, resolveEmergency);

module.exports = router;
