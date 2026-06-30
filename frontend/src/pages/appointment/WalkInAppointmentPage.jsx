import { useState, useEffect, useCallback, useMemo } from "react";
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

// ─── Helper Functions ──────────────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return "";
  if (Array.isArray(t)) {
    const [h, m] = t;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return String(t).slice(0, 5);
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1 font-medium">
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

// ─── Success Card ──────────────────────────────────────────────────────────────
function SuccessCard({ result, onReset }) {
  return (
    <div className="bg-white border border-emerald-300 rounded-2xl p-10 max-w-lg mx-auto text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={36} className="text-emerald-600" />
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-1.5">
        Tạo lịch thành công!
      </h2>
      <p className="text-sm font-medium text-slate-500 mb-6">
        Lịch khám trực tiếp đã được xác nhận.
      </p>

      {/* Queue Number Highlight */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 mb-5 text-white">
        <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-80 mb-1">
          SỐ THỨ TỰ KHÁM
        </div>
        <div className="text-5xl font-black leading-none">
          #{result.queueNumber}
        </div>
      </div>

      <div className="text-left bg-slate-50 rounded-xl p-4 mb-6">
        {[
          ["Mã lịch hẹn",  result.appointmentCode],
          ["Bệnh nhân",    result.patientName],
          ["Bác sĩ",       result.doctorName],
          ["Ngày khám",    result.appointmentDate],
          ["Giờ khám",     `${formatTime(result.startTime)} – ${formatTime(result.endTime)}`],
          ["Trạng thái",   "Đã xác nhận"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between mb-2 text-[13px]">
            <span className="font-medium text-slate-500">{label}</span>
            <strong className="font-bold text-slate-800">{value}</strong>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold text-sm transition-all shadow-md shadow-teal-500/20"
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
  const today = new Date().toISOString().split("T")[0];
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

  const selectedPatientBmi = useMemo(() => {
    if (!selectedExistingPatient?.heightCm || !selectedExistingPatient?.weightKg) return null;
    const h = selectedExistingPatient.heightCm / 100;
    return (selectedExistingPatient.weightKg / (h * h)).toFixed(1);
  }, [selectedExistingPatient]);

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
      const docs = Array.isArray(docRes?.data?.content) 
        ? docRes.data.content 
        : (Array.isArray(docRes?.data) ? docRes.data : (Array.isArray(docRes?.content) ? docRes.content : (Array.isArray(docRes) ? docRes : [])));
      setDoctors(docs);

      const schedRes = await getSchedules({ fromDate: selectedDate, toDate: selectedDate, size: 500 });
      const scheds = Array.isArray(schedRes?.data) 
        ? schedRes.data 
        : (Array.isArray(schedRes?.content) ? schedRes.content : (Array.isArray(schedRes) ? schedRes : []));
      
      // Filter out cancelled/on_leave schedules
      const activeScheds = scheds.filter(s => !["CANCELLED", "ON_LEAVE"].includes(s.status));
      setSchedules(activeScheds);

      // Fetch slots for each schedule concurrently
      const slotsMap = {};
      const slotPromises = activeScheds.map(async (schedule) => {
        try {
          const slotRes = await getSlotsByScheduleId(schedule.scheduleId);
          const slots = Array.isArray(slotRes?.data) 
            ? slotRes.data 
            : (Array.isArray(slotRes?.content) ? slotRes.content : (Array.isArray(slotRes) ? slotRes : []));
          slotsMap[schedule.scheduleId] = slots;
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
      setSelectedSlotObj(null);
      setSelectedDoctorObj(null);
      setForm(EMPTY_FORM);
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

  const getInputClass = (hasError) => {
    return `w-full px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${hasError ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="py-8 px-6 max-w-7xl mx-auto">
        <SuccessCard result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tạo lịch khám trực tiếp"
        icon={UserPlus}
        iconColor="text-white"
        subtitle="Lễ tân: Chọn ngày và bấm vào một ô trống (màu xanh lục) trên lịch khám để đặt lịch cho bệnh nhân."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">
        {/* Left Column: Date Filter & Schedule Grid */}
        <div className="space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-full md:w-72">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Ngày khám</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-600">
                  <CalendarDays size={20} />
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotObj(null);
                    setSelectedDoctorObj(null);
                  }} 
                  min={today}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="bg-white hover:bg-slate-50 text-teal-700 border border-slate-200 font-bold rounded-xl px-5 py-2.5 transition-all flex items-center gap-2 justify-center shadow-sm"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Tải lại lưới
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin mb-4"></div>
              <div className="text-sm font-medium">Đang tải sơ đồ lịch khám...</div>
            </div>
          ) : (
            <QueueGrid 
              doctors={(() => {
                if (!doctors || doctors.length === 0) return [];
                if (!schedules || schedules.length === 0) return doctors;
                const scheduledIds = new Set(schedules.map(s => String(s.doctorId)));
                const matched = doctors.filter(d => scheduledIds.has(String(d.doctorId)));
                return matched.length > 0 ? matched : doctors;
              })()}
              schedules={schedules}
              slotsBySchedule={slotsBySchedule}
              onSlotClick={handleSlotClick}
              onSlotRightClick={handleSlotRightClick}
              selectedSlotId={selectedSlotObj?.slotId || selectedSlotObj?.id}
            />
          )}
        </div>

        {/* Right Column: Vertical Sidebar (350px fixed on desktop) */}
        <aside className="w-full xl:w-[350px] sticky top-6 space-y-4">
          {selectedSlotObj ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <h3 className="m-0 text-base font-black text-teal-700 flex items-center gap-2">
                    <UserPlus size={18} /> Tạo lịch khám
                  </h3>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    Bác sĩ: <strong className="text-slate-800">{selectedDoctorObj?.fullName}</strong>
                    <br />
                    Ca khám: <strong className="text-slate-800">{formatTime(selectedSlotObj?.startTime)} - {formatTime(selectedSlotObj?.endTime)}</strong>
                    <br />
                    Ngày: <strong className="text-slate-800">{selectedDate}</strong>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedSlotObj(null); setSelectedDoctorObj(null); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title="Bỏ chọn ca này"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {apiError && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 text-xs font-medium">
                    <AlertCircle size={16} /> {apiError}
                  </div>
                )}

                {/* Autocomplete Search Field */}
                <div className="relative">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tìm bệnh nhân cũ (SĐT/Tên)</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      placeholder="Nhập SĐT hoặc tên để tìm..." 
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (selectedExistingPatient) setSelectedExistingPatient(null);
                      }}
                      onFocus={() => { if(patientOptions.length > 0) setShowPatientDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all pr-8"
                    />
                    {searchingPatient && <div className="absolute right-2.5 w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />}
                  </div>

                  {/* Dropdown */}
                  {showPatientDropdown && patientOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                      {patientOptions.map(p => (
                        <div 
                          key={p.patientId}
                          onClick={() => handleSelectExistingPatient(p)}
                          className="px-3 py-2 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="font-bold text-teal-700 text-xs">{p.fullName}</div>
                          <div className="text-[11px] font-medium text-slate-500">
                            SĐT: {p.phone} • {p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : "Khác"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Form Fields */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${selectedExistingPatient ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${selectedExistingPatient ? "text-emerald-700" : "text-slate-500"}`}>
                      {selectedExistingPatient ? "✅ Bệnh nhân đã lưu" : "📝 Thông tin bệnh nhân"}
                    </span>
                    {selectedExistingPatient && (
                      <button type="button" onClick={() => { setSelectedExistingPatient(null); setForm(prev=>({...prev, fullName: "", phone: "", dateOfBirth: "", gender: "OTHER"})); setPatientSearch(""); }} className="text-rose-600 text-[10px] font-extrabold uppercase hover:text-rose-700">✕ Hủy chọn</button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="wi-fullName" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Họ và tên <Required /></label>
                      <input id="wi-fullName" name="fullName" type="text"
                             value={form.fullName} onChange={handleChange} className={`${getInputClass(!!errors.fullName)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                      <FieldError msg={errors.fullName} />
                    </div>
                    <div>
                      <label htmlFor="wi-phone" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Số điện thoại <Required /></label>
                      <input id="wi-phone" name="phone" type="tel"
                             value={form.phone} onChange={handleChange} className={`${getInputClass(!!errors.phone)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                      <FieldError msg={errors.phone} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="wi-dateOfBirth" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Ngày sinh</label>
                        <input id="wi-dateOfBirth" name="dateOfBirth" type="date"
                               value={form.dateOfBirth || ""} onChange={handleChange} className={`${getInputClass(false)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                      </div>
                      <div>
                        <label htmlFor="wi-gender" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Giới tính</label>
                        <select id="wi-gender" name="gender"
                                value={form.gender} onChange={handleChange} className={`${getInputClass(false)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient}>
                          {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning and Vitals summary for Lễ tân khi bốc số */}
                {selectedExistingPatient && (
                  <div className="space-y-2.5 my-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {selectedExistingPatient.allergies ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 shadow-sm animate-pulse-slow">
                        <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                        <div>
                          <strong className="text-rose-800 text-[11px] font-extrabold uppercase tracking-wider block">
                            ⚠️ CẢNH BÁO TIỀN SỬ DỊ ỨNG THUỐC:
                          </strong>
                          <p className="text-rose-700 text-xs font-extrabold mt-0.5 whitespace-pre-wrap">
                            {selectedExistingPatient.allergies}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/40 border border-emerald-250/30 rounded-xl p-2.5 flex items-center gap-2">
                        <CheckCircle className="text-emerald-600 shrink-0" size={14} />
                        <span className="text-emerald-800 text-xs font-bold">
                          Không ghi nhận tiền sử dị ứng thuốc.
                        </span>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Nhóm máu</span>
                        <span className="text-rose-600 text-sm font-extrabold">{selectedExistingPatient.bloodType || "Chưa xác định"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Chỉ số BMI</span>
                        <span className="text-slate-800 text-sm font-extrabold">{selectedPatientBmi ? `${selectedPatientBmi}` : "Chưa có chỉ số"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Chiều cao & Cân nặng</span>
                        <span className="text-slate-800">
                          {selectedExistingPatient.heightCm ? `${selectedExistingPatient.heightCm} cm` : "—"} / {selectedExistingPatient.weightKg ? `${selectedExistingPatient.weightKg} kg` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold tracking-wider mb-0.5">Tài khoản quản lý</span>
                        <span className="truncate block max-w-[120px]">
                          {selectedExistingPatient.userName ? (
                            <span className="bg-sky-50 border border-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                              {selectedExistingPatient.userName}
                            </span>
                          ) : (
                            <em className="text-slate-400 font-normal">Tự quản lý</em>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label htmlFor="wi-reason" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Lý do khám / Triệu chứng</label>
                  <textarea id="wi-reason" name="reasonForVisit" rows={2}
                            value={form.reasonForVisit} onChange={handleChange} className={`${getInputClass(false)} resize-y min-h-[45px]`} />
                </div>

                {/* Fee */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-700">Phí khám bệnh</span>
                    <span className="font-black text-emerald-700">{consultationFee.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-600 flex gap-1 items-center">
                    <AlertCircle size={12} /> Thu phí tại quầy để cấp STT.
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                        className={`w-full py-2.5 rounded-xl font-bold transition-all text-white text-sm ${submitting ? "bg-teal-400 cursor-not-allowed" : "bg-[#1DB896] hover:bg-[#159a7c] shadow-md shadow-teal-500/20"}`}>
                  {submitting ? "Đang xử lý..." : "Tạo lịch khám"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <UserPlus size={24} />
              </div>
              <h4 className="m-0 text-sm font-bold text-slate-700">Ô lịch đang chọn</h4>
              <p className="m-0 text-xs text-slate-500 leading-relaxed">
                Chưa chọn ca khám. Vui lòng bấm vào một <strong>ô trống (màu xanh lục)</strong> trên lưới lịch khám để đặt lịch cho bệnh nhân.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Price List Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="m-0 text-base font-black text-slate-800">Bảng giá tham khảo dịch vụ</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {specialtyServices.length === 0 ? (
                <div className="text-center text-slate-500 text-sm font-medium py-8">Đang cập nhật bảng giá...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {specialtyServices.map(s => (
                    <div key={s.serviceId} className="flex justify-between items-center p-3.5 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{s.serviceName}</span>
                        {s.description && <span className="text-xs font-medium text-slate-500 mt-0.5">{s.description}</span>}
                      </div>
                      <span className="text-sm font-black text-teal-600 whitespace-nowrap ml-4">{s.price.toLocaleString("vi-VN")} đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Micro-components & styles ────────────────────────────────────────────────
function Required() {
  return <span className="text-rose-600 ml-0.5">*</span>;
}

