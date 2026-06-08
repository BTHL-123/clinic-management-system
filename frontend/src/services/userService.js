import axiosClient from "./axiosClient";

export const getUsers = (params, config = {}) => axiosClient.get("/users", { params, ...config });
export const createUser = (payload) => axiosClient.post("/users", payload);
export const updateUser = (userId, payload) => axiosClient.put(`/users/${userId}`, payload);
export const updateCurrentUser = (payload) => axiosClient.put("/users/me", payload);
export const uploadCurrentUserAvatar = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const lockUser = (userId) => axiosClient.put(`/users/${userId}/lock`);
export const unlockUser = (userId) => axiosClient.put(`/users/${userId}/unlock`);
export const deleteUser = (userId) => axiosClient.delete(`/users/${userId}`);
