import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const register = (payload) => axiosClient.post("/auth/register", payload);
export const getCurrentUser = () => axiosClient.get("/auth/me");
export const logout = (payload) => axiosClient.post("/auth/logout", payload);
