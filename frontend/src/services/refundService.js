import axiosClient from "./axiosClient";

export const getRefunds = (params) =>
  axiosClient.get("/refunds", { params });

export const getRefundById = (id) =>
  axiosClient.get(`/refunds/${id}`);

export const createRefundRequest = (payload) =>
  axiosClient.post("/refunds/request", payload);

export const approveRefund = (id) =>
  axiosClient.put(`/refunds/${id}/approve`);

export const rejectRefund = (id, payload) =>
  axiosClient.put(`/refunds/${id}/reject`, payload);
