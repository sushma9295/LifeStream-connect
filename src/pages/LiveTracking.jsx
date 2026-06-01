import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Phone, MapPin, Clock, Check, AlertCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const donorIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LiveTracking() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId || null;
  const mapRef = useRef(null);

  const [request, setRequest] = useState(null);
  const [donor, setDonor] = useState(null);
  const [donorLocation, setDonorLocation] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState({ lat: 13.0569, lng: 80.2425 });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState("Waiting for donor...");
  const [distance, setDistance] = useState(null);
  const [requestStatus, setRequestStatus] = useState("pending");

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    const requestRef = ref(db, "requests/" + requestId);
    onValue(requestRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRequest(data);
        setRequestStatus(data.status);
        if (data.status === "pending") setCurrentStep(1);
        else if (data.status === "accepted") setCurrentStep(2);
        else if (data.status === "in-progress") setCurrentStep(3);
        else if (data.status === "completed") setCurrentStep(4);
        if (data.hospitalLat && data.hospitalLng) {
          setHospitalLocation({ lat: data.hospitalLat, lng: data.hospitalLng });
        }
        if (data.donorId) {
          onValue(ref(db, "users/" + data.donorId), (snap) => {
            if (snap.val()) setDonor(snap.val());
          });
        }
      }
      setLoading(false);
    });
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;
    const trackingRef = ref(db, "tracking/" + requestId + "/donorLocation");
    const unsubscribe = onValue(trackingRef, (snapshot) => {
      const loc = snapshot.val();
      if (loc && loc.lat && loc.lng) {
        setDonorLocation({ lat: loc.lat, lng: loc.lng });
        const R = 6371;
        const dLat = (hospitalLocation.lat - loc.lat) * Math.PI / 180;
        const dLon = (hospitalLocation.lng - loc.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(loc.lat * Math.PI / 180) *
          Math.cos(hospitalLocation.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = (R * c).toFixed(1);
        setDistance(dist);
        const mins = Math.ceil((dist / 30) * 60);
        setEta(mins + " minutes");
      }
    });
    return () => unsubscribe();
  }, [requestId, hospitalLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!requestId || !request) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white mb-4">
            <ArrowLeft size={20} /> Back
          </button>
          <p className="text-red-200 text-sm">Live Tracking</p>
          <h1 className="text-white text-2xl font-bold mt-2">No Active Request</h1>
        </div>
        <div className="px-4 -mt-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No tracking data</p>
            <button onClick={() => navigate("/dashboard")} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl w-full">
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const getStatusBanner = () => {
    if (requestStatus === "pending") {
      return { color: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-900", message: "Waiting for donor to accept..." };
    } else if (requestStatus === "accepted") {
      return { color: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-900", message: "Donor accepted! Preparing to leave..." };
    } else if (requestStatus === "in-progress") {
      return { color: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-900", message: "Donor is on the way! Location updating..." };
    } else if (requestStatus === "completed") {
      return { color: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-900", message: "Donation Complete! Thank you!" };
    }
    return { color: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", message: "Tracking..." };
  };

  const banner = getStatusBanner();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <p className="text-red-200 text-sm">Live Tracking</p>
        <h1 className="text-white text-2xl font-bold mt-2">Donor on Route</h1>
      </div>

      <div className="px-4 -mt-8">
        {donor && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                {donor.name ? donor.name.charAt(0) : "D"}
              </div>
              <div>
                <p className="text-gray-900 font-bold">{donor.name || "Donor"}</p>
                <p className="text-sm text-gray-500">{request.bloodGroup || "Blood Group"}</p>
                {donor.phone && <p className="text-sm text-gray-500">{donor.phone}</p>}
              </div>
            </div>
          </div>
        )}

        <div className={banner.color + " border " + banner.borderColor + " rounded-2xl p-4 mb-4"}>
          <p className={banner.textColor + " font-semibold"}>{banner.message}</p>
        </div>

        {donorLocation && request ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <div style={{ width: "100%", height: "280px" }}>
              <MapContainer
                center={[donorLocation.lat, donorLocation.lng]}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                />
                <Marker position={[donorLocation.lat, donorLocation.lng]} icon={donorIcon}>
                  <Popup>Donor Location (Live)</Popup>
                </Marker>
                <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
                  <Popup>{request.hospital}</Popup>
                </Marker>
                <Polyline
                  positions={[[donorLocation.lat, donorLocation.lng], [hospitalLocation.lat, hospitalLocation.lng]]}
                  color="red"
                  weight={3}
                  dashArray="8, 8"
                />
              </MapContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 h-64 flex items-center justify-center flex-col gap-3">
            <MapPin className="text-gray-400" size={32} />
            <p className="text-gray-500 font-semibold">Waiting for donor to start...</p>
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {distance && (
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-red-600" size={18} />
              <p className="text-sm font-semibold text-gray-900">Estimated Arrival</p>
            </div>
            <p className="text-3xl font-bold text-red-700">{eta}</p>
            <p className="text-sm text-gray-600 mt-1">Distance: " + distance + " km</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className={currentStep >= 1 ? "w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center flex-shrink-0"}>
                {currentStep > 1 ? <Check size={16} /> : <span>1</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Request Sent</p>
                <p className="text-xs text-gray-500">Your request has been posted</p>
              </div>
            </div>
            {currentStep > 1 && <div className="ml-4 h-2 bg-green-500 rounded" />}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className={currentStep >= 2 ? "w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center flex-shrink-0"}>
                {currentStep > 2 ? <Check size={16} /> : <span>2</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Donor Accepted</p>
                <p className="text-xs text-gray-500">A donor has accepted your request</p>
              </div>
            </div>
            {currentStep > 2 && <div className="ml-4 h-2 bg-green-500 rounded" />}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className={currentStep >= 3 ? (currentStep > 3 ? "w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse") : "w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center flex-shrink-0"}>
                {currentStep > 3 ? <Check size={16} /> : <span>3</span>}
              </div>
              <div>
                <p className={"font-semibold " + (currentStep === 3 ? "text-red-700" : "text-gray-900")}>Donor On The Way</p>
                <p className="text-xs text-gray-500">Donor is traveling to the hospital</p>
              </div>
            </div>
            {currentStep > 3 && <div className="ml-4 h-2 bg-green-500 rounded" />}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className={currentStep >= 4 ? "w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0" : "w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center flex-shrink-0"}>
                {currentStep >= 4 ? <Check size={16} /> : <span>4</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Donation Completed</p>
                <p className="text-xs text-gray-500">Blood donation has been completed</p>
              </div>
            </div>
          </div>
        </div>

        {donor && donor.phone && (
          <a href={"tel:" + donor.phone} className="w-full bg-green-600 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-green-700">
            <Phone size={18} /> Call Donor
          </a>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
