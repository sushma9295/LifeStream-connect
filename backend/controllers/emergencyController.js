const { db } = require("../config/firebase");
const { sendNotificationToMultiple, getMatchingDonorTokens } = require("../utils/fcmService")

const createEmergency = async (req, res) => {
  try {
    const { bloodGroup, city, hospital, units, urgency } = req.body;
    const userId = req.user.uid;

    if (!bloodGroup || !city || !hospital || !units || !urgency) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const emergencyRef = db.ref("emergency").push();
    const emergencyId = emergencyRef.key;

    await emergencyRef.set({
      bloodGroup,
      city,
      hospital,
      units,
      urgency,
      userId,
      status: "active",
      notifiedDonors: 0,
      createdAt: Date.now(),
    });

    try {
      const tokens = await getMatchingDonorTokens(db, bloodGroup)
      if (tokens.length > 0) {
        await sendNotificationToMultiple(
          tokens,
          "EMERGENCY: Blood Needed!",
          urgency + " - " + bloodGroup + " needed at " + hospital + " in " + city,
          {
            type: "emergency",
            bloodGroup: bloodGroup,
            city: city,
            hospital: hospital
          }
        )
        await db.ref("emergency/" + emergencyId).update({
          notifiedDonors: tokens.length
        })
        console.log("Emergency notifications sent to " + tokens.length + " donors")
      }
    } catch (notifErr) {
      console.log("Notification error (non-critical):", notifErr.message)
    }

    return res.status(201).json({ success: true, message: "Emergency broadcasted", emergencyId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to create emergency" });
  }
};

const getActiveEmergencies = async (req, res) => {
  try {
    const snapshot = await db.ref("emergency").orderByChild("status").equalTo("active").once("value");
    const emergenciesData = snapshot.val() || {};

    const emergencies = Object.keys(emergenciesData)
      .map((id) => ({ id, ...emergenciesData[id] }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch emergencies" });
  }
};

const respondToEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const donorId = req.user.uid;
    const { response } = req.body;

    if (!response || !["accept", "decline"].includes(response)) {
      return res.status(400).json({ success: false, message: "Response must be accept or decline" });
    }

    const updates = {
      [`responses/${donorId}`]: {
        response,
        timestamp: Date.now(),
      },
    };

    if (response === "accept") {
      updates.status = "donor-assigned";
      updates.donorId = donorId;
    }

    await db.ref(`emergency/${id}`).update({ ...updates, updatedAt: Date.now() });

    return res.status(200).json({ success: true, message: `Emergency ${response}ed successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to respond to emergency" });
  }
};

const resolveEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    await db.ref(`emergency/${id}`).update({ status: "resolved", resolvedAt: Date.now() });

    return res.status(200).json({ success: true, message: "Emergency resolved" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to resolve emergency" });
  }
};

module.exports = { createEmergency, getActiveEmergencies, respondToEmergency, resolveEmergency };
