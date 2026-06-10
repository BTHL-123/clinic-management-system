import { Calendar, Info, AlertTriangle, CheckCircle, Trash2, Check, RefreshCw, ChevronLeft, ChevronRight, Loader2, ArrowLeft, Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../../services/notificationService";
import { useAuth } from "../../context/useAuth";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles?.map((r) => r.roleName || r) || [];
  const isDoctor = roles.includes("DOCTOR");
  const isPharmacist = roles.includes("PHARMACIST");
  const isLabTechnician = roles.includes("LAB_TECHNICIAN");
  const isPatientOnly = roles.includes("PATIENT") && !isDoctor && !isPharmacist && !isLabTechnician;
  const isAdminShell = roles.includes("ADMIN") && !isDoctor && !isPharmacist && !isPatientOnly && !isLabTechnician;
  const usePatientVisualShell = isPatientOnly || isAdminShell || isPharmacist || isLabTechnician;
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
    <div className={usePatientVisualShell ? "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10" : "max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10"}>
      <div className={usePatientVisualShell ? "w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px] mt-4" : "w-full mb-10 flex flex-col items-center"}>
        <div className={usePatientVisualShell ? "w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0" : ""}>
          <button
            onClick={() => navigate("/dashboard", { state: { activeClusterId: "settings" } })}
            className={usePatientVisualShell
              ? "w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center shadow-sm transition-all"
              : "self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group mb-6"}
            title="Quay lại"
          >
            {usePatientVisualShell ? (
              <ArrowLeft size={18} />
            ) : (
              <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors flex items-center justify-center">
                <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
            )}
            {!usePatientVisualShell && "Quay lại Màn hình chính"}
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 w-full px-4">
          <h1 className={usePatientVisualShell
            ? "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"
            : "inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4"}
          >
            <Bell size={32} className={usePatientVisualShell ? "text-teal-400 drop-shadow-md" : "text-teal-300 drop-shadow-md"} />
            <span className="drop-shadow-md">Thông báo của tôi</span>
          </h1>
          <p className={usePatientVisualShell ? "text-white/80 font-bold drop-shadow-sm text-[16px] max-w-[600px]" : "text-teal-50/90 font-medium drop-shadow-sm text-[16px] max-w-[600px]"}>
            Nhận và xem các cập nhật về lịch khám hoặc thông báo từ hệ thống.
          </p>
        </div>
      </div>

      <div className={`${usePatientVisualShell ? "patient-glass-panel rounded-[2rem]" : "light-glass-card"} p-6 md:p-8 w-full max-w-[800px] mx-auto mb-10`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", width: "100%" }}>
          <div>
            {unreadCount > 0 && (
              <span className="status-pill locked" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                {unreadCount} chưa đọc
              </span>
            )}
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

        <div className={usePatientVisualShell ? "patient-glass-subcard" : "light-glass-subcard"} style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.45)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255, 255, 255, 0.25)", display: "flex", gap: "12px", background: "rgba(255, 255, 255, 0.2)" }}>
            <button
              onClick={() => setFilterUnread(false)}
              style={{
                minHeight: 36,
                padding: "6px 16px",
                borderRadius: "12px",
                background: !filterUnread ? "#0f766e" : "rgba(255, 255, 255, 0.35)",
                color: !filterUnread ? "#ffffff" : "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Tất cả thông báo
            </button>
            <button
              onClick={() => setFilterUnread(true)}
              style={{
                minHeight: 36,
                padding: "6px 16px",
                borderRadius: "12px",
                background: filterUnread ? "#0f766e" : "rgba(255, 255, 255, 0.35)",
                color: filterUnread ? "#ffffff" : "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Chưa đọc
            </button>
          </div>

          {loading && notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
              <Loader2 className="animate-spin" size={32} style={{ color: "#00b5f1", marginBottom: 12 }} />
              <span className={usePatientVisualShell ? "text-white/60" : "muted"}>Đang tải thông báo...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔔</div>
              <h3 style={{ margin: "0 0 8px", color: usePatientVisualShell ? "white" : "#1e293b", fontWeight: 700 }}>Hộp thư của bạn đang trống</h3>
              <p className={usePatientVisualShell ? "text-white/60" : "muted"} style={{ maxWidth: 360, margin: 0 }}>
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
                    borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
                    background: !item.isRead ? "rgba(224, 242, 254, 0.35)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = !item.isRead ? "rgba(224, 242, 254, 0.55)" : "rgba(255, 255, 255, 0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = !item.isRead ? "rgba(224, 242, 254, 0.35)" : "transparent"; }}
                  onClick={() => !item.isRead && handleMarkAsRead(item.notificationId)}
                >
                  {getNotificationIcon(item.type)}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: !item.isRead ? "750" : "600", color: usePatientVisualShell ? "white" : "#0f172a" }}>
                        {item.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={usePatientVisualShell ? "text-white/50" : "muted"} style={{ fontSize: "0.8rem", marginBottom: 0 }}>{formatDate(item.createdAt)}</span>
                        {!item.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item.notificationId);
                            }}
                            className="icon-button"
                            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(255, 255, 255, 0.4)" }}
                            title="Đánh dấu đã đọc"
                          >
                            <Check size={14} style={{ color: "#0f766e" }} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.92rem", color: usePatientVisualShell ? "rgba(255,255,255,0.8)" : "#475569", lineHeight: 1.5 }}>
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
    </div>
  );
}
