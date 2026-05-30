import API from "./config";

export async function getAllDonors() {
  try {
    const response = await API.get("/donors");
    return response.data;
  } catch (error) {
    console.error("getAllDonors failed", error);
    throw error;
  }
}

export async function getDonorsByBloodGroup(bloodGroup) {
  try {
    const response = await API.get(`/donors/blood/${encodeURIComponent(bloodGroup)}`);
    return response.data;
  } catch (error) {
    console.error("getDonorsByBloodGroup failed", error);
    throw error;
  }
}

export async function getNearbyDonors(lat, lon, radius, bloodGroup) {
  try {
    const response = await API.get("/donors/nearby", {
      params: { lat, lon, radius, bloodGroup },
    });
    return response.data;
  } catch (error) {
    console.error("getNearbyDonors failed", error);
    throw error;
  }
}

export async function updateAvailability(available) {
  try {
    const response = await API.put("/donors/availability", { available });
    return response.data;
  } catch (error) {
    console.error("updateAvailability failed", error);
    throw error;
  }
}

export async function updateLocation(lat, lon) {
  try {
    const response = await API.put("/donors/location", { lat, lon });
    return response.data;
  } catch (error) {
    console.error("updateLocation failed", error);
    throw error;
  }
}

export async function createRequest(data) {
  try {
    const response = await API.post("/requests", data);
    return response.data;
  } catch (error) {
    console.error("createRequest failed", error);
    throw error;
  }
}

export async function getAllRequests() {
  try {
    const response = await API.get("/requests");
    return response.data;
  } catch (error) {
    console.error("getAllRequests failed", error);
    throw error;
  }
}

export async function getMyRequests() {
  try {
    const response = await API.get("/requests/my");
    return response.data;
  } catch (error) {
    console.error("getMyRequests failed", error);
    throw error;
  }
}

export async function updateRequestStatus(id, status, donorId) {
  try {
    const response = await API.put(`/requests/${id}/status`, { status, donorId });
    return response.data;
  } catch (error) {
    console.error("updateRequestStatus failed", error);
    throw error;
  }
}

export async function deleteRequest(id) {
  try {
    const response = await API.delete(`/requests/${id}`);
    return response.data;
  } catch (error) {
    console.error("deleteRequest failed", error);
    throw error;
  }
}

export async function createEmergency(data) {
  try {
    const response = await API.post("/emergency", data);
    return response.data;
  } catch (error) {
    console.error("createEmergency failed", error);
    throw error;
  }
}

export async function getActiveEmergencies() {
  try {
    const response = await API.get("/emergency/active");
    return response.data;
  } catch (error) {
    console.error("getActiveEmergencies failed", error);
    throw error;
  }
}

export async function respondToEmergency(id, responseText) {
  try {
    const response = await API.put(`/emergency/${id}/respond`, { response: responseText });
    return response.data;
  } catch (error) {
    console.error("respondToEmergency failed", error);
    throw error;
  }
}

export async function resolveEmergency(id) {
  try {
    const response = await API.put(`/emergency/${id}/resolve`);
    return response.data;
  } catch (error) {
    console.error("resolveEmergency failed", error);
    throw error;
  }
}

export async function getNotifications() {
  try {
    const response = await API.get("/notifications");
    return response.data;
  } catch (error) {
    console.error("getNotifications failed", error);
    throw error;
  }
}

export async function markAsRead(id) {
  try {
    const response = await API.put(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error("markAsRead failed", error);
    throw error;
  }
}

export async function markAllAsRead() {
  try {
    const response = await API.put("/notifications/read-all");
    return response.data;
  } catch (error) {
    console.error("markAllAsRead failed", error);
    throw error;
  }
}

export async function getTrackingInfo(requestId) {
  try {
    const response = await API.get(`/tracking/${requestId}`);
    return response.data;
  } catch (error) {
    console.error("getTrackingInfo failed", error);
    throw error;
  }
}

export async function updateTracking(requestId, lat, lon, status) {
  try {
    const response = await API.put("/tracking/update", { requestId, lat, lon, status });
    return response.data;
  } catch (error) {
    console.error("updateTracking failed", error);
    throw error;
  }
}
