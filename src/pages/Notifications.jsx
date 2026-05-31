import { useState, useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update, remove } from "firebase/database";
import BottomNav from "../components/BottomNav";

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onValue(ref(db, "notifications/" + currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifList = Object.entries(data)
          .map(([id, notif]) => ({
            id,
            ...notif,
            createdAt: notif.createdAt || Date.now()
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(notifList);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkRead = async (notificationId) => {
    try {
      await update(ref(db, "notifications/" + currentUser.uid + "/" + notificationId), {
        read: true
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await remove(ref(db, "notifications/" + currentUser.uid + "/" + notificationId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const notif of notifications) {
        if (!notif.read) {
          await update(ref(db, "notifications/" + currentUser.uid + "/" + notif.id), {
            read: true
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "now";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return minutes + " min ago";
    if (hours < 24) return hours + " hr ago";
    return days + " day ago";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Latest activity and updates</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && <button onClick={handleMarkAllRead} className="text-xs text-red-600 font-semibold">Mark all read</button>}
            <Bell className="text-red-600" size={28} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">You will see alerts here when donors respond or emergencies occur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const borderClass = notification.type === "success" ? "border-l-4 border-green-500 bg-green-50" : notification.type === "alert" ? "border-l-4 border-red-500 bg-red-50" : "border-l-4 border-blue-500 bg-blue-50";
              const unread = !notification.read;
              
              return (
                <div key={notification.id} onClick={() => handleMarkRead(notification.id)} className={`rounded-2xl p-4 shadow-sm cursor-pointer transition ${borderClass} ${unread ? "opacity-100" : "opacity-70"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${notification.type === "success" ? "bg-green-100" : notification.type === "alert" ? "bg-red-100" : "bg-blue-100"}`}>
                      <span className="text-lg">•</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTime(notification.createdAt)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
