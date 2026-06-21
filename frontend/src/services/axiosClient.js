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

function sanitizeErrorMessage(message) {
  if (!message) return "Đã xảy ra lỗi. Vui lòng thử lại.";
  // Hide raw SQL/JDBC errors
  if (
    message.includes("JDBC") ||
    message.includes("SQL") ||
    message.includes("hibernate") ||
    message.includes("JPA") ||
    message.includes("column") ||
    message.includes("table") ||
    message.includes("relation") ||
    message.includes("Internal server error")
  ) {
    return "Đã xảy ra lỗi kết nối dữ liệu. Vui lòng thử lại sau.";
  }
  return message;
}

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const rawMessage = data?.message || error.message || "Request failed";
    const message = sanitizeErrorMessage(rawMessage);
    const err = new Error(message);
    err.status = error.response?.status;
    err.response = error.response;
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
