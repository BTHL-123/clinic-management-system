import { useState, useEffect, useCallback } from "react";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService.js";
import { useToast } from "../../context/useToast.js";

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const STATUS_BADGE = {
  PENDING:  { label: "Chờ duyệt",  color: "#f59e0b", bg: "#fef3c7" },
  APPROVED: { label: "Đã duyệt",   color: "#10b981", bg: "#d1fae5" },
  REJECTED: { label: "Bị từ chối", color: "#ef4444", bg: "#fee2e2" },
};

const TYPE_LABEL = {
  LEAVE:           "Xin nghỉ",
  CHANGE_SCHEDULE: "Thay đổi lịch",
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function fmt(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/* ─── Reject Modal ─────────────────────────────────────────────────────────── */
function RejectModal({ request, onClose, onConfirm }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!comment.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm(request.id, comment.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Từ chối thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
          Từ chối yêu cầu nghỉ
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Bác sĩ: <strong>{request.doctorName}</strong> — Ngày: <strong>{request.leaveDate}</strong>
        </p>

        <label style={labelStyle}>Lý do từ chối <span style={{ color: "#ef4444" }}>*</span></label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Nhập lý do từ chối..."
          style={{ ...inputStyle, resize: "vertical", width: "100%", boxSizing: "border-box" }}
          autoFocus
        />

        {error && (
          <div style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle} disabled={loading}>
            Hủy bỏ
          </button>
          <button onClick={handleConfirm} style={rejectBtnStyle} disabled={loading}>
            {loading ? "Đang từ chối..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function AdminDoctorLeaveRequestPage() {
  const toast = useToast();
  const [filter, setFilter] = useState("ALL");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // id of row being actioned
  const [rejectTarget, setRejectTarget] = useState(null);   // request object to reject

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await doctorLeaveRequestService.getAllLeaveRequests(
        filter === "ALL" ? undefined : filter
      );
      setRequests(res?.data ?? []);
    } catch (err) {
      setError(err.message || "Tải dữ liệu thất bại.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id) => {
    if (!window.confirm("Phê duyệt yêu cầu này?")) return;
    setActionLoading(id);
    try {
      const res = await doctorLeaveRequestService.approveLeaveRequest(id);
      const updated = res?.data;
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
      toast.success("Đã phê duyệt yêu cầu.");
    } catch (err) {
      toast.error(err, "Phê duyệt thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (id, adminComment) => {
    const res = await doctorLeaveRequestService.rejectLeaveRequest(id, adminComment);
    const updated = res?.data;
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1e293b" }}>
        🗓️ Phê duyệt yêu cầu nghỉ của bác sĩ
      </h1>

      {/* ─── Filter bar ─── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={filterBtn(filter === s)}>
            {s === "ALL" ? "Tất cả" : STATUS_BADGE[s]?.label ?? s}
          </button>
        ))}
        <button onClick={fetchRequests} style={{ ...filterBtn(false), marginLeft: "auto" }}>
          🔄 Làm mới
        </button>
      </div>

      {/* ─── Table ─── */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)", padding: 28 }}>
        {loading ? (
          <div style={centerMuted}>Đang tải...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "#ef4444", padding: 40 }}>{error}</div>
        ) : requests.length === 0 ? (
          <div style={centerMuted}>Không có yêu cầu nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Bác sĩ", "Mã BS", "Loại", "Ngày nghỉ", "Bắt đầu", "Kết thúc", "Lý do", "Trạng thái", "Ghi chú admin", "Người duyệt", "Gửi lúc", "Hành động"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.doctorName}</td>
                    <td style={{ ...tdStyle, color: "#64748b" }}>{r.doctorCode}</td>
                    <td style={tdStyle}>{TYPE_LABEL[r.requestType] ?? r.requestType}</td>
                    <td style={tdStyle}>{r.leaveDate}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{r.startTime?.slice(0, 5)}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{r.endTime?.slice(0, 5)}</td>
                    <td style={{ ...tdStyle, maxWidth: 180 }}>{r.reason}</td>
                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                    <td style={{ ...tdStyle, color: "#64748b", fontStyle: r.adminComment ? "normal" : "italic", maxWidth: 180 }}>
                      {r.adminComment || "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b", fontStyle: r.approvedByName ? "normal" : "italic" }}>
                      {r.approvedByName || "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmt(r.createdAt)}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {r.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoading === r.id}
                            style={approveBtnStyle}
                          >
                            {actionLoading === r.id ? "..." : "✓ Duyệt"}
                          </button>
                          <button
                            onClick={() => setRejectTarget(r)}
                            disabled={actionLoading === r.id}
                            style={rejectBtnSmallStyle}
                          >
                            ✕ Từ chối
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Reject Modal ─── */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const filterBtn = (active) => ({
  padding: "7px 18px", borderRadius: 8, border: "1.5px solid",
  borderColor: active ? "#2563eb" : "#e2e8f0",
  background: active ? "#2563eb" : "#fff",
  color: active ? "#fff" : "#475569",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
});

const centerMuted = { textAlign: "center", color: "#94a3b8", padding: 40 };

const thStyle = {
  padding: "10px 14px", textAlign: "left", fontWeight: 600,
  color: "#475569", fontSize: 12, textTransform: "uppercase",
  letterSpacing: "0.05em", whiteSpace: "nowrap",
};

const tdStyle = { padding: "11px 14px", color: "#1e293b", verticalAlign: "middle" };

const approveBtnStyle = {
  padding: "5px 12px", background: "#d1fae5", color: "#065f46",
  border: "1.5px solid #6ee7b7", borderRadius: 6, fontSize: 12,
  fontWeight: 600, cursor: "pointer",
};

const rejectBtnSmallStyle = {
  padding: "5px 12px", background: "#fee2e2", color: "#dc2626",
  border: "1.5px solid #fca5a5", borderRadius: 6, fontSize: 12,
  fontWeight: 600, cursor: "pointer",
};

// Modal
const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};

const modalStyle = {
  background: "#fff", borderRadius: 14, padding: 28, width: 460, maxWidth: "95vw",
  boxShadow: "0 8px 40px rgba(0,0,0,.18)",
};

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 500,
  color: "#475569", marginBottom: 6,
};

const inputStyle = {
  padding: "9px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none",
};

const cancelBtnStyle = {
  padding: "9px 20px", background: "#f1f5f9", color: "#475569",
  border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: "pointer",
};

const rejectBtnStyle = {
  padding: "9px 20px", background: "#dc2626", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13,
  fontWeight: 600, cursor: "pointer",
};
