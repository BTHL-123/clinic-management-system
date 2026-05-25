import axiosClient from "./axiosClient";

export const getPayments = (params) =>
  axiosClient.get("/payments", { params });

export const getPaymentById = (id) =>
  axiosClient.get(`/payments/${id}`);

export const createPayment = (payload) =>
  axiosClient.post("/payments", payload);

export const confirmCashPayment = (id) =>
  axiosClient.put(`/payments/${id}/confirm-cash`);
