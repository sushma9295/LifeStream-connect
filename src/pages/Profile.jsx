import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { db } from "../firebase/config"
import { ref, onValue, update } from "firebase/database"
import { User, Phone, Mail, MapPin, Droplets, LogOut, Edit, Check, X } from "lucide-react"
import BottomNav from "../components/BottomNav"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default function Profile() {
  const [userProfile, setUserProfile] = useState(null)
  const [available, setAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "", phone: "", city: "", bloodGroup: ""
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) return
    const userRef = ref(db, "users/" + currentUser.uid)
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setUserProfile(data)
        setAvailable(data.available || false)
        setEditForm({
          name: data.name || "",
          phone: data.phone || "",
          city: data.city || "",
          bloodGroup: data.bloodGroup || ""
        })
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [currentUser])

  async function handleSaveProfile() {
    if (!editForm.name || !editForm.phone || !editForm.city || !editForm.bloodGroup) {
      return
    }
    try {
      setSaving(true)
      await update(ref(db, "users/" + currentUser.uid), {
        name: editForm.name,
        phone: editForm.phone,
        city: editForm.city,
        bloodGroup: editForm.bloodGroup,
        updatedAt: Date.now()
      })
      setIsEditing(false)
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.log("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailable() {
    const newValue = !available
    setAvailable(newValue)
    await update(ref(db, "users/" + currentUser.uid), {
      available: newValue
    })
  }

  async function becomeDonor() {
    await update(ref(db, "users/" + currentUser.uid), {
      isDonor: true,
      available: true
    })
    setSuccess("You are now registered as a donor!")
    setTimeout(() => setSuccess(""), 3000)
  }

  async function handleLogout() {
    try {
      await logout()
      navigate("/login")
    } catch (err) {
      console.log("Logout error:", err)
    }
  }

  function getInitials() {
    if (userProfile && userProfile.name) {
      return userProfile.name.charAt(0).toUpperCase()
    }
    if (currentUser && currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
            <span className="text-red-600 font-bold text-2xl">{getInitials()}</span>
          </div>
          <h2 className="text-white font-bold text-xl">
            {userProfile ? userProfile.name : currentUser.email.split("@")[0]}
          </h2>
          {userProfile && userProfile.bloodGroup && (
            <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full mt-2">
              {userProfile.bloodGroup}
            </span>
          )}
          {userProfile && userProfile.city && (
            <p className="text-red-200 text-xs mt-1">{userProfile.city}</p>
          )}
          <div className="flex gap-2 mt-2">
            {userProfile && userProfile.isDonor && (
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                Active Donor
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
            <p className="text-green-700 text-sm text-center font-medium">{success}</p>
          </div>
        )}

        {isEditing ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800">Edit Profile</p>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">City</label>
              <input
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Blood Group</label>
              <select
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800 text-sm">My Information</p>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-red-600 text-xs font-medium"
              >
                <Edit size={14} />
                Edit
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="text-gray-400 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-700">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm text-gray-700">
                    {userProfile && userProfile.phone ? userProfile.phone : "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="text-gray-400 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-gray-400">Blood Group</p>
                  <p className="text-sm text-gray-700">
                    {userProfile && userProfile.bloodGroup ? userProfile.bloodGroup : "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm text-gray-700">
                    {userProfile && userProfile.city ? userProfile.city : "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {userProfile && userProfile.isDonor && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Available to Donate</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {available ? "You appear in donor search" : "You are hidden from search"}
                </p>
              </div>
              <button
                onClick={toggleAvailable}
                className={
                  "w-12 h-6 rounded-full transition-colors relative " +
                  (available ? "bg-red-500" : "bg-gray-300")
                }
              >
                <span
                  className={
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform " +
                    (available ? "translate-x-7" : "translate-x-1")
                  }
                ></span>
              </button>
            </div>
          </div>
        )}

        {userProfile && !userProfile.isDonor && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="font-semibold text-gray-800 text-sm mb-1">
              Become a Donor
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Register as a donor to help save lives. You can still request blood anytime.
            </p>
            <button
              onClick={becomeDonor}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              Register as Donor
            </button>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 border border-red-200 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <BottomNav />
    </div>
  )
}