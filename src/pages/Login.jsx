import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Droplets } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center py-14 px-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Droplets className="text-red-600" size={32} />
        </div>
        <h1 className="text-white text-2xl font-bold mt-3">Lifestream Connect</h1>
        <p className="text-red-200 text-sm mt-1">Sign in to access the network</p>
      </div>
      <div className="flex-1 bg-gray-50 px-6 py-8 rounded-t-3xl -mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Welcome Back</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-white mb-4"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-2 mb-4">
          <Link
            to="/forgot-password"
            className="text-red-600 text-sm font-medium hover:text-red-700"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </button>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="/signup" className="text-red-600 font-semibold">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
