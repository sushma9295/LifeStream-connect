import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";
import { Search, MapPin, Phone, User } from "lucide-react";
import BottomNav from "../components/BottomNav";

const isDonorUser = (donor) =>
  donor && (donor.isDonor === true || donor.isDonor === "true");

const isAvailableDonor = (donor) =>
  donor && (donor.available === true || donor.available === "true");

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function FindDonor() {
  const [searchCity, setSearchCity] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");

    if (!currentUser) {
      setDonors([]);
      setLoading(false);
      return;
    }

    const donorsRef = ref(db, "users");
    const unsubscribeDonors = onValue(
      donorsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const realDonors = Object.entries(data)
            .filter(([, donor]) => isDonorUser(donor))
            .map(([id, donor]) => ({ id, ...donor }));
          setDonors(realDonors);
        } else {
          setDonors([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching donors:", err);
        setError("Unable to load donors. Please try again.");
        setDonors([]);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeDonors();
    };
  }, [currentUser]);

  const filteredDonors = donors.filter((donor) => {
    const matchGroup =
      selectedGroup === "All" || donor.bloodGroup === selectedGroup;
    const matchCity =
      searchCity === "" ||
      (donor.city && donor.city.toLowerCase().includes(searchCity.toLowerCase()));
    return matchGroup && matchCity;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-4 pt-12 pb-6">
        <h1 className="text-white text-xl font-bold mb-1">Find Donor</h1>
        <p className="text-red-200 text-xs">Search nearby blood donors</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="Search by city..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-400 bg-white shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {bloodGroups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={
                "flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all " +
                (selectedGroup === g
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-200")
              }
            >
              {g}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 font-medium">
          {filteredDonors.length} donor{filteredDonors.length !== 1 ? "s" : ""} found
        </p>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && donors.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No donors registered yet</p>
            <p className="text-gray-400 text-sm mt-1">Sign up as a donor to appear here</p>
          </div>
        )}

        {!loading && filteredDonors.length === 0 && donors.length > 0 && (
          <div className="text-center py-12">
            <User className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No donors found</p>
            <p className="text-gray-400 text-sm mt-1">Try changing the filters</p>
          </div>
        )}

        <div className="space-y-3">
          {!loading &&
            filteredDonors.map((donor) => (
              <div
                key={donor.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-sm">
                    {donor.bloodGroup || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {donor.name || "Anonymous"}
                    </p>
                    <span
                      className={
                        "text-xs font-medium px-3 py-1 rounded-full " +
                        (donor.available
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600")
                      }
                    >
                      {donor.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {donor.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        {donor.city}
                      </span>
                    )}
                  </div>
                </div>
                {donor.phone && (
                  <a
                    href={"tel:" + donor.phone}
                    className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold flex-shrink-0"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                )}
              </div>
            ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
