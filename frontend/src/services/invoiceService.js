import axiosClient from "./axiosClient";

export const getInvoices = (params) =>
  axiosClient.get("/invoices", { params });

export const getInvoiceById = (id) =>
  axiosClient.get(`/invoices/${id}`);

export const createInvoice = (payload) =>
  axiosClient.post("/invoices", payload);

export const updateInvoice = (id, payload) =>
  axiosClient.put(`/invoices/${id}`, payload);

export const cancelInvoice = (id) =>
  axiosClient.put(`/invoices/${id}/cancel`);
