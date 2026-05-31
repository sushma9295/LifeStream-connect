import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update } from "firebase/database";
import { Droplets, ChevronRight } from "lucide-react";
import BottomNav from "../components/BottomNav";

function getStatusStyle(status) {
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "accepted") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

export default function MyRequests() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("patient");
  const [patientRequests, setPatientRequests] = useState([]);
  const [donorRequests, setDonorRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const requestsRef = ref(db, "requests");
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const allRequests = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.entries(data).forEach(([id, request]) => {
          allRequests.push({ id, ...request });
        });
      }

      setPatientRequests(allRequests.filter((request) => request.userId === currentUser.uid));
      setDonorRequests(allRequests.filter((request) => request.donorId === currentUser.uid));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function handleComplete(requestId) {
    try {
      await update(ref(db, "requests/" + requestId), {
        status: "completed"
      });
    } catch (error) {
      console.error(error);
    }
  }

  const currentRequests = activeTab === "patient" ? patientRequests : donorRequests;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        </div>
        <div className="bg-white rounded-2xl p-2 flex gap-2 mb-4">
          <button onClick={() => setActiveTab("patient")} className={activeTab === "patient" ? "flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold" : "flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"}>
            My Blood Requests
          </button>
          <button onClick={() => setActiveTab("donor") } className={activeTab === "donor" ? "flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold" : "flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"}>
            Donations I Made
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : currentRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
            No records found for this section.
          </div>
        ) : (
          <div className="space-y-4">
            {currentRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">{request.bloodGroup}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                </div>
                <h2 className="text-gray-900 font-bold text-lg mb-1">{request.patientName}</h2>
                <p className="text-gray-500 text-sm">{request.hospital}, {request.city}</p>
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <span>{request.units} Units</span>
                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                {activeTab === "patient" && request.status === "accepted" && (
                  <button onClick={() => navigate("/live-tracking")} className="mt-4 w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <ChevronRight size={18} /> Track
                  </button>
                )}
                {activeTab === "donor" && request.status === "accepted" && (
                  <div className="mt-4 space-y-3">
                    <button onClick={() => navigate("/live-tracking")} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                      Navigate to Hospital
                    </button>
                    <button onClick={() => handleComplete(request.id)} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl">
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
