import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, get, update } from "firebase/database";
import BottomNav from "../components/BottomNav";

export default function DonorTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donated, setDonated] = useState(false);

  const requestId = location.state?.requestId;

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      try {
        const snapshot = await get(ref(db, "requests/" + requestId));
        if (snapshot.exists()) {
          setRequest(snapshot.val());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleMarkDonated = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      await update(ref(db, "requests/" + requestId), {
        status: "completed",
        completedAt: Date.now()
      });
      setDonated(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error(error);
      alert("Failed to mark donation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="px-4 pt-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-700 mb-4">
            <ArrowLeft size={20} /> Back
          </button>
          <div className="bg-white rounded-2xl p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">Request not found</p>
            <button onClick={() => navigate("/dashboard")} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl">
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-700 mb-4">
          <ArrowLeft size={20} /> Back
        </button>

        {donated && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-semibold text-green-900">Thank You!</p>
              <p className="text-sm text-green-700">You just saved a life. Donation recorded.</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white mb-5">
          <p className="text-red-200 text-sm mb-2">Blood Request</p>
          <h1 className="text-2xl font-bold mb-3">{request.bloodGroup} Blood Needed</h1>
          <div className="space-y-2">
            <p className="text-sm text-red-100">Patient: {request.patientName}</p>
            <p className="text-sm text-red-100">Hospital: {request.hospital}</p>
            <p className="text-sm text-red-100">City: {request.city}</p>
            <p className="text-sm text-red-100">Units Needed: {request.units}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg">
              {request.contactNumber?.substring(0, 1) || "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{request.patientName}</p>
              <p className="text-xs text-gray-500 mt-1">Contact: {request.contactNumber}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl h-40 flex items-center justify-center mb-5">
          <div className="text-center text-gray-500">
            <MapPin size={32} className="mx-auto mb-2" />
            <p className="text-sm font-semibold">Map view</p>
            <p className="text-xs text-gray-400 mt-1">Locate {request.hospital}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-600" size={18} />
            <p className="text-sm font-semibold text-blue-900">Journey Status</p>
          </div>
          <p className="text-xs text-blue-700">Your location is being shared with the patient. Arrive at {request.hospital} to complete donation.</p>
        </div>

        <div className="space-y-2">
          <a href={"tel:" + request.contactNumber} className="w-full bg-green-600 text-white font-semibold py-3 rounded-2xl flex items-center justify-center">
            Call Patient
          </a>
          <button onClick={handleMarkDonated} disabled={loading || donated} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Mark Donation Completed"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
