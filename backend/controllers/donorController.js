const { db } = require("../config/firebase");
const { getCompatibleDonors } = require("../utils/bloodCompatibility");
const { findNearbyDonors } = require("../utils/distanceCalculator");

const getAllDonors = async (req, res) => {
  try {
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val() || {};
    const donors = Object.keys(users)
      .filter((uid) => users[uid].isDonor && users[uid].available)
      .map((uid) => ({ uid, ...users[uid] }));

    return res.status(200).json({ success: true, donors, count: donors.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch donors" });
  }
};

const getDonorsByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const compatibleGroups = getCompatibleDonors(bloodGroup);
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val() || {};

    const donors = Object.keys(users)
      .map((uid) => ({ uid, ...users[uid] }))
      .filter((user) => user.isDonor && user.available && compatibleGroups.includes(user.bloodGroup));

    return res.status(200).json({ success: true, donors, bloodGroup, compatibleGroups });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch donors by blood group" });
  }
};

const getNearbyDonors = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radius = parseFloat(req.query.radius) || 10;
    const bloodGroup = req.query.bloodGroup;

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val() || {};

    let donors = Object.keys(users)
      .map((uid) => ({ uid, ...users[uid] }))
      .filter((user) => user.isDonor && user.available);

    if (bloodGroup) {
      const compatibleGroups = getCompatibleDonors(bloodGroup);
      donors = donors.filter((donor) => compatibleGroups.includes(donor.bloodGroup));
    }

    const nearbyDonors = findNearbyDonors(donors, lat, lon, radius);
    return res.status(200).json({ success: true, donors: nearbyDonors, count: nearbyDonors.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch nearby donors" });
  }
};

const updateDonorAvailability = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { available } = req.body;

    if (available === undefined) {
      return res.status(400).json({ success: false, message: "Availability status is required" });
    }

    await db.ref(`users/${uid}`).update({ available: Boolean(available), updatedAt: Date.now() });

    return res.status(200).json({
      success: true,
      message: available ? "You are now available" : "You are now unavailable",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update availability" });
  }
};

const updateDonorLocation = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { lat, lon } = req.body;

    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    await db.ref(`users/${uid}/location`).set({ lat, lon, updatedAt: Date.now() });

    return res.status(200).json({ success: true, message: "Location updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update location" });
  }
};

module.exports = {
  getAllDonors,
  getDonorsByBloodGroup,
  getNearbyDonors,
  updateDonorAvailability,
  updateDonorLocation,
};
