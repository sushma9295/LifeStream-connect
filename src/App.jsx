import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import RequestBlood from "./pages/RequestBlood";
import EmergencyRequest from "./pages/EmergencyRequest";
import FindDonor from "./pages/FindDonor";
import MyRequests from "./pages/MyRequests";
import LiveTracking from "./pages/LiveTracking";
import DonorTracking from "./pages/DonorTracking";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex justify-center">
          <div className="w-full max-w-sm bg-white min-h-screen relative shadow-xl overflow-hidden">
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/request-blood" element={<ProtectedRoute><RequestBlood /></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><EmergencyRequest /></ProtectedRoute>} />
              <Route path="/find-donor" element={<ProtectedRoute><FindDonor /></ProtectedRoute>} />
              <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
              <Route path="/live-tracking" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
              <Route path="/donor-tracking" element={<ProtectedRoute><DonorTracking /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
