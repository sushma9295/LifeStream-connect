import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update } from "firebase/database";
import { User, Mail, Phone, MapPin, Droplets, LogOut, Edit, X, Save } from "lucide-react";
import BottomNav from "../components/BottomNav";
import Toast from "../components/Toast";

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    bloodGroup: "",
  });
  const [donationsCount, setDonationsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const firstName = userProfile?.name
    ? userProfile.name.split(" ")[0]
    : currentUser?.email?.split("@")[0] || "User";
  const firstLetter = firstName && firstName.length > 0 ? firstName[0].toUpperCase() : "U";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    const userRef = ref(db, "users/" + currentUser.uid);
    const unsubscribeUser = onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val();
        setUserProfile(data || null);
        setAvailable(data?.available || false);
        setEditForm({
          name: data?.name || "",
          phone: data?.phone || "",
          city: data?.city || "",
          bloodGroup: data?.bloodGroup || "",
        });
      },
      (err) => {
        console.error("Error fetching user profile:", err);
        setError("Unable to load profile. Please try again.");
      }
    );

    const requestsRef = ref(db, "requests");
    const unsubscribeRequests = onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const userRequests = Object.values(data).filter((req) => req && req.userId === currentUser.uid);
          setRequestsCount(userRequests.length);
        } else {
          setRequestsCount(0);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setLoading(false);
      }
    );

    const donorRef = ref(db, "requests");
    const unsubscribeDonations = onValue(
      donorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const donations = Object.values(data).filter(
            (req) => req && req.donorId === currentUser.uid && req.status === "completed"
          );
          setDonationsCount(donations.length);
        } else {
          setDonationsCount(0);
        }
      },
      (err) => {
        console.error("Error fetching donations:", err);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeRequests();
      unsubscribeDonations();
    };
  }, [currentUser, navigate]);

  async function handleSaveProfile() {
    if (!editForm.name || !editForm.bloodGroup) {
      setError("Name and blood group are required.");
      return;
    }

    setSavingProfile(true);
    setError("");

    try {
      await update(ref(db, "users/" + currentUser.uid), {
        name: editForm.name,
        phone: editForm.phone,
        city: editForm.city,
        bloodGroup: editForm.bloodGroup,
        updatedAt: Date.now(),
      });
      setIsEditing(false);
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleToggleAvailable() {
    try {
      const newAvailability = !available;
      await update(ref(db, "users/" + currentUser.uid), {
        available: newAvailability,
      });
      setAvailable(newAvailability);
      setToast({
        message: newAvailability ? "You are now available to donate" : "You are now unavailable to donate",
        type: "success",
      });
    } catch (err) {
      console.error("Error updating availability:", err);
      setError("Failed to update availability. Please try again.");
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to logout. Please try again.");
      setLoggingOut(false);
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
      <div className="px-4 pt-10 pb-4">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 text-white shadow-lg mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {firstLetter}
            </div>
            <div>
              <p className="text-sm text-red-200">Profile</p>
              <h1 className="text-2xl font-bold">{userProfile?.name || firstName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Droplets size={16} />
            <span>Blood Group {userProfile?.bloodGroup || "Not set"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500">Donations</p>
            <p className="font-bold text-gray-900 text-xl">{donationsCount}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500">Requests</p>
            <p className="font-bold text-gray-900 text-xl">{requestsCount}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500">Lives Saved</p>
            <p className="font-bold text-gray-900 text-xl">{donationsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Available to Donate</p>
              <p className="text-xs text-gray-500">Update your donation status</p>
            </div>
            <button
              onClick={handleToggleAvailable}
              className={
                available
                  ? "px-4 py-2 rounded-full bg-green-600 text-white font-semibold text-sm"
                  : "px-4 py-2 rounded-full bg-gray-300 text-gray-700 font-semibold text-sm"
              }
            >
              {available ? "Active" : "Offline"}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Blood Group</label>
                <select
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-gray-50"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-60"
              >
                {savingProfile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                Cancel
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
                  <p className="text-sm text-gray-900">{currentUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm text-gray-900">{userProfile?.name || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{userProfile?.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm text-gray-900">{userProfile?.city || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="text-red-600" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm text-gray-900">{userProfile?.bloodGroup || "Not set"}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-white border border-red-200 text-red-600 font-semibold py-3 rounded-xl mb-3 flex items-center justify-center gap-2 hover:bg-red-50"
            >
              <Edit size={18} /> Edit Profile
            </button>
          </>
        )}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-red-50 text-red-600 border border-red-200 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-60"
        >
          {loggingOut ? (
            <>
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              Logging out...
            </>
          ) : (
            <>
              <LogOut size={18} /> Logout
            </>
          )}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <BottomNav />
    </div>
  );
}
