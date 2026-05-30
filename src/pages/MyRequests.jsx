import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, remove } from "firebase/database";
import { Droplets, ChevronRight, Trash2 } from "lucide-react";
import BottomNav from "../components/BottomNav";

export default function MyRequests() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("active");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    const requestsRef = ref(db, "requests");
    const unsubscribeRequests = onValue(
      requestsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const userRequests = Object.entries(data)
            .filter(([, req]) => req.userId === currentUser.uid)
            .map(([id, req]) => ({ id, ...req }));
          setRequests(userRequests);
        } else {
          setRequests([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching requests:", err);
        setError("Unable to load your requests. Please try again.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRequests();
    };
  }, [currentUser, navigate]);

  const filtered = requests.filter((item) => {
    if (activeTab === "active") {
      return ["pending", "accepted", "in-progress"].includes(item.status);
    }
    return ["completed", "cancelled"].includes(item.status);
  });

  async function handleDeleteRequest(requestId) {
    setDeletingId(requestId);
    try {
      await remove(ref(db, "requests/" + requestId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting request:", err);
      setError("Failed to delete request. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusStyle(status) {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "accepted") return "bg-blue-100 text-blue-700";
    if (status === "in-progress") return "bg-purple-100 text-purple-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    return "bg-red-100 text-red-700";
  }

  function formatStatus(status) {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        </div>

        <div className="bg-white rounded-2xl p-2 flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={
              activeTab === "active"
                ? "flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold"
                : "flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
            }
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={
              activeTab === "completed"
                ? "flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold"
                : "flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
            }
          >
            Completed
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <Droplets className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium">
                  You have not made any requests yet
                </p>
                <button
                  onClick={() => navigate("/request-blood")}
                  className="mt-4 bg-red-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-red-700"
                >
                  Create Request
                </button>
              </div>
            )}

            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                {deleteConfirm === item.id && (
                  <div className="mb-3 border border-red-200 rounded-xl bg-red-50 p-3">
                    <p className="text-sm text-red-700 font-semibold mb-2">
                      Delete this request?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteRequest(item.id)}
                        disabled={deletingId === item.id}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold text-xs hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-xs hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    {item.bloodGroup}
                  </div>
                  <div
                    className={
                      "px-3 py-1 rounded-full text-xs font-semibold " +
                      getStatusStyle(item.status)
                    }
                  >
                    {formatStatus(item.status)}
                  </div>
                </div>

                <h2 className="text-gray-900 font-bold text-lg mb-1">
                  {item.patientName || "Blood Request"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {item.hospital || "Hospital"}, {item.city || "Location"}
                </p>

                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <span>{item.units} Units</span>
                  <span>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  {["accepted", "in-progress"].includes(item.status) && (
                    <button
                      onClick={() =>
                        navigate("/live-tracking", {
                          state: { requestId: item.id },
                        })
                      }
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800"
                    >
                      <ChevronRight size={16} /> Track
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="flex-1 border border-red-200 text-red-600 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
