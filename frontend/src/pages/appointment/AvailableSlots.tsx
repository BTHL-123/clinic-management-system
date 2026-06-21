import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Search, CalendarDays, ArrowLeft, ShieldAlert, CheckCircle, UserRound, Star, X, Building, CalendarHeart } from "lucide-react";
import { getAvailableSlotsForPatient, getSchedules, lockSlot, releaseLock } from "../../services/scheduleService";
import { getDoctors } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { getMyProfiles, createDependentProfile } from "../../services/patientService";
import { getActiveMedicalServices } from "../../services/medicalServiceService";
import { getActiveDepartments } from "../../services/departmentService";
import { useToast } from "../../context/useToast";
import { useAuth } from "../../context/useAuth.js";

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
  departmentId?: number;
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
  const paramWorkDate = searchParams.get("workDate") || "";
  const initialDoctorId = searchParams.get("doctorId") || String((location.state as any)?.prefillDoctorId || "");
  const prefillDepartmentName = (location.state as any)?.prefillDepartmentName;

  // Mode Selection
  // If prefillDoctorId, default to DOCTOR mode. If prefillDepartmentName, default to DEPARTMENT.
  const [bookingMode, setBookingMode] = useState<"DATE" | "DOCTOR" | "DEPARTMENT" | null>(
    initialDoctorId ? "DOCTOR" : prefillDepartmentName ? "DEPARTMENT" : null
  );

  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [workDate, setWorkDate] = useState(paramWorkDate);
  const [departmentId, setDepartmentId] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorOption[]>([]); // For DOCTOR and DEPARTMENT mode
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesFetchState, setDatesFetchState] = useState<FetchState>("idle");

  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<DoctorSchedule[]>([]);
  const [doctorFetchState, setDoctorFetchState] = useState<FetchState>("idle");
  const [doctorErrorMsg, setDoctorErrorMsg] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [consultationFee, setConsultationFee] = useState<number>(50000); // default to 50k
  const [specialtyServices, setSpecialtyServices] = useState<any[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    fullName: "",
    gender: "OTHER",
    dateOfBirth: "",
    phone: "",
    relationshipToUser: "CHILD",
    patientCode: `PAT${Date.now()}`
  });

  const [visitReason, setVisitReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const selectedDoctor = bookingMode === "DATE" 
    ? doctorOptions.find((doctor) => String(doctor.doctorId) === doctorId)
    : allDoctors.find((doctor) => String(doctor.doctorId) === doctorId);

  const getDoctorScheduleText = (id: number) => {
    if (bookingMode !== "DATE") return ""; // Tránh tính text gộp ở mode khác vì hiển thị date riêng
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

  const fetchSlots = useCallback(async (did: string, date: string, optionsList?: DoctorOption[]) => {
    setFetchState("loading");
    setErrorMsg("");
    setSlots([]);
    try {
      if (did === "ANY" && optionsList) {
        const promises = optionsList.map(async (doc) => {
           try {
              const json: any = await getAvailableSlotsForPatient(doc.doctorId, date);
              const data: TimeSlot[] = Array.isArray(json.data) ? json.data : [];
              return data.map(s => ({ ...s, doctorId: doc.doctorId, doctorName: doc.fullName }));
           } catch (e) {
              return [];
           }
        });
        const allResults = await Promise.all(promises);
        const merged: any[] = [];
        allResults.forEach(res => merged.push(...res));
        merged.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSlots(merged);
      } else {
        const json: any = await getAvailableSlotsForPatient(Number(did), date);
        const data: TimeSlot[] = Array.isArray(json.data) ? json.data : [];
        setSlots(data);
      }
      setFetchState("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối đến máy chủ.");
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    if (bookingStep && user) {
      getMyProfiles().then((res: any) => {
        setProfiles(res.data);
        if (res.data.length > 0 && !selectedProfileId) {
          const selfProfile = res.data.find((p: any) => p.relationshipToUser === "SELF");
          setSelectedProfileId(selfProfile ? selfProfile.patientId : res.data[0].patientId);
        }
      }).catch(console.error);
    }
  }, [bookingStep, user]);

  useEffect(() => {
    if (doctorId && workDate) {
      if (doctorId === "ANY") {
        fetchSlots("ANY", workDate, doctorOptions);
      } else {
        fetchSlots(doctorId, workDate);
      }
    } else {
      setFetchState("idle");
      setSlots([]);
    }
  }, [doctorId, workDate, fetchSlots, doctorOptions]);

  useEffect(() => {
    let isActive = true;
    const fetchBaseData = async () => {
      try {
        const [depRes, docRes]: any[] = await Promise.all([
          getActiveDepartments(),
          getDoctors({ page: 0, size: 200, status: "ACTIVE", sortBy: "doctorId", direction: "asc" }),
        ]);
        if (isActive) {
          const deps = depRes.data || [];
          setDepartments(deps);
          setAllDoctors(docRes.data?.content || []);
          
          if (prefillDepartmentName) {
            const matchedDep = deps.find((d: any) => d.departmentName === prefillDepartmentName);
            if (matchedDep) setDepartmentId(String(matchedDep.departmentId));
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchBaseData();
    return () => { isActive = false; };
  }, [prefillDepartmentName]);

  useEffect(() => {
    let isActive = true;
    if ((bookingMode === "DOCTOR" || bookingMode === "DEPARTMENT") && doctorId && doctorId !== "ANY") {
      const fetchDates = async () => {
        setDatesFetchState("loading");
        setAvailableDates([]);
        try {
          const fromDate = new Date().toISOString().split("T")[0];
          const toDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          const res: any = await getSchedules({ doctorId, fromDate, toDate, status: "AVAILABLE" });
          if (isActive) {
            const schedules = Array.isArray(res.data) ? res.data : [];
            const uniqueDates = Array.from(new Set(schedules.map((s: any) => s.workDate))).sort();
            setAvailableDates(uniqueDates as string[]);
            setDatesFetchState("done");
          }
        } catch (e) {
          if (isActive) setDatesFetchState("error");
        }
      };
      fetchDates();
    } else {
      setAvailableDates([]);
      setDatesFetchState("idle");
    }
    return () => { isActive = false; };
  }, [doctorId, bookingMode]);

  useEffect(() => {
    let isActive = true;

    const fetchDoctorsByDate = async () => {
      setSlots([]);
      setFetchState("idle");
      setSelectedSlot(null);
      setBookingStep(false);

      // Load active medical services to get consultation fee
      const fetchServices = async () => {
        try {
          const res: any = await getActiveMedicalServices();
          if (res.data && Array.isArray(res.data)) {
            const consultService = res.data.find((s: any) => s.serviceType === "CONSULTATION");
            if (consultService && consultService.price) {
              setConsultationFee(consultService.price);
            }
            const otherServices = res.data.filter((s: any) => s.serviceType !== "CONSULTATION");
            setSpecialtyServices(otherServices);
          }
        } catch (err) {
          console.error("Failed to fetch medical services:", err);
        }
      };

      fetchServices();

      if (!workDate) {
        setScheduleOptions([]);
        setDoctorOptions([]);
        setDoctorFetchState("idle");
        setDoctorErrorMsg("");
        return;
      }

      setDoctorFetchState("loading");
      setDoctorErrorMsg("");
      try {
        const scheduleJson: any = await getSchedules({ fromDate: workDate, toDate: workDate, status: "AVAILABLE" });

        if (!isActive) return;

        const schedules: DoctorSchedule[] = Array.isArray(scheduleJson.data) ? scheduleJson.data : [];
        const scheduledDoctorIds = new Set(schedules.map((schedule) => schedule.doctorId));
        let availableDoctors = allDoctors.filter((doctor) => scheduledDoctorIds.has(doctor.doctorId));

        if (bookingMode === "DEPARTMENT" && departmentId) {
           availableDoctors = availableDoctors.filter((doctor) => String(doctor.departmentId) === departmentId);
        } else if (bookingMode === "DATE" && prefillDepartmentName) {
           availableDoctors = availableDoctors.filter((doctor) => doctor.departmentName === prefillDepartmentName);
        }

        setScheduleOptions(schedules);
        setDoctorOptions(availableDoctors);
        setDoctorFetchState("done");

        setDoctorId((prev) => {
          if (prev === "ANY") return "ANY";
          const idToCheck = prev || initialDoctorId;
          if (idToCheck) {
            const isAvailable = availableDoctors.some(d => String(d.doctorId) === String(idToCheck));
            if (isAvailable) return String(idToCheck);
          }
          return "";
        });
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

  const handleSelectSlot = async (slot: any) => {
    if (slot.status === "LOCKED" || slot.status === "BOOKED" || slot.status === "BLOCKED") return;
    try {
      await lockSlot(slot.slotId);
      setSelectedSlot(slot);
      if (slot.doctorId) {
         setDoctorId(String(slot.doctorId));
      }
      setBookingStep(true);
      setTimer(600);
      setIsExpired(false);
      setBookingSuccess(false);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Ca khám này đã được người khác giữ chỗ. Vui lòng chọn ca khác.", "Không thể giữ ca khám");
      if (doctorId && workDate) {
        if (doctorId === "ANY") fetchSlots("ANY", workDate, doctorOptions);
        else fetchSlots(doctorId, workDate);
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
      if (doctorId === "ANY") fetchSlots("ANY", workDate, doctorOptions);
      else fetchSlots(doctorId, workDate);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      let finalPatientId = selectedProfileId;
      if (showAddProfile) {
        if (!newProfile.fullName.trim() || !newProfile.phone.trim()) {
          toast.error("Vui lòng điền đầy đủ họ tên và số điện thoại người thân.", "Thiếu thông tin");
          return;
        }
        
        // Validation
        if (!/^(0|\+84)[0-9]{8,10}$/.test(newProfile.phone.trim())) {
          toast.error("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-11 chữ số).", "Lỗi");
          return;
        }

        const res: any = await createDependentProfile({
           ...newProfile,
           patientCode: `PAT${Date.now()}`
        });
        finalPatientId = res.data.patientId;
      }

      await appointmentService.bookAppointment({
        slotId: selectedSlot.slotId,
        patientId: finalPatientId,
        reasonForVisit: visitReason,
        paymentMethod: paymentMethod
      });
      setBookingSuccess(true);
      window.dispatchEvent(new CustomEvent("notification-updated"));
      setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setShowAddProfile(false);
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
        releaseLock(slotToRelease).catch(() => { });
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
    <div className="w-full min-h-full p-6 flex flex-col gap-6 patient-clean-page">
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button
            onClick={() => {
              if (selectedSlot && !bookingSuccess) {
                releaseLock(selectedSlot.slotId).catch(() => { });
              }
              if (!bookingStep && bookingMode) {
                setBookingMode(null);
                setDoctorId("");
                setWorkDate("");
                setDepartmentId("");
                setSlots([]);
              } else {
                navigate("/dashboard", { state: { activeClusterId: "booking" } });
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <CalendarHeart size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Đặt Lịch Khám</span>
          </h1>
          <p className="text-white/80 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            {!bookingMode && "Vui lòng chọn một trong các phương thức đặt lịch dưới đây."}
            {bookingMode === "DATE" && "Chọn ngày khám để xem danh sách bác sĩ có lịch làm việc, sau đó chọn ca khám trống."}
            {bookingMode === "DOCTOR" && "Chọn bác sĩ bạn muốn khám để xem các ngày bác sĩ có lịch làm việc, sau đó chọn ca khám trống."}
            {bookingMode === "DEPARTMENT" && "Chọn chuyên khoa bạn muốn khám để xem danh sách bác sĩ, sau đó chọn ca khám trống."}
          </p>
        </div>
      </div>

      {prefillDepartmentName && bookingMode === "DATE" && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", marginBottom: "16px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
          Đang lọc bác sĩ theo chuyên khoa AI đề xuất: <strong>{prefillDepartmentName}</strong>
        </div>
      )}

      {!bookingMode ? (
        <div className="flex flex-col gap-6 w-full items-center max-w-[900px] mx-auto animate-[fadeIn_0.3s_ease]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <button
              onClick={() => setBookingMode("DATE")}
              className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-lg hover:bg-white/20 hover:-translate-y-2 transition-all text-white text-center group"
            >
              <CalendarDays size={48} className="text-teal-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold">Theo Ngày</h3>
              <p className="text-sm text-white/70">Tôi đã biết ngày muốn khám và muốn xem bác sĩ nào có lịch.</p>
            </button>
            <button
              onClick={() => setBookingMode("DOCTOR")}
              className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-lg hover:bg-white/20 hover:-translate-y-2 transition-all text-white text-center group"
            >
              <UserRound size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold">Theo Bác sĩ</h3>
              <p className="text-sm text-white/70">Tôi muốn khám với một bác sĩ cụ thể mà tôi đã biết.</p>
            </button>
            <button
              onClick={() => setBookingMode("DEPARTMENT")}
              className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-lg hover:bg-white/20 hover:-translate-y-2 transition-all text-white text-center group"
            >
              <Building size={48} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold">Theo Chuyên khoa</h3>
              <p className="text-sm text-white/70">Tôi cần khám chuyên khoa và muốn chọn bác sĩ phù hợp.</p>
            </button>
          </div>
        </div>
      ) : !bookingStep ? (
        <div className="flex flex-col gap-10 w-full items-center">
          <button
            onClick={() => {
              setBookingMode(null);
              setDoctorId("");
              setWorkDate("");
              setDepartmentId("");
              setSlots([]);
            }}
            className="text-white hover:text-teal-300 font-bold underline transition-colors"
          >
            Đổi phương thức đặt lịch
          </button>
          <div className={`flex flex-col lg:flex-row justify-center gap-8 items-start w-full transition-all duration-500`}>
            <div className="patient-glass-card p-6 md:p-8 w-full max-w-[600px] mx-auto lg:mx-0">
              <div className="flex flex-col gap-5">
                {bookingMode === "DEPARTMENT" && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="as-departmentId" className="patient-label text-[14px]">Chọn Chuyên khoa</label>
                    <select
                      id="as-departmentId"
                      value={departmentId}
                      className="w-full px-4 py-3 patient-glass-input"
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        setDoctorId("");
                        setWorkDate("");
                        setSlots([]);
                      }}
                    >
                      <option value="">Chọn một chuyên khoa</option>
                      {departments.map(d => (
                        <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(bookingMode === "DOCTOR" || (bookingMode === "DEPARTMENT" && departmentId)) && (
                  <div className="flex flex-col gap-2">
                    <label className="patient-label text-[14px]">
                      {bookingMode === "DEPARTMENT" ? "Chọn Bác sĩ thuộc chuyên khoa này" : "Chọn Bác sĩ"}
                    </label>
                    <div className="grid gap-2 mt-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDoctorId("ANY");
                          setWorkDate("");
                          setSlots([]);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          doctorId === "ANY" 
                            ? "bg-teal-50 border-teal-500 shadow-sm" 
                            : "bg-black/5 border-slate-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <UserRound size={18} className={doctorId === "ANY" ? "text-teal-600" : "text-slate-500"} />
                        </div>
                        <div>
                          <strong className="block text-[14px] font-bold text-slate-800">Bác sĩ bất kỳ {bookingMode === "DEPARTMENT" ? "trong khoa này" : ""}</strong>
                          <span className="block text-[12px] text-slate-500 font-medium">Hệ thống sẽ chỉ định bác sĩ phù hợp</span>
                        </div>
                      </button>
                      
                      {allDoctors
                        .filter(d => bookingMode === "DOCTOR" || (bookingMode === "DEPARTMENT" && String(d.departmentId) === departmentId))
                        .map((doctor) => {
                          const isSelected = String(doctor.doctorId) === doctorId;
                          return (
                            <button
                              key={doctor.doctorId}
                              type="button"
                              onClick={() => {
                                setDoctorId(String(doctor.doctorId));
                                setWorkDate("");
                                setSlots([]);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected 
                                  ? "bg-teal-50 border-teal-500 shadow-sm" 
                                  : "bg-black/5 border-slate-200 hover:border-teal-300"
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden border border-white">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${doctor.doctorId}&backgroundColor=e2e8f0`} alt="Avatar" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <strong className="block text-[14px] font-bold text-slate-800 truncate">{getDoctorLabel(doctor)}</strong>
                                <span className="block text-[12px] text-slate-500 font-medium truncate">
                                  {[doctor.departmentName, doctor.specialization].filter(Boolean).join(" - ") || "Chưa có chuyên khoa"}
                                </span>
                              </div>
                            </button>
                          );
                      })}
                    </div>
                  </div>
                )}

                {(bookingMode === "DOCTOR" || bookingMode === "DEPARTMENT") && doctorId && (
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="patient-label text-[14px]">Chọn Ngày khám</label>
                    {datesFetchState === "loading" ? (
                      <div className="text-sm font-bold text-teal-800 bg-teal-50 p-3 rounded-lg border border-teal-200">
                        Đang tải lịch làm việc của bác sĩ...
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="text-sm font-bold text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-200">
                        Bác sĩ này hiện không có lịch làm việc trống trong 30 ngày tới.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableDates.map(date => {
                          const [y, m, d] = date.split("-");
                          const displayDate = `${d}/${m}/${y}`;
                          return (
                            <button
                              key={date}
                              onClick={() => setWorkDate(date)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                workDate === date 
                                  ? "bg-teal-600 text-white border-teal-700 shadow-md transform scale-105" 
                                  : "bg-white text-slate-700 border-slate-300 hover:border-teal-500 hover:text-teal-700"
                              }`}
                            >
                              {displayDate}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {bookingMode === "DATE" && (
                  <>
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
                  </>
                )}
              </div>

              {bookingMode === "DATE" && doctorFetchState === "loading" && (
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

              {bookingMode === "DATE" && doctorFetchState === "error" && (
                <div className="error-box" style={{ marginTop: "16px" }}>
                  {doctorErrorMsg}
                </div>
              )}

              {bookingMode === "DATE" && workDate && doctorFetchState === "done" && doctorOptions.length === 0 && (
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

              {bookingMode === "DATE" && workDate && doctorOptions.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDoctorId("ANY")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: doctorId === "ANY" ? "1.5px solid #0f766e" : "1px solid rgba(0, 0, 0, 0.15)",
                      background: doctorId === "ANY" ? "rgba(15, 118, 110, 0.15)" : "rgba(0, 0, 0, 0.05)",
                      backdropFilter: "blur(8px)",
                      boxShadow: doctorId === "ANY" ? "0 4px 12px rgba(15, 118, 110, 0.15)" : "none",
                      color: "#0f172a",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <UserRound size={18} color={doctorId === "ANY" ? "#0f766e" : "#475569"} />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: "14px", fontWeight: 800 }}>Bác sĩ bất kỳ</strong>
                        <span style={{ display: "block", fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                          Chọn giờ khám trước, hệ thống sẽ chỉ định bác sĩ.
                        </span>
                      </span>
                    </span>
                  </button>

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

            {selectedDoctor && doctorId && doctorId !== "ANY" && (
              <div className="patient-glass-card p-6 lg:p-8 animate-[fadeIn_0.3s_ease] w-full max-w-[450px] mx-auto lg:mx-0 border border-teal-200/50 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl"></div>
                <h3 className="text-[1.2rem] patient-section-title mb-6 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-teal-600" /> Hồ sơ Bác sĩ
                </h3>
                <div className="flex gap-5 items-center mb-6 relative z-10">
                  <div className="w-24 h-24 rounded-full bg-teal-50 flex-shrink-0 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedDoctor.doctorId}&backgroundColor=115e59`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-xl patient-data font-black text-slate-800">{getDoctorLabel(selectedDoctor)}</strong>
                    <span className="text-sm text-teal-700 font-extrabold mb-1">{selectedDoctor.departmentName || "Khám tổng quát"}</span>
                    <span className="text-xs bg-teal-100 text-teal-800 px-3 py-1 rounded-md font-bold self-start mb-3 border border-teal-200">
                      Bằng cấp: {selectedDoctor.degree || "Bác sĩ Chuyên khoa"}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} className="fill-amber-400 text-amber-400" />)}
                      <span className="text-xs font-bold text-slate-500 ml-1">4.9/5 (120+ đánh giá)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-6 relative z-10">
                   <div className="bg-white/80 p-2 rounded-xl border border-teal-100 shadow-sm text-center flex flex-col justify-center">
                      <div className="text-[1.1rem] font-black text-slate-700">{selectedDoctor.yearsOfExperience ? 25 + selectedDoctor.yearsOfExperience : "35"}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Tuổi</div>
                   </div>
                   <div className="bg-white/80 p-2 rounded-xl border border-teal-100 shadow-sm text-center flex flex-col justify-center">
                      <div className="text-[1.1rem] font-black text-teal-600">{selectedDoctor.yearsOfExperience || "10"}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Năm KN</div>
                   </div>
                   <div className="bg-white/80 p-2 rounded-xl border border-teal-100 shadow-sm text-center flex flex-col justify-center">
                      <div className="text-[1.1rem] font-black text-blue-600">98%</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Hài Lòng</div>
                   </div>
                   <div className="bg-white/80 p-2 rounded-xl border border-teal-100 shadow-sm text-center flex flex-col justify-center">
                      <div className="text-[1.1rem] font-black text-emerald-600">1.5k+</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Ca khám</div>
                   </div>
                </div>

                <div className="bg-white/50 p-4 rounded-xl border border-slate-100 shadow-sm relative z-10">
                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1"><CheckCircle size={14} className="text-teal-500"/> Tiểu sử & Chuyên môn</h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    {selectedDoctor.biography || `Bác sĩ ${selectedDoctor.fullName} là chuyên gia giàu kinh nghiệm trong lĩnh vực ${selectedDoctor.departmentName || "y tế"}. Luôn tận tâm với nghề và đặt sức khỏe bệnh nhân lên hàng đầu, bác sĩ đã điều trị thành công hàng ngàn ca bệnh phức tạp.`}
                  </p>
                </div>

                {getDoctorScheduleText(selectedDoctor.doctorId) && (
                  <div className="mt-6 flex justify-end relative z-10">
                    <span className="text-xs font-extrabold text-teal-800 bg-teal-100/80 border border-teal-300 px-4 py-2 rounded-full shadow-sm tracking-wide">
                      Ca làm việc: {getDoctorScheduleText(selectedDoctor.doctorId)}
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
                      key={`${slot.slotId}-${slot.doctorId || 's'}`}
                      disabled={isLocked}
                      onClick={() => handleSelectSlot(slot)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-[13px] tracking-wide transition-all duration-200 ${isLocked
                          ? "bg-black/20 border border-dashed border-white/20 text-white/40 cursor-not-allowed backdrop-blur-sm"
                          : "bg-white/15 backdrop-blur-md border border-white/30 text-white hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)] hover:border-white/60 hover:bg-white/25 cursor-pointer shadow-sm"
                        }`}
                    >
                      <Clock size={15} strokeWidth={2.5} />
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      {slot.doctorName && ` (${slot.doctorName})`}
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

            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] tracking-wide border transition-colors ${isWarningTime ? "bg-red-100 text-red-700 border-red-350 animate-pulse" : "bg-teal-100 text-teal-900 border-teal-300"
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
                <div className="flex flex-col gap-3">
                  <label className="patient-label text-[13px]">Chọn Hồ sơ Bệnh nhân</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {profiles.map(p => (
                      <label key={p.patientId} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedProfileId === p.patientId && !showAddProfile ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-200'}`}>
                        <input
                          type="radio"
                          name="profile"
                          checked={selectedProfileId === p.patientId && !showAddProfile}
                          onChange={() => {
                            setSelectedProfileId(p.patientId);
                            setShowAddProfile(false);
                          }}
                          disabled={isExpired}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500/30"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-[14px] text-slate-800">{p.fullName}</span>
                          <span className="text-[12px] text-slate-500">{p.relationshipToUser === 'SELF' ? 'Bản thân' : p.relationshipToUser} • {p.phone}</span>
                        </div>
                      </label>
                    ))}
                    
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${showAddProfile ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-200'}`}>
                        <input
                          type="radio"
                          name="profile"
                          checked={showAddProfile}
                          onChange={() => setShowAddProfile(true)}
                          disabled={isExpired}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500/30"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-[14px] text-teal-700">+ Thêm người thân</span>
                          <span className="text-[12px] text-slate-500">Tạo hồ sơ mới</span>
                        </div>
                    </label>
                  </div>
                </div>

                {showAddProfile && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
                      <label className="patient-label text-[13px]">Họ tên Bệnh nhân <span className="text-rose-600 font-bold">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Nhập đầy đủ họ tên"
                        value={newProfile.fullName}
                        onChange={(e) => setNewProfile({...newProfile, fullName: e.target.value})}
                        disabled={isExpired}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="patient-label text-[13px]">Mối quan hệ <span className="text-rose-600 font-bold">*</span></label>
                        <select
                          value={newProfile.relationshipToUser}
                          onChange={(e) => setNewProfile({...newProfile, relationshipToUser: e.target.value})}
                          disabled={isExpired}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        >
                          <option value="CHILD">Con cái</option>
                          <option value="PARENT">Bố/Mẹ</option>
                          <option value="SPOUSE">Vợ/Chồng</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="patient-label text-[13px]">Số điện thoại <span className="text-rose-600 font-bold">*</span></label>
                        <input
                          type="tel"
                          required
                          placeholder="Số điện thoại"
                          value={newProfile.phone}
                          onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                          disabled={isExpired}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-bold text-teal-900">Phí khám bệnh</span>
                      <span className="text-[15px] font-bold text-teal-900">{consultationFee.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-teal-200/50">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-teal-900 flex items-center gap-2">
                          Phí giữ chỗ (Thanh toán trước)
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-teal-200/50 text-teal-800 px-2 py-0.5 rounded-md">Bắt buộc</span>
                        </span>
                        <span className="text-[12px] text-teal-800/80 font-medium leading-snug mt-1 max-w-[250px]">
                          Phí này sẽ được khấu trừ vào tổng hóa đơn khi bạn đến khám.
                        </span>
                      </div>
                      <span className="text-[18px] font-black text-rose-600">50.000 VNĐ</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2 pr-1">
                    <button type="button" onClick={() => setShowPriceModal(true)} className="text-[12px] font-bold text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors">
                      Xem bảng giá dịch vụ chuyên khoa dự kiến
                    </button>
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

      {/* Price List Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Bảng giá tham khảo dịch vụ</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {specialtyServices.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-4">Đang cập nhật bảng giá...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {specialtyServices.map(s => (
                    <div key={s.serviceId} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white hover:border-teal-100 hover:shadow-sm transition-all">
                      <div className="flex flex-col">
                        <span className="font-bold text-[14px] text-slate-700">{s.serviceName}</span>
                        {s.description && <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{s.description}</span>}
                      </div>
                      <span className="font-black text-[15px] text-teal-600 shrink-0 ml-4">{s.price.toLocaleString("vi-VN")} đ</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
