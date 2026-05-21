import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveAlerts } from "../services/inventoryService";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadAlerts();
    // Poll every 5 minutes
    const interval = setInterval(fetchUnreadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadAlerts = async () => {
    try {
      setLoading(true);
      const response = await getActiveAlerts({ page: 0, size: 5 });
      const unresolvedAlerts = response.data.content || [];
      setAlerts(unresolvedAlerts);
      setUnreadCount(unresolvedAlerts.length);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/dashboard/inventory-alerts");
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "EXPIRED":
        return "❌";
      case "NEAR_EXPIRY":
        return "⚠️";
      case "LOW_STOCK":
        return "📦";
      default:
        return "ℹ️";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="notification-bell-wrapper">
      <button
        className="icon-button notification-bell-button"
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
              <h3>Cảnh báo tồn kho</h3>
              <span className="muted">{unreadCount} chưa xử lý</span>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Đang tải...</div>
              ) : alerts.length === 0 ? (
                <div className="notification-empty">
                  <span>✅</span>
                  <p>Mọi thứ đều ổn!</p>
                  <small className="muted">Không có cảnh báo nào</small>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className={`notification-item alert-${alert.alertType.toLowerCase()}`}
                  >
                    <div className="alert-icon">
                      {getAlertIcon(alert.alertType)}
                    </div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <span className="alert-time muted">
                        {formatDate(alert.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {alerts.length > 0 && (
              <div className="notification-footer">
                <button
                  className="notification-view-all"
                  onClick={handleViewAll}
                >
                  Xem tất cả cảnh báo →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
