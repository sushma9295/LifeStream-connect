import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, MapPin, Droplets, LogOut, Edit, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, get, update } from "firebase/database";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const snapshot = await get(ref(db, "users/" + currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData(data);
          setEditData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const isDonor = userData?.isDonor === true || userData?.isDonor === "true";
  const isAvailable = userData?.available === true || userData?.available === "true";

  async function handleSaveEdit() {
    if (!currentUser) return;
    try {
      setLoading(true);
      await update(ref(db, "users/" + currentUser.uid), editData);
      setUserData(editData);
      setEditing(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(updates) {
    if (!currentUser) return;
    try {
      setLoading(true);
      await update(ref(db, "users/" + currentUser.uid), updates);
      setUserData({ ...userData, ...updates });
    } catch (error) {
      console.error(error);
      alert("Unable to update profile status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white shadow-lg mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              <User size={28} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-200">Profile</p>
              <h1 className="text-2xl font-bold">{userData?.name || "User"}</h1>
              <p className="text-xs text-red-200 mt-1">{isDonor ? "Donor + Patient" : "Patient"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Droplets size={16} />
            <span>{userData?.bloodGroup || "Unknown"} Blood Group</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Role</p>
              <p className="text-xs text-gray-500">{isDonor ? "Donor + Patient" : "Patient"}</p>
            </div>
            <span className={isDonor ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-semibold" : "px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold"}>
              {isDonor ? "Both" : "Patient"}
            </span>
          </div>

          {!isDonor ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">Become a donor anytime while keeping your ability to request blood.</p>
              <button onClick={() => handleUpdateUser({ isDonor: true, available: true })} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-2xl font-semibold">
                Become a Donor
              </button>
              <p className="text-xs text-gray-500">You are now registered as a donor! Other patients can find you when you are available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-green-900">Active Donor</p>
                <p className="text-xs text-green-700">You remain visible to patients while your donor status is active.</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Availability</p>
                  <p className="text-xs text-gray-500">Toggle online or offline for donations</p>
                </div>
                <button onClick={() => handleUpdateUser({ available: !isAvailable })} disabled={loading} className={isAvailable ? "px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold" : "px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold"}>
                  {isAvailable ? "Online" : "Offline"}
                </button>
              </div>
              <button onClick={() => handleUpdateUser({ isDonor: false, available: false })} disabled={loading} className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold">
                Stop being a donor
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
              <input type="text" value={editData.name || ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
              <input type="tel" value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">City</label>
              <input type="text" value={editData.city || ""} onChange={(e) => setEditData({ ...editData, city: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveEdit} disabled={loading} className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2">
                <Check size={16} /> Save
              </button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl flex items-center justify-center gap-2">
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <Mail className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{currentUser?.email || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{userData?.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm text-gray-900">{userData?.bloodGroup || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm text-gray-900">{userData?.city || "Not set"}</p>
                </div>
              </div>
            </div>

            <button onClick={() => setEditing(true)} className="w-full bg-white border border-red-200 text-red-600 font-semibold py-3 rounded-xl mb-3 flex items-center justify-center gap-2">
              <Edit size={18} /> Edit Profile
            </button>
          </>
        )}

        <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 border border-red-200 font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <LogOut size={18} /> Logout
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
