import axiosClient from "./axiosClient";

export const getPayments = (params) =>
  axiosClient.get("/payments", { params });

export const getPaymentById = (id) =>
  axiosClient.get(`/payments/${id}`);

export const createPayment = (payload) =>
  axiosClient.post("/payments", payload);

export const confirmCashPayment = (id) =>
  axiosClient.put(`/payments/${id}/confirm-cash`);

export const createOnlinePaymentUrl = (payload) =>
  axiosClient.post("/payments/online/create-url", payload);

export const processPaymentCallback = (payload) =>
  axiosClient.post("/payments/online/callback", payload);

export const verifySePayTransaction = async (id, config) => {
  const response = await axiosClient.post(`/payments/${id}/verify-sepay`, null, config);
  const payment = response?.data ?? response;
  if (payment?.status !== "PAID") {
    throw new Error("Giao dịch chưa được ngân hàng xác nhận.");
  }
  return response;
};
