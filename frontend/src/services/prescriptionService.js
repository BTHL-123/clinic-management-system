import api from "./axiosClient";

export const getPrescriptionByConsultationId = (consultationId) =>
  api.get(`/prescriptions/by-consultation/${consultationId}`, { skipErrorToast: true });

export const getPrescriptionById = (prescriptionId) =>
  api.get(`/prescriptions/${prescriptionId}`);

export const getPrescriptions = (params) =>
  api.get("/prescriptions", { params });

export const createPrescription = (data) =>
  api.post("/prescriptions", data, { skipErrorToast: true });

export const checkDrugInteractions = (prescriptionId) =>
  api.post(`/prescriptions/${prescriptionId}/check-interactions`);

export const checkInteractionsDraft = (medicineIds) =>
  api.post("/prescriptions/check-interactions-draft", medicineIds);

export const dispensePrescription = (prescriptionId) =>
  api.post(`/prescriptions/${prescriptionId}/dispense`);
