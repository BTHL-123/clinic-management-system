import axiosClient from "./axiosClient";

export const getMedicalServices = () => axiosClient.get("/medical-services");

export const getMedicalServiceById = (id) => axiosClient.get(`/medical-services/${id}`);

export const createMedicalService = (payload) =>
  axiosClient.post("/medical-services", payload);

export const updateMedicalService = (id, payload) =>
  axiosClient.put(`/medical-services/${id}`, payload);

export const deleteMedicalService = (id) =>
  axiosClient.delete(`/medical-services/${id}`);
