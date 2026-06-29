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

  const getInputClass = (hasError) => {
    return `w-full px-3.5 py-2.5 rounded-xl border-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${hasError ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}`;
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tạo lịch khám trực tiếp"
        icon={UserPlus}
        iconColor="text-white"
        subtitle="Lễ tân: Chọn ngày và bấm vào một ô trống (màu xanh lục) để đặt lịch nhanh."
      />

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
              onChange={(e) => setSelectedDate(e.target.value)} 
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
          doctors={doctors.filter(d => schedules.some(s => s.doctorId === d.doctorId))}
          schedules={schedules}
          slotsBySchedule={slotsBySchedule}
          onSlotClick={handleSlotClick}
          onSlotRightClick={handleSlotRightClick}
        />
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl sticky top-0 z-10">
              <div>
                <h2 className="m-0 text-lg font-black text-teal-700 flex items-center gap-2">
                  <UserPlus size={20} /> Tạo Walk-in Appointment
                </h2>
                <div className="mt-1 text-[13px] font-medium text-slate-500 flex items-center gap-2">
                  <span>Bác sĩ: <strong className="text-slate-700">{selectedDoctorObj?.fullName}</strong></span>
                  <span>•</span>
                  <span>Ca khám: <strong className="text-slate-700">{formatTime(selectedSlotObj?.startTime)} - {formatTime(selectedSlotObj?.endTime)}</strong></span>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5" noValidate>
              {apiError && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-600 text-sm font-medium">
                  <AlertCircle size={18} /> {apiError}
                </div>
              )}

              {/* Autocomplete Search Field */}
              <div className="relative">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Tìm kiếm bệnh nhân (SĐT hoặc Tên)</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all pr-10"
                  />
                  {searchingPatient && <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />}
                </div>

                {/* Dropdown */}
                {showPatientDropdown && patientOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                    {patientOptions.map(p => (
                      <div 
                        key={p.patientId}
                        onClick={() => handleSelectExistingPatient(p)}
                        className="px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="font-bold text-teal-700 text-sm mb-0.5">{p.fullName}</div>
                        <div className="text-xs font-medium text-slate-500">
                          SĐT: {p.phone} • {p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : "Khác"} 
                          {p.dateOfBirth ? ` • Sinh: ${p.dateOfBirth}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Info Form */}
              <div className={`p-5 rounded-2xl border ${selectedExistingPatient ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                <div className="mb-4 flex justify-between items-center">
                   <span className={`text-[13px] font-extrabold uppercase tracking-wider ${selectedExistingPatient ? "text-emerald-700" : "text-slate-500"}`}>
                     {selectedExistingPatient ? "✅ Thông tin bệnh nhân đã lưu" : "📝 Thông tin bệnh nhân (Mới)"}
                   </span>
                   {selectedExistingPatient && (
                     <button type="button" onClick={() => { setSelectedExistingPatient(null); setForm({...form, fullName: "", phone: "", dateOfBirth: "", gender: "OTHER"}); setPatientSearch(""); }} className="text-rose-600 text-[11px] font-extrabold uppercase tracking-wider hover:text-rose-700">✕ Hủy chọn</button>
                   )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="wi-fullName" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Họ và tên <Required /></label>
                    <input id="wi-fullName" name="fullName" type="text" autoFocus={!selectedExistingPatient}
                           value={form.fullName} onChange={handleChange} className={`${getInputClass(!!errors.fullName)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                    <FieldError msg={errors.fullName} />
                  </div>
                  <div>
                    <label htmlFor="wi-phone" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Số điện thoại <Required /></label>
                    <input id="wi-phone" name="phone" type="tel"
                           value={form.phone} onChange={handleChange} className={`${getInputClass(!!errors.phone)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                    <FieldError msg={errors.phone} />
                  </div>
                  <div>
                    <label htmlFor="wi-dateOfBirth" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Ngày sinh</label>
                    <input id="wi-dateOfBirth" name="dateOfBirth" type="date"
                           value={form.dateOfBirth || ""} onChange={handleChange} className={`${getInputClass(false)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient} />
                  </div>
                  <div>
                    <label htmlFor="wi-gender" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Giới tính</label>
                    <select id="wi-gender" name="gender"
                            value={form.gender} onChange={handleChange} className={`${getInputClass(false)} ${selectedExistingPatient ? "opacity-70" : ""}`} disabled={!!selectedExistingPatient}>
                      {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div>
                <label htmlFor="wi-reason" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Lý do khám / Triệu chứng</label>
                <textarea id="wi-reason" name="reasonForVisit" rows={2}
                          value={form.reasonForVisit} onChange={handleChange} className={`${getInputClass(false)} resize-y min-h-[60px]`} />
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-700">Phí khám bệnh</span>
                  <span className="text-base font-black text-emerald-700">{consultationFee.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="text-xs font-medium text-emerald-600 flex gap-1.5 items-center">
                  <AlertCircle size={14} /> Báo bệnh nhân thanh toán phí tại quầy để lấy số thứ tự.
                </div>
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => setShowPriceModal(true)} className="text-xs font-bold text-teal-600 hover:text-teal-700 underline underline-offset-2">
                    Xem bảng giá dịch vụ chuyên khoa
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-5 py-2.5 transition-all">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-all text-white ${submitting ? "bg-teal-400 cursor-not-allowed" : "bg-[#1DB896] hover:bg-[#159a7c] shadow-md shadow-teal-500/20"}`}>
                  {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

