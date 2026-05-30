import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, AlertCircle, Bell, User } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Search, label: "Find", path: "/find-donor" },
    { icon: AlertCircle, label: "Emergency", path: "/emergency" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100 flex justify-around items-center py-2 z-50 shadow-lg">
      {tabs.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <button key={path} onClick={() => navigate(path)} className="flex flex-col items-center gap-0.5 px-3 py-1">
            <Icon size={22} className={active ? "text-red-600" : "text-gray-400"} />
            <span className={active ? "text-xs font-medium text-red-600" : "text-xs font-medium text-gray-400"}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
