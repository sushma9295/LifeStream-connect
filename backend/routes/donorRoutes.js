const express = require("express");
const {
  getAllDonors,
  getDonorsByBloodGroup,
  getNearbyDonors,
  updateDonorAvailability,
  updateDonorLocation,
} = require("../controllers/donorController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, getAllDonors);
router.get("/blood/:bloodGroup", verifyToken, getDonorsByBloodGroup);
router.get("/nearby", verifyToken, getNearbyDonors);
router.put("/availability", verifyToken, updateDonorAvailability);
router.put("/location", verifyToken, updateDonorLocation);

module.exports = router;
