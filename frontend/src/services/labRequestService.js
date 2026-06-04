import api from "./axiosClient";

export const getAllLabRequests = (params) => api.get("/lab-requests", { params });

export const getMyLabRequests = (params) =>
  api.get("/lab-requests/my", { params });

export const getLabRequestsByConsultationId = (consultationId) =>
  api.get(`/lab-requests/by-consultation/${consultationId}`);

export const getLabRequestById = (labRequestId) =>
  api.get(`/lab-requests/${labRequestId}`);

export const createLabRequest = (data) => api.post("/lab-requests", data);

export const acceptLabRequest = (labRequestId) =>
  api.put(`/lab-requests/${labRequestId}/accept`);
