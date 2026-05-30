import axios from "axios";
import { auth } from "../firebase/config";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5002/api";

const API = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = "Bearer " + token;
    }
  } catch (err) {
    console.log("Token error:", err);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default API;