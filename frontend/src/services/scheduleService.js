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
  axiosClient.get(`/doctor-schedules/${id}/slots`);

export const getAvailableSlots = (doctorId, workDate) =>
  axiosClient.get("/doctor-schedules/available-slots", {
    params: { doctorId, workDate },
  });

export const lockSlot = (slotId) =>
  axiosClient.post(`/doctor-schedules/slots/${slotId}/lock`);

export const releaseLock = (slotId) =>
  axiosClient.delete(`/doctor-schedules/slots/${slotId}/lock`);

export const createAppointment = (payload) =>
  axiosClient.post("/appointments", payload);

