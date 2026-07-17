import axiosClient from "./axiosClient";

export const getBatches = (params) =>
  axiosClient.get("/inventory/batches", { params });

export const importBatch = (payload) =>
  axiosClient.post("/inventory/batches/import", payload);

export const updateBatch = (id, payload) =>
  axiosClient.put(`/inventory/batches/${id}`, payload);

export const deleteBatch = (id) =>
  axiosClient.delete(`/inventory/batches/${id}`);

export const getTransactions = (params) =>
  axiosClient.get("/inventory/transactions", { params });

export const exportStock = (payload) =>
  axiosClient.post("/inventory/transactions/export", payload);

export const getActiveAlerts = (params) =>
  axiosClient.get("/inventory/alerts", { params });

export const resolveAlert = (id) =>
  axiosClient.put(`/inventory/alerts/${id}/resolve`);
