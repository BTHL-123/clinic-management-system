import React, { useState, useCallback, useEffect } from "react";
import { CalendarDays, Pencil, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "../../context/useToast";

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

function ToastRelay({ message, type }: ToastProps) {
  const toast = useToast();

  useEffect(() => {
    if (!message) return;
    if (type === "error") {
      toast.error(message);
      return;
    }
    toast.success(message);
  }, [message, type, toast]);

  return null;
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
      <ToastRelay message={msg} type="success" />
      <ToastRelay message={err} type="error" />
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
  selectedData?: DoctorSchedule | null;
}

function UpdatePanel({ doctors, onDone, selectedData }: UpdatePanelProps) {
  const [scheduleId, setScheduleId] = useState("");
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (selectedData) {
      setScheduleId(String(selectedData.scheduleId));
      setForm({
        doctorId: String(selectedData.doctorId),
        workDate: selectedData.workDate,
        startTime: formatTime(selectedData.startTime),
        endTime: formatTime(selectedData.endTime)
      });
    }
  }, [selectedData]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const sid = parseInt(scheduleId, 10);
    if (isNaN(sid) || sid <= 0) {
      setErr("Vui lòng chọn lịch từ bảng bên dưới.");
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
      <ToastRelay message={msg} type="success" />
      <ToastRelay message={err} type="error" />
      <div className="field">
        <label htmlFor="u-scheduleId">ID Lịch cần cập nhật (Chọn từ bảng)</label>
        <input
          type="number"
          id="u-scheduleId"
          value={scheduleId}
          readOnly
          placeholder="Nhấp vào biểu tượng sửa ở bảng bên dưới"
          style={{
            border: "2px solid #0f766e",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "14px",
            outline: "none",
            backgroundColor: "#f8fafc"
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
  selectedData?: DoctorSchedule | null;
}

function CancelPanel({ onDone, selectedData }: CancelPanelProps) {
  const [scheduleId, setScheduleId] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (selectedData) {
      setScheduleId(String(selectedData.scheduleId));
    }
  }, [selectedData]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    const sid = parseInt(scheduleId, 10);
    if (isNaN(sid) || sid <= 0) {
      setErr("Vui lòng chọn lịch từ bảng bên dưới.");
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
      <ToastRelay message={msg} type="success" />
      <ToastRelay message={err} type="error" />
      <div className="field">
        <label htmlFor="c-scheduleId">ID Lịch cần hủy (Chọn từ bảng)</label>
        <input
          type="number"
          id="c-scheduleId"
          value={scheduleId}
          readOnly
          placeholder="Nhấp vào biểu tượng thùng rác ở bảng bên dưới"
          style={{ backgroundColor: "#f8fafc" }}
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
        <td style={{ textAlign: "center" }}>
          <div className="action-group" style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <button type="button" className="icon-button" onClick={() => (window as any).selectScheduleForAction("update", schedule)} title="Cập nhật lịch" style={{ padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", color: "#334155" }}>
              <Pencil size={15} />
            </button>
            <button type="button" className="icon-button btn-danger" onClick={() => (window as any).selectScheduleForAction("cancel", schedule)} title="Hủy lịch" style={{ padding: "6px", borderRadius: "6px", border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", color: "#ef4444" }}>
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>

      {slotErr && (
        <tr>
          <td colSpan={7} style={{ padding: "12px 16px" }}>
            <div className="error-box" style={{ fontSize: "13px" }}>
              {slotErr}
            </div>
          </td>
        </tr>
      )}

      {open && !slotErr && slots.length === 0 && (
        <tr>
          <td colSpan={7} style={{ padding: "16px 20px", background: "#f8fafc" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>
              Lịch này chưa có ca khám nào.
            </span>
          </td>
        </tr>
      )}

      {open && !slotErr && slots.length > 0 && (
        <tr>
          <td colSpan={7} style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #dfe5ec" }}>
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
  dateFilter: string;
  onFilterChange: (val: string) => void;
}

function ScheduleTable({ schedules, loading, error, onRefresh, dateFilter, onFilterChange }: ScheduleTableProps) {
  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
          Danh sách lịch làm việc
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <select 
            value={dateFilter} 
            onChange={(e) => onFilterChange(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", cursor: "pointer" }}
          >
            <option value="upcoming">Từ hôm nay trở đi</option>
            <option value="today">Chỉ hôm nay</option>
            <option value="week">7 ngày tới</option>
            <option value="all">Tất cả (Bao gồm quá khứ)</option>
          </select>
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
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && schedules.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="empty-row">
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
  const [dateFilter, setDateFilter] = useState("upcoming");
  const [selectedScheduleForUpdate, setSelectedScheduleForUpdate] = useState<DoctorSchedule | null>(null);
  const [selectedScheduleForCancel, setSelectedScheduleForCancel] = useState<DoctorSchedule | null>(null);

  useEffect(() => {
    (window as any).selectScheduleForAction = (action: string, scheduleData: DoctorSchedule) => {
      if (action === "update") {
        setActivePanel(PANEL.UPDATE);
        setSelectedScheduleForUpdate(scheduleData);
      } else if (action === "cancel") {
        setActivePanel(PANEL.CANCEL);
        setSelectedScheduleForCancel(scheduleData);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return () => { delete (window as any).selectScheduleForAction; };
  }, []);

  const loadSchedules = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      let url = "http://localhost:8080/api/doctor-schedules";
      
      const today = new Date();
      // Format as YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const params = new URLSearchParams();
      
      if (dateFilter === "upcoming") {
        params.append("fromDate", formatDate(today));
      } else if (dateFilter === "today") {
        params.append("fromDate", formatDate(today));
        params.append("toDate", formatDate(today));
      } else if (dateFilter === "week") {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        params.append("fromDate", formatDate(today));
        params.append("toDate", formatDate(nextWeek));
      }
      
      const qs = params.toString();
      if (qs) {
        url += "?" + qs;
      }

      const response = await fetch(url, {
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
  }, [loadSchedules, dateFilter]);

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
        {activePanel === PANEL.UPDATE && <UpdatePanel doctors={doctors} onDone={loadSchedules} selectedData={selectedScheduleForUpdate} />}
        {activePanel === PANEL.CANCEL && <CancelPanel onDone={loadSchedules} selectedData={selectedScheduleForCancel} />}
      </div>

      <ScheduleTable
        schedules={schedules}
        loading={tableLoading}
        error={tableError}
        onRefresh={loadSchedules}
        dateFilter={dateFilter}
        onFilterChange={setDateFilter}
      />
    </>
  );
}
