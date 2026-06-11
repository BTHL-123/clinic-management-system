import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  Hash,
} from "lucide-react";
import { getDoctors } from "../../services/doctorService";
import { getAvailableSlots } from "../../services/scheduleService";
import walkInService from "../../services/walkInService";

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: "MALE",   label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER",  label: "Khác" },
];

const EMPTY_FORM = {
  fullName:        "",
  phone:           "",
  dateOfBirth:     "",
  gender:          "OTHER",
  doctorId:        "",
  appointmentDate: "",
  slotId:          "",
  reasonForVisit:  "",
  initialSymptoms: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(t) {
  return String(t ?? "").slice(0, 5);
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

// ─── Success Card ──────────────────────────────────────────────────────────────
function SuccessCard({ result, onReset }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #86efac",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "520px",
        margin: "0 auto",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(22,101,52,0.10)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <CheckCircle size={36} color="#16a34a" />
      </div>

      <h2 style={{ margin: "0 0 6px", fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
        Tạo lịch thành công!
      </h2>
      <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>
        Lịch khám trực tiếp đã được xác nhận.
      </p>

      {/* Queue Number Highlight */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e, #0d9488)",
          borderRadius: "12px", padding: "16px 20px",
          marginBottom: "20px", color: "#ffffff",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.8, marginBottom: "4px", letterSpacing: "0.05em" }}>
          SỐ THỨ TỰ KHÁM
        </div>
        <div style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1 }}>
          #{result.queueNumber}
        </div>
      </div>

      <div style={{ textAlign: "left", background: "#f8fafc", borderRadius: "10px", padding: "16px 18px", marginBottom: "24px" }}>
        {[
          ["Mã lịch hẹn",  result.appointmentCode],
          ["Bệnh nhân",    result.patientName],
          ["Bác sĩ",       result.doctorName],
          ["Ngày khám",    result.appointmentDate],
          ["Giờ khám",     `${formatTime(result.startTime)} – ${formatTime(result.endTime)}`],
          ["Trạng thái",   "Đã xác nhận"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
            <span style={{ color: "#64748b" }}>{label}</span>
            <strong style={{ color: "#0f172a" }}>{value}</strong>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 24px", borderRadius: "8px",
          background: "#0f766e", color: "#ffffff",
          border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer",
        }}
      >
        <UserPlus size={16} />
        Tạo lịch khám mới
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalkInAppointmentPage() {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]   = useState("");
  const [result, setResult]       = useState(null);

  // Doctor + slot state
  const [doctors, setDoctors]             = useState([]);
  const [slots, setSlots]                 = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading]   = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // ── Load doctors on mount ────────────────────────────────────────────────
  useEffect(() => {
    setDoctorsLoading(true);
    getDoctors({ page: 0, size: 200, status: "ACTIVE", sortBy: "doctorId", direction: "asc" })
      .then((res) => {
        const content = Array.isArray(res?.data?.content) ? res.data.content : [];
        setDoctors(content);
      })
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, []);

  // ── Load available slots when doctor + date change ───────────────────────
  const fetchSlots = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) { setSlots([]); return; }
    setSlotsLoading(true);
    setForm((prev) => ({ ...prev, slotId: "" }));
    try {
      const res = await getAvailableSlots(Number(doctorId), date);
      const available = (Array.isArray(res?.data) ? res.data : [])
        .filter((s) => s.status === "AVAILABLE");
      setSlots(available);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots(form.doctorId, form.appointmentDate);
  }, [form.doctorId, form.appointmentDate, fetchSlots]);

  // ── Field change handler ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())        errs.fullName = "Họ tên không được để trống";
    if (!form.phone.trim())           errs.phone    = "Số điện thoại không được để trống";
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim()))
                                      errs.phone    = "Số điện thoại không hợp lệ";
    if (!form.doctorId)               errs.doctorId = "Vui lòng chọn bác sĩ";
    if (!form.appointmentDate)        errs.appointmentDate = "Vui lòng chọn ngày khám";
    else if (form.appointmentDate < today) errs.appointmentDate = "Ngày khám không được là ngày trong quá khứ";
    if (!form.slotId)                 errs.slotId   = "Vui lòng chọn ca khám";
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError("");
    try {
      const payload = {
        fullName:        form.fullName.trim(),
        phone:           form.phone.trim(),
        dateOfBirth:     form.dateOfBirth || null,
        gender:          form.gender,
        doctorId:        Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        slotId:          Number(form.slotId),
        reasonForVisit:  form.reasonForVisit.trim() || null,
        initialSymptoms: form.initialSymptoms.trim() || null,
      };
      const res = await walkInService.createWalkIn(payload);
      setResult(res.data ?? res);
    } catch (err) {
      setApiError(err.message || "Tạo lịch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError("");
    setResult(null);
    setSlots([]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="walk-in-page walk-in-success" style={{ padding: "32px 0" }}>
        <SuccessCard result={result} onReset={handleReset} />
      </div>
    );
  }

  const selectedDoctor = doctors.find((d) => String(d.doctorId) === form.doctorId);

  return (
    <div className="walk-in-page">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .wi-input:focus { border-color: #0f766e !important; outline: none; box-shadow: 0 0 0 3px rgba(15,118,110,0.12); }
        .wi-slot-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(22,101,52,0.18) !important; }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col items-center w-full mb-6">
        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><UserPlus size={26} /></span>
            <span style={{ color: "#0f766e" }} className="text-2xl font-bold tracking-wide">Tạo lịch khám trực tiếp</span>
          </h1>
          <p className="text-white/70 font-medium mt-3 drop-shadow-sm">
            Dành cho bệnh nhân đến trực tiếp tại phòng khám mà không có lịch đặt trước.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>

        {/* ── Main Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>

          {/* API Error Banner */}
          {apiError && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "10px", padding: "14px 18px",
              color: "#dc2626", fontSize: "14px", marginBottom: "20px",
              animation: "fadeIn 0.2s ease",
            }}>
              <AlertCircle size={18} />
              {apiError}
            </div>
          )}

          {/* ── Section 1: Patient Info ──────────────────────────────────── */}
          <div className="walk-in-section" style={sectionStyle}>
            <SectionTitle icon={<UserPlus size={16} />} title="Thông tin bệnh nhân" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="wi-fullName">Họ và tên <Required /></label>
                <input
                  id="wi-fullName" name="fullName" type="text"
                  className="wi-input"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  style={inputStyle(!!errors.fullName)}
                />
                <FieldError msg={errors.fullName} />
              </div>

              <div className="field">
                <label htmlFor="wi-phone">Số điện thoại <Required /></label>
                <input
                  id="wi-phone" name="phone" type="tel"
                  className="wi-input"
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={handleChange}
                  style={inputStyle(!!errors.phone)}
                />
                <FieldError msg={errors.phone} />
              </div>

              <div className="field">
                <label htmlFor="wi-dob">Ngày sinh</label>
                <input
                  id="wi-dob" name="dateOfBirth" type="date"
                  className="wi-input"
                  max={today}
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  style={inputStyle(false)}
                />
              </div>

              <div className="field">
                <label htmlFor="wi-gender">Giới tính</label>
                <select
                  id="wi-gender" name="gender"
                  className="wi-input"
                  value={form.gender}
                  onChange={handleChange}
                  style={inputStyle(false)}
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 2: Appointment Info ──────────────────────────────── */}
          <div className="walk-in-section" style={sectionStyle}>
            <SectionTitle icon={<CalendarDays size={16} />} title="Thông tin lịch khám" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="field">
                <label htmlFor="wi-doctor">Bác sĩ <Required /></label>
                <select
                  id="wi-doctor" name="doctorId"
                  className="wi-input"
                  value={form.doctorId}
                  onChange={handleChange}
                  disabled={doctorsLoading}
                  style={inputStyle(!!errors.doctorId)}
                >
                  <option value="">{doctorsLoading ? "Đang tải..." : "Chọn bác sĩ"}</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorCode} – {d.fullName}
                      {d.specialization ? ` (${d.specialization})` : ""}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.doctorId} />
              </div>

              <div className="field">
                <label htmlFor="wi-date">Ngày khám <Required /></label>
                <input
                  id="wi-date" name="appointmentDate" type="date"
                  className="wi-input"
                  min={today}
                  value={form.appointmentDate}
                  onChange={handleChange}
                  style={inputStyle(!!errors.appointmentDate)}
                />
                <FieldError msg={errors.appointmentDate} />
              </div>
            </div>

            {/* Slot picker */}
            <div className="field">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Clock size={14} /> Ca khám còn trống <Required />
              </label>

              {!form.doctorId || !form.appointmentDate ? (
                <div style={hintBoxStyle}>
                  Vui lòng chọn bác sĩ và ngày khám để xem ca trống.
                </div>
              ) : slotsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
                  <div style={spinnerStyle} /> Đang tải ca khám...
                </div>
              ) : slots.length === 0 ? (
                <div style={{ ...hintBoxStyle, background: "#fef9c3", borderColor: "#fde047", color: "#854d0e" }}>
                  Không có ca khám trống. Vui lòng chọn ngày hoặc bác sĩ khác.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {slots.map((s) => {
                    const selected = String(s.slotId) === form.slotId;
                    return (
                      <button
                        key={s.slotId}
                        type="button"
                        className="wi-slot-btn"
                        onClick={() => {
                          setForm((p) => ({ ...p, slotId: String(s.slotId) }));
                          setErrors((p) => ({ ...p, slotId: "" }));
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "9px 16px", borderRadius: "10px",
                          border: selected ? "2px solid #0f766e" : "1.5px solid #86efac",
                          background: selected
                            ? "linear-gradient(135deg,#0f766e,#0d9488)"
                            : "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                          color: selected ? "#ffffff" : "#166534",
                          fontWeight: 700, fontSize: "14px",
                          fontFamily: "monospace", cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: selected ? "0 2px 10px rgba(15,118,110,0.3)" : "0 1px 4px rgba(22,101,52,0.08)",
                        }}
                      >
                        <Clock size={12} />
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </button>
                    );
                  })}
                </div>
              )}
              <FieldError msg={errors.slotId} />
            </div>
          </div>

          {/* ── Section 3: Symptoms ──────────────────────────────────────── */}
          <div className="walk-in-section" style={sectionStyle}>
            <SectionTitle icon={<AlertCircle size={16} />} title="Triệu chứng & Lý do khám" />

            <div className="field" style={{ marginBottom: "16px" }}>
              <label htmlFor="wi-reason">Lý do khám</label>
              <input
                id="wi-reason" name="reasonForVisit" type="text"
                className="wi-input"
                placeholder="VD: Khám sức khỏe định kỳ"
                value={form.reasonForVisit}
                onChange={handleChange}
                style={inputStyle(false)}
              />
            </div>

            <div className="field">
              <label htmlFor="wi-symptoms">Triệu chứng ban đầu</label>
              <textarea
                id="wi-symptoms" name="initialSymptoms"
                className="wi-input"
                rows={3}
                placeholder="Mô tả ngắn gọn triệu chứng của bệnh nhân..."
                value={form.initialSymptoms}
                onChange={handleChange}
                style={{ ...inputStyle(false), resize: "vertical" }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "14px 24px",
              background: submitting ? "#94a3b8" : "linear-gradient(135deg, #0f766e, #0d9488)",
              color: "#ffffff", border: "none", borderRadius: "12px",
              fontSize: "15px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: submitting ? "none" : "0 4px 16px rgba(15,118,110,0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {submitting
              ? <><div style={spinnerStyle} /> Đang tạo lịch...</>
              : <><UserPlus size={18} /> Tạo lịch khám trực tiếp</>
            }
          </button>
        </form>

        {/* ── Side Summary Panel ─────────────────────────────────────────── */}
        <div className="walk-in-summary" style={{
          background: "#ffffff", border: "1px solid #e2e8f0",
          borderRadius: "14px", padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          position: "sticky", top: "20px",
        }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            Tóm tắt lịch khám
          </h3>

          {[ 
            { label: "Bệnh nhân",    value: form.fullName || "—" },
            { label: "Điện thoại",   value: form.phone || "—" },
            {
              label: "Giới tính",
              value: GENDER_OPTIONS.find((o) => o.value === form.gender)?.label || "—",
            },
            {
              label: "Bác sĩ",
              value: selectedDoctor
                ? `${selectedDoctor.doctorCode} – ${selectedDoctor.fullName}`
                : "—",
            },
            { label: "Ngày khám",    value: form.appointmentDate || "—" },
            {
              label: "Ca khám",
              value: form.slotId
                ? (() => {
                    const s = slots.find((sl) => String(sl.slotId) === form.slotId);
                    return s ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}` : "—";
                  })()
                : "—",
            },
            { label: "Loại lịch",    value: "Khám trực tiếp" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px",
            }}>
              <span style={{ color: "#64748b" }}>{label}</span>
              <span style={{ fontWeight: 600, color: "#0f172a", textAlign: "right", maxWidth: "170px" }}>
                {value}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: "18px", background: "#f0fdf4",
            borderRadius: "10px", padding: "14px 16px",
            border: "1px solid #bbf7d0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontSize: "12px", fontWeight: 600 }}>
              <Hash size={13} />
              Số thứ tự sẽ được tạo tự động sau khi đặt lịch thành công.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Micro-components & styles ────────────────────────────────────────────────
function Required() {
  return <span style={{ color: "#dc2626", marginLeft: "2px" }}>*</span>;
}

function SectionTitle({ icon, title }) {
  return (
    <div className="walk-in-section-title" style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "18px", paddingBottom: "10px",
      borderBottom: "1px solid #f1f5f9",
      color: "#0f766e", fontWeight: 700, fontSize: "0.9rem",
    }}>
      {icon}{title}
    </div>
  );
}

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "22px 24px",
  marginBottom: "20px",
  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
};

const hintBoxStyle = {
  padding: "12px 14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  color: "#64748b",
  fontSize: "13px",
};

const spinnerStyle = {
  width: "16px", height: "16px",
  border: "2.5px solid rgba(255,255,255,0.4)",
  borderTopColor: "#ffffff",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  display: "inline-block",
};

function inputStyle(hasError) {
  return {
    width: "100%",
    padding: "10px 13px",
    borderRadius: "8px",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#dfe5ec"}`,
    fontSize: "14px",
    background: hasError ? "#fff5f5" : "#ffffff",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };
}
