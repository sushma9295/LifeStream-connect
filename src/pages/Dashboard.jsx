import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update, push } from "firebase/database";
import { Droplets, AlertCircle, Search, ClipboardList, Heart, Bell } from "lucide-react";
import BottomNav from "../components/BottomNav";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [requestsCount, setRequestsCount] = useState(0);
  const [emergenciesCount, setEmergenciesCount] = useState(0);
  const [donorsCount, setDonorsCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const displayName = userProfile?.name
    ? userProfile.name.split(" ")[0]
    : currentUser?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    const userRef = ref(db, "users/" + currentUser.uid);
    const requestsRef = ref(db, "requests");
    const emergenciesRef = ref(db, "emergency");
    const usersRef = ref(db, "users");

    const unsubscribeUser = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val();
        setUserProfile(data || null);
      },
      (err) => {
        console.error("Error fetching user profile:", err);
        setError("Unable to load profile data.");
      }
    );

    const unsubscribeRequests = onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        const userRequests = data
          ? Object.entries(data)
              .filter(([, req]) => req && req.userId === currentUser.uid)
              .map(([id, req]) => ({ id, ...req }))
          : [];
        setRequestsCount(userRequests.length);
        const sortedRecent = userRequests
          .slice()
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 3);
        setRecentRequests(sortedRecent);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError("Unable to load requests.");
        setRequestsCount(0);
        setRecentRequests([]);
        setLoading(false);
      }
    );

    const unsubscribeEmergencies = onValue(
      emergenciesRef,
      (snapshot) => {
        const data = snapshot.val();
        const activeCount = data
          ? Object.values(data).filter((emergency) => emergency && emergency.status === "active").length
          : 0;
        setEmergenciesCount(activeCount);
      },
      (err) => {
        console.error("Error fetching emergencies:", err);
        setEmergenciesCount(0);
      }
    );

    const unsubscribeDonors = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        const donorCount = data
          ? Object.values(data).filter((user) => user && user.isDonor === true).length
          : 0;
        setDonorsCount(donorCount);
      },
      (err) => {
        console.error("Error fetching donors:", err);
        setDonorsCount(0);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeRequests();
      unsubscribeEmergencies();
      unsubscribeDonors();
    };
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !userProfile?.isDonor) {
      setAvailableRequests([]);
      return;
    }

    const requestsRef = ref(db, "requests");
    const unsubscribeAvailable = onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setAvailableRequests([]);
          return;
        }

        const allPending = Object.entries(data)
          .filter(
            ([, request]) =>
              request &&
              request.status === "pending" &&
              request.userId !== currentUser.uid
          )
          .map(([id, request]) => ({ id, ...request }));

        const matchingRequests = allPending.filter((request) => {
          const bloodMatch = userProfile.bloodGroup
            ? request.bloodGroup === userProfile.bloodGroup
            : true;
          const cityMatch = userProfile.city
            ? request.city?.toLowerCase() === userProfile.city?.toLowerCase()
            : true;
          return bloodMatch && cityMatch;
        });

        setAvailableRequests(matchingRequests);
      },
      (err) => {
        console.error("Error fetching donor requests:", err);
        setAvailableRequests([]);
      }
    );

    return () => unsubscribeAvailable();
  }, [currentUser, userProfile]);

  async function handleAcceptRequest(request) {
    if (!currentUser) {
      return;
    }

    setAcceptingRequestId(request.id);
    setActionError("");

    try {
      await update(ref(db, "requests/" + request.id), {
        status: "accepted",
        donorId: currentUser.uid,
        updatedAt: Date.now(),
      });

      await push(ref(db, "notifications/" + request.userId), {
        type: "success",
        title: "Blood Request Accepted",
        message: `A donor accepted your request for ${request.patientName || "blood"}.`,
        read: false,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error("Accept request error:", err);
      setActionError("Unable to accept the request right now. Please try again.");
    } finally {
      setAcceptingRequestId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-200 text-sm">Welcome back</p>
            <h1 className="text-white text-2xl font-bold mt-2">Hi, {displayName}</h1>
            <p className="text-red-200 text-xs mt-1">{new Date().toDateString()}</p>
          </div>
          <Bell className="text-red-200" size={24} />
        </div>
      </div>
      <div className="px-4 -mt-8">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
              <Droplets className="text-red-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{requestsCount}</p>
            <p className="text-gray-500 text-xs">Requests</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center mb-2">
              <AlertCircle className="text-orange-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{emergenciesCount}</p>
            <p className="text-gray-500 text-xs">Emergencies</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center mb-2">
              <Heart className="text-purple-600" size={18} />
            </div>
            <p className="text-gray-900 font-bold text-lg">{donorsCount}</p>
            <p className="text-gray-500 text-xs">Total Donors</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => navigate("/request-blood")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Droplets className="text-red-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Request Blood</p>
            <p className="text-gray-400 text-xs text-center">
              Create a new request to reach donors fast
            </p>
          </button>
          <button
            onClick={() => navigate("/emergency")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
              <AlertCircle className="text-red-700" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Emergency</p>
            <p className="text-gray-400 text-xs text-center">
              Broadcast a crisis alert to nearby donors
            </p>
          </button>
          <button
            onClick={() => navigate("/find-donor")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Search className="text-blue-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Find Donor</p>
            <p className="text-gray-400 text-xs text-center">
              Search donor profiles by blood group and city
            </p>
          </button>
          <button
            onClick={() => navigate("/my-requests")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3 hover:shadow-md transition"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <ClipboardList className="text-green-600" size={20} />
            </div>
            <p className="text-gray-700 font-semibold text-sm">My Requests</p>
            <p className="text-gray-400 text-xs text-center">
              Track your active and completed cases
            </p>
          </button>
        </div>

        {userProfile?.isDonor && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Available Requests</h2>
                <p className="text-gray-500 text-xs">
                  Pending blood requests matching your profile
                </p>
              </div>
              <span className="text-xs text-gray-500">
                Blood group {userProfile.bloodGroup || "any"}
              </span>
            </div>

            {actionError && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            {availableRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                No pending requests currently match your profile.
              </div>
            ) : (
              <div className="space-y-3">
                {availableRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {request.patientName || "Blood needed"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.bloodGroup} • {request.units} unit(s)
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {request.hospital}, {request.city}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        disabled={acceptingRequestId === request.id}
                        className="rounded-2xl bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {acceptingRequestId === request.id ? "Accepting..." : "Accept"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {recentRequests.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Recent Activity</h2>
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {req.patientName || "Blood Request"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {req.bloodGroup} + {req.units} units
                      </p>
                    </div>
                    <span
                      className={
                        "text-xs font-semibold px-2 py-1 rounded-full " +
                        (req.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : req.status === "accepted"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700")
                      }
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-base font-bold">Urgent Help Needed?</p>
            <p className="text-red-200 text-xs mt-1">
              Raise the alert to nearby donor network
            </p>
          </div>
          <button
            onClick={() => navigate("/emergency")}
            className="bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-xl shadow"
          >
            Emergency
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
