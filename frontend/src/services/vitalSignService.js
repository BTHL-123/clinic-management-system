import api from "./axiosClient";

const vitalSignService = {
  getByConsultation(consultationId) {
    return api.get(`/consultations/${consultationId}/vital-signs`);
  },

  create(data) {
    return api.post("/vital-signs", data);
  },
};

export default vitalSignService;
