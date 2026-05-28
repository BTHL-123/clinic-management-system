import axiosClient from "./axiosClient.js";

const walkInService = {
  /**
   * Create a walk-in appointment.
   * POST /api/receptionist/appointments/walk-in
   */
  createWalkIn(payload) {
    return axiosClient.post("/appointments/walk-in", payload);
  },
};

export default walkInService;
