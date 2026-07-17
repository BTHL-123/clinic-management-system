import axiosClient from "./axiosClient.js";

const doctorLeaveRequestService = {
  // ── Doctor endpoints ────────────────────────────────────────────────────────

  /** Create a leave / schedule-change request */
  createLeaveRequest(data) {
    return axiosClient.post("/doctor/leave-requests", data);
  },

  /** Fetch the logged-in doctor's own requests */
  getMyLeaveRequests() {
    return axiosClient.get("/doctor/leave-requests/my");
  },

  /** Cancel a PENDING request (doctor-only) */
  cancelLeaveRequest(id) {
    return axiosClient.delete(`/doctor/leave-requests/${id}`);
  },

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  /** Fetch all requests, optionally filtered by status */
  getAllLeaveRequests(status) {
    const params = status && status !== "ALL" ? { status } : {};
    return axiosClient.get("/admin/doctor-leave-requests", { params });
  },

  /** Approve a PENDING request */
  approveLeaveRequest(id) {
    return axiosClient.put(`/admin/doctor-leave-requests/${id}/approve`);
  },

  /** Reject a PENDING request — adminComment is required */
  rejectLeaveRequest(id, adminComment) {
    return axiosClient.put(`/admin/doctor-leave-requests/${id}/reject`, {
      adminComment,
    });
  },
};

export default doctorLeaveRequestService;
