const { db } = require("../config/firebase");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.ref(`notifications/${userId}`).once("value");
    const notificationsData = snapshot.val() || {};

    const notifications = Object.keys(notificationsData)
      .map((id) => ({ id, ...notificationsData[id] }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to fetch notifications" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;
    const notifId = req.params.id;

    await db.ref(`notifications/${userId}/${notifId}`).update({ read: true });

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to mark notification as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.ref(`notifications/${userId}`).once("value");
    const notificationsData = snapshot.val() || {};

    const updates = {};
    Object.keys(notificationsData).forEach((id) => {
      updates[`${id}/read`] = true;
    });

    if (Object.keys(updates).length > 0) {
      await db.ref(`notifications/${userId}`).update(updates);
    }

    return res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to mark all notifications as read" });
  }
};

const createNotification = async (userId, type, title, message) => {
  try {
    const notificationRef = db.ref(`notifications/${userId}`).push();
    await notificationRef.set({
      type,
      title,
      message,
      read: false,
      createdAt: Date.now(),
    });

    return notificationRef.key;
  } catch (error) {
    console.error("Unable to create notification", error);
    return null;
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
