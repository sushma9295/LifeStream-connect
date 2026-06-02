import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { db } from "../firebase/config"
import { ref, onValue, update, push } from "firebase/database"
import { Droplets, AlertCircle, Search, ClipboardList, Bell, Users } from "lucide-react"
import BottomNav from "../components/BottomNav"

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState(null)
  const [donorCount, setDonorCount] = useState(0)
  const [myRequestCount, setMyRequestCount] = useState(0)
  const [emergencyCount, setEmergencyCount] = useState(0)
  const [availableRequests, setAvailableRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) return
    onValue(ref(db, "users/" + currentUser.uid), (snap) => {
      if (snap.val()) setUserProfile(snap.val())
      setLoading(false)
    })
    onValue(ref(db, "users"), (snap) => {
      const data = snap.val()
      if (data) {
        const donors = Object.values(data).filter((u) => u.isDonor === true)
        setDonorCount(donors.length)
      }
    })
    onValue(ref(db, "requests"), (snap) => {
      const data = snap.val()
      if (data) {
        const all = Object.entries(data).map(([id, r]) => ({ id, ...r }))
        const mine = all.filter((r) => r.userId === currentUser.uid)
        setMyRequestCount(mine.length)
        const available = all.filter(
          (r) => r.status === "pending" && r.userId !== currentUser.uid
        )
        setAvailableRequests(available)
      }
    })
    onValue(ref(db, "emergency"), (snap) => {
      const data = snap.val()
      if (data) {
        const active = Object.values(data).filter((e) => e.status === "active")
        setEmergencyCount(active.length)
      }
    })
  }, [currentUser])

  async function acceptRequest(req) {
    try {
      await update(ref(db, "requests/" + req.id), {
        status: "accepted",
        donorId: currentUser.uid,
        acceptedAt: Date.now()
      })
      if (userProfile) {
        await push(ref(db, "notifications/" + req.userId), {
          type: "success",
          title: "Donor Found!",
          message: (userProfile.name || "A donor") + " accepted your blood request",
          read: false,
          createdAt: Date.now()
        })
      }
      navigate("/donor-tracking", { state: { requestId: req.id } })
    } catch (err) {
      console.log("Accept error:", err)
    }
  }

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  function getName() {
    if (userProfile && userProfile.name) return userProfile.name.split(" ")[0]
    if (currentUser && currentUser.email) return currentUser.email.split("@")[0]
    return "User"
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric"
  })

  const matchingRequests = availableRequests.filter((r) => {
    if (!userProfile || !userProfile.bloodGroup) return true
    return r.bloodGroup === userProfile.bloodGroup
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-red-200 text-sm">{today}</p>
            <h1 className="text-white text-2xl font-bold mt-1">
              {getGreeting()}, {getName()}!
            </h1>
            {userProfile && userProfile.isDonor && (
              <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full mt-2 inline-block">
                Donor + Patient
              </span>
            )}
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
          >
            <Bell className="text-white" size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <Users className="text-white mx-auto mb-1" size={20} />
            <p className="text-white font-bold text-xl">{donorCount}</p>
            <p className="text-red-200 text-xs">Donors</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <ClipboardList className="text-white mx-auto mb-1" size={20} />
            <p className="text-white font-bold text-xl">{myRequestCount}</p>
            <p className="text-red-200 text-xs">My Requests</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-3 text-center">
            <AlertCircle className="text-white mx-auto mb-1" size={20} />
            <p className="text-white font-bold text-xl">{emergencyCount}</p>
            <p className="text-red-200 text-xs">Emergencies</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/request-blood")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <Droplets className="text-red-600" size={24} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">Request Blood</p>
            <p className="text-xs text-gray-400 text-center">Create a new request</p>
          </button>

          <button
            onClick={() => navigate("/emergency")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">Emergency</p>
            <p className="text-xs text-gray-400 text-center">Broadcast alert</p>
          </button>

          <button
            onClick={() => navigate("/find-donor")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Search className="text-blue-600" size={24} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">Find Donor</p>
            <p className="text-xs text-gray-400 text-center">Search donors</p>
          </button>

          <button
            onClick={() => navigate("/my-requests")}
            className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <ClipboardList className="text-green-600" size={24} />
            </div>
            <p className="font-semibold text-gray-800 text-sm">My Requests</p>
            <p className="text-xs text-gray-400 text-center">Track requests</p>
          </button>
        </div>

        {userProfile && userProfile.isDonor && matchingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="font-semibold text-gray-800 text-sm mb-3">
              Available Requests for You
            </p>
            <div className="space-y-3">
              {matchingRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-xs">
                      {req.bloodGroup}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {req.patientName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {req.hospital} — {req.city}
                    </p>
                    <p className="text-xs text-gray-400">
                      {req.units} unit(s) needed
                    </p>
                  </div>
                  <button
                    onClick={() => acceptRequest(req)}
                    className="bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {userProfile && userProfile.isDonor && matchingRequests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="font-semibold text-gray-800 text-sm mb-1">
              Available Requests
            </p>
            <p className="text-xs text-gray-400">
              No pending requests matching your blood group right now.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}