import { useState, useCallback, useEffect } from "react";
import { CalendarDays, Pencil, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import {
  createSchedule,
  getSchedules,
  updateSchedule,
  cancelSchedule,
  getSlotsByScheduleId,
} from "../../services/scheduleService";

const PANEL = { CREATE: "create", UPDATE: "update", CANCEL: "cancel" };
const INIT_FORM = { doctorId: "", workDate: "", startTime: "", endTime: "" };

function toPayload(form) {
  return {
    doctorId: parseInt(form.doctorId, 10),
    workDate: form.workDate,
    startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
    endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
  };
}

function Toast({ message, type }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div style={{
      padding: "11px 15px",
      borderRadius: "8px",
      marginBottom: "14px",
      fontSize: "13.5px",
      fontWeight: 500,
      background: isError ? "#fff0f0" : "#f0fdf4",
      border: `1px solid ${isError ? "#fca5a5" : "#86efac"}`,
      color: isError ? "#b91c1c" : "#15803d",
    }}>
      {message}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "9px 18px", borderRadius: "8px", border: "none",
        cursor: "pointer", fontWeight: 600, fontSize: "13.5px",
        transition: "all 0.18s",
        background: active ? "#2563eb" : "#f1f5f9",
        color: active ? "#fff" : "#475569",
        boxShadow: active ? "0 2px 8px rgba(37,99,235,0.22)" : "none",
      }}
    >
      {icon}{label}
    </button>
  );
}

function FormFields({ form, onChange }) {
  return (
    <>
      <div className="field">
        <label htmlFor="f-doctorId">ID Bác sĩ *</label>
        <input type="number" id="f-doctorId" name="doctorId"
          value={form.doctorId} onChange={onChange}
          placeholder="Nhập ID bác sĩ" min="1" />
      </div>
      <div className="field">
        <label htmlFor="f-workDate">Ngày làm việc *</label>
        <input type="date" id="f-workDate" name="workDate"
          value={form.workDate} onChange={onChange} />
      </div>
      <div className="field">
        <label htmlFor="f-startTime">Giờ bắt đầu *</label>
        <input type="time" id="f-startTime" name="startTime"
          value={form.startTime} onChange={onChange} />
      </div>
      <div className="field">
        <label htmlFor="f-endTime">Giờ kết thúc *</label>
        <input type="time" id="f-endTime" name="endTime"
          value={form.endTime} onChange={onChange} />
      </div>
    </>
  );
}

function CreatePanel({ onDone }) {
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!form.doctorId || !form.workDate || !form.startTime || !form.endTime) {
      setErr("Vui lòng điền đầy đủ tất cả các trường."); return;
    }
    setBusy(true);
    try {
      await createSchedule(toPayload(form));
      setMsg("Tạo lịch làm việc thành công!");
      setForm(INIT_FORM);
      onDone();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <FormFields form={form} onChange={onChange} />
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button type="submit" className="primary-button" disabled={busy}
          style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
          {busy ? "Đang xử lý..." : "Tạo lịch làm việc"}
        </button>
      </div>
    </form>
  );
}

function UpdatePanel({ onDone }) {
  const [scheduleId, setScheduleId] = useState("");
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const sid = parseInt(scheduleId, 10);
    if (!sid || sid <= 0) { setErr("Vui lòng nhập ID lịch hợp lệ."); return; }
    if (!form.doctorId || !form.workDate || !form.startTime || !form.endTime) {
      setErr("Vui lòng điền đầy đủ tất cả các trường."); return;
    }
    setBusy(true);
    try {
      await updateSchedule(sid, toPayload(form));
      setMsg("Cập nhật và sinh lại ca khám mới thành công!");
      onDone();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <div className="field">
        <label htmlFor="u-scheduleId">ID Lịch cần cập nhật *</label>
        <input
          type="number" id="u-scheduleId" min="1"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          placeholder="Nhập ID lịch (số nguyên)"
          style={{ border: "2px solid #2563eb", borderRadius: "8px", padding: "10px 14px",
            fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ height: "1px", background: "#e2e8f0", margin: "2px 0 4px" }} />
      <FormFields form={form} onChange={onChange} />
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button type="submit" className="primary-button" disabled={busy}
          style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}>
          {busy ? "Đang xử lý..." : "Cập nhật lịch"}
        </button>
      </div>
    </form>
  );
}

function CancelPanel({ onDone }) {
  const [scheduleId, setScheduleId] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const sid = parseInt(scheduleId, 10);
    if (!sid || sid <= 0) { setErr("Vui lòng nhập ID lịch hợp lệ."); return; }
    setBusy(true);
    try {
      await cancelSchedule(sid);
      setMsg("Hủy lịch và các ca khám thành công!");
      setScheduleId("");
      onDone();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <div className="field">
        <label htmlFor="c-scheduleId">ID Lịch cần hủy *</label>
        <input type="number" id="c-scheduleId" min="1"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          placeholder="Nhập ID lịch (số nguyên)" />
      </div>
      <div style={{ padding: "11px 14px", borderRadius: "8px", background: "#fff7ed",
        border: "1px solid #fed7aa", color: "#9a3412", fontSize: "13px" }}>
        ⚠️ Lịch chỉ có thể hủy khi <strong>chưa có ca khám nào được đặt</strong>. Thao tác này không thể hoàn tác.
      </div>
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button type="submit" disabled={busy} style={{
          width: "100%", justifyContent: "center", minHeight: "44px",
          display: "flex", alignItems: "center", gap: "8px", padding: "0 24px",
          borderRadius: "8px", border: "none", cursor: busy ? "not-allowed" : "pointer",
          fontWeight: 600, fontSize: "14px",
          background: busy ? "#fca5a5" : "#dc2626",
          color: "#fff", boxShadow: "0 2px 8px rgba(220,38,38,0.28)",
          transition: "background 0.2s",
        }}>
          <Trash2 size={15} />
          {busy ? "Đang hủy..." : "Hủy lịch"}
        </button>
      </div>
    </form>
  );
}

function slotColor(status) {
  if (status === "BOOKED") return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" };
  if (status === "CANCELLED") return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
  return { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
}

function scheduleBadge(status) {
  if (status === "CANCELLED") return { background: "#fee2e2", color: "#991b1b" };
  return { background: "#dcfce7", color: "#166534" };
}

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function SlotRow({ schedule }) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotErr, setSlotErr] = useState("");

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setSlotErr("");
    setLoading(true);
    try {
      const res = await getSlotsByScheduleId(schedule.scheduleId);
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setSlots(data);
      setOpen(true);
    } catch (e) {
      setSlotErr(e?.message || "Không thể tải ca khám.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr>
        <td style={{ fontWeight: 700, color: "#0f172a" }}>#{schedule.scheduleId}</td>
        <td>BS-{schedule.doctorId}</td>
        <td>{schedule.workDate}</td>
        <td>
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#334155" }}>
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </span>
        </td>
        <td>
          <span className="status-badge" style={scheduleBadge(schedule.status)}>
            {schedule.status}
          </span>
        </td>
        <td>
          <button type="button" onClick={toggle} disabled={loading} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "5px 12px", borderRadius: "6px",
            border: "1px solid #cbd5e1",
            background: open ? "#eff6ff" : "#f8fafc",
            color: open ? "#2563eb" : "#334155",
            fontWeight: 600, fontSize: "12.5px",
            cursor: loading ? "wait" : "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}>
            {loading
              ? "Đang tải..."
              : open
                ? <><ChevronUp size={13} /> Ẩn</>
                : <><ChevronDown size={13} /> Xem ca khám</>
            }
          </button>
        </td>
      </tr>

      {slotErr && (
        <tr>
          <td colSpan={6} style={{ padding: "8px 16px" }}>
            <div className="error-box" style={{ fontSize: "13px" }}>{slotErr}</div>
          </td>
        </tr>
      )}

      {open && !slotErr && slots.length === 0 && (
        <tr>
          <td colSpan={6} style={{ padding: "10px 16px 14px" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>
              Lịch này chưa có ca khám nào.
            </span>
          </td>
        </tr>
      )}

      {open && slots.length > 0 && (
        <tr>
          <td colSpan={6} style={{ padding: "8px 16px 16px", background: "#f8fafc" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "4px" }}>
              {slots.map((slot, idx) => (
                <span key={slot.slotId ?? idx} style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "4px 11px", borderRadius: "20px",
                  fontSize: "12px", fontWeight: 600,
                  fontFamily: "monospace", cursor: "default",
                  ...slotColor(slot.status),
                }}>
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  <span style={{ fontFamily: "inherit", fontWeight: 500, opacity: 0.75, fontSize: "11px" }}>
                    {slot.status}
                  </span>
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ScheduleTable({ schedules, loading, error, onRefresh }) {
  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
          Danh sách lịch làm việc
        </h2>
        <button type="button" onClick={onRefresh} disabled={loading} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", borderRadius: "7px",
          border: "1px solid #d7dee8", background: "#fff",
          color: "#475569", fontWeight: 600, fontSize: "13px",
          cursor: loading ? "not-allowed" : "pointer",
        }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Tải lại
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: "14px" }}>{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Lịch</th>
              <th>ID Bác sĩ</th>
              <th>Ngày làm việc</th>
              <th>Khung giờ</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Ca khám</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="empty-row">Đang tải dữ liệu...</td></tr>
            )}
            {!loading && schedules.length === 0 && !error && (
              <tr><td colSpan={6} className="empty-row">Chưa có lịch làm việc nào.</td></tr>
            )}
            {!loading && schedules.map((s) => (
              <SlotRow key={s.scheduleId} schedule={s} />
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function AppointmentManagement() {
  const [activePanel, setActivePanel] = useState(PANEL.CREATE);
  const [schedules, setSchedules] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  const loadSchedules = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const res = await getSchedules({});
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setSchedules(data);
    } catch (e) {
      setTableError(e?.message || "Không thể tải danh sách lịch.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarDays size={26} />
            Quản lý Lịch hẹn &amp; Lịch khám
          </h1>
          <p className="muted">
            Tạo, cập nhật và hủy lịch làm việc. Ca khám 30 phút được tự động sinh lại sau mỗi lần cập nhật.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "22px", flexWrap: "wrap" }}>
        <TabBtn active={activePanel === PANEL.CREATE} onClick={() => setActivePanel(PANEL.CREATE)}
          icon={<CalendarDays size={14} />} label="Tạo lịch mới" />
        <TabBtn active={activePanel === PANEL.UPDATE} onClick={() => setActivePanel(PANEL.UPDATE)}
          icon={<Pencil size={14} />} label="Cập nhật lịch" />
        <TabBtn active={activePanel === PANEL.CANCEL} onClick={() => setActivePanel(PANEL.CANCEL)}
          icon={<Trash2 size={14} />} label="Hủy lịch" />
      </div>

      <div style={{
        maxWidth: "480px", background: "#fff", padding: "26px",
        borderRadius: "12px", border: "1px solid #dfe5ec",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        {activePanel === PANEL.CREATE && <CreatePanel onDone={loadSchedules} />}
        {activePanel === PANEL.UPDATE && <UpdatePanel onDone={loadSchedules} />}
        {activePanel === PANEL.CANCEL && <CancelPanel onDone={loadSchedules} />}
      </div>

      <ScheduleTable
        schedules={schedules}
        loading={tableLoading}
        error={tableError}
        onRefresh={loadSchedules}
      />
    </>
  );
}
