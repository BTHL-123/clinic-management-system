import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  UserCheck,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import { useToast } from "../../context/useToast.js";

export default function ReceptionistAppointmentsPage() {
  const toast = useToast();
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

  // No Show Modal State
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [noShowNote, setNoShowNote] = useState("");

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
      toast.error(err, "Không thể tải danh sách lịch hẹn");
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
      toast.success("Check-in bệnh nhân thành công!");
      fetchAppointments(currentPage);
    } catch (err) {
      toast.error(err, "Check-in thất bại");
    }
  };

  const openNoShowModal = (appointmentId) => {
    setSelectedAppId(appointmentId);
    setNoShowNote("");
    setShowNoShowModal(true);
  };

  const confirmNoShow = async () => {
    if (!selectedAppId) return;
    try {
      await appointmentService.markNoShow(selectedAppId, noShowNote);
      toast.success("Đã đánh dấu bệnh nhân không đến khám (No Show)");
      fetchAppointments(currentPage);
    } catch (err) {
      toast.error(err, "Đánh dấu No Show thất bại");
    } finally {
      setShowNoShowModal(false);
      setSelectedAppId(null);
    }
  };

  const getStatusBadge = (appStatus) => {
    switch (appStatus) {
      case "CONFIRMED":
        return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Confirmed</span>;
      case "SCHEDULED":
        return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Scheduled</span>;
      case "CHECKED_IN":
        return <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Checked In</span>;
      case "CANCELLED":
        return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Cancelled</span>;
      case "NO_SHOW":
        return <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Vắng mặt</span>;
      case "COMPLETED":
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Completed</span>;
      case "PENDING_PAYMENT":
        return <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>Pending Payment</span>;
      default:
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: 650 }}>{appStatus}</span>;
    }
  };

  return (
    <div className="content receptionist-data-page">
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

      {/* Toolbar / Filters */}
      <div className="panel checkin-filter-panel">
        <form onSubmit={handleSearchSubmit} className="checkin-filter-bar">
          <label className="checkin-filter-field checkin-search-field">
            <span className="checkin-filter-label">Tìm bệnh nhân</span>
            <span className="checkin-filter-control">
              <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã lịch hẹn, tên hoặc số điện thoại..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            </span>
          </label>

          <label className="checkin-filter-field">
            <span className="checkin-filter-label">Ngày khám</span>
            <span className="checkin-filter-control">
              <Calendar size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            </span>
          </label>

          <label className="checkin-filter-field">
            <span className="checkin-filter-label">Trạng thái</span>
            <span className="checkin-filter-control checkin-select-control">
              <SlidersHorizontal size={18} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="CONFIRMED">Confirmed (Chờ khám)</option>
              <option value="CHECKED_IN">Checked In (Đã check-in)</option>
              <option value="COMPLETED">Completed (Hoàn thành)</option>
              <option value="CANCELLED">Cancelled (Đã hủy)</option>
              <option value="NO_SHOW">Không đến khám (No Show)</option>
            </select>
              <ChevronDown size={16} className="checkin-select-chevron" />
            </span>
          </label>

          <button type="submit" className="checkin-search-button">
            <Search size={18} />
            <span>Tìm kiếm</span>
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-wrapper receptionist-fit-table">
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
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
                          <span style={{ color: "#94a3b8", fontSize: "13px", display: !["SCHEDULED", "CONFIRMED"].includes(app.status) ? "inline-block" : "none" }}>
                            Không khả dụng
                          </span>
                        )}

                        {["SCHEDULED", "CONFIRMED"].includes(app.status) && (
                          <button
                            className="danger-button compact"
                            onClick={() => openNoShowModal(app.appointmentId)}
                            style={{
                              padding: "4px 12px",
                              borderRadius: "6px",
                              fontSize: "13px",
                              fontWeight: 600,
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fee2e2",
                              cursor: "pointer"
                            }}
                          >
                            Đánh dấu Không đến
                          </button>
                        )}
                      </div>
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
      {/* No Show Modal */}
      {showNoShowModal && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="modal-content" style={{ background: "white", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%" }}>
            <h3 style={{ margin: "0 0 16px", color: "#dc2626", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={20} />
              Xác nhận bệnh nhân không đến
            </h3>
            <p style={{ marginBottom: "16px", color: "#475569", fontSize: "14px" }}>
              Bạn có chắc chắn bệnh nhân không đến? Hành động này sẽ hủy lịch hẹn và đánh dấu bệnh nhân không đến khám (No Show).
            </p>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                Ghi chú của Lễ tân (Tùy chọn)
              </label>
              <textarea
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical", minHeight: "80px" }}
                placeholder="Ví dụ: Đã gọi điện 3 cuộc nhưng bệnh nhân không nghe máy."
                value={noShowNote}
                onChange={(e) => setNoShowNote(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setShowNoShowModal(false)}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 500 }}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmNoShow}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontWeight: 600 }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
