import axiosClient from "./axiosClient";

export const getUsers = (params) => axiosClient.get("/users", { params });
export const createUser = (payload) => axiosClient.post("/users", payload);
export const updateUser = (userId, payload) => axiosClient.put(`/users/${userId}`, payload);
export const lockUser = (userId) => axiosClient.put(`/users/${userId}/lock`);
export const unlockUser = (userId) => axiosClient.put(`/users/${userId}/unlock`);
export const deleteUser = (userId) => axiosClient.delete(`/users/${userId}`);
