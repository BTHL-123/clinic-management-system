import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  Hash,
  X,
  RefreshCw,
} from "lucide-react";
import { getDoctors } from "../../services/doctorService";
import { getSchedules, getSlotsByScheduleId, blockSlot, unblockSlot } from "../../services/scheduleService";
import walkInService from "../../services/walkInService";
import { getPatients } from "../../services/patientService";
import { getActiveMedicalServices } from "../../services/medicalServiceService";
import QueueGrid from "./QueueGrid";
import { useToast } from "../../context/useToast";
import PageHeader from "../../components/PageHeader";
import { toLocalDateString } from "../../lib/utils";


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
  const toast = useToast();
  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Doctor + schedule state
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [slotsBySchedule, setSlotsBySchedule] = useState({});
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [consultationFee, setConsultationFee] = useState(50000);
  const [specialtyServices, setSpecialtyServices] = useState([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [result, setResult] = useState(null);
  
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [selectedSlotObj, setSelectedSlotObj] = useState(null);

  // Patient Autocomplete State
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(null);

  // ── Debounced Search ─────────────────────────────────────────
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatientOptions([]);
      setShowPatientDropdown(false);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setSearchingPatient(true);
      try {
        const res = await getPatients({ keyword: patientSearch, size: 5 });
        const data = res?.data?.content || [];
        setPatientOptions(data);
        setShowPatientDropdown(true);
      } catch (err) {
        console.error("Lỗi tìm kiếm bệnh nhân:", err);
      } finally {
        setSearchingPatient(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearch]);

  const handleSelectExistingPatient = (p) => {
    setSelectedExistingPatient(p);
    setPatientSearch(""); // Clear search bar
    setShowPatientDropdown(false);
    setForm(prev => ({
      ...prev,
      fullName: p.fullName || "",
      phone: p.phone || "",
      dateOfBirth: p.dateOfBirth || "",
      gender: p.gender || "OTHER",
    }));
    setErrors({});
  };

  // ── Load data ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const docRes = await getDoctors({ page: 0, size: 200, status: "ACTIVE" });
      const docs = Array.isArray(docRes?.data?.content) ? docRes.data.content : [];
      setDoctors(docs);

      const schedRes = await getSchedules({ fromDate: selectedDate, toDate: selectedDate, size: 500 });
      const scheds = Array.isArray(schedRes?.data) ? schedRes.data : [];
      
      // Filter out cancelled/on_leave schedules
      const activeScheds = scheds.filter(s => !["CANCELLED", "ON_LEAVE"].includes(s.status));
      setSchedules(activeScheds);

      // Fetch slots for each schedule concurrently
      const slotsMap = {};
      const slotPromises = activeScheds.map(async (schedule) => {
        try {
          const slotRes = await getSlotsByScheduleId(schedule.scheduleId);
          slotsMap[schedule.scheduleId] = Array.isArray(slotRes?.data) ? slotRes.data : [];
        } catch (e) {
          slotsMap[schedule.scheduleId] = [];
        }
      });
      await Promise.all(slotPromises);
      setSlotsBySchedule(slotsMap);

    } catch (err) {
      toast.error(err, "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, toast]);

  useEffect(() => {
    fetchData();

    // Fetch consultation fee and specialty services
    getActiveMedicalServices().then((res) => {
      if (res.data && Array.isArray(res.data)) {
        const consultService = res.data.find(s => s.serviceType === "CONSULTATION");
        if (consultService && consultService.price) {
          setConsultationFee(consultService.price);
        }
        const others = res.data.filter((s) => s.serviceType !== "CONSULTATION");
        setSpecialtyServices(others);
      }
    }).catch(console.error);

    const intv = setInterval(fetchData, 15000);
    return () => clearInterval(intv);
  }, [selectedDate, fetchData]);


  // ── Handlers ──────────────────────────────────────────────────
  const handleSlotClick = (doctor, schedule, slot) => {
    setSelectedDoctorObj(doctor);
    setSelectedSlotObj(slot);
    setForm({
      ...EMPTY_FORM,
      doctorId: doctor.doctorId,
      appointmentDate: selectedDate,
      slotId: slot.slotId || slot.id,
    });
    setErrors({});
    setApiError("");
    setPatientSearch("");
    setSelectedExistingPatient(null);
    setShowPatientDropdown(false);
    setShowModal(true);
  };

  const handleSlotRightClick = async (slot) => {
    try {
      if (slot.status === "AVAILABLE") {
        await blockSlot(slot.slotId || slot.id);
        toast.success("Đã chặn slot thành công");
      } else if (slot.status === "BLOCKED") {
        await unblockSlot(slot.slotId || slot.id);
        toast.success("Đã mở lại slot thành công");
      }
      fetchData(); // reload
    } catch (err) {
      toast.error(err, "Thao tác thất bại");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Họ tên không được để trống";
    if (!form.phone.trim()) errs.phone = "Số điện thoại không được để trống";
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim())) errs.phone = "Số điện thoại không hợp lệ";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError("");
    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        doctorId: Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        slotId: Number(form.slotId),
        reasonForVisit: form.reasonForVisit.trim() || null,
        initialSymptoms: form.initialSymptoms.trim() || null,
      };
      const res = await walkInService.createWalkIn(payload);
      setResult(res.data ?? res);
      setShowModal(false);
      fetchData(); // Refresh grid behind
    } catch (err) {
      setApiError(err.message || "Tạo lịch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="walk-in-page walk-in-success" style={{ padding: "32px 0" }}>
        <SuccessCard result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="walk-in-page" style={{ padding: "0 20px 40px" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .wi-input:focus { border-color: #0f766e !important; outline: none; box-shadow: 0 0 0 3px rgba(15,118,110,0.12); }
      `}</style>

      {/* Page Header */}
      <PageHeader
        title="Tạo lịch khám trực tiếp"
        icon={UserPlus}
        iconColor="text-white"
        subtitle="Lễ tân: Chọn ngày và bấm vào một ô trống (màu xanh lục) để đặt lịch nhanh."
      />

      <div className="patient-glass-panel" style={{ padding: "24px", borderRadius: "20px", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
          <div className="field" style={{ margin: 0, width: "280px" }}>
            <label style={{ fontWeight: 700, color: "#1e293b", marginBottom: "8px", display: "block", fontSize: "14px" }}>Ngày khám</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}>
              <CalendarDays size={20} color="#0f766e" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                min={today}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "15px", color: "#0f172a", width: "100%", fontWeight: 500 }}
              />
            </div>
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="hover:bg-slate-50 transition-all"
            style={{ 
              padding: "11px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", 
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              fontWeight: 600, color: "#0f766e", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            <RefreshCw size={18} className={loading ? "spin-animation" : ""} />
            Tải lại lưới
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
          <div style={spinnerStyle} className="mb-4"></div>
          <div>Đang tải sơ đồ lịch khám...</div>
        </div>
      ) : (
        <QueueGrid 
          doctors={doctors.filter(d => schedules.some(s => s.doctorId === d.doctorId))}
          schedules={schedules}
          slotsBySchedule={slotsBySchedule}
          onSlotClick={handleSlotClick}
          onSlotRightClick={handleSlotRightClick}
        />
      )}

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", width: "90%", maxWidth: "600px",
            borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh", overflowY: "auto", animation: "fadeIn 0.2s ease"
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(to right, #f8fafc, #ffffff)",
              borderTopLeftRadius: "16px", borderTopRightRadius: "16px"
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f766e", display: "flex", alignItems: "center", gap: "8px" }}>
                  <UserPlus size={20} /> Tạo Walk-in Appointment
                </h2>
                <div style={{ marginTop: "4px", fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>Bác sĩ: <strong>{selectedDoctorObj?.fullName}</strong></span>
                  <span>•</span>
                  <span>Ca khám: <strong>{formatTime(selectedSlotObj?.startTime)} - {formatTime(selectedSlotObj?.endTime)}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px" }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }} noValidate>
              {apiError && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px",
                  color: "#dc2626", fontSize: "14px", marginBottom: "20px"
                }}>
                  <AlertCircle size={18} /> {apiError}
                </div>
              )}

              {/* Autocomplete Search Field */}
              <div className="field" style={{ marginBottom: "20px", position: "relative" }}>
                <label style={{ fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block", fontSize: "13px" }}>Tìm kiếm bệnh nhân (SĐT hoặc Tên)</label>
                <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                  <input 
                    type="text" 
                    className="wi-input"
                    placeholder="Nhập số điện thoại hoặc tên để tìm..." 
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedExistingPatient) {
                         setSelectedExistingPatient(null);
                      }
                    }}
                    onFocus={() => { if(patientOptions.length > 0) setShowPatientDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                    style={{ ...inputStyle(false), paddingRight: "30px", background: "#f8fafc" }}
                  />
                  {searchingPatient && <div style={{ position: "absolute", right: 10, ...spinnerStyle, width: 14, height: 14, borderWidth: 2 }} />}
                </div>

                {/* Dropdown */}
                {showPatientDropdown && patientOptions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, 
                    background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, marginTop: "4px",
                    maxHeight: "200px", overflowY: "auto"
                  }}>
                    {patientOptions.map(p => (
                      <div 
                        key={p.patientId}
                        onClick={() => handleSelectExistingPatient(p)}
                        style={{
                          padding: "10px 14px", borderBottom: "1px solid #f1f5f9",
                          cursor: "pointer", transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                      >
                        <div style={{ fontWeight: 600, color: "#0f766e", fontSize: "14px" }}>{p.fullName}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          SĐT: {p.phone} • {p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : "Khác"} 
                          {p.dateOfBirth ? ` • Sinh: ${p.dateOfBirth}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Info Form */}
              <div style={{ padding: "16px", background: selectedExistingPatient ? "#f0fdf4" : "#f8fafc", borderRadius: "12px", border: `1px solid ${selectedExistingPatient ? "#bbf7d0" : "#e2e8f0"}`, marginBottom: "20px" }}>
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: "13px", fontWeight: 700, color: selectedExistingPatient ? "#166534" : "#475569" }}>
                     {selectedExistingPatient ? "✅ Thông tin bệnh nhân đã lưu" : "📝 Thông tin bệnh nhân (Mới)"}
                   </span>
                   {selectedExistingPatient && (
                     <button type="button" onClick={() => { setSelectedExistingPatient(null); setForm({...form, fullName: "", phone: "", dateOfBirth: "", gender: "OTHER"}); setPatientSearch(""); }} style={{ background: "transparent", border: "none", color: "#dc2626", fontSize: "12px", cursor: "pointer", fontWeight: 600, padding: 0 }}>✕ Hủy chọn</button>
                   )}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="field" style={{ gridColumn: "1 / -1", margin: 0 }}>
                    <label htmlFor="wi-fullName">Họ và tên <Required /></label>
                    <input id="wi-fullName" name="fullName" type="text" className="wi-input" autoFocus={!selectedExistingPatient}
                           value={form.fullName} onChange={handleChange} style={{...inputStyle(!!errors.fullName), opacity: selectedExistingPatient ? 0.7 : 1}} disabled={!!selectedExistingPatient} />
                    <FieldError msg={errors.fullName} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="wi-phone">Số điện thoại <Required /></label>
                    <input id="wi-phone" name="phone" type="tel" className="wi-input"
                           value={form.phone} onChange={handleChange} style={{...inputStyle(!!errors.phone), opacity: selectedExistingPatient ? 0.7 : 1}} disabled={!!selectedExistingPatient} />
                    <FieldError msg={errors.phone} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="wi-dateOfBirth">Ngày sinh</label>
                    <input id="wi-dateOfBirth" name="dateOfBirth" type="date" className="wi-input"
                           value={form.dateOfBirth || ""} onChange={handleChange} style={{...inputStyle(false), opacity: selectedExistingPatient ? 0.7 : 1}} disabled={!!selectedExistingPatient} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label htmlFor="wi-gender">Giới tính</label>
                    <select id="wi-gender" name="gender" className="wi-input"
                            value={form.gender} onChange={handleChange} style={{...inputStyle(false), opacity: selectedExistingPatient ? 0.7 : 1}} disabled={!!selectedExistingPatient}>
                      {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="field" style={{ margin: 0 }}>
                  <label htmlFor="wi-reason">Lý do khám / Triệu chứng</label>
                  <textarea id="wi-reason" name="reasonForVisit" className="wi-input" rows={2}
                            value={form.reasonForVisit} onChange={handleChange} style={{...inputStyle(false), resize: "vertical"}} />
                </div>
              </div>

              <div style={{ padding: "14px 16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>Phí khám bệnh</span>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#166534" }}>{consultationFee.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div style={{ fontSize: "12px", color: "#15803d", display: "flex", gap: "4px" }}>
                  <AlertCircle size={14} /> Báo bệnh nhân thanh toán phí tại quầy để lấy số thứ tự.
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowPriceModal(true)} style={{ background: "transparent", border: "none", fontSize: "12px", fontWeight: 700, color: "#0f766e", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                    Xem bảng giá dịch vụ chuyên khoa
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                        style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting}
                        style={{ padding: "10px 24px", background: "#0f766e", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price List Modal */}
      {showPriceModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "500px",
            maxHeight: "80vh", display: "flex", flexDirection: "col", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: "16px 16px 0 0" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Bảng giá tham khảo dịch vụ</h3>
                <button onClick={() => setShowPriceModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                {specialtyServices.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Đang cập nhật bảng giá...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {specialtyServices.map(s => (
                      <div key={s.serviceId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #f1f5f9", borderRadius: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#334155" }}>{s.serviceName}</span>
                          {s.description && <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{s.description}</span>}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 900, color: "#0f766e", marginLeft: "16px" }}>{s.price.toLocaleString("vi-VN")} đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Micro-components & styles ────────────────────────────────────────────────
function Required() {
  return <span style={{ color: "#dc2626", marginLeft: "2px" }}>*</span>;
}

const spinnerStyle = {
  width: "20px", height: "20px",
  border: "3px solid rgba(15,118,110,0.2)",
  borderTopColor: "#0f766e",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

function inputStyle(hasError) {
  return {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: `1.5px solid ${hasError ? "#fca5a5" : "#cbd5e1"}`,
    fontSize: "14px",
    background: hasError ? "#fff5f5" : "#ffffff",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  };
}
