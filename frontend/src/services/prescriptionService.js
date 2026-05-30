import api from "./axiosClient";

export const getPrescriptionByConsultationId = (consultationId) =>
  api.get(`/prescriptions/by-consultation/${consultationId}`);

export const getPrescriptionById = (prescriptionId) =>
  api.get(`/prescriptions/${prescriptionId}`);

export const createPrescription = (data) => api.post("/prescriptions", data);
