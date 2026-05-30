require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

const fixedKey = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    ...serviceAccount,
    private_key: fixedKey
  }),
  databaseURL: "https://lifestreamconnect-10e84-default-rtdb.firebaseio.com"
});

const db = admin.database();
const auth = admin.auth();

console.log("Firebase Admin connected successfully");

module.exports = { admin, db, auth };