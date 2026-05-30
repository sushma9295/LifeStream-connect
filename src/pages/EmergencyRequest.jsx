import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, push } from "firebase/database";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = [
  { label: "Critical", style: "bg-red-600 text-white border-red-600" },
  { label: "High", style: "bg-orange-500 text-white border-orange-500" },
  { label: "Medium", style: "bg-yellow-500 text-white border-yellow-500" },
];

export default function EmergencyRequest() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [urgency, setUrgency] = useState("Critical");
  const [city, setCity] = useState("");
  const [hospital, setHospital] = useState("");
  const [units, setUnits] = useState("1");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleBroadcast() {
    if (!currentUser) {
      setError("Please log in to broadcast an emergency.");
      return;
    }

    if (!selectedGroup || !city || !hospital) {
      setError("Please fill all fields and select a blood group.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const emergencyData = {
        bloodGroup: selectedGroup,
        city: city,
        hospital: hospital,
        units: units,
        urgency: urgency,
        userId: currentUser.uid,
        status: "active",
        createdAt: Date.now(),
      };

      await push(ref(db, "emergency"), emergencyData);

      const usersSnapshot = await new Promise((resolve, reject) => {
        const usersRef = ref(db, "users");
        const unsubscribeUsers = onValue(
          usersRef,
          (snapshot) => {
            unsubscribeUsers();
            resolve(snapshot);
          },
          (err) => {
            unsubscribeUsers();
            reject(err);
          }
        );
      });

      const usersData = usersSnapshot.val();
      const donorEntries = usersData
        ? Object.entries(usersData).filter(
            ([, user]) => user && (user.isDonor === true || user.isDonor === "true")
          )
        : [];

      const notificationPromises = donorEntries.map(([userId]) =>
        push(ref(db, "notifications/" + userId), {
          type: "alert",
          title: "EMERGENCY: Blood Needed!",
          message:
            urgency +
            " - " +
            selectedGroup +
            " needed at " +
            hospital +
            " in " +
            city,
          read: false,
          createdAt: Date.now(),
        })
      );

      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }

      setSuccessMessage(
        "Emergency broadcasted to " + notificationPromises.length + " donors!"
      );
      setSelectedGroup("");
      setUrgency("Critical");
      setCity("");
      setHospital("");
      setUnits("1");
    } catch (err) {
      console.error("Emergency broadcast error:", err);
      setError("Failed to broadcast. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-white mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="text-red-600" size={22} />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Emergency Request</h1>
            <p className="text-red-200 text-xs">
              Broadcast to all nearby donors instantly
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={22} />
            <div>
              <p className="text-green-700 font-semibold text-sm">
                {successMessage}
              </p>
              <p className="text-green-600 text-xs">
                All donors have been notified in real time.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Select Blood Group *
          </p>
          <div className="grid grid-cols-4 gap-2">
            {bloodGroups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={
                  "py-2.5 rounded-xl text-sm font-bold border-2 transition-all " +
                  (selectedGroup === g
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-gray-50 text-gray-700 border-gray-200")
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Urgency Level
          </p>
          <div className="flex gap-2">
            {urgencyLevels.map(({ label, style }) => (
              <button
                key={label}
                onClick={() => setUrgency(label)}
                className={
                  "flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all " +
                  (urgency === label
                    ? style
                    : "bg-gray-50 text-gray-500 border-gray-200")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Hospital Name *
            </label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g. Apollo Hospital"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Chennai"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Units Required
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              min="1"
              max="10"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>
        </div>

        <button
          onClick={handleBroadcast}
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Notifying nearby donors...
            </>
          ) : (
            <>
              <AlertCircle size={20} />
              BROADCAST EMERGENCY
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
