import axiosClient from "./axiosClient";

export const createSchedule = (payload) =>
  axiosClient.post("/doctor-schedules", payload);

export const getSchedules = (params) =>
  axiosClient.get("/doctor-schedules", { params });

export const updateSchedule = (id, payload) =>
  axiosClient.put(`/doctor-schedules/${id}`, payload);

export const cancelSchedule = (id) =>
  axiosClient.delete(`/doctor-schedules/${id}`);

export const getSlotsByScheduleId = (id) =>
  axiosClient.get(`v1/admin/schedules/${id}/slots`);
