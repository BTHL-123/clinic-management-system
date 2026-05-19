import axiosClient from "./axiosClient";

export const getPatients = (params) => axiosClient.get("/patients", { params });

export const getPatientById = (id) => axiosClient.get(`/patients/${id}`);

export const createPatient = (payload) => axiosClient.post("/patients", payload);

export const updatePatient = (id, payload) => axiosClient.put(`/patients/${id}`, payload);

export const deletePatient = (id) => axiosClient.delete(`/patients/${id}`);
