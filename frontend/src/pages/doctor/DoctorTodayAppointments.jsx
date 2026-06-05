import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  Play,
  SkipForward,
  Check,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Activity
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import queueService from "../../services/queueService";
import { getMyDoctorProfile } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";

export default function DoctorTodayAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "all"

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Doctor Profile if not fetched yet
      let currentDoctor = doctor;
      if (!currentDoctor) {
        const docRes = await getMyDoctorProfile();
        currentDoctor = docRes?.data || docRes;
        setDoctor(currentDoctor);
      }

      if (currentDoctor && currentDoctor.doctorId) {
        // 2. Fetch today's appointments for this doctor
        const appRes = await appointmentService.getDoctorTodayAppointments();
        const appList = appRes?.data || [];
        setAppointments(appList);

        // 3. Fetch today's queue tickets for this doctor
        const todayStr = new Date().toISOString().split("T")[0];
        const queueRes = await queueService.getQueue({
          date: todayStr,
          doctorId: currentDoctor.doctorId
        });
        const queueList = queueRes?.data || [];
        setQueueTickets(queueList);
      }
    } catch (err) {
      console.error(err);
      toast.error(err, "Không thể tải dữ liệu hôm nay");
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Queue actions
  const handleCall = async (id) => {
    try {
      await queueService.callPatient(id);
      toast.success("Đã gọi khám bệnh nhân!");
      fetchData();
    } catch (err) {
      toast.error(err, "Gọi khám thất bại");
    }
  };

  const handleSkip = async (id) => {
    try {
      await queueService.skipPatient(id);
      toast.success("Đã bỏ qua lượt bệnh nhân.");
      fetchData();
    } catch (err) {
      toast.error(err, "Không thể bỏ qua");
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      toast.success("Đã hoàn tất ca khám!");
      fetchData();
    } catch (err) {
      toast.error(err, "Không thể hoàn tất ca khám");
    }
  };

  // Compute stats
  const stats = {
    total: appointments.length,
    waiting: queueTickets.filter(t => t.queueStatus === "WAITING").length,
    called: queueTickets.filter(t => t.queueStatus === "CALLED").length,
    completed: queueTickets.filter(t => t.queueStatus === "COMPLETED" || t.queueStatus === "DONE").length,
    notCheckedIn: appointments.filter(a => a.status === "CONFIRMED" && !a.checkedInAt).length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "WAITING":
        return <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Đang chờ</span>;
      case "CALLED":
        return <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Đang khám</span>;
      case "SKIPPED":
        return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Bỏ qua</span>;
      case "COMPLETED":
      case "DONE":
        return <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>Hoàn tất</span>;
      default:
        return <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={24} style={{ color: "#0f766e" }} />
          Lịch khám hôm nay
          {doctor && (
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b", marginLeft: "8px" }}>
              (Bác sĩ: {doctor.fullName || doctor.user?.fullName})
            </span>
          )}
        </h1>
        <button
          className="ghost-button"
          onClick={fetchData}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Chưa check-in", count: stats.notCheckedIn, color: "#64748b", bg: "#f8fafc", icon: Clock },
          { label: "Đang chờ khám", count: stats.waiting, color: "#0284c7", bg: "#f0f9ff", icon: Users },
          { label: "Đang khám", count: stats.called, color: "#d97706", bg: "#fffbeb", icon: Activity },
          { label: "Hoàn tất khám", count: stats.completed, color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Tổng lịch hẹn", count: stats.total, color: "#0f766e", bg: "#f0fdfa", icon: Calendar }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="panel"
              style={{
                background: stat.bg,
                borderColor: `${stat.color}15`,
                display: "flex",
                justifyContent: "space-between",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>{stat.label}</span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: stat.color, marginTop: "4px" }}>{stat.count}</span>
              </div>
              <div style={{ color: stat.color, opacity: 0.6, display: "flex", alignItems: "center" }}>
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("queue")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px",
            background: activeTab === "queue" ? "#0f766e" : "#f1f5f9",
            color: activeTab === "queue" ? "#white" : "#475569",
            transition: "all 0.2s"
          }}
        >
          Hàng đợi khám ({queueTickets.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px",
            background: activeTab === "all" ? "#0f766e" : "#f1f5f9",
            color: activeTab === "all" ? "#white" : "#475569",
            transition: "all 0.2s"
          }}
        >
          Tất cả lịch hẹn hôm nay ({appointments.length})
        </button>
      </div>

      {/* Main content table */}
      <div className="table-wrapper">
        <table className="data-table">
          {activeTab === "queue" ? (
            <>
              <thead>
                <tr>
                  <th style={{ width: "80px", textAlign: "center" }}>STT</th>
                  <th>Mã Lịch Hẹn</th>
                  <th>Bệnh Nhân</th>
                  <th>Số Điện Thoại</th>
                  <th style={{ textAlign: "center" }}>Giờ Hẹn</th>
                  <th>Check-in</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: "center", width: "240px" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : queueTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      Không có bệnh nhân nào trong hàng đợi khám lúc này.
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
                                title="Gọi bệnh nhân vào khám"
                                onClick={() => handleCall(ticket.queueTicketId)}
                                style={{
                                  background: ticket.queueStatus === "CALLED"
                                    ? "linear-gradient(135deg, #475569, #64748b)"
                                    : "linear-gradient(135deg, #0284c7, #06b6d4)",
                                  boxShadow: "0 2px 4px rgba(2,132,199,0.15)",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <Play size={14} />
                                {ticket.queueStatus === "CALLED" ? "Gọi lại" : "Gọi vào"}
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
                                title="Hoàn tất ca khám"
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
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Mã Lịch Hẹn</th>
                  <th>Bệnh Nhân</th>
                  <th>Số Điện Thoại</th>
                  <th style={{ textAlign: "center" }}>Giờ Hẹn</th>
                  <th>Trạng Thái</th>
                  <th>Check-in</th>
                  <th style={{ textAlign: "center" }}>Số Thứ Tự</th>
                  <th>Hàng Đợi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      Không có lịch hẹn nào được đăng ký cho hôm nay.
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.appointmentId}>
                      <td style={{ fontWeight: 650, color: "#0f766e" }}>{app.appointmentCode}</td>
                      <td style={{ fontWeight: 600 }}>{app.patientName}</td>
                      <td>{app.patientPhone || "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 500 }}>
                        {app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          app.status === "CONFIRMED" ? "badge-active" : 
                          app.status === "COMPLETED" ? "badge-completed" : "badge-inactive"
                        }`}>
                          {app.status === "CONFIRMED" ? "Đã xác nhận" : 
                           app.status === "COMPLETED" ? "Đã khám" : 
                           app.status === "CANCELLED" ? "Đã hủy" : app.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px", color: "#64748b" }}>
                        {app.checkedInAt ? new Date(app.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Chưa Check-in"}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#0f766e" }}>
                        {app.queueNumber ? `#${app.queueNumber}` : "—"}
                      </td>
                      <td>
                        {app.queueStatus ? getStatusBadge(app.queueStatus) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
}
