import api from "./axiosClient";

export const getLabTests = (params) => api.get("/lab-tests", { params });
