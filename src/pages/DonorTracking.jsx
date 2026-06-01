import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update, push } from "firebase/database";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Navigation, Phone, CheckCircle, MapPin, Clock, ExternalLink } from "lucide-react";
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

export default function DonorTracking() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId || null;
  const mapRef = useRef(null);
  const watchId = useRef(null);

  const [request, setRequest] = useState(null);
  const [requester, setRequester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donorLocation, setDonorLocation] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState({ lat: 13.0569, lng: 80.2425 });
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("accepted");
  const [eta, setEta] = useState("Calculating...");
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (!requestId) return;
    const requestRef = ref(db, "requests/" + requestId);
    onValue(requestRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRequest(data);
        setStatus(data.status || "accepted");
        if (data.userId) {
          onValue(ref(db, "users/" + data.userId), (snap) => {
            if (snap.val()) setRequester(snap.val());
          });
        }
        if (data.hospitalLat && data.hospitalLng) {
          setHospitalLocation({ lat: data.hospitalLat, lng: data.hospitalLng });
        }
      }
      setLoading(false);
    });
  }, [requestId]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDonorLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.log("Location error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    if (donorLocation && hospitalLocation) {
      const R = 6371;
      const dLat = (hospitalLocation.lat - donorLocation.lat) * Math.PI / 180;
      const dLon = (hospitalLocation.lng - donorLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(donorLocation.lat * Math.PI / 180) *
        Math.cos(hospitalLocation.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = (R * c).toFixed(1);
      setDistance(dist);
      const mins = Math.ceil((dist / 30) * 60);
      setEta(mins + " minutes");
    }
  }, [donorLocation, hospitalLocation]);

  function startSharing() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported on this device");
      return;
    }
    setSharing(true);
    update(ref(db, "requests/" + requestId), {
      status: "in-progress",
      donorId: currentUser.uid
    });
    update(ref(db, "tracking/" + requestId), {
      status: "in-progress",
      donorId: currentUser.uid
    });
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDonorLocation({ lat, lng });
        update(ref(db, "tracking/" + requestId + "/donorLocation"), {
          lat: lat,
          lng: lng,
          updatedAt: Date.now()
        });
      },
      (error) => {
        console.log("Watch position error:", error);
        alert("Unable to get your location. Please enable GPS.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }

  function stopSharing() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
  }

  async function markCompleted() {
    stopSharing();
    await update(ref(db, "requests/" + requestId), {
      status: "completed",
      completedAt: Date.now()
    });
    await update(ref(db, "tracking/" + requestId), {
      status: "completed"
    });
    if (request && request.userId) {
      await push(ref(db, "notifications/" + request.userId), {
        type: "success",
        title: "Donation Completed!",
        message: "Your blood request has been fulfilled. Thank you!",
        read: false,
        createdAt: Date.now()
      });
    }
    setStatus("completed");
  }

  useEffect(() => {
    return () => stopSharing();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!requestId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white mb-4">
            <ArrowLeft size={20} /> Back
          </button>
          <p className="text-red-200 text-sm">Donor Navigation</p>
          <h1 className="text-white text-2xl font-bold mt-2">No Active Request</h1>
        </div>
        <div className="px-4 -mt-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No active request</p>
            <button onClick={() => navigate("/dashboard")} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl w-full">
              Go to Dashboard
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-24 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Donation Completed!</h1>
          <p className="text-gray-600 mb-6">Thank you for saving a life!</p>
          <button onClick={() => navigate("/dashboard")} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold">
            Back to Dashboard
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <p className="text-red-200 text-sm">Donor Navigation</p>
        <h1 className="text-white text-2xl font-bold mt-2">Navigate to Hospital</h1>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-red-700 font-bold text-2xl">{request.bloodGroup}</p>
              <p className="text-gray-600 text-sm mt-1">Blood Group</p>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-semibold">{request.patientName}</p>
              <p className="text-gray-500 text-xs mt-1">Patient: " + (requester ? requester.name : "Loading...") + "</p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-600 border-t pt-3">
            <p>Hospital: " + (request.hospital || "N/A") + "</p>
            <p>City: " + (request.city || "N/A") + "</p>
            <p>Units: " + (request.units || "0") + " units needed</p>
          </div>
          {requester && requester.phone && (
            <a href={"tel:" + requester.phone} className="mt-3 w-full bg-green-600 text-white rounded-xl py-2 font-semibold flex items-center justify-center gap-2">
              <Phone size={18} /> Call Patient
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className={sharing ? "text-green-600" : "text-gray-400"} size={20} />
              <p className="font-semibold text-gray-900">Route to Hospital</p>
            </div>
            {sharing && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Location sharing active
              </div>
            )}
            {!sharing && (
              <p className="text-xs text-gray-500">Start navigation to share location</p>
            )}
          </div>

          {donorLocation ? (
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
                  <Popup>You are here</Popup>
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
          ) : (
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center flex-col gap-2">
              <MapPin className="text-gray-400" size={32} />
              <p className="text-gray-500 text-sm">Getting your location...</p>
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {donorLocation && distance && (
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-red-600" size={18} />
              <p className="text-sm font-semibold text-gray-900">Estimated Time</p>
            </div>
            <p className="text-gray-600 text-sm">Distance: " + distance + " km</p>
            <p className="text-2xl font-bold text-red-600">{eta}</p>
            <p className="text-xs text-gray-500 mt-2">Drive safely and follow traffic rules</p>
          </div>
        )}

        {status === "accepted" && !sharing && (
          <div className="space-y-3 mb-4">
            <button onClick={startSharing} className="w-full bg-green-600 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-green-700">
              <Navigation size={20} /> Start Navigation & Share Location
            </button>
            <p className="text-xs text-gray-500 text-center">Your location will be shared with the patient</p>
          </div>
        )}

        {sharing && status === "in-progress" && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-green-900">Location Sharing Active</p>
                <p className="text-xs text-green-700">Patient can see you moving on map</p>
              </div>
            </div>
            <button onClick={markCompleted} className="w-full bg-red-600 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-red-700">
              <CheckCircle size={20} /> Mark as Donated - I Have Arrived
            </button>
          </div>
        )}

        {donorLocation && (
          <a
            href={"https://www.google.com/maps/dir/" + donorLocation.lat + "," + donorLocation.lng + "/" + hospitalLocation.lat + "," + hospitalLocation.lng}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 border-2 border-blue-600 text-blue-600 rounded-2xl py-3 font-semibold text-center flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <ExternalLink size={18} /> Open in Google Maps for Navigation
          </a>
        )}

        <div className="mt-4 bg-gray-100 rounded-2xl p-3">
          <p className="text-xs text-gray-600 text-center">Your location is only shared during active donation</p>
          <p className="text-xs text-gray-600 text-center mt-1">Sharing stops when donation is marked complete</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
