import api from "./axiosClient";

const queueTicketService = {
  getQueue(doctorId, date, status) {
    const params = { doctorId };
    if (date) params.date = date;
    if (status) params.status = status;
    return api.get("/queue-tickets", { params });
  },

  getById(id) {
    return api.get(`/queue-tickets/${id}`);
  },

  call(id) {
    return api.put(`/queue-tickets/${id}/call`);
  },

  startExamination(id) {
    return api.put(`/queue-tickets/${id}/start-examination`);
  },

  markDone(id) {
    return api.put(`/queue-tickets/${id}/done`);
  },

  skip(id, reason) {
    return api.put(`/queue-tickets/${id}/skip`, { reason });
  },
};

export default queueTicketService;
