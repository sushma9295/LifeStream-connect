import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update } from "firebase/database";
import { Droplets, AlertCircle, ClipboardList, Bell, Check } from "lucide-react";
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

    return () => unsubscribeUser();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const allUsersRef = ref(db, "users");
    const unsubscribeDonors = onValue(allUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let donorCount = 0;
        Object.values(data).forEach((user) => {
          if (user.isDonor === true || user.isDonor === "true") {
            donorCount = donorCount + 1;
          }
        });
        setStats((prev) => ({ ...prev, donors: donorCount }));
      }
    });

    const emergencyRef = ref(db, "emergency");
    const unsubscribeEmergencies = onValue(emergencyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let emergencyCount = 0;
        Object.values(data).forEach((emergency) => {
          if (emergency.status === "active") {
            emergencyCount = emergencyCount + 1;
          }
        });
        setStats((prev) => ({ ...prev, emergencies: emergencyCount }));
      } else {
        setStats((prev) => ({ ...prev, emergencies: 0 }));
      }
    });

    return () => {
      unsubscribeDonors();
      unsubscribeEmergencies();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const requestsRef = ref(db, "requests");
    const unsubscribeRequests = onValue(requestsRef, (snapshot) => {
      const allRequests = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.entries(data).forEach(([id, request]) => {
          allRequests.push({ id, ...request });
        });
      }

      const myRequests = allRequests.filter((request) => request.userId === currentUser.uid);
      setStats((prev) => ({ ...prev, requests: myRequests.length }));

      if (userData?.isDonor === true || userData?.isDonor === "true") {
        const matchingRequests = allRequests.filter((request) => {
          return request.status === "pending" && request.bloodGroup === userData.bloodGroup;
        });
        setAvailableRequests(matchingRequests);
      } else {
        setAvailableRequests([]);
      }
    });

    return () => unsubscribeRequests();
  }, [currentUser, userData]);

  const isDonor = userData?.isDonor === true || userData?.isDonor === "true";
  const isAvailable = userData?.available === true || userData?.available === "true";

  const handleAcceptRequest = async (requestId, request) => {
    try {
      setAcceptingId(requestId);
      await update(ref(db, "requests/" + requestId), {
        status: "accepted",
        donorId: currentUser.uid,
        acceptedAt: Date.now()
      });
      navigate("/donor-tracking", { state: { requestId } });
    } catch (error) {
      console.error(error);
      setAcceptingId(null);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!currentUser || !userData) return;
    try {
      await update(ref(db, "users/" + currentUser.uid), {
        available: !isAvailable
      });
    } catch (error) {
      console.error(error);
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

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-900 font-bold text-xl">Dashboard</p>
              <p className="text-xs text-gray-500">{isDonor ? "Donor + Patient" : "Patient"}</p>
            </div>
            <span className={isDonor ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold" : "px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold"}>
              {isDonor ? "Donor + Patient" : "Patient"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate("/request-blood")} className="bg-red-50 rounded-2xl p-4 text-left border border-red-100 hover:border-red-200 transition">
              <p className="text-red-700 font-semibold">Request Blood</p>
              <p className="text-gray-500 text-xs mt-2">Open a new request</p>
            </button>
            <button onClick={() => navigate("/emergency")} className="bg-red-50 rounded-2xl p-4 text-left border border-red-100 hover:border-red-200 transition">
              <p className="text-red-700 font-semibold">Emergency</p>
              <p className="text-gray-500 text-xs mt-2">Send a broadcast alert</p>
            </button>
            <button onClick={() => navigate("/find-donor")} className="bg-red-50 rounded-2xl p-4 text-left border border-red-100 hover:border-red-200 transition">
              <p className="text-blue-700 font-semibold">Find Donor</p>
              <p className="text-gray-500 text-xs mt-2">Search available donors</p>
            </button>
            <button onClick={() => navigate("/my-requests")} className="bg-red-50 rounded-2xl p-4 text-left border border-red-100 hover:border-red-200 transition">
              <p className="text-red-700 font-semibold">My Requests</p>
              <p className="text-gray-500 text-xs mt-2">Review your patient requests</p>
            </button>
          </div>
        </div>

        {isDonor && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-900 font-bold text-xl">Donor Requests</p>
                <p className="text-xs text-gray-500">Available requests for your group</p>
              </div>
              <button onClick={handleAvailabilityToggle} className={isAvailable ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold" : "px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold"}>
                {isAvailable ? "Available" : "Offline"}
              </button>
            </div>
            {availableRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No available requests for your blood group currently.</p>
            ) : (
              <div className="space-y-3">
                {availableRequests.map((request) => (
                  <div key={request.id} className="bg-red-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-gray-900 font-semibold">{request.patientName}</p>
                        <p className="text-xs text-gray-500">{request.bloodGroup} needed</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-white text-red-700 text-xs font-semibold">{request.units} units</span>
                    </div>
                    <p className="text-gray-600 text-xs mb-3">{request.hospital}, {request.city}</p>
                    <button onClick={() => handleAcceptRequest(request.id, request)} disabled={acceptingId === request.id} className="w-full bg-red-600 text-white rounded-2xl py-2 text-sm font-semibold disabled:opacity-60">
                      {acceptingId === request.id ? "Accepting..." : "Accept Request"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
