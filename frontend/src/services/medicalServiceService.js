import axiosClient from "./axiosClient";

export const getMedicalServices = (params) =>
  axiosClient.get("/medical-services", { params });

export const getActiveMedicalServices = () =>
  axiosClient.get("/medical-services/active");

export const getMedicalServiceById = (id) =>
  axiosClient.get(`/medical-services/${id}`);

export const createMedicalService = (payload) =>
  axiosClient.post("/medical-services", payload);

export const updateMedicalService = (id, payload) =>
  axiosClient.put(`/medical-services/${id}`, payload);

export const deleteMedicalService = (id) =>
  axiosClient.delete(`/medical-services/${id}`);
