import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Calendar,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Play,
  SkipForward,
  Check,
  UserX,
} from "lucide-react";
import queueService from "../../services/queueService";
import { getDoctors } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";

export default function QueueManagementPage() {
  const toast = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const [date, setDate] = useState(todayStr);
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");

  // Data lists
  const [queueTickets, setQueueTickets] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch doctors for filter dropdown
  useEffect(() => {
    const fetchDoctorsData = async () => {
      try {
        const res = await getDoctors({ page: 0, size: 100 });
        const list = res?.data?.content || res?.data || [];
        setDoctors(list);
      } catch (err) {
        console.error("Lỗi lấy danh sách bác sĩ", err);
      }
    };
    fetchDoctorsData();
  }, []);

  // Fetch queue tickets
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (date) filters.date = date;
      if (doctorId) filters.doctorId = doctorId;
      if (status) filters.status = status;

      const response = await queueService.getQueue(filters);
      const list = response?.data || [];
      setQueueTickets(list);
    } catch (err) {
      toast.error(err, "Không thể tải danh sách hàng đợi");
    } finally {
      setLoading(false);
    }
  }, [date, doctorId, status]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Actions
  const handleCall = async (id) => {
    try {
      await queueService.callPatient(id);
      toast.success("Đã gọi khám bệnh nhân thành công!");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Gọi khám thất bại");
    }
  };

  const handleSkip = async (id) => {
    try {
      await queueService.skipPatient(id);
      toast.success("Đã bỏ qua bệnh nhân.");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Không thể bỏ qua");
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      toast.success("Đã hoàn tất ca khám.");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Không thể hoàn tất");
    }
  };

  const getStatusBadge = (ticketStatus) => {
    switch (ticketStatus) {
      case "WAITING":
        return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Đang chờ</span>;
      case "CALLED":
        return <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Đang khám</span>;
      case "SKIPPED":
        return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Bỏ qua</span>;
      case "COMPLETED":
        return <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Hoàn tất</span>;
      default:
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>{ticketStatus}</span>;
    }
  };

  // Quick stats computed
  const stats = {
    waiting: queueTickets.filter(t => t.queueStatus === "WAITING").length,
    called: queueTickets.filter(t => t.queueStatus === "CALLED").length,
    skipped: queueTickets.filter(t => t.queueStatus === "SKIPPED").length,
    completed: queueTickets.filter(t => t.queueStatus === "COMPLETED").length,
    total: queueTickets.length
  };

  return (
    <div className="content">
      <div className="relative flex flex-col items-start mb-6">
        <div className="flex flex-col items-start">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><Users size={26} /></span>
            <span className="text-white text-2xl font-bold tracking-wide">Quản lý hàng đợi</span>
          </h1>
        </div>
        <button
          className="ghost-button absolute right-0 top-1/2 -translate-y-1/2"
          onClick={fetchQueue}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          Làm mới
        </button>
      </div>

      {/* Grid of stats overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Đang chờ", count: stats.waiting, color: "#0284c7", bg: "#f0f9ff" },
          { label: "Đang khám (Đã gọi)", count: stats.called, color: "#d97706", bg: "#fffbeb" },
          { label: "Bỏ qua", count: stats.skipped, color: "#dc2626", bg: "#fef2f2" },
          { label: "Hoàn tất", count: stats.completed, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Tổng số hàng đợi", count: stats.total, color: "#0f766e", bg: "#f0fdfa" }
        ].map((stat, i) => (
          <div
            key={i}
            className="panel"
            style={{
              background: stat.bg,
              borderColor: `${stat.color}15`,
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>{stat.label}</span>
            <span style={{ fontSize: "28px", fontWeight: 800, color: stat.color, marginTop: "4px" }}>{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="panel" style={{ marginBottom: "20px" }}>
        <div className="toolbar" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} style={{ color: "#64748b" }} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map(d => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.user?.fullName || d.fullName} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Tất cả trạng thái hàng đợi</option>
              <option value="WAITING">Đang chờ (Waiting)</option>
              <option value="CALLED">Đang khám (Called)</option>
              <option value="SKIPPED">Bỏ qua (Skipped)</option>
              <option value="COMPLETED">Hoàn tất (Completed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table container */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "80px", textAlign: "center" }}>STT</th>
              <th>Mã Lịch Hẹn</th>
              <th>Bệnh Nhân</th>
              <th>Số Điện Thoại</th>
              <th>Bác Sĩ</th>
              <th style={{ textAlign: "center" }}>Giờ Hẹn</th>
              <th>Check-in</th>
              <th>Trạng Thái</th>
              <th style={{ textAlign: "center", width: "240px" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Đang tải dữ liệu hàng đợi...
                </td>
              </tr>
            ) : queueTickets.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  Không có bệnh nhân nào trong hàng đợi hôm nay.
                </td>
              </tr>
            ) : (
              queueTickets.map((ticket) => {
                const canCall = ticket.queueStatus === "WAITING" || ticket.queueStatus === "SKIPPED" || ticket.queueStatus === "CALLED";
                const canSkip = ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED";
                const canComplete = ticket.queueStatus === "CALLED" || ticket.queueStatus === "WAITING";

                return (
                  <tr key={ticket.queueTicketId}>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          background: ticket.queueStatus === "CALLED"
                            ? "linear-gradient(135deg, #d97706, #f59e0b)"
                            : ticket.queueStatus === "COMPLETED"
                            ? "linear-gradient(135deg, #16a34a, #22c55e)"
                            : "linear-gradient(135deg, #0f766e, #0d9488)",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontWeight: 800,
                          fontSize: "14px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                          display: "inline-block"
                        }}
                      >
                        #{ticket.queueNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 650, color: "#0f766e" }}>{ticket.appointmentCode}</td>
                    <td style={{ fontWeight: 600 }}>{ticket.patientName}</td>
                    <td>{ticket.patientPhone || "—"}</td>
                    <td>{ticket.doctorName}</td>
                    <td style={{ textAlign: "center", fontWeight: 500 }}>
                      {ticket.startTime?.slice(0, 5)} - {ticket.endTime?.slice(0, 5)}
                    </td>
                    <td style={{ fontSize: "13px", color: "#64748b" }}>
                      {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td>{getStatusBadge(ticket.queueStatus)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        {canCall && (
                          <button
                            className="primary-button compact"
                            title="Gọi khám bệnh nhân"
                            onClick={() => handleCall(ticket.queueTicketId)}
                            style={{
                              background: ticket.queueStatus === "CALLED"
                                ? "linear-gradient(135deg, #475569, #64748b)" // Recalling
                                : "linear-gradient(135deg, #0284c7, #06b6d4)",
                              boxShadow: "0 2px 4px rgba(2,132,199,0.15)",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Play size={14} />
                            {ticket.queueStatus === "CALLED" ? "Gọi lại" : "Gọi khám"}
                          </button>
                        )}
                        {canSkip && (
                          <button
                            className="ghost-button compact"
                            title="Bỏ qua lượt bệnh nhân"
                            onClick={() => handleSkip(ticket.queueTicketId)}
                            style={{
                              borderColor: "#fca5a5",
                              color: "#dc2626",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <SkipForward size={14} />
                            Bỏ qua
                          </button>
                        )}
                        {canComplete && (
                          <button
                            className="primary-button compact"
                            title="Hoàn tất lượt khám"
                            onClick={() => handleComplete(ticket.queueTicketId)}
                            style={{
                              background: "linear-gradient(135deg, #16a34a, #22c55e)",
                              boxShadow: "0 2px 4px rgba(22,163,74,0.15)",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Check size={14} />
                            Hoàn tất
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
    </div>
  );
}
