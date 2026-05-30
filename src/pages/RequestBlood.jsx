import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, push, get } from "firebase/database";
import { ArrowLeft, Droplets, CheckCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";

const isDonorUser = (user) =>
  user && (user.isDonor === true || user.isDonor === "true");

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RequestBlood() {
  const [form, setForm] = useState({
    patientName: "",
    bloodGroup: "",
    hospital: "",
    city: "",
    units: "1",
    contact: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  function handle(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { patientName, bloodGroup, hospital, city, units, contact } = form;
    if (!currentUser) {
      setError("Please log in to submit a request.");
      return;
    }
    if (!patientName || !bloodGroup || !hospital || !city || !contact) {
      setError("Please fill all required fields.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await push(ref(db, "requests"), {
        patientName,
        bloodGroup,
        hospital,
        city,
        units,
        contact,
        notes: form.notes,
        userId: currentUser.uid,
        status: "pending",
        createdAt: Date.now(),
      });
      await notifyMatchingDonors(bloodGroup, hospital, city, units);
      setSuccess(true);
      setForm({
        patientName: "",
        bloodGroup: "",
        hospital: "",
        city: "",
        units: "1",
        contact: "",
        notes: "",
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function notifyMatchingDonors(bloodGroup, hospital, city, units) {
    try {
      const usersSnapshot = await get(ref(db, "users"));
      const usersData = usersSnapshot.val();
      if (!usersData) {
        return;
      }
      const matchingDonorIds = Object.entries(usersData)
        .filter(
          ([, user]) =>
            isDonorUser(user) &&
            (user.available === true || user.available === "true") &&
            user.bloodGroup === bloodGroup
        )
        .map(([donorId]) => donorId);

      await Promise.all(
        matchingDonorIds.map((donorId) =>
          push(ref(db, `notifications/${donorId}`), {
            type: "request",
            title: "New Blood Request",
            message: `Need ${units} unit(s) of ${bloodGroup} at ${hospital} in ${city}`,
            read: false,
            createdAt: Date.now(),
          })
        )
      );
    } catch (err) {
      console.error("Request notification error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-white mb-4 flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Droplets className="text-red-600" size={22} />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Request Blood</h1>
            <p className="text-red-200 text-xs">Fill in patient details below</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={22} />
            <div>
              <p className="text-green-700 font-semibold text-sm">Request Submitted!</p>
              <p className="text-green-600 text-xs">We are finding donors for you.</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Patient Name *
            </label>
            <input
              name="patientName"
              type="text"
              value={form.patientName}
              onChange={handle}
              placeholder="Enter patient name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Blood Group *
            </label>
            <select
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Hospital Name *
            </label>
            <input
              name="hospital"
              type="text"
              value={form.hospital}
              onChange={handle}
              placeholder="e.g. Apollo Hospital"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              City *
            </label>
            <input
              name="city"
              type="text"
              value={form.city}
              onChange={handle}
              placeholder="e.g. Chennai"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Units Required *
            </label>
            <input
              name="units"
              type="number"
              value={form.units}
              onChange={handle}
              min="1"
              max="10"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Contact Number *
            </label>
            <input
              name="contact"
              type="tel"
              value={form.contact}
              onChange={handle}
              placeholder="Enter contact number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handle}
              rows={3}
              placeholder="Any additional information..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50 resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <Droplets size={20} />
              Submit Request
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}