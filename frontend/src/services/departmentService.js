import axiosClient from "./axiosClient";

export const getDepartments = () => axiosClient.get("/departments");

export const getDepartmentById = (id) => axiosClient.get(`/departments/${id}`);

export const createDepartment = (payload) =>
  axiosClient.post("/departments", payload);

export const updateDepartment = (id, payload) =>
  axiosClient.put(`/departments/${id}`, payload);

export const deleteDepartment = (id) =>
  axiosClient.delete(`/departments/${id}`);
