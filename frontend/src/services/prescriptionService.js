import api from "./axiosClient";

export const getPrescriptionByConsultationId = (consultationId) =>
  api.get(`/prescriptions/by-consultation/${consultationId}`, { skipErrorToast: true });

export const getPrescriptionById = (prescriptionId) =>
  api.get(`/prescriptions/${prescriptionId}`);

export const getPrescriptions = (params) =>
  api.get("/prescriptions", { params });

export const createPrescription = (data) => api.post("/prescriptions", data);

export const checkDrugInteractions = (prescriptionId) =>
  api.post(`/prescriptions/${prescriptionId}/check-interactions`);

export const dispensePrescription = (prescriptionId) =>
  api.post(`/prescriptions/${prescriptionId}/dispense`);
