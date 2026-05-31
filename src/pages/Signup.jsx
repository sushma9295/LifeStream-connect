import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, set } from "firebase/database";
import { Droplets } from "lucide-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
        name: name,
        email: email,
        phone: phone,
        bloodGroup: bloodGroup,
        city: city,
        isDonor: isDonor,
        available: isDonor,
        createdAt: Date.now()
      });
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
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
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Blood Group</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400">
              <option value="">Select Blood Group</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm your password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-red-400" />
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl px-4 py-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-900">Register as a Donor</label>
              <button type="button" onClick={() => setIsDonor(!isDonor)} className={isDonor ? "w-12 h-6 rounded-full bg-red-600 relative transition" : "w-12 h-6 rounded-full bg-gray-300 relative transition"}>
                <span className={isDonor ? "absolute left-6 top-0.5 w-5 h-5 bg-white rounded-full shadow transition" : "absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition"} />
              </button>
            </div>
            {isDonor && <p className="text-xs text-red-700 font-semibold">You will appear as a donor to others in the Find Donor network</p>}
            {!isDonor && <p className="text-xs text-gray-600">Toggle on to help save lives by becoming a registered donor</p>}
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 rounded-xl shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-4">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
          </button>
        </form>
        
        <p className="text-center text-gray-500 text-sm mt-4">Already have an account? <Link to="/login" className="text-red-600 font-semibold">Login</Link></p>
      </div>
    </div>
  );
}
