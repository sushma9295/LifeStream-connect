import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-600 to-red-800">
      <div className="animate-pulse mb-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
          <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
            <path d="M32 56C32 56 8 40 8 24C8 15 14 8 23 8C27 8 31 10 32 12C33 10 37 8 41 8C50 8 56 15 56 24C56 40 32 56 32 56Z" fill="#E53935" />
            <path d="M32 20 L32 44 M20 32 L44 32" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Lifestream Connect</h1>
      <p className="text-red-200 text-sm text-center px-8">A Smart Blood Donation & Emergency Donor Tracking System</p>
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
