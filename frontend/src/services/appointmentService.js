import axiosClient from "./axiosClient.js";

const appointmentService = {
  getMyAppointments(upcoming, page = 0, size = 10, filters = {}) {
    const params = { page, size, sortBy: "appointmentDate", direction: upcoming ? "ASC" : "DESC", ...filters };
    if (upcoming !== null && upcoming !== undefined) {
      params.upcoming = upcoming;
    }
    return axiosClient.get("/appointments/me", { params });
  },

  getAppointmentById(id) {
    return axiosClient.get(`/appointments/${id}`);
  },

  getAppointmentBySlotId(slotId) {
    return axiosClient.get(`/appointments/by-slot/${slotId}`);
  },

  getAppointments(filters = {}, page = 0, size = 10) {
    return axiosClient.get("/appointments", { params: { ...filters, page, size } });
  },

  bookAppointment(payload) {
    return axiosClient.post("/appointments", payload);
  },

  getReceptionistAppointments(filters = {}, page = 0, size = 10) {
    return axiosClient.get("/receptionist/appointments", { params: { ...filters, page, size } });
  },

  checkInAppointment(appointmentId) {
    return axiosClient.put(`/receptionist/appointments/${appointmentId}/check-in`);
  },

  cancelAppointment(id, payload) {
    return axiosClient.put(`/appointments/${id}/cancel`, payload);
  },

  rescheduleAppointment(id, newSlotId, rescheduleReason) {
    return axiosClient.put(`/appointments/${id}/reschedule`, { newSlotId, rescheduleReason });
  },

  getDoctorTodayAppointments() {
    return axiosClient.get("/appointments/doctor/today");
  },

  markNoShow(appointmentId, note) {
    return axiosClient.put(`/receptionist/appointments/${appointmentId}/no-show`, { note });
  },
};

export default appointmentService;
