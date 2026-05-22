import axiosClient from "./axiosClient.js";

const appointmentService = {
  getMyAppointments(upcoming, page = 0, size = 10) {
    const params = { page, size, sortBy: "appointmentDate", direction: upcoming ? "ASC" : "DESC" };
    if (upcoming !== null && upcoming !== undefined) {
      params.upcoming = upcoming;
    }
    return axiosClient.get("/appointments/me", { params });
  },

  getAppointmentById(id) {
    return axiosClient.get(`/appointments/${id}`);
  },

  getAppointments(filters = {}, page = 0, size = 10) {
    return axiosClient.get("/appointments", { params: { ...filters, page, size } });
  },

  bookAppointment(payload) {
    return axiosClient.post("/appointments", payload);
  },
};

export default appointmentService;
