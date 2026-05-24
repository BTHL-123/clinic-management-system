import React, { useState, useCallback, useEffect } from "react";
import { CalendarDays, Pencil, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface DoctorSchedule {
  scheduleId: number;
  doctorId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  maxPatients?: number;
  status: string;
}

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorOption {
  doctorId: number;
  doctorCode: string;
  fullName: string;
}

const PANEL = { CREATE: "create", UPDATE: "update", CANCEL: "cancel" } as const;
type PanelType = typeof PANEL[keyof typeof PANEL];

const INIT_FORM = { doctorId: "", workDate: "", startTime: "", endTime: "" };

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleFetchError = async (response: Response): Promise<never> => {
  let errorMessage = "Internal server error";
  try {
    const errorJson = await response.json();
    if (errorJson && typeof errorJson.message === "string") {
      errorMessage = errorJson.message;
    } else if (errorJson && typeof errorJson.error === "string") {
      errorMessage = errorJson.error;
    }
  } catch {
    errorMessage = response.statusText || errorMessage;
  }
  throw new Error(errorMessage);
};

function toPayload(form: typeof INIT_FORM) {
  return {
    doctorId: parseInt(form.doctorId, 10),
    workDate: form.workDate,
    startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
    endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
  };
}

interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className="error-box" style={{
      background: isError ? "#fee2e2" : "#dcfce7",
      color: isError ? "#991b1b" : "#166534",
      border: `1px solid ${isError ? "#fca5a5" : "#86efac"}`,
      padding: "12px 14px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 500,
      marginBottom: "16px"
    }}>
      {message}
    </div>
  );
}

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabBtn({ active, onClick, icon, label }: TabBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "13.5px",
        transition: "all 0.18s ease-in-out",
        background: active ? "#0f766e" : "#f1f5f9",
        color: active ? "#ffffff" : "#475569",
        boxShadow: active ? "0 4px 12px rgba(15, 118, 110, 0.2)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

interface FormFieldsProps {
  form: typeof INIT_FORM;
  doctors: DoctorOption[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function FormFields({ form, doctors, onChange }: FormFieldsProps) {
  return (
    <>
      <div className="field">
        <label htmlFor="f-doctorId">ID Bác sĩ *</label>
        <select
          id="f-doctorId"
          name="doctorId"
          value={form.doctorId}
          onChange={onChange}
        >
          <option value="">Chọn bác sĩ</option>
          {doctors.map((doctor) => (
            <option key={doctor.doctorId} value={doctor.doctorId}>
              {doctor.doctorCode} - {doctor.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-workDate">Ngày làm việc *</label>
        <input
          type="date"
          id="f-workDate"
          name="workDate"
          value={form.workDate}
          onChange={onChange}
        />
      </div>
      <div className="field">
        <label htmlFor="f-startTime">Giờ bắt đầu *</label>
        <input
          type="time"
          id="f-startTime"
          name="startTime"
          value={form.startTime}
          onChange={onChange}
        />
      </div>
      <div className="field">
        <label htmlFor="f-endTime">Giờ kết thúc *</label>
        <input
          type="time"
          id="f-endTime"
          name="endTime"
          value={form.endTime}
          onChange={onChange}
        />
      </div>
    </>
  );
}

interface CreatePanelProps {
  doctors: DoctorOption[];
  onDone: () => void;
}

function CreatePanel({ doctors, onDone }: CreatePanelProps) {
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!form.doctorId || !form.workDate || !form.startTime || !form.endTime) {
      setErr("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("http://localhost:8080/api/doctor-schedules", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(toPayload(form)),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      setMsg("Tạo lịch làm việc thành công!");
      setForm(INIT_FORM);
      onDone();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <FormFields form={form} doctors={doctors} onChange={onChange} />
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button
          type="submit"
          disabled={busy}
          className="primary-button"
          style={{
            width: "100%",
            justifyContent: "center",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            background: "#0f766e",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Đang xử lý..." : "Tạo lịch làm việc"}
        </button>
      </div>
    </form>
  );
}

interface UpdatePanelProps {
  doctors: DoctorOption[];
  onDone: () => void;
}

function UpdatePanel({ doctors, onDone }: UpdatePanelProps) {
  const [scheduleId, setScheduleId] = useState("");
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const sid = parseInt(scheduleId, 10);
    if (isNaN(sid) || sid <= 0) {
      setErr("Vui lòng nhập ID lịch hợp lệ.");
      return;
    }
    if (!form.doctorId || !form.workDate || !form.startTime || !form.endTime) {
      setErr("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`http://localhost:8080/api/doctor-schedules/${sid}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(toPayload(form)),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      setMsg("Cập nhật và sinh lại ca khám mới thành công!");
      onDone();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <div className="field">
        <label htmlFor="u-scheduleId">ID Lịch cần cập nhật *</label>
        <input
          type="number"
          id="u-scheduleId"
          min="1"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          placeholder="Nhập ID lịch (số nguyên)"
          style={{
            border: "2px solid #0f766e",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "14px",
            outline: "none"
          }}
        />
      </div>
      <div style={{ height: "1px", background: "#e2e8f0", margin: "8px 0" }} />
      <FormFields form={form} doctors={doctors} onChange={onChange} />
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button
          type="submit"
          disabled={busy}
          className="primary-button"
          style={{
            width: "100%",
            justifyContent: "center",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
            background: "#0f766e",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Đang xử lý..." : "Cập nhật lịch"}
        </button>
      </div>
    </form>
  );
}

interface CancelPanelProps {
  onDone: () => void;
}

function CancelPanel({ onDone }: CancelPanelProps) {
  const [scheduleId, setScheduleId] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const sid = parseInt(scheduleId, 10);
    if (isNaN(sid) || sid <= 0) {
      setErr("Vui lòng nhập ID lịch hợp lệ.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`http://localhost:8080/api/doctor-schedules/${sid}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      setMsg("Hủy lịch và các ca khám thành công!");
      setScheduleId("");
      onDone();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" style={{ marginTop: 0 }} onSubmit={onSubmit}>
      <Toast message={msg} type="success" />
      <Toast message={err} type="error" />
      <div className="field">
        <label htmlFor="c-scheduleId">ID Lịch cần hủy *</label>
        <input
          type="number"
          id="c-scheduleId"
          min="1"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          placeholder="Nhập ID lịch (số nguyên)"
        />
      </div>
      <div style={{
        padding: "12px 14px",
        borderRadius: "8px",
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        color: "#9a3412",
        fontSize: "13px",
        lineHeight: "1.5"
      }}>
        ⚠️ Lịch chỉ có thể hủy khi chưa có ca khám nào được đặt. Thao tác này không thể hoàn tác.
      </div>
      <div className="form-actions" style={{ marginTop: "20px" }}>
        <button
          type="submit"
          disabled={busy}
          className="danger-button"
          style={{
            width: "100%",
            justifyContent: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          <Trash2 size={15} />
          {busy ? "Đang hủy..." : "Hủy lịch"}
        </button>
      </div>
    </form>
  );
}

function slotStyle(status: string) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "monospace",
    border: "1px solid",
    transition: "all 0.15s ease",
  };
  if (status === "BOOKED") {
    return {
      ...base,
      background: "#fef9c3",
      color: "#854d0e",
      borderColor: "#fde047",
    };
  }
  if (status === "CANCELLED") {
    return {
      ...base,
      background: "#fee2e2",
      color: "#991b1b",
      borderColor: "#fca5a5",
    };
  }
  if (status === "LOCKED") {
    return {
      ...base,
      background: "#f1f5f9",
      color: "#475569",
      borderColor: "#cbd5e1",
    };
  }
  return {
    ...base,
    background: "#dcfce7",
    color: "#166534",
    borderColor: "#86efac",
  };
}

function scheduleBadgeClass(status: string) {
  if (status === "CANCELLED" || status === "ON_LEAVE") {
    return "status-badge badge-inactive";
  }
  return "status-badge badge-active";
}

function scheduleStatusLabel(status: string) {
  if (status === "AVAILABLE") return "Có sẵn";
  if (status === "FULL") return "Đầy ca";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "ON_LEAVE") return "Nghỉ phép";
  return status;
}

function formatTime(t: string) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

interface SlotRowProps {
  schedule: DoctorSchedule;
}

function SlotRow({ schedule }: SlotRowProps) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotErr, setSlotErr] = useState("");

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setSlotErr("");
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/doctor-schedules/${schedule.scheduleId}/slots`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      const json = await response.json();
      const data = json.data || [];
      setSlots(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch (error: any) {
      setSlotErr(error.message || "Không thể tải ca khám.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr>
        <td className="cell-name">#{schedule.scheduleId}</td>
        <td>BS-{schedule.doctorId}</td>
        <td>{schedule.workDate}</td>
        <td>
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#334155" }}>
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </span>
        </td>
        <td>
          <span className={scheduleBadgeClass(schedule.status)}>
            {scheduleStatusLabel(schedule.status)}
          </span>
        </td>
        <td style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={toggle}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #d7dee8",
              background: open ? "#e8f7f4" : "#ffffff",
              color: open ? "#0f766e" : "#405064",
              fontWeight: 650,
              fontSize: "13px",
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? (
              "Đang tải..."
            ) : open ? (
              <>
                <ChevronUp size={13} />
                Ẩn
              </>
            ) : (
              <>
                <ChevronDown size={13} />
                Xem ca khám
              </>
            )}
          </button>
        </td>
      </tr>

      {slotErr && (
        <tr>
          <td colSpan={6} style={{ padding: "12px 16px" }}>
            <div className="error-box" style={{ fontSize: "13px" }}>
              {slotErr}
            </div>
          </td>
        </tr>
      )}

      {open && !slotErr && slots.length === 0 && (
        <tr>
          <td colSpan={6} style={{ padding: "16px 20px", background: "#f8fafc" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>
              Lịch này chưa có ca khám nào.
            </span>
          </td>
        </tr>
      )}

      {open && !slotErr && slots.length > 0 && (
        <tr>
          <td colSpan={6} style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #dfe5ec" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {slots.map((slot, idx) => (
                <div key={slot.slotId ?? idx} style={slotStyle(slot.status)}>
                  <span>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
                  <span style={{
                    fontSize: "10px",
                    opacity: 0.85,
                    textTransform: "lowercase",
                    background: "rgba(0,0,0,0.05)",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontWeight: 500
                  }}>
                    {slot.status === "AVAILABLE" ? "trống" : slot.status === "BOOKED" ? "đã đặt" : slot.status === "LOCKED" ? "đang khóa" : "đã hủy"}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface ScheduleTableProps {
  schedules: DoctorSchedule[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

function ScheduleTable({ schedules, loading, error, onRefresh }: ScheduleTableProps) {
  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
          Danh sách lịch làm việc
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #d7dee8",
            background: "#ffffff",
            color: "#475569",
            fontWeight: 650,
            fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          Tải lại
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

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
              <tr>
                <td colSpan={6} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && schedules.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="empty-row">
                  Chưa có lịch làm việc nào.
                </td>
              </tr>
            )}
            {!loading &&
              schedules.map((s) => (
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
  const [activePanel, setActivePanel] = useState<PanelType>(PANEL.CREATE);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  const loadSchedules = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const response = await fetch("http://localhost:8080/api/doctor-schedules", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      const json = await response.json();
      const data = json.data || [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setTableError(error.message || "Không thể tải danh sách lịch.");
    } finally {
      setTableLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/api/doctors?size=200", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      const json = await response.json();
      const data = json.data?.content || json.data || [];
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setTableError(error.message || "Không thể tải danh sách bác sĩ.");
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

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
        <TabBtn
          active={activePanel === PANEL.CREATE}
          onClick={() => setActivePanel(PANEL.CREATE)}
          icon={<CalendarDays size={14} />}
          label="Tạo lịch mới"
        />
        <TabBtn
          active={activePanel === PANEL.UPDATE}
          onClick={() => setActivePanel(PANEL.UPDATE)}
          icon={<Pencil size={14} />}
          label="Cập nhật lịch"
        />
        <TabBtn
          active={activePanel === PANEL.CANCEL}
          onClick={() => setActivePanel(PANEL.CANCEL)}
          icon={<Trash2 size={14} />}
          label="Hủy lịch"
        />
      </div>

      <div style={{
        maxWidth: "480px",
        background: "#ffffff",
        padding: "26px",
        borderRadius: "12px",
        border: "1px solid #dfe5ec",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        {activePanel === PANEL.CREATE && <CreatePanel doctors={doctors} onDone={loadSchedules} />}
        {activePanel === PANEL.UPDATE && <UpdatePanel doctors={doctors} onDone={loadSchedules} />}
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
