import api from "./axiosClient";

export const getLabRequestsByConsultationId = async (consultationId) => {
  return await api.get(`/lab-requests/by-consultation/${consultationId}`);
};

export const getLabRequestById = async (labRequestId) => {
  return await api.get(`/lab-requests/${labRequestId}`);
};
