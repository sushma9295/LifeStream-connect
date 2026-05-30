const ORS_API_KEY = import.meta.env.VITE_ORS_KEY || "";

export async function getRoute(startLng, startLat, endLng, endLat) {
  try {
    if (!ORS_API_KEY) {
      return { coords: null, distance: null, duration: null };
    }
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [[startLng, startLat], [endLng, endLat]],
      }),
    });
    const data = await response.json();
    if (data.routes && data.routes[0]) {
      const route = data.routes[0];
      const coords = decodePolyline(route.geometry);
      const distance = (route.summary.distance / 1000).toFixed(1);
      const duration = Math.ceil(route.summary.duration / 60);
      return { coords, distance, duration };
    }
    return { coords: null, distance: null, duration: null };
  } catch {
    return { coords: null, distance: null, duration: null };
  }
}

function decodePolyline(encoded) {
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

export function calculateStraightDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export function estimateETA(distanceKm) {
  const avgSpeedKmh = 30;
  const minutes = Math.ceil((distanceKm / avgSpeedKmh) * 60);
  if (minutes < 1) return "Less than 1 min";
  if (minutes === 1) return "1 minute";
  return minutes + " minutes";
}
