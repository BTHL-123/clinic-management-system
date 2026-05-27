import { useState, useEffect, useCallback } from "react";
import { X, CalendarDays, Clock, UserRound } from "lucide-react";
import { getSchedules, getSlotsByScheduleId } from "../../services/scheduleService";
import { getDoctors } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";

export default function RescheduleModal({ isOpen, onClose, onRescheduleSuccess, appointment }) {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [slots, setSlots] = useState([]);

  const [form, setForm] = useState({
    doctorId: "",
    appointmentDate: "",
    slotId: "",
    rescheduleReason: ""
  });

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadDoctors = useCallback(async () => {
    try {
      const res = await getDoctors({ size: 100 });
      setDoctors(res?.data?.content || res?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSchedules = useCallback(async (docId) => {
    try {
      const res = await getSchedules({ doctorId: docId, status: "AVAILABLE", size: 100 });
      setSchedules(res?.data?.content || res?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSlots = useCallback(async (scheduleId) => {
    try {
      const res = await getSlotsByScheduleId(scheduleId);
      const allSlots = Array.isArray(res) ? res : (res?.data || []);
      setSlots(allSlots.filter(s => s.status === "AVAILABLE"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      setForm({
        doctorId: appointment?.doctorId || "",
        appointmentDate: "",
        slotId: "",
        rescheduleReason: ""
      });
      setError("");
    }
  }, [isOpen, appointment, loadDoctors]);

  useEffect(() => {
    if (form.doctorId) {
      fetchSchedules(form.doctorId);
    } else {
      setSchedules([]);
    }
    setForm(p => ({ ...p, appointmentDate: "", slotId: "" }));
    setSlots([]);
  }, [form.doctorId, fetchSchedules]);

  useEffect(() => {
    if (form.appointmentDate && form.doctorId) {
      const schedule = schedules.find(s => String(s.doctorId) === String(form.doctorId) && s.workDate === form.appointmentDate);
      if (schedule) {
        fetchSlots(schedule.scheduleId);
      } else {
        setSlots([]);
      }
    } else {
      setSlots([]);
    }
    setForm(p => ({ ...p, slotId: "" }));
  }, [form.appointmentDate, form.doctorId, schedules, fetchSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.slotId) {
      setError("Vui lòng chọn một ca khám.");
      return;
    }
    setBusy(true);
    try {
      await appointmentService.rescheduleAppointment(appointment.appointmentId, form.slotId, form.rescheduleReason);
      onRescheduleSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Không thể dời lịch hẹn.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  const uniqueDates = [...new Set(schedules.filter(s => s.workDate >= today).map(s => s.workDate))].sort();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", padding: "24px", borderRadius: "12px",
        width: "90%", maxWidth: "500px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.25rem" }}>Dời lịch hẹn</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Bác sĩ *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
              <UserRound size={16} color="#64748b" />
              <select 
                value={form.doctorId} 
                onChange={e => setForm(p => ({ ...p, doctorId: e.target.value }))}
                style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "14px", color: "#0f172a" }}
              >
                <option value="">Chọn bác sĩ</option>
                {doctors.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>{d.fullName} - {d.departmentName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Ngày khám *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
              <CalendarDays size={16} color="#64748b" />
              <select 
                value={form.appointmentDate} 
                onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value }))}
                style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "14px", color: "#0f172a" }}
                disabled={!form.doctorId}
              >
                <option value="">Chọn ngày khám</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
            {form.doctorId && uniqueDates.length === 0 && <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px", display: "block" }}>Bác sĩ này chưa có lịch làm việc sắp tới.</span>}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Ca khám *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc", minHeight: "60px" }}>
              {!form.appointmentDate && <span style={{ fontSize: "13px", color: "#94a3b8", display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>Vui lòng chọn ngày khám trước</span>}
              {form.appointmentDate && slots.length === 0 && <span style={{ fontSize: "13px", color: "#ef4444", display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>Không có ca khám nào khả dụng</span>}
              {slots.map(s => (
                <button
                  key={s.id || s.slotId}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, slotId: s.id || s.slotId }))}
                  style={{
                    padding: "6px 12px", borderRadius: "6px", border: "1px solid",
                    background: form.slotId === (s.id || s.slotId) ? "#e0f2fe" : "#fff",
                    borderColor: form.slotId === (s.id || s.slotId) ? "#0ea5e9" : "#cbd5e1",
                    color: form.slotId === (s.id || s.slotId) ? "#0369a1" : "#475569",
                    cursor: "pointer", fontWeight: 600, fontSize: "13px",
                    display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s"
                  }}
                >
                  <Clock size={14} /> {String(s.startTime).substring(0, 5)} - {String(s.endTime).substring(0, 5)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>Lý do dời lịch (tùy chọn)</label>
            <textarea
              value={form.rescheduleReason}
              onChange={(e) => setForm(p => ({ ...p, rescheduleReason: e.target.value }))}
              placeholder="Nhập lý do dời lịch..."
              rows={2}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "8px",
                border: "1px solid #cbd5e1", outline: "none", resize: "none",
                fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", background: "#f8fafc"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1",
                background: "#fff", cursor: "pointer", fontWeight: 600, color: "#475569"
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy || !form.slotId}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "none",
                background: (busy || !form.slotId) ? "#93c5fd" : "#2563eb",
                color: "#fff", cursor: (busy || !form.slotId) ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              {busy ? "Đang xử lý..." : "Xác nhận dời lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
