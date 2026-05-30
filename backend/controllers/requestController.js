const { db } = require("../config/firebase");
const { getCompatibleDonors } = require("../utils/bloodCompatibility");
const { sendNotificationToMultiple, getMatchingDonorTokens } = require("../utils/fcmService")

const createRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, hospital, city, units, contact, notes } = req.body;
    const userId = req.user.uid;

    if (!patientName || !bloodGroup || !hospital || !city || !units || !contact) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const requestRef = db.ref("requests").push();
    const requestId = requestRef.key;

    await requestRef.set({
      patientName,
      bloodGroup,
      hospital,
      city,
      units,
      contact,
      notes: notes || "",
      userId,
      status: "pending",
      createdAt: Date.now(),
    });

    try {
      const tokens = await getMatchingDonorTokens(db, bloodGroup)
      if (tokens.length > 0) {
        await sendNotificationToMultiple(
          tokens,
          "Blood Request: " + bloodGroup + " Needed",
          "Patient needs " + units + " unit(s) at " + hospital + " in " + city,
          {
            type: "request",
            bloodGroup: bloodGroup,
            city: city,
            hospital: hospital
          }
        )
      }
    } catch (notifErr) {
      console.log("Request notification error:", notifErr.message)
    }

    return res.status(201).json({ success: true, message: "Request created", requestId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to create request" });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const snapshot = await db.ref("requests").once("value");
    const requestsData = snapshot.val() || {};

    const requests = Object.keys(requestsData)
      .map((id) => ({ id, ...requestsData[id] }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch requests" });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.ref("requests").once("value");
    const requestsData = snapshot.val() || {};

    const requests = Object.keys(requestsData)
      .map((id) => ({ id, ...requestsData[id] }))
      .filter((request) => request.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch your requests" });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref(`requests/${id}`).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    return res.status(200).json({ success: true, request: snapshot.val() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch request" });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, donorId } = req.body;
    const validStatuses = ["pending", "accepted", "in-progress", "completed", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status provided" });
    }

    const updates = { status, updatedAt: Date.now() };
    if (donorId) updates.donorId = donorId;

    await db.ref(`requests/${id}`).update(updates);

    return res.status(200).json({ success: true, message: "Status updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update request status" });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const snapshot = await db.ref(`requests/${id}`).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const request = snapshot.val();
    if (request.userId !== userId) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this request" });
    }

    await db.ref(`requests/${id}`).remove();

    return res.status(200).json({ success: true, message: "Request deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to delete request" });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};
