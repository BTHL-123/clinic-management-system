import axiosClient from "./axiosClient.js";

const queueService = {
  getQueue(filters = {}) {
    return axiosClient.get("/receptionist/queue", { params: filters });
  },

  callPatient(queueTicketId) {
    return axiosClient.put(`/receptionist/queue/${queueTicketId}/call`);
  },

  skipPatient(queueTicketId) {
    return axiosClient.put(`/receptionist/queue/${queueTicketId}/skip`);
  },

  completePatient(queueTicketId) {
    return axiosClient.put(`/receptionist/queue/${queueTicketId}/complete`);
  },

  getMyQueueStatus() {
    return axiosClient.get("/patient/queue-status");
  },
};

export default queueService;
