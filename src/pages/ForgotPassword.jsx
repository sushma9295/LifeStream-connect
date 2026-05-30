import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { Mail, CheckCircle, Droplets } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleReset(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
          <Droplets className="text-red-600" size={32} />
        </div>
        <h1 className="text-white text-2xl font-bold">Forgot Password</h1>
        <p className="text-red-200 text-sm mt-1">Reset your password via email</p>
      </div>

      {!success ? (
        <div className="flex-1 bg-gray-50 px-6 py-8 -mt-4 rounded-t-3xl">
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your registered email address. We will send you a password reset link.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div>
              <label className="text-gray-600 text-sm font-medium mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Reset Link
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password? <Link to="/login" className="text-red-600 font-semibold">Login</Link>
            </p>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 px-6 py-8 -mt-4 rounded-t-3xl flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Email Sent!</h2>
          <p className="text-sm text-gray-500">Password reset link has been sent to</p>
          <p className="text-red-600 font-semibold text-sm mt-1 mb-6">{email}</p>

          <div className="bg-white rounded-2xl p-4 shadow-sm text-left w-full mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next Steps</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="text-white" size={14} />
                </div>
                <span>Check your email inbox</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="text-white" size={14} />
                </div>
                <span>Click the reset link in the email</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="text-white" size={14} />
                </div>
                <span>Create your new password</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="text-white" size={14} />
                </div>
                <span>Come back and login</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full border-2 border-red-600 text-red-600 font-semibold py-3 rounded-xl mb-3"
          >
            Resend Email
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
