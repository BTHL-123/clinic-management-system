import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  UserCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import appointmentService from "../../services/appointmentService";

function Toast({ message, type }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "16px",
        fontSize: "14px",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: isError ? "#fef2f2" : "#f0fdf4",
        border: `1px solid ${isError ? "#fee2e2" : "#dcfce7"}`,
        color: isError ? "#991b1b" : "#166534",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      <span>{message}</span>
    </div>
  );
}

export default function ReceptionistAppointmentsPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const [keyword, setKeyword] = useState("");
  const [date, setDate] = useState(todayStr);
  const [status, setStatus] = useState("CONFIRMED");

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Toast
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4000);
  };

  const fetchAppointments = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const filters = {};
      if (keyword.trim()) filters.keyword = keyword.trim();
      if (date) filters.date = date;
      if (status) filters.status = status;

      const response = await appointmentService.getReceptionistAppointments(filters, page, 10);
      const data = response?.data;
      if (data) {
        setAppointments(data.content || []);
        setCurrentPage(data.pageNumber || 0);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách lịch hẹn", "error");
    } finally {
      setLoading(false);
    }
  }, [keyword, date, status]);

  useEffect(() => {
    fetchAppointments(0);
  }, [date, status]); // Auto-fetch when date or status changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments(0);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentService.checkInAppointment(appointmentId);
      showToast("Check-in bệnh nhân thành công!");
      fetchAppointments(currentPage);
    } catch (err) {
      showToast(err.message || "Check-in thất bại", "error");
    }
  };

  const getStatusBadge = (appStatus) => {
    switch (appStatus) {
      case "CONFIRMED":
        return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Confirmed</span>;
      case "CHECKED_IN":
        return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Checked In</span>;
      case "CANCELLED":
        return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Cancelled</span>;
      case "COMPLETED":
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Completed</span>;
      case "PENDING_PAYMENT":
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Pending Payment</span>;
      default:
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>{appStatus}</span>;
    }
  };

  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title">
          <UserCheck size={24} style={{ color: "#0f766e" }} />
          Check-in Bệnh nhân
        </h1>
        <button
          className="ghost-button"
          onClick={() => fetchAppointments(currentPage)}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          Làm mới
        </button>
      </div>

      <Toast message={toast.message} type={toast.type} />

      {/* Toolbar / Filters */}
      <div className="panel" style={{ marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} className="toolbar" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã lịch hẹn, tên hoặc số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} style={{ color: "#64748b" }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "160px" }}
            />
          </div>

          <div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "160px" }}>
              <option value="">Tất cả trạng thái</option>
              <option value="CONFIRMED">Confirmed (Chờ khám)</option>
              <option value="CHECKED_IN">Checked In (Đã check-in)</option>
              <option value="COMPLETED">Completed (Hoàn thành)</option>
              <option value="CANCELLED">Cancelled (Đã hủy)</option>
            </select>
          </div>

          <button type="submit" className="primary-button" style={{ height: "40px" }}>
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Lịch Hẹn</th>
              <th>Bệnh Nhân</th>
              <th>Số Điện Thoại</th>
              <th>Bác Sĩ</th>
              <th>Ngày Khám</th>
              <th>Giờ Khám</th>
              <th>Trạng Thái</th>
              <th>Số Thứ Tự</th>
              <th style={{ textAlign: "center" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Không tìm thấy lịch hẹn nào phù hợp.
                </td>
              </tr>
            ) : (
              appointments.map((app) => {
                const isToday = app.appointmentDate === todayStr;
                const canCheckIn = app.status === "CONFIRMED" && isToday;

                return (
                  <tr key={app.appointmentId}>
                    <td style={{ fontWeight: 600, color: "#0f766e" }}>{app.appointmentCode}</td>
                    <td style={{ fontWeight: 600 }}>{app.patientName}</td>
                    <td>{app.patientPhone || "—"}</td>
                    <td>{app.doctorName}</td>
                    <td>{app.appointmentDate}</td>
                    <td style={{ fontWeight: 500 }}>
                      {app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      {app.queueNumber ? (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #0f766e, #0d9488)",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontWeight: 800,
                            fontSize: "13px",
                            display: "inline-block",
                            boxShadow: "0 2px 4px rgba(13,148,136,0.2)",
                          }}
                        >
                          #{app.queueNumber}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {canCheckIn ? (
                        <button
                          className="primary-button compact"
                          onClick={() => handleCheckIn(app.appointmentId)}
                          style={{
                            background: "linear-gradient(135deg, #0f766e, #0d9488)",
                            boxShadow: "0 2px 4px rgba(15,118,110,0.2)",
                            fontWeight: 700,
                          }}
                        >
                          Check-in
                        </button>
                      ) : app.status === "CHECKED_IN" ? (
                        <span style={{ color: "#16a34a", fontWeight: 700, fontSize: "13.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          ✓ Đã check-in
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>Không khả dụng</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13.5px", color: "#64748b" }}>
            Hiển thị <strong>{appointments.length}</strong> / <strong>{totalElements}</strong> lịch hẹn
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              className="ghost-button compact"
              disabled={currentPage === 0 || loading}
              onClick={() => fetchAppointments(currentPage - 1)}
            >
              Trước
            </button>
            <span style={{ padding: "8px 12px", fontSize: "14px", fontWeight: 600 }}>
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="ghost-button compact"
              disabled={currentPage === totalPages - 1 || loading}
              onClick={() => fetchAppointments(currentPage + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
