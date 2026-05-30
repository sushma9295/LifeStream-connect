import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import { ArrowLeft, Phone, MessageCircle, Clock, Navigation, RefreshCw } from "lucide-react";
import MapView from "../components/MapView";
import TrackingTimeline from "../components/TrackingTimeline";
import BottomNav from "../components/BottomNav";
import { getRoute, calculateStraightDistance, estimateETA } from "../utils/routeService";

export default function LiveTracking() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId || null;

  const [request, setRequest] = useState(null);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [donorLocation, setDonorLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [hospitalLocation, setHospitalLocation] = useState({ lat: 13.0569, lng: 80.2425 });
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState("Calculating...");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const routeTimer = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!requestId) {
      setError("No active tracking found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const requestRef = ref(db, "requests/" + requestId);
    let unsubscribeDonor = () => {};
    let unsubscribeTracking = () => {};

    const unsubscribeRequest = onValue(
      requestRef,
      (snapshot) => {
        const requestData = snapshot.val();
        if (requestData) {
          setRequest({ id: requestId, ...requestData });

          if (requestData.status === "pending") setCurrentStep(1);
          else if (requestData.status === "accepted") setCurrentStep(2);
          else if (requestData.status === "in-progress") setCurrentStep(3);
          else if (requestData.status === "completed") setCurrentStep(4);
          else setCurrentStep(1);

          if (requestData.patientLat && requestData.patientLng) {
            setHospitalLocation({ lat: requestData.patientLat, lng: requestData.patientLng });
          }

          if (requestData.donorId) {
            const donorRef = ref(db, "users/" + requestData.donorId);
            unsubscribeDonor = onValue(donorRef, (donorSnapshot) => {
              const donorData = donorSnapshot.val();
              if (donorData) {
                setDonor(donorData);
              }
            });
          } else {
            setDonor(null);
          }
        } else {
          setRequest(null);
          setDonor(null);
          setError("Unable to find tracking information.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching request tracking:", err);
        setError("Unable to load tracking information. Please try again.");
        setLoading(false);
      }
    );

    const trackingRef = ref(db, "tracking/" + requestId + "/donorLocation");
    unsubscribeTracking = onValue(
      trackingRef,
      async (snapshot) => {
        const loc = snapshot.val();
        if (loc && loc.lat && loc.lng) {
          setDonorLocation({ lat: loc.lat, lng: loc.lng });
          setLastUpdated(new Date().toLocaleTimeString());
          const dist = calculateStraightDistance(
            loc.lat,
            loc.lng,
            hospitalLocation.lat,
            hospitalLocation.lng
          );
          setDistance(dist);
          setEta(estimateETA(dist));
          const route = await getRoute(
            loc.lng,
            loc.lat,
            hospitalLocation.lng,
            hospitalLocation.lat
          );
          if (route.coords) {
            setRouteCoords(route.coords);
            if (route.duration) setEta(route.duration + " minutes");
          } else {
            setRouteCoords([]);
          }
        }
      },
      (err) => {
        console.error("Error fetching donor location:", err);
      }
    );

    return () => {
      unsubscribeRequest();
      unsubscribeDonor();
      unsubscribeTracking();
      if (routeTimer.current) {
        clearInterval(routeTimer.current);
      }
    };
  }, [currentUser, navigate, requestId, hospitalLocation.lat, hospitalLocation.lng]);

  useEffect(() => {
    if (!donorLocation || !hospitalLocation) {
      return;
    }

    async function refreshRoute() {
      const route = await getRoute(
        donorLocation.lng,
        donorLocation.lat,
        hospitalLocation.lng,
        hospitalLocation.lat
      );
      if (route.coords) {
        setRouteCoords(route.coords);
        if (route.duration) {
          setEta(route.duration + " minutes");
        }
      }
    }

    refreshRoute();
    if (routeTimer.current) {
      clearInterval(routeTimer.current);
    }
    routeTimer.current = setInterval(refreshRoute, 30000);
    return () => {
      if (routeTimer.current) {
        clearInterval(routeTimer.current);
      }
    };
  }, [donorLocation, hospitalLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 px-4 pt-10">
        <button onClick={() => navigate("/my-requests")} className="flex items-center gap-2 text-gray-700 mb-4">
          <ArrowLeft size={20} /> Back to requests
        </button>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-gray-900 font-bold text-lg">Tracking unavailable</p>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => navigate("/my-requests")}
            className="mt-6 bg-red-600 text-white font-semibold py-3 px-4 rounded-xl"
          >
            Go to My Requests
          </button>
        </div>
      </div>
    );
  }

  const donorName = donor?.name || "Donor";
  const donorPhone = donor?.phone || request?.contact || "";
  const donorBloodGroup = donor?.bloodGroup || request?.bloodGroup || "N/A";
  const patientName = request?.hospital || "Hospital";
  const statusLabel = request?.status ? request.status.replace(/-/g, " ") : "Pending";
  const stepBanner =
    currentStep === 1
      ? "Waiting for donor to accept..."
      : currentStep === 2
      ? "Donor accepted! Preparing to leave..."
      : currentStep === 3
      ? "Donor is on the way!"
      : "Donation Completed! Thank you!";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-700 mb-4">
          <ArrowLeft size={20} /> Back
        </button>

        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-5 mb-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Live Tracking</p>
              <p className="text-xs text-red-200 mt-1">Updated: {lastUpdated || "--"}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-red-700 bg-opacity-20 p-2"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div
          className={
            "rounded-2xl p-4 mb-5 text-sm font-semibold " +
            (currentStep === 1
              ? "bg-yellow-50 text-yellow-700"
              : currentStep === 2
              ? "bg-blue-50 text-blue-700"
              : currentStep === 3
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700")
          }
        >
          {stepBanner}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
              {donorName?.split(" ")[0]?.[0] || "D"}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-bold text-lg">{donor ? donorName : "Finding donor..."}</p>
              <p className="text-sm text-gray-500 mt-1">Blood Group {donorBloodGroup}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={"tel:" + donorPhone}
                className="bg-green-500 text-white rounded-2xl px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Phone size={16} /> Call
              </a>
              <a
                href={"https://wa.me/" + (donorPhone ? donorPhone.replace(/\D/g, "") : "")}
                target="_blank"
                rel="noreferrer"
                className="border border-green-500 text-green-600 rounded-2xl px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              <Navigation size={18} />
              <span>Live Route Map</span>
            </div>
            <MapView
              donorLat={donorLocation.lat}
              donorLng={donorLocation.lng}
              patientLat={hospitalLocation.lat}
              patientLng={hospitalLocation.lng}
              donorName={donorName}
              patientName={patientName}
              routeCoords={routeCoords}
              height="280px"
            />
          </div>

          <div className="bg-red-50 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">Estimated Arrival</p>
                <p className="text-2xl font-bold text-red-600">{eta}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Distance</p>
                <p className="text-lg font-semibold text-gray-900">{distance || "--"} km away</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
            <TrackingTimeline currentStep={currentStep} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="font-semibold text-gray-900 mt-1">{request?.bloodGroup || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hospital</p>
                <p className="font-semibold text-gray-900 mt-1">{request?.hospital || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">City</p>
                <p className="font-semibold text-gray-900 mt-1">{request?.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Units</p>
                <p className="font-semibold text-gray-900 mt-1">{request?.units || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Status</p>
                <p className="inline-flex items-center rounded-full px-3 py-1 mt-1 text-xs font-semibold bg-red-100 text-red-700">
                  {statusLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
