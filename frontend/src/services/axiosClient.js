import axios from "axios";
import { notifyError } from "./toastService.js";

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
    err.status = error.response?.status;
    err.response = error.response;
    
    if (err.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      if (error.config) {
         error.config.skipErrorToast = true;
      }
    }

    // Attach structured conflict data when the backend returns it (leave-request conflict)
    if (data?.data?.conflictingAppointments) {
      err.conflictingAppointments = data.data.conflictingAppointments;
    }
    if (data?.errors) {
      err.errors = data.errors;
    }
    if (!error.config?.skipErrorToast) {
      notifyError(err);
      err.toastShown = true;
    }
    return Promise.reject(err);
  },
);

export default axiosClient;
