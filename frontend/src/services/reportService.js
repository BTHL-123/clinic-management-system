import axiosClient from "./axiosClient";

export const getRevenueReport = (params) =>
  axiosClient.get("/reports/revenue", { params });

export const getRevenueSummary = (params) =>
  axiosClient.get("/reports/revenue/summary", { params });

export const getAppointmentReport = (params) =>
  axiosClient.get("/reports/appointments", { params });

export const getDoctorPerformance = (params) =>
  axiosClient.get("/reports/doctor-performance", { params });

export const getMedicineStockSummary = () =>
  axiosClient.get("/reports/medicine-stock");

export const getExpiringBatches = (params) =>
  axiosClient.get("/reports/medicine-expiring", { params });
