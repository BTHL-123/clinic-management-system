import { Calendar, Info, AlertTriangle, CheckCircle, Trash2, Check, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import notificationService from "../../services/notificationService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.data || 0);

      const listRes = await notificationService.getNotifications(page, 10);
      let content = listRes.data?.content || [];
      if (filterUnread) {
        content = content.filter(n => !n.isRead);
      }
      setNotifications(content);
      setTotalPages(listRes.data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filterUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "APPOINTMENT":
        return (
          <div className="item-icon type-appointment" style={{ padding: 10, borderRadius: "50%", background: "#e0f2fe", color: "#0284c7" }}>
            <Calendar size={20} />
          </div>
        );
      case "ALERT":
        return (
          <div className="item-icon type-alert" style={{ padding: 10, borderRadius: "50%", background: "#fef3c7", color: "#d97706" }}>
            <AlertTriangle size={20} />
          </div>
        );
      case "SYSTEM":
      default:
        return (
          <div className="item-icon type-system" style={{ padding: 10, borderRadius: "50%", background: "#f1f5f9", color: "#475569" }}>
            <Info size={20} />
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>
            Thông báo của tôi
            {unreadCount > 0 && (
              <span className="status-pill locked" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                {unreadCount} chưa đọc
              </span>
            )}
          </h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Nhận và xem các cập nhật về lịch khám hoặc thông báo từ hệ thống.</p>
        </div>

        <div className="heading-actions">
          {unreadCount > 0 && (
            <button className="ghost-button" onClick={handleMarkAllRead} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} />
              Đánh dấu đọc tất cả
            </button>
          )}
          <button className="ghost-button" onClick={fetchNotifications} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #dfe5ec", display: "flex", gap: "12px", background: "#f8fafc" }}>
          <button
            onClick={() => setFilterUnread(false)}
            className={`secondary-button ${!filterUnread ? "active" : ""}`}
            style={{
              minHeight: 36,
              background: !filterUnread ? "#00b5f1" : "#ffffff",
              color: !filterUnread ? "#ffffff" : "#334155",
              borderColor: !filterUnread ? "#00b5f1" : "#d7dee8",
              fontWeight: 700
            }}
          >
            Tất cả thông báo
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`secondary-button ${filterUnread ? "active" : ""}`}
            style={{
              minHeight: 36,
              background: filterUnread ? "#00b5f1" : "#ffffff",
              color: filterUnread ? "#ffffff" : "#334155",
              borderColor: filterUnread ? "#00b5f1" : "#d7dee8",
              fontWeight: 700
            }}
          >
            Chưa đọc
          </button>
        </div>

        {loading && notifications.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
            <Loader2 className="animate-spin" size={32} style={{ color: "#00b5f1", marginBottom: 12 }} />
            <span className="muted">Đang tải thông báo...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔔</div>
            <h3 style={{ margin: "0 0 8px", color: "#1e293b", fontWeight: 700 }}>Hộp thư của bạn đang trống</h3>
            <p className="muted" style={{ maxWidth: 360, margin: 0 }}>
              {filterUnread ? "Không tìm thấy thông báo chưa đọc nào." : "Bạn không có thông báo nào vào lúc này."}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((item) => (
              <div
                key={item.notificationId}
                className={`notification-row ${!item.isRead ? "unread" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "start",
                  gap: "16px",
                  padding: "20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: !item.isRead ? "rgba(240, 249, 255, 0.4)" : "#ffffff",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onClick={() => !item.isRead && handleMarkAsRead(item.notificationId)}
              >
                {getNotificationIcon(item.type)}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: !item.isRead ? "750" : "600", color: "#0f172a" }}>
                      {item.title}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="muted" style={{ fontSize: "0.8rem" }}>{formatDate(item.createdAt)}</span>
                      {!item.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.notificationId);
                          }}
                          className="icon-button"
                          style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0f9ff", border: "1px solid #bae6fd" }}
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} style={{ color: "#0284c7" }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#475569", lineHeight: 1.5 }}>
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="ghost-button"
            style={{ padding: "6px 12px", minHeight: 36 }}
          >
            <ChevronLeft size={16} />
            Trang trước
          </button>
          <span className="muted" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="ghost-button"
            style={{ padding: "6px 12px", minHeight: 36 }}
          >
            Trang sau
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
