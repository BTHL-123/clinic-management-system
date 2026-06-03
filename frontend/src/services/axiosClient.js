import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const message = data?.message || error.message || "Request failed";
    const err = new Error(message);
    // Attach structured conflict data when the backend returns it (leave-request conflict)
    if (data?.data?.conflictingAppointments) {
      err.conflictingAppointments = data.data.conflictingAppointments;
    }
    return Promise.reject(err);
  },
);

export default axiosClient;
