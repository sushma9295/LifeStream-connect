import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBkCQlHc2b9ZeNMJi5G5AfKGoEjnMZLKv0",
  authDomain: "lifestreamconnect-10e84.firebaseapp.com",
  databaseURL: "https://lifestreamconnect-10e84-default-rtdb.firebaseio.com",
  projectId: "lifestreamconnect-10e84",
  storageBucket: "lifestreamconnect-10e84.firebasestorage.app",
  messagingSenderId: "105198015504",
  appId: "1:105198015504:web:6e6ead47566b27bc10a695"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;