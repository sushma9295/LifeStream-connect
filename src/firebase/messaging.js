import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { db } from "./config"
import { ref, update } from "firebase/database"
import app from "./config"

let messaging = null

try {
  messaging = getMessaging(app)
} catch (err) {
  console.log("Messaging not supported:", err)
}

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY || ""

export async function requestNotificationPermission(userId) {
  try {
    if (!messaging) return null
    if (!("Notification" in window)) return null
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token && userId) {
      await update(ref(db, "users/" + userId), {
        fcmToken: token,
        notificationsEnabled: true,
        tokenUpdatedAt: Date.now()
      })
      console.log("FCM token saved successfully")
      return token
    }
    return null
  } catch (err) {
    console.log("FCM permission error:", err)
    return null
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {}
  try {
    return onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload)
      callback(payload)
    })
  } catch (err) {
    console.log("Foreground message error:", err)
    return () => {}
  }
}

export { messaging }
