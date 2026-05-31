import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { db } from "../firebase/config";
import { ref, push, onValue } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const urgencyLevels = [
  { label: "Critical", color: "bg-red-600 text-white border-red-600" },
  { label: "High", color: "bg-orange-500 text-white border-orange-500" },
  { label: "Medium", color: "bg-yellow-500 text-white border-yellow-500" }
];

export default function EmergencyRequest() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [urgency, setUrgency] = useState("Critical");
  const [city, setCity] = useState("");
  const [hospital, setHospital] = useState("");
  const [units, setUnits] = useState("1");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleBroadcast() {
    if (!selectedGroup || !city || !hospital) {
      alert("Please complete all emergency details.");
      return;
    }
    try {
      setLoading(true);
      
      const emergencyRef = await push(ref(db, "emergency"), {
        bloodGroup: selectedGroup,
        urgency: urgency,
        city: city,
        hospital: hospital,
        units: Number(units),
        userId: currentUser?.uid,
        status: "active",
        createdAt: Date.now()
      });
      
      const emergencyId = emergencyRef.key;
      
      onValue(ref(db, "users"), (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          let donorCount = 0;
          
          Object.entries(usersData).forEach(([userId, user]) => {
            if (userId !== currentUser.uid && (user.isDonor === true || user.isDonor === "true")) {
              donorCount++;
              const notificationTitle = "EMERGENCY: " + selectedGroup + " Blood Needed!";
              const notificationMessage = urgency + " - " + hospital + " in " + city + " needs " + units + " units";
              
              push(ref(db, "notifications/" + userId), {
                type: "alert",
                title: notificationTitle,
                message: notificationMessage,
                read: false,
                createdAt: Date.now(),
                emergencyId: emergencyId
              });
            }
          });
          
          setNotifiedCount(donorCount);
          setSent(true);
          setLoading(false);
          setTimeout(() => setSent(false), 4000);
        }
      }, { onlyOnce: true });
    } catch (err) {
      setLoading(false);
      alert("Failed to broadcast emergency. Please try again.");
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center animate-pulse">
            <AlertCircle className="text-red-600" size={22} />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Emergency Request</h1>
            <p className="text-red-200 text-sm">Notify donors immediately</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 space-y-4">
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">✓</div>
            <div>
              <p className="font-semibold text-green-700">Emergency broadcasted to {notifiedCount} donors!</p>
              <p className="text-sm text-green-600">Your alert has been sent instantly.</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Blood Group</p>
          <div className="grid grid-cols-4 gap-2">
            {bloodGroups.map((group) => (
              <button key={group} type="button" onClick={() => setSelectedGroup(group)} className={selectedGroup === group ? "py-2.5 rounded-xl bg-red-600 text-white border-red-600 text-sm font-bold" : "py-2.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-sm font-bold"}>
                {group}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Urgency Level</p>
          <div className="flex gap-2">
            {urgencyLevels.map((level) => (
              <button key={level.label} type="button" onClick={() => setUrgency(level.label)} className={urgency === level.label ? level.color + " rounded-xl flex-1 py-2 text-sm font-semibold" : "bg-gray-50 border border-gray-200 text-gray-600 rounded-xl flex-1 py-2 text-sm font-semibold"}>
                {level.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Hospital</label>
            <input type="text" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Apollo Hospital" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Chennai" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Units Needed</label>
            <input type="number" value={units} onChange={(e) => setUnits(e.target.value)} min="1" max="10" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:border-red-400" />
          </div>
        </div>
        <button onClick={handleBroadcast} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-2xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Broadcast Emergency"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
