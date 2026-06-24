import api from "./axiosClient";

export const getLabTests = (params) => api.get("/lab-tests", { params });
export const getLabTestById = (id) => api.get(`/lab-tests/${id}`);
export const createLabTest = (data) => api.post("/lab-tests", data);
export const updateLabTest = (id, data) => api.put(`/lab-tests/${id}`, data);
export const deleteLabTest = (id) => api.delete(`/lab-tests/${id}`);
