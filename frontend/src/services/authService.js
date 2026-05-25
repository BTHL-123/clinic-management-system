import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const loginWithGoogle = (payload) => axiosClient.post("/auth/google", payload);
export const register = (payload) => axiosClient.post("/auth/register", payload);
export const sendRegisterOtp = (payload) => axiosClient.post("/auth/register/send-otp", payload);
export const forgotPassword = (payload) => axiosClient.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => axiosClient.post("/auth/reset-password", payload);
export const changePassword = (payload) => axiosClient.post("/auth/change-password", payload);
export const getCurrentUser = () => axiosClient.get("/auth/me");
export const logout = (payload) => axiosClient.post("/auth/logout", payload);
