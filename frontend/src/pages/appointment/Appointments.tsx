import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Filter,
  LockKeyhole,
  Pencil,
  RefreshCw,
  Stethoscope,
  Trash2,
  UnlockKeyhole,
  UserRound,
} from "lucide-react";
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
const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const TIME_ROWS = Array.from({ length: 22 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

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

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatTime(t: string) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function doctorLabel(doctors: DoctorOption[], doctorId: number) {
  const doctor = doctors.find((item) => item.doctorId === doctorId);
  if (!doctor) return `BS-${doctorId}`;
  return `${doctor.doctorCode} - ${doctor.fullName}`;
}

function scheduleStatusLabel(status: string) {
  if (status === "AVAILABLE") return "Có sẵn";
  if (status === "FULL") return "Đầy ca";
  if (status === "CANCELLED") return "Đã hủy";
  if (status === "ON_LEAVE") return "Nghỉ phép";
  return status;
}

function slotStatusLabel(status: string) {
  if (status === "AVAILABLE") return "Trống";
  if (status === "BOOKED") return "Đã đặt";
  if (status === "LOCKED") return "Đang khóa";
  if (status === "BLOCKED") return "Đã chặn";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function scheduleBadgeClass(status: string) {
  if (status === "CANCELLED" || status === "ON_LEAVE") {
    return "status-badge badge-inactive";
  }
  if (status === "FULL") return "status-badge badge-warning";
  return "status-badge badge-active";
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

interface FormFieldsProps {
  form: typeof INIT_FORM;
  doctors: DoctorOption[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function FormFields({ form, doctors, onChange }: FormFieldsProps) {
  return (
    <>
      <div className="field">
        <label htmlFor="f-doctorId">Bác sĩ *</label>
        <select id="f-doctorId" name="doctorId" value={form.doctorId} onChange={onChange}>
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
        <input type="date" id="f-workDate" name="workDate" value={form.workDate} onChange={onChange} />
      </div>
      <div className="appointment-time-fields">
        <div className="field">
          <label htmlFor="f-startTime">Giờ bắt đầu *</label>
          <input type="time" id="f-startTime" name="startTime" value={form.startTime} onChange={onChange} />
        </div>
        <div className="field">
          <label htmlFor="f-endTime">Giờ kết thúc *</label>
          <input type="time" id="f-endTime" name="endTime" value={form.endTime} onChange={onChange} />
        </div>
      </div>
    </>
  );
}

interface CreatePanelProps {
  doctors: DoctorOption[];
  selectedDate: string;
  selectedTime: string;
  selectedDoctorId: string;
  onDone: () => void;
}

function CreatePanel({ doctors, selectedDate, selectedTime, selectedDoctorId, onDone }: CreatePanelProps) {
  const [form, setForm] = useState(INIT_FORM);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      doctorId: selectedDoctorId || current.doctorId,
      workDate: selectedDate || current.workDate,
      startTime: selectedTime || current.startTime,
    }));
  }, [selectedDate, selectedDoctorId, selectedTime]);

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
      setForm({ ...INIT_FORM, doctorId: selectedDoctorId, workDate: selectedDate, startTime: selectedTime });
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
      <button type="submit" disabled={busy} className="appointment-panel-submit">
        <CalendarDays size={16} />
        {busy ? "Đang xử lý..." : "Tạo lịch làm việc"}
      </button>
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
    if (!selectedData) return;
    setScheduleId(String(selectedData.scheduleId));
    setForm({
      doctorId: String(selectedData.doctorId),
      workDate: selectedData.workDate,
      startTime: formatTime(selectedData.startTime),
      endTime: formatTime(selectedData.endTime),
    });
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
      setErr("Vui lòng chọn lịch trên cuốn lịch tuần hoặc bảng bên dưới.");
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
        <label htmlFor="u-scheduleId">ID lịch đang chọn</label>
        <input id="u-scheduleId" type="number" value={scheduleId} readOnly placeholder="Chọn một block lịch" />
      </div>
      <FormFields form={form} doctors={doctors} onChange={onChange} />
      <button type="submit" disabled={busy} className="appointment-panel-submit">
        <Pencil size={16} />
        {busy ? "Đang xử lý..." : "Cập nhật lịch"}
      </button>
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
      setErr("Vui lòng chọn lịch trên cuốn lịch tuần hoặc bảng bên dưới.");
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
        <label htmlFor="c-scheduleId">ID lịch cần hủy</label>
        <input id="c-scheduleId" type="number" value={scheduleId} readOnly placeholder="Chọn một block lịch" />
      </div>
      <div className="appointment-warning">
        Lịch chỉ có thể hủy khi chưa có ca khám nào được đặt. Thao tác này không thể hoàn tác.
      </div>
      <button type="submit" disabled={busy} className="appointment-panel-submit danger">
        <Trash2 size={16} />
        {busy ? "Đang hủy..." : "Hủy lịch"}
      </button>
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
    return { ...base, background: "#fef9c3", color: "#854d0e", borderColor: "#fde047" };
  }
  if (status === "CANCELLED") {
    return { ...base, background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
  }
  if (status === "LOCKED") {
    return { ...base, background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" };
  }
  if (status === "BLOCKED") {
    return { ...base, background: "#fff7ed", color: "#9a3412", borderColor: "#fdba74" };
  }
  return { ...base, background: "#dcfce7", color: "#166534", borderColor: "#86efac" };
}

interface SlotRowProps {
  schedule: DoctorSchedule;
  doctor?: DoctorOption;
  onPick: (action: PanelType, schedule: DoctorSchedule) => void;
}

function SlotRow({ schedule, doctor, onPick }: SlotRowProps) {
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
        <td>
          <strong className="appointment-table-doctor-name">{doctor?.fullName || `Bác sĩ #${schedule.doctorId}`}</strong>
          <small className="appointment-table-doctor-code">{doctor?.doctorCode || `ID ${schedule.doctorId}`}</small>
        </td>
        <td>{schedule.workDate}</td>
        <td>
          <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#334155" }}>
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
        </td>
        <td>
          <span className={scheduleBadgeClass(schedule.status)}>{scheduleStatusLabel(schedule.status)}</span>
        </td>
        <td style={{ textAlign: "center" }}>
          <button type="button" onClick={toggle} disabled={loading} className="appointment-table-slot-btn">
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
          <div className="action-group">
            <button type="button" className="icon-button" onClick={() => onPick(PANEL.UPDATE, schedule)} title="Cập nhật lịch">
              <Pencil size={15} />
            </button>
            <button type="button" className="icon-button btn-danger" onClick={() => onPick(PANEL.CANCEL, schedule)} title="Hủy lịch">
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
                  <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  <span className="appointment-slot-mini-status">{slotStatusLabel(slot.status)}</span>
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
  doctors: DoctorOption[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onPick: (action: PanelType, schedule: DoctorSchedule) => void;
}

function ScheduleTable({ schedules, doctors, loading, error, onRefresh, onPick }: ScheduleTableProps) {
  return (
    <div className="appointment-table-section">
      <div className="appointment-section-title">
        <div>
          <h2>Danh sách lịch làm việc trong tuần</h2>
          <p>Vẫn giữ bảng ID để cập nhật, hủy và xem toàn bộ ca khám khi cần.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="calendar-ghost-btn">
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Tải lại
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Lịch</th>
              <th>Bác sĩ</th>
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
                <td colSpan={7} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && schedules.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="empty-row">Chưa có lịch làm việc nào trong tuần này.</td>
              </tr>
            )}
            {!loading && schedules.map((s) => (
              <SlotRow
                key={s.scheduleId}
                schedule={s}
                doctor={doctors.find((doctor) => doctor.doctorId === s.doctorId)}
                onPick={onPick}
              />
            ))}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

interface WeekCalendarProps {
  weekDates: Date[];
  schedules: DoctorSchedule[];
  doctors: DoctorOption[];
  selectedDate: string;
  onPickDate: (date: string) => void;
}

function WeekCalendar({ weekDates, schedules, doctors, selectedDate, onPickDate }: WeekCalendarProps) {
  return (
    <div className="appointment-week-summary">
      {weekDates.map((date, index) => {
        const dateValue = formatDate(date);
        const daySchedules = schedules.filter((schedule) => schedule.workDate === dateValue);
        const doctorCount = new Set(daySchedules.map((schedule) => schedule.doctorId)).size;
        const bookedCount = daySchedules.reduce((total, schedule) => {
          const slots = schedule.maxPatients || 0;
          return total + slots;
        }, 0);
        return (
          <button
            type="button"
            className={`appointment-day-summary ${selectedDate === dateValue ? "selected" : ""}`}
            key={dateValue}
            onClick={() => onPickDate(dateValue)}
          >
            <span>{WEEK_DAYS[index]}</span>
            <strong>{String(date.getDate()).padStart(2, "0")}</strong>
            <small>{String(date.getMonth() + 1).padStart(2, "0")}/{date.getFullYear()}</small>
            <em>{doctorCount} bác sĩ · {bookedCount || daySchedules.length} ca</em>
          </button>
        );
      })}
    </div>
  );
}

interface DayResourceCalendarProps {
  selectedDate: string;
  doctors: DoctorOption[];
  schedules: DoctorSchedule[];
  slotsBySchedule: Record<number, TimeSlot[]>;
  selectedScheduleId?: number;
  onPickSchedule: (schedule: DoctorSchedule) => void;
  onQuickCreate: (doctorId: number, date: string, startTime: string, endTime: string) => Promise<boolean>;
  onToggleSlot: (slot: TimeSlot) => Promise<void>;
}

function DayResourceCalendar({
  selectedDate,
  doctors,
  schedules,
  slotsBySchedule,
  selectedScheduleId,
  onPickSchedule,
  onQuickCreate,
  onToggleSlot,
}: DayResourceCalendarProps) {
  const [dragSelection, setDragSelection] = useState<{ doctorId: number; startIndex: number; endIndex: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const daySchedules = schedules.filter((schedule) => schedule.workDate === selectedDate);
  const columns = doctors;

  const finishSelection = async () => {
    if (!dragSelection || creating) return;
    const startIndex = Math.min(dragSelection.startIndex, dragSelection.endIndex);
    const endIndex = Math.max(dragSelection.startIndex, dragSelection.endIndex);
    setCreating(true);
    await onQuickCreate(
      dragSelection.doctorId,
      selectedDate,
      TIME_ROWS[startIndex],
      addMinutes(TIME_ROWS[endIndex], 30),
    );
    setCreating(false);
    setDragSelection(null);
  };

  return (
    <div className="appointment-resource-board" onPointerUp={finishSelection} onPointerCancel={() => setDragSelection(null)}>
      <div className="appointment-resource-time-axis">
        <span />
        {TIME_ROWS.map((time) => <span key={time}>{time}</span>)}
      </div>
      <div className="appointment-resource-grid" style={{ "--doctor-columns": columns.length || 1 } as React.CSSProperties}>
        {columns.map((doctor) => {
          const doctorSchedules = daySchedules.filter((schedule) => schedule.doctorId === doctor.doctorId);
          return (
            <div className="appointment-resource-column" key={doctor.doctorId}>
              <div className="appointment-resource-head">
                <strong>{doctor.fullName}</strong>
                <small>{doctor.doctorCode} · {doctorSchedules.length || 0} lịch</small>
              </div>
              {TIME_ROWS.map((time, timeIndex) => {
                const schedule = doctorSchedules.find((item) => formatTime(item.startTime) <= time && formatTime(item.endTime) > time);
                if (!schedule) {
                  const isSelecting = dragSelection?.doctorId === doctor.doctorId
                    && timeIndex >= Math.min(dragSelection.startIndex, dragSelection.endIndex)
                    && timeIndex <= Math.max(dragSelection.startIndex, dragSelection.endIndex);
                  return (
                    <button
                      type="button"
                      className={`appointment-resource-slot free ${isSelecting ? "drag-selecting" : ""}`}
                      key={time}
                      disabled={creating}
                      onPointerDown={() => {
                        setDragSelection({ doctorId: doctor.doctorId, startIndex: timeIndex, endIndex: timeIndex });
                      }}
                      onPointerEnter={() => {
                        if (dragSelection?.doctorId === doctor.doctorId) {
                          setDragSelection((current) => current ? { ...current, endIndex: timeIndex } : current);
                        }
                      }}
                      title="Bấm để tạo ca 30 phút, hoặc giữ và kéo để tạo nhiều ca"
                    >
                      +
                    </button>
                  );
                }
                const slots = slotsBySchedule[schedule.scheduleId] || [];
                const slot = slots.find((item) => formatTime(item.startTime) === time);
                const status = slot?.status || schedule.status;
                return (
                  <button
                    type="button"
                    className={`appointment-resource-slot ${status.toLowerCase()} ${schedule.scheduleId === selectedScheduleId ? "selected" : ""}`}
                    key={time}
                    onClick={() => onPickSchedule(schedule)}
                    title={`${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)} · ${doctorLabel(doctors, schedule.doctorId)}`}
                  >
                    <span>{slot ? slotStatusLabel(slot.status) : scheduleStatusLabel(schedule.status)}</span>
                    {slot && (slot.status === "AVAILABLE" || slot.status === "BLOCKED") && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="appointment-slot-toggle"
                        title={slot.status === "BLOCKED" ? "Mở lại ca khám" : "Chặn riêng ca khám"}
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleSlot(slot);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            onToggleSlot(slot);
                          }
                        }}
                      >
                        {slot.status === "BLOCKED" ? <UnlockKeyhole size={12} /> : <LockKeyhole size={12} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        {columns.length === 0 && (
          <div className="appointment-resource-empty">
            Chưa có bác sĩ để hiển thị lịch trong ngày này.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppointmentManagement() {
  const toast = useToast();
  const [activePanel, setActivePanel] = useState<PanelType>(PANEL.CREATE);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [slotsBySchedule, setSlotsBySchedule] = useState<Record<number, TimeSlot[]>>({});
  const [tableLoading, setTableLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [tableError, setTableError] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [doctorFilter, setDoctorFilter] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState("07:00");
  const [selectedEmptyDoctorId, setSelectedEmptyDoctorId] = useState("");

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const filteredSchedules = useMemo(() => {
    const list = doctorFilter ? schedules.filter((schedule) => String(schedule.doctorId) === doctorFilter) : schedules;
    return [...list].sort((a, b) => `${a.workDate} ${a.startTime}`.localeCompare(`${b.workDate} ${b.startTime}`));
  }, [doctorFilter, schedules]);

  const selectedDoctorId = selectedEmptyDoctorId || doctorFilter || (doctors[0]?.doctorId ? String(doctors[0].doctorId) : "");

  const loadSchedules = useCallback(async () => {
    setTableLoading(true);
    setTableError("");
    try {
      const params = new URLSearchParams({
        fromDate: formatDate(weekStart),
        toDate: formatDate(addDays(weekStart, 6)),
      });
      const response = await fetch(`http://localhost:8080/api/doctor-schedules?${params.toString()}`, {
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
      setSchedules([]);
    } finally {
      setTableLoading(false);
    }
  }, [weekStart]);

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

  const loadWeekSlots = useCallback(async (items: DoctorSchedule[]) => {
    if (items.length === 0) {
      setSlotsBySchedule({});
      return;
    }
    setSlotLoading(true);
    try {
      const entries = await Promise.all(
        items.map(async (schedule) => {
          try {
            const response = await fetch(`http://localhost:8080/api/doctor-schedules/${schedule.scheduleId}/slots`, {
              headers: getHeaders(),
            });
            if (!response.ok) return [schedule.scheduleId, []] as const;
            const json = await response.json();
            return [schedule.scheduleId, Array.isArray(json.data) ? json.data : []] as const;
          } catch {
            return [schedule.scheduleId, []] as const;
          }
        })
      );
      setSlotsBySchedule(Object.fromEntries(entries));
    } finally {
      setSlotLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    loadWeekSlots(schedules);
  }, [loadWeekSlots, schedules]);

  const pickSchedule = (panel: PanelType, schedule: DoctorSchedule) => {
    setSelectedSchedule(schedule);
    setSelectedDate(schedule.workDate);
    setSelectedTime(formatTime(schedule.startTime));
    setActivePanel(panel);
  };

  const shiftWeek = (amount: number) => {
    const nextWeekStart = addDays(weekStart, amount * 7);
    setWeekStart(nextWeekStart);
    setSelectedDate(formatDate(nextWeekStart));
    setSelectedSchedule(null);
  };

  const jumpToday = () => {
    setWeekStart(startOfWeek(new Date()));
    setSelectedDate(formatDate(new Date()));
    setSelectedSchedule(null);
  };

  const quickCreateSchedule = async (doctorId: number, workDate: string, startTime: string, endTime: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/doctor-schedules", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          doctorId,
          workDate,
          startTime: `${startTime}:00`,
          endTime: `${endTime}:00`,
        }),
      });
      if (!response.ok) {
        await handleFetchError(response);
      }
      toast.success(`Đã tạo lịch ${startTime} - ${endTime}.`);
      setSelectedDate(workDate);
      setSelectedTime(startTime);
      setSelectedEmptyDoctorId(String(doctorId));
      await loadSchedules();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo lịch nhanh.");
      return false;
    }
  };

  const toggleSlotBlocked = async (slot: TimeSlot) => {
    const shouldUnblock = slot.status === "BLOCKED";
    try {
      const response = await fetch(
        `http://localhost:8080/api/doctor-schedules/slots/${slot.slotId}/${shouldUnblock ? "unblock" : "block"}`,
        {
          method: "PUT",
          headers: getHeaders(),
        },
      );
      if (!response.ok) {
        await handleFetchError(response);
      }
      toast.success(shouldUnblock ? "Đã mở lại ca khám." : "Đã khóa riêng ca khám.");
      await loadWeekSlots(schedules);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật trạng thái ca khám.");
    }
  };

  return (
    <div className="appointment-week-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarDays size={26} />
            Quản lý Lịch hẹn &amp; Lịch khám
          </h1>
        </div>
      </div>

      <div className="appointment-week-toolbar">
        <div className="appointment-week-title">
          <CalendarDays size={18} />
          <div>
            <strong>
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </strong>
            <span>{slotLoading ? "Đang tải ca khám..." : `${filteredSchedules.length} lịch làm việc trong tuần`}</span>
          </div>
        </div>
        <div className="appointment-week-controls">
          <button type="button" className="calendar-ghost-btn" onClick={() => shiftWeek(-1)} aria-label="Tuần trước">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="calendar-ghost-btn" onClick={jumpToday}>Hôm nay</button>
          <button type="button" className="calendar-ghost-btn" onClick={() => shiftWeek(1)} aria-label="Tuần sau">
            <ChevronRight size={16} />
          </button>
          <label className="appointment-filter-control">
            <Filter size={15} />
            <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)}>
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.doctorCode} - {doctor.fullName}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="calendar-primary-btn" onClick={() => setActivePanel(PANEL.CREATE)}>
            <CalendarDays size={16} />
            Tạo lịch
          </button>
        </div>
      </div>

      <div className="appointment-main-grid">
        <section className="appointment-calendar-panel">
          <WeekCalendar
            weekDates={weekDates}
            schedules={filteredSchedules}
            doctors={doctors}
            selectedDate={selectedDate}
            onPickDate={(date) => {
              setSelectedDate(date);
              setSelectedSchedule(null);
            }}
          />
          <div className="appointment-legend">
            <span><i className="free" /> Trống</span>
            <span><i className="available" /> Có lịch</span>
            <span><i className="booked" /> Đã đặt</span>
            <span><i className="locked" /> Đang khóa</span>
            <span><i className="blocked" /> Đã chặn</span>
            <span><i className="cancelled" /> Đã hủy</span>
          </div>
          <DayResourceCalendar
            selectedDate={selectedDate}
            schedules={filteredSchedules}
            slotsBySchedule={slotsBySchedule}
            doctors={doctorFilter ? doctors.filter((doctor) => String(doctor.doctorId) === doctorFilter) : doctors}
            selectedScheduleId={selectedSchedule?.scheduleId}
            onPickSchedule={(schedule) => pickSchedule(PANEL.UPDATE, schedule)}
            onQuickCreate={quickCreateSchedule}
            onToggleSlot={toggleSlotBlocked}
          />
        </section>

        <aside className="appointment-side-panel">
          <div className="appointment-panel-tabs" role="tablist" aria-label="Tác vụ lịch">
            <button type="button" className={activePanel === PANEL.CREATE ? "active" : ""} onClick={() => setActivePanel(PANEL.CREATE)}>
              <CalendarDays size={15} />
              Tạo
            </button>
            <button type="button" className={activePanel === PANEL.UPDATE ? "active" : ""} onClick={() => setActivePanel(PANEL.UPDATE)}>
              <Pencil size={15} />
              Sửa
            </button>
            <button type="button" className={activePanel === PANEL.CANCEL ? "active" : ""} onClick={() => setActivePanel(PANEL.CANCEL)}>
              <Trash2 size={15} />
              Hủy
            </button>
          </div>

          <div className="appointment-selected-card">
            <div className="appointment-selected-icon">
              {selectedSchedule ? <Stethoscope size={18} /> : <Clock3 size={18} />}
            </div>
            <div>
              <strong>{selectedSchedule ? `Lịch #${selectedSchedule.scheduleId}` : "Ô lịch đang chọn"}</strong>
              <span>{selectedSchedule ? doctorLabel(doctors, selectedSchedule.doctorId) : `${selectedDate} · ${selectedTime}`}</span>
            </div>
          </div>

          {activePanel === PANEL.CREATE && (
            <CreatePanel
              doctors={doctors}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedDoctorId={selectedDoctorId}
              onDone={loadSchedules}
            />
          )}
          {activePanel === PANEL.UPDATE && (
            <UpdatePanel doctors={doctors} onDone={loadSchedules} selectedData={selectedSchedule} />
          )}
          {activePanel === PANEL.CANCEL && (
            <CancelPanel onDone={loadSchedules} selectedData={selectedSchedule} />
          )}
        </aside>
      </div>

      <div className="appointment-doctor-strip">
        {doctors.slice(0, 4).map((doctor) => {
          const load = schedules.filter((schedule) => schedule.doctorId === doctor.doctorId).length;
          return (
            <button type="button" className="appointment-doctor-card" key={doctor.doctorId} onClick={() => setDoctorFilter(String(doctor.doctorId))}>
              <span className="doctor-avatar">
                <UserRound size={16} />
              </span>
              <span>
                <strong>{doctor.fullName}</strong>
                <small>{doctor.doctorCode} · {load} lịch tuần này</small>
              </span>
            </button>
          );
        })}
      </div>

      <ScheduleTable
        schedules={filteredSchedules}
        doctors={doctors}
        loading={tableLoading}
        error={tableError}
        onRefresh={loadSchedules}
        onPick={pickSchedule}
      />
    </div>
  );
}
