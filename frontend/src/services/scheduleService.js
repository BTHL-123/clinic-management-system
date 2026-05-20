import axiosClient from "./axiosClient";

export const createSchedule = (payload) =>
  axiosClient.post("/v1/admin/schedules", payload);
