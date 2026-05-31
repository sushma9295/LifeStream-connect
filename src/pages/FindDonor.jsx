import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, MapPin } from "lucide-react";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import BottomNav from "../components/BottomNav";

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function FindDonor() {
  const [searchCity, setSearchCity] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const donorList = [];
        Object.entries(data).forEach(([userId, user]) => {
          if (user.isDonor === true || user.isDonor === "true") {
            donorList.push({
              id: userId,
              name: user.name || "Anonymous Donor",
              bloodGroup: user.bloodGroup || "Unknown",
              city: user.city || "Unknown",
              phone: user.phone || "N/A",
              available: user.available === true || user.available === "true"
            });
          }
        });
        setDonors(donorList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredDonors = donors.filter((donor) => {
    const matchesGroup = selectedGroup === "All" || donor.bloodGroup === selectedGroup;
    const matchesCity = donor.city.toLowerCase().includes(searchCity.toLowerCase());
    return matchesGroup && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="text-white/80" size={20} />
          <h1 className="text-white text-xl font-bold">Find Donor</h1>
        </div>
        <div className="mt-4 bg-white rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="text-gray-400" size={18} />
          <input value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Search by city" className="w-full text-sm focus:outline-none" />
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {bloodGroups.map((group) => (
            <button key={group} onClick={() => setSelectedGroup(group)} className={selectedGroup === group ? "px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold" : "px-3 py-1.5 rounded-full bg-white text-gray-600 text-xs font-semibold border border-gray-200"}>
              {group}
            </button>
          ))}
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No donors found</p>
              <p className="text-gray-400 text-sm mt-1">No donors registered yet. Sign up as a donor to help save lives!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDonors.map((donor) => (
                <div key={donor.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-700 font-bold text-sm">{donor.bloodGroup}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm">{donor.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{donor.city}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className={donor.available ? "text-green-600 text-xs font-semibold" : "text-gray-400 text-xs font-semibold"}>
                      {donor.available ? "Available" : "Unavailable"}
                    </div>
                    <a href={"tel:" + donor.phone} className="bg-red-600 text-white text-xs px-3 py-1 rounded-xl flex items-center gap-1 no-underline">
                      <Phone size={12} /> Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
