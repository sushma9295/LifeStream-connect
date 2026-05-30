const { admin } = require("../config/firebase")

async function sendNotificationToToken(token, title, body, data) {
  try {
    if (!token) return null
    const message = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: data || {},
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: "/vite.svg",
          badge: "/vite.svg",
          vibrate: [200, 100, 200],
          actions: [
            { action: "open", title: "Open App" }
          ]
        },
        fcmOptions: {
          link: "/"
        }
      },
      android: {
        notification: {
          title: title,
          body: body,
          priority: "high",
          defaultVibrateTimings: true
        },
        priority: "high"
      }
    }
    const response = await admin.messaging().send(message)
    console.log("Notification sent successfully:", response)
    return response
  } catch (err) {
    console.log("FCM send error for token:", err.message)
    return null
  }
}

async function sendNotificationToMultiple(tokens, title, body, data) {
  if (!tokens || tokens.length === 0) return
  const validTokens = tokens.filter(Boolean)
  if (validTokens.length === 0) return
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: "/vite.svg",
          vibrate: [200, 100, 200]
        }
      },
      tokens: validTokens
    }
    const response = await admin.messaging().sendEachForMulticast(message)
    console.log("Sent to " + response.successCount + " devices")
    console.log("Failed: " + response.failureCount + " devices")
    return response
  } catch (err) {
    console.log("Multicast FCM error:", err.message)
    return null
  }
}

async function getMatchingDonorTokens(db, bloodGroup) {
  try {
    const snapshot = await db.ref("users").once("value")
    const users = snapshot.val()
    if (!users) return []
    const compatibleGroups = getCompatibleGroups(bloodGroup)
    const tokens = Object.values(users)
      .filter((user) =>
        user.isDonor === true &&
        user.available === true &&
        user.fcmToken &&
        compatibleGroups.includes(user.bloodGroup)
      )
      .map((user) => user.fcmToken)
      .filter(Boolean)
    return tokens
  } catch (err) {
    console.log("Error getting donor tokens:", err)
    return []
  }
}

function getCompatibleGroups(requiredGroup) {
  const compatibility = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
  }
  return compatibility[requiredGroup] || [requiredGroup]
}

module.exports = {
  sendNotificationToToken,
  sendNotificationToMultiple,
  getMatchingDonorTokens
}
