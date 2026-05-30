importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyBkCQlHc2b9ZeNMJi5G5AfKGoEjnMZLKv0",
  authDomain: "lifestreamconnect-10e84.firebaseapp.com",
  databaseURL: "https://lifestreamconnect-10e84-default-rtdb.firebaseio.com",
  projectId: "lifestreamconnect-10e84",
  storageBucket: "lifestreamconnect-10e84.firebasestorage.app",
  messagingSenderId: "105198015504",
  appId: "1:105198015504:web:6e6ead47566b27bc10a695"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification && payload.notification.title ? payload.notification.title : "Lifestream Connect"
  const options = {
    body: payload.notification && payload.notification.body ? payload.notification.body : "New blood request",
    icon: "/vite.svg",
    badge: "/vite.svg",
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" }
    ]
  }
  self.registration.showNotification(title, options)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow("/notifications")
  )
})
