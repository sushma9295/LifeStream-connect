import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue, update, remove } from "firebase/database";
import { Bell } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { onForegroundMessage } from "../firebase/messaging"

export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    setError("");

    const notificationsRef = ref(db, "notifications/" + currentUser.uid);
    const unsubscribeNotifications = onValue(
      notificationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const items = Object.entries(data)
            .map(([id, notification]) => ({ id, ...notification }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setNotifications(items);
        } else {
          setNotifications([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setError("Unable to load notifications. Please try again.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeNotifications();
    };
  }, [currentUser]);

  useEffect(() => {
    let unsubscribe = null
    try {
      unsubscribe = onForegroundMessage((payload) => {
        const newNotif = {
          id: Date.now().toString(),
          type: payload.data && payload.data.type ? payload.data.type : "alert",
          title: payload.notification && payload.notification.title ? payload.notification.title : "New Alert",
          message: payload.notification && payload.notification.body ? payload.notification.body : "New notification",
          time: "Just now",
          read: false
        }
        setNotifications((prev) => [newNotif, ...prev])
      })
    } catch (err) {
      console.log("Message handler error:", err)
    }
    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  async function handleMarkAsRead(notificationId) {
    try {
      await update(ref(db, "notifications/" + currentUser.uid + "/" + notificationId), {
        read: true,
      });
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
      setError("Unable to update notification status.");
    }
  }

  async function handleDeleteNotification(notificationId) {
    try {
      await remove(ref(db, "notifications/" + currentUser.uid + "/" + notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError("Unable to delete notification.");
    }
  }

  async function handleMarkAllAsRead() {
    const updates = {};
    notifications.forEach((notification) => {
      if (!notification.read) {
        updates[notification.id + "/read"] = true;
      }
    });

    if (Object.keys(updates).length === 0) {
      return;
    }

    try {
      await update(ref(db, "notifications/" + currentUser.uid), updates);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error("Error marking all notifications read:", err);
      setError("Unable to mark all notifications as read.");
    }
  }

  function getNotificationBorder(type) {
    if (type === "success") return "border-l-4 border-green-500";
    if (type === "alert") return "border-l-4 border-red-500";
    return "border-l-4 border-blue-500";
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Latest activity and updates</p>
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
          >
            Mark all read
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-red-600" size={28} />
          <p className="text-sm text-gray-500">Tap any notification to mark it read.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">You will see updates here when activity happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const bgClass = notification.read ? "bg-white" : "bg-gray-100";
              return (
                <div
                  key={notification.id}
                  className={"rounded-2xl p-4 shadow-sm " + getNotificationBorder(notification.type) + " " + bgClass}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{notification.title || "Notification"}</p>
                      <p className="text-gray-600 text-sm mt-1">{notification.message || ""}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.time || "Just now"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-red-600 text-xs font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-gray-500 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
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