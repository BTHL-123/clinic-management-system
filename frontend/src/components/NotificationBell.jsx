import { Bell, Calendar, Info, AlertTriangle, Loader2, Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/useAuth.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { emitToast } from "../services/toastService.js";

export default function NotificationBell({ theme = "dark" }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.data || 0);

      const listRes = await notificationService.getNotifications(0, 5);
      setNotifications(listRes.data?.content || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 60 * 1000); // refresh every minute

    window.addEventListener("notification-updated", fetchNotifications);

    // Setup STOMP WebSocket for real-time notifications
    let stompClient = null;
    if (user?.userId) {
      const socketUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
        : "http://localhost:8080/ws-queue";

      stompClient = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      stompClient.onConnect = () => {
        stompClient.subscribe(`/topic/notifications/${user.userId}`, (message) => {
          if (message.body) {
            const notif = JSON.parse(message.body);
            // Trigger toast
            emitToast({
              type: "success",
              title: notif.title || "Thông báo mới",
              message: notif.message,
            });
            // Update unread count and list
            fetchNotifications();
          }
        });
      };

      stompClient.onStompError = (frame) => {
        console.error("STOMP error in NotificationBell:", frame.headers["message"]);
      };

      stompClient.activate();
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener("notification-updated", fetchNotifications);
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [fetchNotifications, user?.userId]);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/dashboard/notifications");
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "APPOINTMENT":
        return (
          <div className="item-icon type-appointment">
            <Calendar size={16} />
          </div>
        );
      case "ALERT":
        return (
          <div className="item-icon type-alert">
            <AlertTriangle size={16} />
          </div>
        );
      case "SYSTEM":
      default:
        return (
          <div className="item-icon type-system">
            <Info size={16} />
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="notification-bell-wrapper">
      <button
        className={`icon-button notification-bell-button ${theme === "light" ? "!bg-slate-50 !text-slate-500 !border-slate-200 hover:!bg-teal-50 hover:!text-teal-600 hover:!border-teal-200 shadow-sm" : ""}`}
        aria-label="Notifications"
        onClick={handleBellClick}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="notification-backdrop"
            onClick={() => setShowDropdown(false)}
          />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Thông báo</h3>
              {unreadCount > 0 && (
                <button className="mark-all-read" onClick={handleMarkAllRead}>
                  Đọc tất cả
                </button>
              )}
            </div>

            <div className="notification-list">
              {loading && notifications.length === 0 ? (
                <div className="notification-loading" style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                  <Loader2 className="animate-spin" size={18} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <div className="icon">🔔</div>
                  <p>Bạn không có thông báo nào</p>
                  <small className="muted">Các thông báo mới của bạn sẽ xuất hiện ở đây</small>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.notificationId}
                    className={`notification-item ${!item.isRead ? "unread" : ""}`}
                    onClick={(e) => !item.isRead && handleMarkAsRead(e, item.notificationId)}
                  >
                    {getNotificationIcon(item.type)}
                    <div className="item-details">
                      <div style={{ display: "flex", justifyContent: "between", alignItems: "start" }}>
                        <h4 className="item-title" style={{ flex: 1, margin: 0 }}>{item.title}</h4>
                        {!item.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, item.notificationId)}
                            style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: "#64748b" }}
                            title="Đánh dấu đã đọc"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="item-message">{item.message}</p>
                      <span className="item-time">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <button
                className="notification-view-all"
                onClick={handleViewAll}
              >
                Xem tất cả thông báo →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
