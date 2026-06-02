import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { db } from "../firebase/config"
import { ref, onValue } from "firebase/database"
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ArrowLeft, Phone, MessageCircle, Clock, MapPin, Navigation } from "lucide-react"
import BottomNav from "../components/BottomNav"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const donorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function LiveTracking() {
  const [request, setRequest] = useState(null)
  const [donor, setDonor] = useState(null)
  const [donorLocation, setDonorLocation] = useState(null)
  const [hospitalLocation] = useState({ lat: 13.0569, lng: 80.2425 })
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [eta, setEta] = useState("Waiting for donor...")
  const [distance, setDistance] = useState(null)
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestId = location.state?.requestId || null

  useEffect(() => {
    if (!requestId) {
      setLoading(false)
      return
    }
    const requestRef = ref(db, "requests/" + requestId)
    const unsubscribe = onValue(requestRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setRequest(data)
        if (data.status === "pending") setCurrentStep(1)
        if (data.status === "accepted") setCurrentStep(2)
        if (data.status === "in-progress") setCurrentStep(3)
        if (data.status === "completed") setCurrentStep(4)
        if (data.donorId) {
          onValue(ref(db, "users/" + data.donorId), (snap) => {
            if (snap.val()) setDonor(snap.val())
          })
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [requestId])

  useEffect(() => {
    if (!requestId) return
    const trackingRef = ref(db, "tracking/" + requestId + "/donorLocation")
    const unsubscribe = onValue(trackingRef, (snapshot) => {
      const loc = snapshot.val()
      if (loc && loc.lat && loc.lng) {
        setDonorLocation({ lat: loc.lat, lng: loc.lng })
        const R = 6371
        const dLat = (hospitalLocation.lat - loc.lat) * Math.PI / 180
        const dLon = (hospitalLocation.lng - loc.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(loc.lat * Math.PI / 180) *
          Math.cos(hospitalLocation.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const dist = (R * c).toFixed(1)
        setDistance(dist)
        const mins = Math.ceil((dist / 30) * 60)
        setEta(mins + " minutes")
      }
    })
    return () => unsubscribe()
  }, [requestId, hospitalLocation])

  const steps = [
    { id: 1, label: "Request Sent", desc: "Looking for donor" },
    { id: 2, label: "Donor Accepted", desc: "Donor preparing to leave" },
    { id: 3, label: "On The Way", desc: "Donor is coming to you" },
    { id: 4, label: "Completed", desc: "Donation successful" }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!requestId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 pb-24">
        <MapPin className="text-gray-300 mb-4" size={64} />
        <h2 className="text-xl font-bold text-gray-600 mb-2">No Active Tracking</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Go to My Requests and click Track on an accepted request
        </p>
        <button
          onClick={() => navigate("/my-requests")}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Go to My Requests
        </button>
        <BottomNav />
      </div>
    )
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
        <h1 className="text-white text-xl font-bold">Live Tracking</h1>
        <p className="text-red-200 text-xs mt-1">Track your donor in real time</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status Banner */}
        {currentStep === 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3">
            <p className="text-yellow-700 font-semibold text-sm text-center">
              Waiting for donor to accept...
            </p>
          </div>
        )}
        {currentStep === 2 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
            <p className="text-blue-700 font-semibold text-sm text-center">
              Donor accepted! Preparing to leave...
            </p>
          </div>
        )}
        {currentStep === 3 && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-3 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-red-700 font-semibold text-sm">Donor is on the way!</p>
          </div>
        )}
        {currentStep === 4 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
            <p className="text-green-700 font-semibold text-sm text-center">
              Donation Completed! Thank you!
            </p>
          </div>
        )}

        {/* Donor Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-bold text-sm">
                {donor ? donor.name?.charAt(0).toUpperCase() : "D"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {donor ? donor.name : "Finding donor..."}
              </p>
              {donor && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {donor.bloodGroup}
                </span>
              )}
            </div>
            {donor && donor.phone && (
              <div className="flex gap-2">
                
                  href={"tel:" + donor.phone}
                  className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <Phone size={16} className="text-green-600" />
                </a>
                
                  href={"https://wa.me/" + donor.phone}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <MessageCircle size={16} className="text-green-600" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
            <Navigation className="text-red-600" size={18} />
            <span className="font-semibold text-gray-800 text-sm">Live Route Map</span>
          </div>
          {donorLocation ? (
            <MapContainer
              center={[donorLocation.lat, donorLocation.lng]}
              zoom={14}
              style={{ width: "100%", height: "280px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="OpenStreetMap contributors"
              />
              <Marker
                position={[donorLocation.lat, donorLocation.lng]}
                icon={donorIcon}
              >
                <Popup>{donor ? donor.name : "Donor"} is here</Popup>
              </Marker>
              <Marker
                position={[hospitalLocation.lat, hospitalLocation.lng]}
                icon={hospitalIcon}
              >
                <Popup>{request ? request.hospital : "Hospital"}</Popup>
              </Marker>
              <Polyline
                positions={[
                  [donorLocation.lat, donorLocation.lng],
                  [hospitalLocation.lat, hospitalLocation.lng]
                ]}
                color="red"
                weight={3}
                dashArray="8, 8"
              />
            </MapContainer>
          ) : (
            <div className="h-48 bg-gray-100 flex flex-col items-center justify-center gap-2">
              <MapPin className="text-gray-400" size={32} />
              <p className="text-gray-500 text-sm">
                {currentStep >= 3
                  ? "Waiting for donor location..."
                  : "Map will appear when donor starts navigation"}
              </p>
            </div>
          )}
        </div>

        {/* ETA Card */}
        {donorLocation && (
          <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-xs text-gray-500">Estimated arrival</p>
              <p className="text-xl font-bold text-red-600">{eta}</p>
              {distance && (
                <p className="text-xs text-gray-400">{distance} km away</p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold text-gray-800 text-sm mb-4">Tracking Status</p>
          <div className="space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 " +
                    (step.id < currentStep
                      ? "bg-green-500"
                      : step.id === currentStep
                      ? "bg-red-500 animate-pulse"
                      : "border-2 border-gray-300 bg-white")
                  }>
                    {step.id < currentStep ? (
                      <span className="text-white text-xs font-bold">✓</span>
                    ) : step.id === currentStep ? (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={
                      "w-0.5 h-8 " +
                      (step.id < currentStep ? "bg-green-400" : "bg-gray-200")
                    }></div>
                  )}
                </div>
                <div className="pb-4">
                  <p className={
                    "text-sm font-semibold " +
                    (step.id <= currentStep ? "text-gray-800" : "text-gray-400")
                  }>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request Details */}
        {request && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="font-semibold text-gray-800 text-sm mb-3">Request Details</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Blood Group</span>
                <span className="text-xs font-semibold text-red-600">
                  {request.bloodGroup}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Hospital</span>
                <span className="text-xs font-semibold text-gray-700">
                  {request.hospital}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">City</span>
                <span className="text-xs font-semibold text-gray-700">
                  {request.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Units</span>
                <span className="text-xs font-semibold text-gray-700">
                  {request.units}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}