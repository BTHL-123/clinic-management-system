import axiosClient from "./axiosClient";

export const getDepartments = (params) => axiosClient.get("/departments", { params });

export const getActiveDepartments = () => axiosClient.get("/departments/active");

export const getDepartmentById = (id) => axiosClient.get(`/departments/${id}`);

export const createDepartment = (payload) =>
  axiosClient.post("/departments", payload);

export const updateDepartment = (id, payload) =>
  axiosClient.put(`/departments/${id}`, payload);

export const deleteDepartment = (id) =>
  axiosClient.delete(`/departments/${id}`);
