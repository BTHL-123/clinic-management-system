import api from "./axiosClient";

const consultationService = {
  getAll(params) {
    return api.get("/consultations", { params });
  },

  getById(id) {
    return api.get(`/consultations/${id}`);
  },

  create(data) {
    return api.post("/consultations", data);
  },

  start(id) {
    return api.put(`/consultations/${id}/start`);
  },

  complete(id) {
    return api.put(`/consultations/${id}/complete`);
  },

  changeStatus(id, status) {
    return api.put(`/consultations/${id}/status`, { status });
  },
};

export default consultationService;
