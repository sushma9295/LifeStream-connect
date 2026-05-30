import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const background = type === "success" ? "bg-emerald-500" : "bg-red-500";
  const textColor = "text-white";

  return (
    <div className={
      "fixed bottom-6 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 shadow-2xl " +
      background +
      " " +
      textColor +
      " animate-[slideup_0.3s_ease-out]"
    }>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
