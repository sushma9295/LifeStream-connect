import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update } from "firebase/database";
import { Droplets, AlertCircle, Search, ClipboardList, Heart, Bell, Check } from "lucide-react";
import BottomNav from "../components/BottomNav";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ donors: 0, requests: 0, emergencies: 0 });
  const [availableRequests, setAvailableRequests] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = ref(db, "users/" + currentUser.uid);
    const unsubscribeUser = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    });

    const allUsersRef = ref(db, "users");
    const unsubscribeDonors = onValue(allUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let donorCount = 0;
        Object.values(data).forEach((user) => {
          if (user.isDonor === true || user.isDonor === "true") {
            donorCount++;
          }
        });
        setStats((prev) => ({ ...prev, donors: donorCount }));
      }
    });

    const userRequestsRef = ref(db, "requests");
    const unsubscribeRequests = onValue(userRequestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let userRequestCount = 0;
        const pendingRequests = [];
        
        Object.entries(data).forEach(([id, request]) => {
          if (request.userId === currentUser.uid) {
            userRequestCount++;
          }
          if (request.status === "pending" && userData && request.bloodGroup === userData.bloodGroup) {
            pendingRequests.push({ id, ...request });
          }
        });
        
        setStats((prev) => ({ ...prev, requests: userRequestCount }));
        if (userData?.isDonor === true || userData?.isDonor === "true") {
          setAvailableRequests(pendingRequests);
        }
      }
    });

    const emergencyRef = ref(db, "emergency");
    const unsubscribeEmergencies = onValue(emergencyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let emergencyCount = 0;
        Object.values(data).forEach((emergency) => {
          if (emergency.status === "active") {
            emergencyCount++;
          }
        });
        setStats((prev) => ({ ...prev, emergencies: emergencyCount }));
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeDonors();
      unsubscribeRequests();
      unsubscribeEmergencies();
    };
  }, [currentUser, userData]);

  const handleAcceptRequest = async (requestId, request) => {
    try {
      setAcceptingId(requestId);
      await update(ref(db, "requests/" + requestId), {
        status: "accepted",
        donorId: currentUser.uid,
        acceptedAt: Date.now()
      });
      
      await new Promise((resolve) => {
        const notifRef = ref(db, "notifications/" + request.userId);
        const newNotifRef = ref(db, "notifications/" + request.userId + "/" + Date.now());
        onValue(notifRef, (snapshot) => {
          resolve();
        }, { onlyOnce: true });
      });

      navigate("/donor-tracking", { state: { requestId } });
    } catch (error) {
      console.error(error);
      setAcceptingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-200 text-sm">Welcome back</p>
            <h1 className="text-white text-2xl font-bold mt-2">Hi, {name}</h1>
            <p className="text-red-200 text-xs mt-1">{new Date().toDateString()}</p>
          </div>
          <Bell className="text-red-200" size={24} />
        </div>
      </div>
      <div className="px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
              <Droplets className="text-red-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{stats.donors}</p>
            <p className="text-gray-500 text-xs">Donors</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
              <ClipboardList className="text-blue-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{stats.requests}</p>
            <p className="text-gray-500 text-xs">My Requests</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center mb-2">
              <AlertCircle className="text-green-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{stats.emergencies}</p>
            <p className="text-gray-500 text-xs">Emergencies</p>
          </div>
        </div>

        {(userData?.isDonor === true || userData?.isDonor === "true") && availableRequests.length > 0 && (
          <div className="mb-4">
            <h2 className="text-gray-900 font-bold text-base px-2 mb-3">Available Requests</h2>
            {availableRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-gray-900 font-semibold">{request.patientName}</p>
                    <p className="text-gray-500 text-xs mt-1">{request.bloodGroup} Blood Needed</p>
                  </div>
                  <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{request.units} units</span>
                </div>
                <p className="text-gray-600 text-xs mb-1">{request.hospital} in {request.city}</p>
                <p className="text-gray-500 text-xs mb-3">Contact: {request.contactNumber}</p>
                <button onClick={() => handleAcceptRequest(request.id, request)} disabled={acceptingId === request.id} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {acceptingId === request.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />}
                  Accept Request
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => navigate("/request-blood")} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Droplets className="text-red-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Request Blood</p>
            <p className="text-gray-400 text-xs text-center">Create a new request</p>
          </button>
          <button onClick={() => navigate("/emergency")} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <AlertCircle className="text-red-700" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Emergency</p>
            <p className="text-gray-400 text-xs text-center">Broadcast alert</p>
          </button>
          <button onClick={() => navigate("/find-donor")} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Search className="text-blue-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Find Donor</p>
            <p className="text-gray-400 text-xs text-center">Search donors</p>
          </button>
          <button onClick={() => navigate("/my-requests")} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <ClipboardList className="text-green-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">My Requests</p>
            <p className="text-gray-400 text-xs text-center">Track requests</p>
          </button>
        </div>
        
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-base font-bold">Need Blood Urgently?</p>
            <p className="text-red-200 text-xs mt-1">Broadcast to donor network</p>
          </div>
          <button onClick={() => navigate("/emergency")} className="bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-xl shadow">Emergency</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
