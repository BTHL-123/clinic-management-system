import axiosClient from "./axiosClient";

export const getAuditLogs = (params) => axiosClient.get("/audit-logs", { params });

export const getAuditLogById = (auditLogId) => axiosClient.get(`/audit-logs/${auditLogId}`);
