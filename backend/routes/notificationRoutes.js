const express = require("express");
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.put("/:id/read", verifyToken, markAsRead);
router.put("/read-all", verifyToken, markAllAsRead);

// Admin/test route to send a test notification to a token or current user
const { sendNotificationToToken } = require("../utils/fcmService")
router.post('/test', verifyToken, async (req, res) => {
	try {
		const { token, title, body, data } = req.body
		const target = token || req.user.fcmToken
		if (!target) return res.status(400).json({ success: false, message: 'No token provided or on user' })
		await sendNotificationToToken(target, title || 'Test Notification', body || 'This is a test', data || {})
		return res.status(200).json({ success: true, message: 'Test sent' })
	} catch (err) {
		console.error('Test notification error:', err)
		return res.status(500).json({ success: false, message: err.message })
	}
})

module.exports = router;
