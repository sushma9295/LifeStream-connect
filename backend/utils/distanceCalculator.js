const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;
  return Math.round(distance * 10) / 10;
};

const findNearbyDonors = (donors, centerLat, centerLon, radiusKm) => {
  const filtered = donors
    .map((donor) => {
      const distance = calculateDistance(
        centerLat,
        centerLon,
        Number(donor.location?.lat) || 0,
        Number(donor.location?.lon) || 0
      );
      return { ...donor, distance };
    })
    .filter((donor) => donor.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return filtered;
};

module.exports = { calculateDistance, findNearbyDonors };
