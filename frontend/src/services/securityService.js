import axiosClient from "./axiosClient";

export const getRoles = () => axiosClient.get("/roles");
export const createRole = (payload) => axiosClient.post("/roles", payload);
export const updateRole = (roleId, payload) => axiosClient.put(`/roles/${roleId}`, payload);
export const deleteRole = (roleId) => axiosClient.delete(`/roles/${roleId}`);
export const getPermissions = () => axiosClient.get("/permissions");
export const assignPermissions = (roleId, permissionIds) =>
  axiosClient.put(`/roles/${roleId}/permissions`, { permissionIds });
