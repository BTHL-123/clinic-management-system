import { useState, useEffect, useCallback } from "react";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService.js";
import { useToast } from "../../context/useToast.js";

const STATUS_BADGE = {
  PENDING:  { label: "Chờ duyệt",   color: "#f59e0b", bg: "#fef3c7" },
  APPROVED: { label: "Đã duyệt",    color: "#10b981", bg: "#d1fae5" },
  REJECTED: { label: "Bị từ chối",  color: "#ef4444", bg: "#fee2e2" },
};

const TYPE_LABEL = {
  LEAVE:           "Xin nghỉ",
  CHANGE_SCHEDULE: "Thay đổi lịch",
};

// Status display helpers for the conflicting-appointment table
const CONFLICT_STATUS_LABEL = {
  SCHEDULED:  "Chờ khám",
  CONFIRMED:  "Đã xác nhận",
  CHECKED_IN: "Đã check-in",
};
const CONFLICT_STATUS_BG = {
  SCHEDULED:  "#fef3c7",
  CONFIRMED:  "#dbeafe",
  CHECKED_IN: "#dcfce7",
};
const CONFLICT_STATUS_COLOR = {
  SCHEDULED:  "#92400e",
  CONFIRMED:  "#1d4ed8",
  CHECKED_IN: "#15803d",
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

export default function DoctorLeaveRequestPage() {
  const toast = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    requestType: "LEAVE",
    leaveDate: today,
    startTime: "08:00",
    endTime: "17:00",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [conflictingAppointments, setConflictingAppointments] = useState([]);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorLeaveRequestService.getMyLeaveRequests();
      setRequests(res?.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "leaveDate" || e.target.name === "startTime" || e.target.name === "endTime") {
      setConflictingAppointments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (form.startTime >= form.endTime) {
      setFormError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
      return;
    }
    if (!form.reason.trim()) {
      setFormError("Lý do không được để trống.");
      return;
    }

    setSubmitting(true);
    try {
      await doctorLeaveRequestService.createLeaveRequest({
        requestType: form.requestType,
        leaveDate: form.leaveDate,
        startTime: form.startTime + ":00",
        endTime: form.endTime + ":00",
        reason: form.reason.trim(),
      });
      setFormSuccess("Gửi yêu cầu thành công!");
      setForm({ requestType: "LEAVE", leaveDate: today, startTime: "08:00", endTime: "17:00", reason: "" });
      setConflictingAppointments([]);
      fetchMyRequests();
    } catch (err) {
      const msg = err.message || "Gửi yêu cầu thất bại.";
      setFormError(msg);
      // If the backend returned structured conflict data, display the table
      if (err.conflictingAppointments && err.conflictingAppointments.length > 0) {
        setConflictingAppointments(err.conflictingAppointments);
      } else {
        setConflictingAppointments([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu này không?")) return;
    setCancellingId(id);
    try {
      await doctorLeaveRequestService.cancelLeaveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success("Đã hủy yêu cầu.");
    } catch (err) {
      toast.error(err, "Hủy yêu cầu thất bại");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: "#1e293b" }}>
        📋 Yêu cầu nghỉ / Thay đổi lịch
      </h1>

      {/* ─── Form ─── */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        padding: 28,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#334155" }}>
          Gửi yêu cầu mới
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Loại yêu cầu</label>
              <select name="requestType" value={form.requestType} onChange={handleChange} style={inputStyle}>
                <option value="LEAVE">Xin nghỉ</option>
                <option value="CHANGE_SCHEDULE">Thay đổi lịch</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Ngày</label>
              <input
                type="date"
                name="leaveDate"
                min={today}
                value={form.leaveDate}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Giờ bắt đầu</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Giờ kết thúc</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required style={inputStyle} />
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Lý do</label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                required
                placeholder="Nhập lý do xin nghỉ hoặc thay đổi lịch..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          {formError && (
            <div style={{ marginTop: 12, padding: "8px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: 8, fontSize: 13 }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div style={{ marginTop: 12, padding: "8px 14px", background: "#d1fae5", color: "#065f46", borderRadius: 8, fontSize: 13 }}>
              {formSuccess}
            </div>
          )}

          {conflictingAppointments.length > 0 && (
            <div style={{ marginTop: 16, padding: "16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 12 }}>
                Danh sách lịch hẹn bị trùng
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#fee2e2" }}>
                      {["Mã lịch hẹn", "Bệnh nhân", "Số điện thoại", "Ngày khám", "Giờ khám", "Trạng thái"].map((h) => (
                        <th key={h} style={conflictThStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {conflictingAppointments.map((appt) => (
                      <tr key={appt.appointmentId} style={{ borderBottom: "1px solid #fecaca" }}>
                        <td style={conflictTdStyle}>
                          <code style={{ fontFamily: "monospace", fontWeight: 600 }}>{appt.appointmentCode}</code>
                        </td>
                        <td style={conflictTdStyle}>{appt.patientName}</td>
                        <td style={conflictTdStyle}>{appt.patientPhone || "—"}</td>
                        <td style={conflictTdStyle}>{appt.appointmentDate}</td>
                        <td style={{ ...conflictTdStyle, whiteSpace: "nowrap" }}>
                          {appt.startTime?.slice(0, 5)}
                        </td>
                        <td style={conflictTdStyle}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: CONFLICT_STATUS_BG[appt.status] || "#f3f4f6",
                            color: CONFLICT_STATUS_COLOR[appt.status] || "#374151",
                          }}>
                            {CONFLICT_STATUS_LABEL[appt.status] || appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 20,
              padding: "10px 28px",
              background: submitting ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background .2s",
            }}
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </form>
      </div>

      {/* ─── Table ─── */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        padding: 28,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#334155" }}>
          Danh sách yêu cầu của tôi
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Đang tải...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Chưa có yêu cầu nào.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Loại", "Ngày", "Giờ", "Lý do", "Trạng thái", "Ghi chú admin", "Hành động"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{TYPE_LABEL[r.requestType] ?? r.requestType}</td>
                    <td style={tdStyle}>{r.leaveDate}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{r.startTime?.slice(0, 5)} – {r.endTime?.slice(0, 5)}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>{r.reason}</td>
                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                    <td style={{ ...tdStyle, color: "#64748b", fontStyle: r.adminComment ? "normal" : "italic" }}>
                      {r.adminComment || "—"}
                    </td>
                    <td style={tdStyle}>
                      {r.status === "PENDING" ? (
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          style={{
                            padding: "5px 14px",
                            background: cancellingId === r.id ? "#fca5a5" : "#fee2e2",
                            color: "#dc2626",
                            border: "1.5px solid #fca5a5",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: cancellingId === r.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {cancellingId === r.id ? "Đang hủy..." : "Hủy"}
                        </button>
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
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#475569",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  color: "#1e293b",
  background: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  color: "#475569",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "11px 14px",
  color: "#1e293b",
  verticalAlign: "middle",
};

const conflictThStyle = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#991b1b",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
};

const conflictTdStyle = {
  padding: "9px 12px",
  color: "#1e293b",
  verticalAlign: "middle",
  borderTop: "1px solid #fecaca",
};
