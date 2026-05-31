import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets } from "lucide-react";
import { db } from "../firebase/config";
import { ref, push, set, get } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RequestBlood() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [hospital, setHospital] = useState("");
  const [city, setCity] = useState("");
  const [units, setUnits] = useState("1");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDonor, setIsDonor] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfile = async () => {
      try {
        const snapshot = await get(ref(db, "users/" + currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setIsDonor(data.isDonor === true || data.isDonor === "true");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, [currentUser]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!patientName || !bloodGroup || !hospital || !city || !units || !contact) {
      return;
    }
    setLoading(true);
    try {
      const requestRef = push(ref(db, "requests"));
      await set(requestRef, {
        patientName,
        bloodGroup,
        hospital,
        city,
        units: Number(units),
        contact,
        notes,
        userId: currentUser?.uid,
        status: "pending",
        createdAt: Date.now(),
      });
      setSuccess(true);
      setPatientName("");
      setBloodGroup("");
      setHospital("");
      setCity("");
      setUnits("1");
      setContact("");
      setNotes("");
      setTimeout(() => {
        setSuccess(false);
        navigate("/my-requests");
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-700 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Droplets size={20} />
            </div>
            <div>
              <p className="text-sm text-red-200">Request blood for patients fast</p>
              <h1 className="text-xl font-bold">Create Request</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 space-y-4">
        {isDonor && (
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-4 text-blue-900 space-y-2">
            <p className="text-sm font-semibold">You are requesting as a patient</p>
            <p className="text-xs">Your donor status remains active.</p>
            <p className="text-xs">Other donors can still see you as available.</p>
          </div>
        )}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3">Request submitted successfully!</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Patient Name</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Blood Group</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400">
              <option value="">Select blood group</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Hospital</label>
            <input type="text" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Units</label>
            <input type="number" value={units} onChange={(e) => setUnits(e.target.value)} min="1" max="10" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Contact Number</label>
            <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" placeholder="Additional details" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400 resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Broadcast Request"}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
