require("dotenv").config()
const admin = require("firebase-admin")

let serviceAccount

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e)
    process.exit(1)
  }
} else {
  try {
    serviceAccount = require("../serviceAccountKey.json")
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  } catch (e) {
    console.error("serviceAccountKey.json not found:", e)
    process.exit(1)
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lifestreamconnect-10e84-default-rtdb.firebaseio.com"
})

const db = admin.database()
const auth = admin.auth()

console.log("Firebase Admin connected successfully")

module.exports = { admin, db, auth }