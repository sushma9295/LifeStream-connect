const { db } = require("../config/firebase");

const getTrackingInfo = async (req, res) => {
  try {
    const { requestId } = req.params;
    const snapshot = await db.ref(`requests/${requestId}`).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const request = snapshot.val();

    if (!request.donorId) {
      return res.status(200).json({
        success: true,
        tracking: { status: "waiting", message: "Looking for donor" },
      });
    }

    const donorSnapshot = await db.ref(`users/${request.donorId}`).once("value");
    const donorLocationSnapshot = await db.ref(`users/${request.donorId}/location`).once("value");
    const donorData = donorSnapshot.val() || {};
    const location = donorLocationSnapshot.val() || { lat: 0, lon: 0 };

    return res.status(200).json({
      success: true,
      tracking: {
        status: request.status || "assigned",
        donor: {
          name: donorData.name || "Unknown",
          phone: donorData.phone || "",
          bloodGroup: donorData.bloodGroup || "",
        },
        location,
        eta: "12 minutes",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch tracking info" });
  }
};

const updateDonorTracking = async (req, res) => {
  try {
    const donorId = req.user.uid;
    const { requestId, lat, lon, status } = req.body;

    if (!requestId || lat === undefined || lon === undefined || !status) {
      return res.status(400).json({ success: false, message: "requestId, lat, lon, and status are required" });
    }

    await db.ref(`requests/${requestId}`).update({
      donorLocation: { lat, lon },
      trackingStatus: status,
      updatedAt: Date.now(),
    });

    await db.ref(`users/${donorId}/location`).set({ lat, lon, updatedAt: Date.now() });

    return res.status(200).json({ success: true, message: "Tracking updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update tracking" });
  }
};

module.exports = { getTrackingInfo, updateDonorTracking };
