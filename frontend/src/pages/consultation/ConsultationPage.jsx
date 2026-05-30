import { useEffect, useState, useCallback } from "react";
import { Stethoscope, RefreshCw, Play, PhoneCall, SkipForward, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { getMyDoctorProfile } from "../../services/doctorService";
import queueTicketService from "../../services/queueTicketService";
import { useNavigate } from "react-router-dom";

const STATUS_LABEL = {
  WAITING: { label: "Chờ khám", color: "#d97706", bg: "#fef3c7" },
  CALLED: { label: "Đã gọi", color: "#2563eb", bg: "#dbeafe" },
  IN_EXAMINATION: { label: "Đang khám", color: "#7c3aed", bg: "#ede9fe" },
  WAITING_LAB: { label: "Chờ XN", color: "#0891b2", bg: "#cffafe" },
  DONE: { label: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  SKIPPED: { label: "Bỏ qua", color: "#6b7280", bg: "#f3f4f6" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const PRIORITY_LABEL = {
  NORMAL: { label: "Thường", color: "#6b7280" },
  PRIORITY: { label: "Ưu tiên", color: "#d97706" },
  EMERGENCY: { label: "Cấp cứu", color: "#dc2626" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default function ConsultationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // queueTicketId đang xử lý
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Load doctor profile
  useEffect(() => {
    getMyDoctorProfile()
      .then((res) => setDoctor(res.data))
      .catch(() => setError("Không thể tải thông tin bác sĩ. Vui lòng đăng nhập lại."));
  }, []);

  // Load queue
  const fetchQueue = useCallback(async () => {
    if (!doctor?.doctorId) return;
    setLoading(true);
    try {
      const res = await queueTicketService.getQueue(
        doctor.doctorId,
        selectedDate,
        filterStatus || undefined
      );
      setQueue(res.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải hàng đợi.");
    } finally {
      setLoading(false);
    }
  }, [doctor?.doctorId, selectedDate, filterStatus]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (ticketId, action, label) => {
    setActionLoading(ticketId);
    try {
      if (action === "call") {
        await queueTicketService.call(ticketId);
        showToast("Đã gọi bệnh nhân vào phòng khám.");
      } else if (action === "start") {
        const res = await queueTicketService.startExamination(ticketId);
        showToast("Bắt đầu khám thành công!");
        // Điều hướng sang trang khám bệnh với consultationId
        if (res.data?.consultationId) {
          navigate(`/dashboard/examination/${res.data.consultationId}`);
          return;
        }
      } else if (action === "done") {
        await queueTicketService.markDone(ticketId);
        showToast("Đã hoàn thành ca khám.");
      } else if (action === "skip") {
        await queueTicketService.skip(ticketId, "Bệnh nhân không có mặt");
        showToast("Đã bỏ qua số thứ tự này.");
      }
      await fetchQueue();
    } catch (err) {
      showToast(err.message || `Không thể thực hiện: ${label}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const waitingCount = queue.filter((q) => q.status === "WAITING" || q.status === "CALLED").length;
  const inExamCount = queue.filter((q) => q.status === "IN_EXAMINATION").length;
  const doneCount = queue.filter((q) => q.status === "DONE").length;

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Stethoscope size={22} />
        <h2 style={{ margin: 0, fontSize: 20 }}>Phòng khám — Hàng đợi bệnh nhân</h2>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          color: toast.type === "error" ? "#991b1b" : "#166534",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          padding: "10px 14px", borderRadius: 8, fontSize: 14,
          fontWeight: 500, marginBottom: 16,
        }}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Đang chờ / Đã gọi", value: waitingCount, color: "#d97706", bg: "#fef3c7" },
          { label: "Đang khám", value: inExamCount, color: "#7c3aed", bg: "#ede9fe" },
          { label: "Hoàn thành hôm nay", value: doneCount, color: "#16a34a", bg: "#dcfce7" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: "#374151" }}>{s.label}</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="WAITING">Chờ khám</option>
          <option value="CALLED">Đã gọi</option>
          <option value="IN_EXAMINATION">Đang khám</option>
          <option value="DONE">Hoàn thành</option>
          <option value="SKIPPED">Bỏ qua</option>
        </select>
        <button
          className="secondary-button"
          onClick={fetchQueue}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Queue Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: "center" }}>STT</th>
              <th>Bệnh nhân</th>
              <th style={{ width: 100 }}>Ưu tiên</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 90, textAlign: "center" }}>Chờ (phút)</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-row">Đang tải hàng đợi...</td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">Không có bệnh nhân trong hàng đợi.</td>
              </tr>
            ) : (
              queue.map((ticket) => {
                const isActing = actionLoading === ticket.queueTicketId;
                const priority = PRIORITY_LABEL[ticket.priorityLevel] || PRIORITY_LABEL.NORMAL;
                return (
                  <tr key={ticket.queueTicketId} style={{
                    background: ticket.queueStatus === "IN_EXAMINATION" ? "#faf5ff" : undefined,
                  }}>
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#1d4ed8" }}>
                      {ticket.queueNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ticket.patientName || `Bệnh nhân #${ticket.patientId}`}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>ID: {ticket.patientId}</div>
                    </td>
                    <td>
                      <span style={{ color: priority.color, fontWeight: 600, fontSize: 13 }}>
                        {priority.label}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={ticket.queueStatus} />
                    </td>
                    <td style={{ textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                      {ticket.estimatedWaitMinutes ?? "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        {/* Gọi bệnh nhân */}
                        {ticket.queueStatus === "WAITING" && (
                          <ActionBtn
                            icon={<PhoneCall size={13} />}
                            label="Gọi vào"
                            color="#2563eb"
                            loading={isActing}
                            onClick={() => handleAction(ticket.queueTicketId, "call", "Gọi bệnh nhân")}
                          />
                        )}
                        {/* Bắt đầu khám */}
                        {(ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED") && (
                          <ActionBtn
                            icon={<Play size={13} />}
                            label="Bắt đầu khám"
                            color="#7c3aed"
                            loading={isActing}
                            onClick={() => handleAction(ticket.queueTicketId, "start", "Bắt đầu khám")}
                          />
                        )}
                        {/* Tiếp tục khám (đã có consultation) */}
                        {ticket.queueStatus === "IN_EXAMINATION" && ticket.consultationId && (
                          <ActionBtn
                            icon={<Stethoscope size={13} />}
                            label="Vào phòng khám"
                            color="#7c3aed"
                            loading={isActing}
                            onClick={() => navigate(`/dashboard/examination/${ticket.consultationId}`)}
                          />
                        )}
                        {/* Hoàn thành */}
                        {ticket.queueStatus === "IN_EXAMINATION" && (
                          <ActionBtn
                            icon={<CheckCircle size={13} />}
                            label="Hoàn thành"
                            color="#16a34a"
                            loading={isActing}
                            onClick={() => handleAction(ticket.queueTicketId, "done", "Hoàn thành")}
                          />
                        )}
                        {/* Bỏ qua */}
                        {(ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED") && (
                          <ActionBtn
                            icon={<SkipForward size={13} />}
                            label="Bỏ qua"
                            color="#6b7280"
                            loading={isActing}
                            onClick={() => handleAction(ticket.queueTicketId, "skip", "Bỏ qua")}
                          />
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

function ActionBtn({ icon, label, color, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 6, border: "none",
        background: color + "18", color, cursor: loading ? "not-allowed" : "pointer",
        fontSize: 12, fontWeight: 600, opacity: loading ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {icon} {label}
    </button>
  );
}
