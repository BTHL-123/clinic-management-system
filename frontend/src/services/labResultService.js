import api from "./axiosClient";

export const createLabResult = (data) => api.post("/lab-results", data);

export const getLabResultByItemId = (labRequestItemId) =>
  api.get(`/lab-results/by-item/${labRequestItemId}`);
