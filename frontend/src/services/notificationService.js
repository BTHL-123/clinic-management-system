import axiosClient from "./axiosClient.js";

const notificationService = {
  getNotifications(page = 0, size = 10) {
    return axiosClient.get("/notifications", { params: { page, size } });
  },

  getUnreadCount() {
    return axiosClient.get("/notifications/unread-count");
  },

  markAsRead(id) {
    return axiosClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return axiosClient.put("/notifications/read-all");
  }
};

export default notificationService;
