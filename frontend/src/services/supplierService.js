import axiosClient from "./axiosClient";

export const getSuppliers = (params) =>
  axiosClient.get("/suppliers", { params });

export const getSupplierById = (id) =>
  axiosClient.get(`/suppliers/${id}`);

export const createSupplier = (payload) =>
  axiosClient.post("/suppliers", payload);

export const updateSupplier = (id, payload) =>
  axiosClient.put(`/suppliers/${id}`, payload);
