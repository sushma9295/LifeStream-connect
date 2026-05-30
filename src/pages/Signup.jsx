import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, set } from "firebase/database";
import { Droplets } from "lucide-react";

const bloodGroups = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isDonor, setIsDonor] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name || !email || !phone || !bloodGroup || !city || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const credential = await signup(email, password);
      const uid = credential.user.uid;
      await set(ref(db, "users/" + uid), {
        name,
        email,
        phone,
        bloodGroup,
        city,
        isDonor,
        available: isDonor,
        createdAt: Date.now(),
      });
      navigate("/dashboard");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg mb-3">
          <Droplets className="text-red-600" size={28} />
        </div>
        <h1 className="text-white text-2xl font-bold">Create Account</h1>
        <p className="text-red-200 text-sm mt-1">Join Lifestream Connect today</p>
      </div>
      <div className="flex-1 bg-white px-6 py-6 -mt-4 rounded-t-3xl">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400">
            <option value="">Select Blood Group</option>
            {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm Password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">Register as donor</span>
            <button type="button" onClick={() => setIsDonor(!isDonor)} className={isDonor ? "w-12 h-6 rounded-full bg-red-600 relative" : "w-12 h-6 rounded-full bg-gray-300 relative"}>
              <span className={isDonor ? "absolute left-6 top-0.5 w-5 h-5 bg-white rounded-full shadow" : "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"} />
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-60 flex items-center justify-center">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
          </button>
        </form>
        <p className="text-center text-gray-500 text-sm mt-4">Already have an account? <Link to="/login" className="text-red-600 font-semibold">Login</Link></p>
      </div>
    </div>
  );
}
