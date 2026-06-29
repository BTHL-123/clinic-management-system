import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Calendar,
  RefreshCw,
  Play,
  SkipForward,
  Check,
  Stethoscope,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import queueService from "../../services/queueService";
import { getDoctors } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

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

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
      : "http://localhost:8080/ws-queue";

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP for queue management updates");
        client.subscribe("/topic/queue", (message) => {
          if (message.body === "QUEUE_UPDATED") {
            fetchQueue();
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
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
        return <span className="queue-status queue-status-waiting">Đang chờ</span>;
      case "CALLED":
        return <span className="queue-status queue-status-called">Đang khám</span>;
      case "SKIPPED":
        return <span className="queue-status queue-status-skipped">Bỏ qua</span>;
      case "COMPLETED":
        return <span className="queue-status queue-status-completed">Hoàn tất</span>;
      default:
        return <span className="queue-status">{ticketStatus}</span>;
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
    <div className="content receptionist-data-page">
      <PageHeader
        title="Quản lý hàng đợi"
        icon={Users}
        iconColor="text-white"
        rightContent={
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-teal-600 font-semibold bg-teal-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-teal-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Sync
            </span>
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] shadow-md shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        }
      />

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
      <div className="panel checkin-filter-panel queue-filter-panel">
        <div className="queue-filter-bar">
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
            <span className="checkin-filter-label">Bác sĩ phụ trách</span>
            <span className="checkin-filter-control checkin-select-control">
              <Stethoscope size={18} />
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Tất cả bác sĩ</option>
                {doctors.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.user?.fullName || d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="checkin-select-chevron" />
            </span>
          </label>

          <label className="checkin-filter-field">
            <span className="checkin-filter-label">Trạng thái hàng đợi</span>
            <span className="checkin-filter-control checkin-select-control">
              <SlidersHorizontal size={18} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Tất cả trạng thái</option>
                <option value="WAITING">Đang chờ</option>
                <option value="CALLED">Đang khám</option>
                <option value="SKIPPED">Bỏ qua</option>
                <option value="COMPLETED">Hoàn tất</option>
              </select>
              <ChevronDown size={16} className="checkin-select-chevron" />
            </span>
          </label>
        </div>
      </div>

      {/* Table container */}
      <div className="table-wrapper receptionist-fit-table queue-table-wrapper">
        <table className="data-table fixed-table queue-table w-full min-w-[1100px]">
          <thead>
            <tr>
              <th style={{ width: "5%", textAlign: "center" }}>STT</th>
              <th style={{ width: "11%", textAlign: "left" }}>Mã Lịch Hẹn</th>
              <th style={{ width: "13%", textAlign: "left" }}>Bệnh Nhân</th>
              <th style={{ width: "11%", textAlign: "left" }}>Số Điện Thoại</th>
              <th style={{ width: "12%", textAlign: "left" }}>Bác Sĩ</th>
              <th style={{ width: "8%", textAlign: "center" }}>Giờ Hẹn</th>
              <th style={{ width: "9%", textAlign: "left" }}>Check-in</th>
              <th style={{ width: "9%", textAlign: "left" }}>Trạng Thái</th>
              <th style={{ width: "22%", textAlign: "center" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="queue-table-message">
                  Đang tải dữ liệu hàng đợi...
                </td>
              </tr>
            ) : queueTickets.length === 0 ? (
              <tr>
                <td colSpan="9" className="queue-table-message">
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
                    <td className="queue-appointment-code" style={{ textAlign: "left" }}>{ticket.appointmentCode}</td>
                    <td className="queue-patient-name" style={{ textAlign: "left" }}>{ticket.patientName}</td>
                    <td style={{ textAlign: "left" }}>{ticket.patientPhone || "—"}</td>
                    <td style={{ textAlign: "left" }}>{ticket.doctorName}</td>
                    <td style={{ textAlign: "center", fontWeight: 500 }}>
                      {ticket.startTime?.slice(0, 5)} - {ticket.endTime?.slice(0, 5)}
                    </td>
                    <td className="queue-checkin-time" style={{ textAlign: "left" }}>
                      {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td style={{ textAlign: "left" }}>{getStatusBadge(ticket.queueStatus)}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
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
                              color: "white",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              minHeight: "32px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer"
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
                              background: "#ffffff",
                              fontWeight: 650,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              minHeight: "32px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              cursor: "pointer"
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
                              color: "white",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              minHeight: "32px",
                              fontSize: "12px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer"
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
