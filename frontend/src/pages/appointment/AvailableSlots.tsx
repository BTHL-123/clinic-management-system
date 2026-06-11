import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Search, CalendarDays, ArrowLeft, ShieldAlert, CheckCircle, UserRound, Star } from "lucide-react";
import { getAvailableSlotsForPatient, getSchedules, lockSlot, releaseLock } from "../../services/scheduleService";
import { getDoctors } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { useToast } from "../../context/useToast";

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorSchedule {
  scheduleId: number;
  doctorId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorOption {
  doctorId: number;
  fullName: string;
  departmentName?: string;
  doctorCode?: string;
  degree?: string;
  specialization?: string;
  status?: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

function formatTime(t: string): string {
  return String(t ?? "").slice(0, 5);
}

export default function AvailableSlots() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const searchParams = new URLSearchParams(location.search);
  const paramDoctorId = searchParams.get("doctorId") || "";
  const paramWorkDate = searchParams.get("workDate") || "";

  const [doctorId, setDoctorId] = useState(paramDoctorId);
  const [workDate, setWorkDate] = useState(paramWorkDate);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<DoctorSchedule[]>([]);
  const [doctorFetchState, setDoctorFetchState] = useState<FetchState>("idle");
  const [doctorErrorMsg, setDoctorErrorMsg] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const prefillDepartmentName = (location.state as any)?.prefillDepartmentName;

  const today = new Date().toISOString().split("T")[0];

  const selectedDoctor = doctorOptions.find((doctor) => String(doctor.doctorId) === doctorId);

  const getDoctorScheduleText = (id: number) => {
    const schedules = scheduleOptions.filter((schedule) => schedule.doctorId === id);
    if (schedules.length === 0) return "";
    const first = schedules[0];
    const last = schedules[schedules.length - 1];
    const timeRange = `${formatTime(first.startTime)} - ${formatTime(last.endTime)}`;
    return schedules.length === 1 ? timeRange : `${timeRange}, ${schedules.length} lịch`;
  };

  const getDoctorLabel = (doctor?: DoctorOption) => {
    if (!doctor) return "";
    const code = doctor.doctorCode || `BS-${doctor.doctorId}`;
    return `${code} - ${doctor.fullName}`;
  };

  const fetchSlots = useCallback(async (did: string, date: string) => {
    setFetchState("loading");
    setErrorMsg("");
    setSlots([]);
    try {
      const json: any = await getAvailableSlotsForPatient(Number(did), date);
      const data: TimeSlot[] = Array.isArray(json.data) ? json.data : [];
      setSlots(data);
      setFetchState("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối đến máy chủ.");
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    if (doctorId && workDate) {
      fetchSlots(doctorId, workDate);
    } else {
      setFetchState("idle");
      setSlots([]);
    }
  }, [doctorId, workDate, fetchSlots]);

  useEffect(() => {
    let isActive = true;

    const fetchDoctorsByDate = async () => {
      const keepDoctorId = paramDoctorId && workDate === paramWorkDate;
      if (!keepDoctorId) {
        setDoctorId("");
      }
      setSlots([]);
      setFetchState("idle");
      setSelectedSlot(null);
      setBookingStep(false);

      if (!workDate) {
        setDoctorOptions([]);
        setScheduleOptions([]);
        setDoctorFetchState("idle");
        setDoctorErrorMsg("");
        return;
      }

      setDoctorFetchState("loading");
      setDoctorErrorMsg("");
      try {
        const [scheduleJson, doctorJson]: any[] = await Promise.all([
          getSchedules({ fromDate: workDate, toDate: workDate, status: "AVAILABLE" }),
          getDoctors({ page: 0, size: 200, status: "ACTIVE", sortBy: "doctorId", direction: "asc" }),
        ]);

        if (!isActive) return;

        const schedules: DoctorSchedule[] = Array.isArray(scheduleJson.data) ? scheduleJson.data : [];
        const doctors: DoctorOption[] = Array.isArray(doctorJson.data?.content) ? doctorJson.data.content : [];
        const scheduledDoctorIds = new Set(schedules.map((schedule) => schedule.doctorId));
        let availableDoctors = doctors.filter((doctor) => scheduledDoctorIds.has(doctor.doctorId));

        if (prefillDepartmentName) {
          availableDoctors = availableDoctors.filter((doctor) => doctor.departmentName === prefillDepartmentName);
        }

        setScheduleOptions(schedules);
        setDoctorOptions(availableDoctors);
        setDoctorFetchState("done");
      } catch (err: any) {
        if (!isActive) return;
        setDoctorOptions([]);
        setScheduleOptions([]);
        setDoctorErrorMsg(err.message || "Không thể tải danh sách bác sĩ có lịch.");
        setDoctorFetchState("error");
      }
    };

    fetchDoctorsByDate();

    return () => {
      isActive = false;
    };
  }, [workDate]);

  useEffect(() => {
    if (!bookingStep || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingStep, timer]);

  useEffect(() => {
    if (isExpired) {
      const timeout = setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setIsExpired(false);
        if (doctorId && workDate) {
          fetchSlots(doctorId, workDate);
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [isExpired, doctorId, workDate, fetchSlots]);

  const handleSelectSlot = async (slot: TimeSlot) => {
    if (slot.status === "LOCKED" || slot.status === "BOOKED" || slot.status === "BLOCKED") return;
    try {
      await lockSlot(slot.slotId);
      setSelectedSlot(slot);
      setBookingStep(true);
      setTimer(600);
      setIsExpired(false);
      setBookingSuccess(false);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Ca khám này đã được người khác giữ chỗ. Vui lòng chọn ca khác.", "Không thể giữ ca khám");
      if (doctorId && workDate) {
        fetchSlots(doctorId, workDate);
      }
    }
  };

  const handleCancelBooking = async () => {
    if (selectedSlot) {
      try {
        await releaseLock(selectedSlot.slotId);
      } catch (e) {
      }
    }
    setBookingStep(false);
    setSelectedSlot(null);
    setIsExpired(false);
    if (doctorId && workDate) {
      fetchSlots(doctorId, workDate);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên và số điện thoại.", "Thiếu thông tin");
      return;
    }
    if (!selectedSlot) return;

    try {
      await appointmentService.bookAppointment({
        slotId: selectedSlot.slotId,
        reasonForVisit: visitReason,
        paymentMethod: paymentMethod
      });
      setBookingSuccess(true);
      window.dispatchEvent(new CustomEvent("notification-updated"));
      setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setPatientName("");
        setPatientPhone("");
        setVisitReason("");
        if (doctorId && workDate) {
          fetchSlots(doctorId, workDate);
        }
      }, 2000);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Đặt lịch thất bại. Vui lòng thử lại.", "Đặt lịch thất bại");
    }
  };

  // Release lock if component unmounts while holding a lock
  useEffect(() => {
    const slotToRelease = selectedSlot?.slotId;
    const isSuccess = bookingSuccess;
    
    return () => {
      if (slotToRelease && !isSuccess) {
        releaseLock(slotToRelease).catch(() => {});
      }
    };
  }, [selectedSlot, bookingSuccess]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarningTime = timer < 60;

  const hasResult = fetchState === "done";
  const isLoading = fetchState === "loading";
  const isError = fetchState === "error";

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button 
            onClick={() => {
              if (selectedSlot && !bookingSuccess) {
                releaseLock(selectedSlot.slotId).catch(() => {});
              }
              navigate("/dashboard", { state: { activeClusterId: "booking" } });
            }}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <Search size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Tìm kiếm ca khám trống</span>
          </h1>
          <p className="text-white/80 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Chọn ngày khám, sau đó chọn bác sĩ có lịch làm việc trong ngày để xem các khung giờ còn trống.
          </p>
        </div>
      </div>

      {prefillDepartmentName && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", marginBottom: "16px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
          Đang lọc bác sĩ theo chuyên khoa AI đề xuất: <strong>{prefillDepartmentName}</strong>
        </div>
      )}

      {!bookingStep ? (
        <div className="flex flex-col gap-10 w-full items-center">
          <div className={`flex flex-col lg:flex-row justify-center gap-8 items-start w-full transition-all duration-500`}>
            <div className="patient-glass-card p-6 md:p-8 w-full max-w-[600px] mx-auto lg:mx-0">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="as-workDate" className="patient-label text-[14px]">Ngày khám</label>
                <input
                  type="date"
                  id="as-workDate"
                  min={today}
                  value={workDate}
                  className="w-full px-4 py-3 patient-glass-input"
                  onChange={(e) => {
                    setWorkDate(e.target.value);
                    setDoctorId("");
                    setSlots([]);
                    setFetchState("idle");
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="as-doctorId" className="patient-label text-[14px]">Bác sĩ có lịch trong ngày</label>
                <select
                  id="as-doctorId"
                  value={doctorId}
                  className="w-full px-4 py-3 patient-glass-input disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={!workDate || doctorFetchState === "loading" || doctorOptions.length === 0}
                >
                  <option value="">
                    {!workDate
                      ? "Chọn ngày khám trước"
                      : doctorFetchState === "loading"
                        ? "Đang tải bác sĩ..."
                        : doctorOptions.length === 0
                          ? "Không có bác sĩ phù hợp"
                          : "Chọn bác sĩ"}
                  </option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.doctorId} value={doctor.doctorId}>
                      {getDoctorLabel(doctor)}
                      {doctor.departmentName ? ` - ${doctor.departmentName}` : ""}
                      {getDoctorScheduleText(doctor.doctorId) ? ` (${getDoctorScheduleText(doctor.doctorId)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {doctorFetchState === "loading" && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#334155",
                  fontWeight: "bold"
                }}
              >
                <CalendarDays size={14} />
                Đang tìm bác sĩ có lịch làm việc trong ngày {workDate}...
              </div>
            )}

            {doctorFetchState === "error" && (
              <div className="error-box" style={{ marginTop: "16px" }}>
                {doctorErrorMsg}
              </div>
            )}

            {workDate && doctorFetchState === "done" && doctorOptions.length === 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "rgba(0,0,0,0.05)",
                  color: "#1e293b",
                  fontSize: "13px",
                  fontWeight: "bold"
                }}
              >
                Không có bác sĩ nào có lịch làm việc trong ngày này. Hãy chọn ngày khác.
              </div>
            )}

            {workDate && doctorOptions.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                {doctorOptions.map((doctor) => {
                  const isSelected = String(doctor.doctorId) === doctorId;
                  return (
                    <button
                      key={doctor.doctorId}
                      type="button"
                      onClick={() => setDoctorId(String(doctor.doctorId))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: isSelected ? "1.5px solid #0f766e" : "1px solid rgba(0, 0, 0, 0.15)",
                        background: isSelected ? "rgba(15, 118, 110, 0.15)" : "rgba(0, 0, 0, 0.05)",
                        backdropFilter: "blur(8px)",
                        boxShadow: isSelected ? "0 4px 12px rgba(15, 118, 110, 0.15)" : "none",
                        color: "#0f172a",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <UserRound size={18} color={isSelected ? "#0f766e" : "#475569"} />
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: "14px", fontWeight: 800 }}>{getDoctorLabel(doctor)}</strong>
                          <span style={{ display: "block", fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                            {[doctor.departmentName, doctor.specialization].filter(Boolean).join(" - ") || "Chưa có chuyên khoa"}
                          </span>
                        </span>
                      </span>
                      <span style={{ fontSize: "12px", color: "#0f766e", fontWeight: 800, whiteSpace: "nowrap" }}>
                        {getDoctorScheduleText(doctor.doctorId)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDoctor && workDate && (
              <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-700 font-bold">
                <CalendarDays size={14} />
                Đang hiển thị ca khám của {getDoctorLabel(selectedDoctor)} vào ngày {workDate}
              </div>
            )}
          </div>

          {selectedDoctor && doctorId && (
            <div className="patient-glass-card p-6 lg:p-8 animate-[fadeIn_0.3s_ease] w-full max-w-[450px] mx-auto lg:mx-0">
              <h3 className="text-[1.1rem] patient-section-title mb-6 flex items-center gap-2">
                 Chi tiết Bác sĩ
              </h3>
              <div className="flex gap-5 items-center">
                <div className="w-20 h-20 rounded-full bg-teal-900/50 flex-shrink-0 flex items-center justify-center border-2 border-teal-400/50 shadow-sm overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedDoctor.doctorId}&backgroundColor=115e59`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <strong className="text-lg patient-data font-extrabold">{getDoctorLabel(selectedDoctor)}</strong>
                  <span className="text-sm patient-data font-bold mb-2">{selectedDoctor.departmentName || "Khám tổng quát"}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} className="fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
              </div>
              {getDoctorScheduleText(selectedDoctor.doctorId) && (
                <div className="mt-6 flex justify-end">
                  <span className="text-xs font-bold text-teal-900 bg-teal-100 border border-teal-300 px-4 py-2 rounded-full shadow-sm tracking-wide">
                    {getDoctorScheduleText(selectedDoctor.doctorId)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

          {fetchState === "idle" && (!workDate || (doctorOptions.length > 0 && !doctorId)) && (
            <div className="text-center py-20 px-4 text-slate-800 max-w-[600px] font-bold">
              <Search size={56} strokeWidth={1.5} className="mx-auto mb-4 opacity-20" />
              <p className="text-[15px] m-0">
                {!workDate
                  ? "Vui lòng chọn ngày khám để hệ thống đề xuất bác sĩ có lịch làm việc."
                  : "Vui lòng chọn một bác sĩ trong danh sách đề xuất để xem ca trống."}
              </p>
            </div>
          )}

          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "24px 0",
                color: "#1e293b",
                fontWeight: "bold"
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2.5px solid #cbd5e1",
                  borderTopColor: "#0f766e",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Đang tải danh sách ca khám...
            </div>
          )}

          {isError && (
            <div className="error-box" style={{ maxWidth: "600px" }}>
              {errorMsg}
            </div>
          )}

          {hasResult && slots.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                padding: "56px 20px",
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                borderRadius: "12px",
                maxWidth: "600px",
              }}
            >
              <CalendarDays size={36} style={{ color: "#475569" }} />
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#0f172a",
                }}
              >
                Hiện không có ca khám nào trống trong ngày này.
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#334155", fontWeight: 600 }}>
                Bác sĩ đã hết ca trống trong ngày này hoặc lịch đang được giữ chỗ tạm thời.
              </p>
            </div>
          )}

          {hasResult && slots.length > 0 && (
            <div className="animate-[fadeIn_0.3s_ease] w-full flex flex-col items-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <h2 className="m-0 text-[1.2rem] font-extrabold text-white flex items-center gap-2 drop-shadow-md">
                  <Clock size={22} className="text-teal-300" />
                  Các ca khám còn trống
                </h2>
                <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {slots.length} ca
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-3 max-w-[800px]">
                {slots.map((slot) => {
                  const isLocked = slot.status === "LOCKED" || slot.status === "BOOKED" || slot.status === "BLOCKED";
                  return (
                    <button
                      key={slot.slotId}
                      disabled={isLocked}
                      onClick={() => handleSelectSlot(slot)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-[13px] tracking-wide transition-all duration-200 ${
                        isLocked 
                          ? "bg-black/20 border border-dashed border-white/20 text-white/40 cursor-not-allowed backdrop-blur-sm" 
                          : "bg-white/15 backdrop-blur-md border border-white/30 text-white hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)] hover:border-white/60 hover:bg-white/25 cursor-pointer shadow-sm"
                      }`}
                    >
                      <Clock size={15} strokeWidth={2.5} />
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      {slot.status === "LOCKED" && " (Đang giữ)"}
                      {slot.status === "BOOKED" && " (Đã đặt)"}
                      {slot.status === "BLOCKED" && " (Tạm đóng)"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="patient-glass-card p-6 md:p-8 w-full max-w-[600px] mx-auto relative animate-[fadeIn_0.3s_ease]">
          {isExpired && (
            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md rounded-[2rem] flex flex-col items-center justify-center z-10 animate-[fadeIn_0.15s_ease]">
              <ShieldAlert size={56} className="text-rose-450 mb-4" strokeWidth={1.5} />
              <h3 className="m-0 text-white text-xl font-extrabold mb-2">
                Phiên giữ chỗ đã hết hạn
              </h3>
              <p className="m-0 text-white/70 font-medium">
                Đang tự động quay trở lại màn hình chọn ca khám...
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8 border-b border-slate-300 pb-5">
            <button
              onClick={handleCancelBooking}
              className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-950 font-bold text-[13px] transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Quay lại chọn ca
            </button>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] tracking-wide border transition-colors ${
              isWarningTime ? "bg-red-100 text-red-700 border-red-350 animate-pulse" : "bg-teal-100 text-teal-900 border-teal-300"
            }`}>
              <Clock size={16} strokeWidth={2.5} />
              <span>Thời gian giữ chỗ: {timeString}</span>
            </div>
          </div>

          {bookingSuccess ? (
            <div className="text-center py-12">
              <CheckCircle size={64} strokeWidth={1.5} className="mx-auto mb-5 text-emerald-600" />
              <h3 className="m-0 text-2xl font-extrabold mb-2 text-slate-900">
                Đặt lịch thành công!
              </h3>
              <p className="m-0 text-slate-700 font-bold">
                Hệ thống đang cập nhật trạng thái của ca khám...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitBooking}>
              <h2 className="m-0 mb-5 text-[1.3rem] patient-section-title tracking-tight">
                Thông tin đặt lịch khám
              </h2>

              <div className="bg-black/5 rounded-2xl p-5 mb-6 border border-slate-300 shadow-sm">
                <div className="flex justify-between items-center mb-3.5">
                  <span className="patient-label text-[13px] uppercase tracking-wider">Bác sĩ</span>
                  <strong className="patient-data font-extrabold">{getDoctorLabel(selectedDoctor)}</strong>
                </div>
                <div className="flex justify-between items-center mb-3.5">
                  <span className="patient-label text-[13px] uppercase tracking-wider">Ngày khám</span>
                  <strong className="patient-data font-extrabold">{workDate}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="patient-label text-[13px] uppercase tracking-wider">Khung giờ</span>
                  <strong className="patient-data bg-teal-100 border border-teal-300 px-3.5 py-1.5 rounded-lg shadow-sm font-extrabold">
                    {selectedSlot ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}` : ""}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col gap-2">
                  <label htmlFor="bk-name" className="patient-label text-[13px]">
                    Họ tên Bệnh nhân <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    id="bk-name"
                    required
                    placeholder="Nhập đầy đủ họ tên bệnh nhân"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-4 py-3 patient-glass-input placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bk-phone" className="patient-label text-[13px]">
                    Số điện thoại liên hệ <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    id="bk-phone"
                    required
                    placeholder="Nhập số điện thoại liên hệ"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-4 py-3 patient-glass-input placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="bk-reason" className="patient-label text-[13px]">
                    Lý do khám bệnh
                  </label>
                  <textarea
                    id="bk-reason"
                    rows={3}
                    placeholder="Mô tả ngắn gọn lý do khám bệnh"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    disabled={isExpired}
                    className="w-full px-4 py-3 patient-glass-input placeholder:text-slate-500 min-h-[100px] resize-y disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="patient-label text-[13px]">Phương thức thanh toán</label>
                  <div className="flex gap-6 mt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="payment"
                        value="CASH"
                        checked={paymentMethod === "CASH"}
                        onChange={() => setPaymentMethod("CASH")}
                        disabled={isExpired}
                        className="w-4 h-4 text-teal-600 border-slate-350 focus:ring-teal-500/30 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-[14px] font-bold patient-data group-hover:text-teal-700 transition-colors">Tiền mặt tại quầy</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="payment"
                        value="BANK"
                        checked={paymentMethod === "BANK"}
                        onChange={() => setPaymentMethod("BANK")}
                        disabled={isExpired}
                        className="w-4 h-4 text-teal-600 border-slate-350 focus:ring-teal-500/30 focus:ring-2 disabled:opacity-50"
                      />
                      <span className="text-[14px] font-bold patient-data group-hover:text-teal-700 transition-colors">Chuyển khoản (NH)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isExpired}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[15px] py-3.5 rounded-xl hover:shadow-[0_8px_20px_rgba(20,184,166,0.25)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed"
                >
                  Xác nhận đặt lịch
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  disabled={isExpired}
                  className="px-6 bg-black/5 text-slate-800 border border-slate-300 font-bold text-[15px] py-3.5 rounded-xl hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
