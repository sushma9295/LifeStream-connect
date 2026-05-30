const { admin, db } = require("../config/firebase");

const registerUser = async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, city, isDonor, password } = req.body;

    if (!name || !email || !phone || !bloodGroup || !city || isDonor === undefined || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const userData = {
      name,
      email,
      phone,
      bloodGroup,
      city,
      isDonor: Boolean(isDonor),
      available: Boolean(isDonor),
      createdAt: Date.now(),
      location: { lat: 0, lon: 0 },
    };

    await db.ref(`users/${userRecord.uid}`).set(userData);

    return res.status(201).json({ success: true, message: "User registered", uid: userRecord.uid });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to register user" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    const snapshot = await db.ref(`users/${userRecord.uid}`).once("value");
    const userData = snapshot.val();

    if (!userData) {
      return res.status(404).json({ success: false, message: "User data not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        uid: userRecord.uid,
        name: userData.name,
        email: userData.email,
        bloodGroup: userData.bloodGroup,
        city: userData.city,
        isDonor: userData.isDonor,
        available: userData.available,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to login user" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snapshot = await db.ref(`users/${uid}`).once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: snapshot.val() });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch profile" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, phone, city, available } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (available !== undefined) updates.available = Boolean(available);
    updates.updatedAt = Date.now();

    await db.ref(`users/${uid}`).update(updates);

    return res.status(200).json({ success: true, message: "Profile updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update profile" });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
