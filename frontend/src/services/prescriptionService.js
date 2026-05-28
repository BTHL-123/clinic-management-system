import api from "./axiosClient";

export const getPrescriptionByConsultationId = async (consultationId) => {
  return await api.get(`/prescriptions/by-consultation/${consultationId}`);
};

export const getPrescriptionById = async (prescriptionId) => {
  return await api.get(`/prescriptions/${prescriptionId}`);
};
