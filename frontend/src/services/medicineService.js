import axiosClient from "./axiosClient";

export const getMedicines = (params) =>
  axiosClient.get("/medicines", { params });

export const getMedicineById = (id) =>
  axiosClient.get(`/medicines/${id}`);

export const createMedicine = (payload) =>
  axiosClient.post("/medicines", payload);

export const updateMedicine = (id, payload) =>
  axiosClient.put(`/medicines/${id}`, payload);

export const deleteMedicine = (id) =>
  axiosClient.delete(`/medicines/${id}`);
