import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Clock, Search, CalendarDays, ArrowLeft, ShieldAlert, CheckCircle, 
  UserRound, Star, X, Building, CalendarHeart, MapPin, 
  ChevronLeft, ChevronRight, Coins, Plus, CalendarPlus, UserCheck, ShieldCheck
} from "lucide-react";
import { getAvailableSlotsForPatient, getSchedules, lockSlot, releaseLock } from "../../services/scheduleService";
import { getDoctors } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { getMyProfiles, createDependentProfile } from "../../services/patientService";
import { getActiveMedicalServices } from "../../services/medicalServiceService";
import { getActiveDepartments } from "../../services/departmentService";
import { useToast } from "../../context/useToast";
import { useAuth } from "../../context/useAuth.js";
import { createOnlinePaymentUrl, verifySePayTransaction } from "../../services/paymentService";
import DoctorDetailModal from "../../components/DoctorDetailModal";

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
  doctorId?: number;
  doctorName?: string;
  appointmentId?: number;
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
  consultationFee?: number | string;
  doctorCode?: string;
  degree?: string;
  specialization?: string;
  status?: string;
  biography?: string;
  yearsOfExperience?: number;
  yearOfBirth?: number;
  hometown?: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

function formatTime(t: string): string {
  return String(t ?? "").slice(0, 5);
}

function secondsUntil(expiresAt?: string): number {
  if (!expiresAt) return 600;
  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return 600;
  return Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
}

export default function AvailableSlots() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();

  // Route state parsing
  const searchParams = new URLSearchParams(location.search);
  const paramWorkDate = searchParams.get("workDate") || "";
  const initialDoctorId = searchParams.get("doctorId") || String((location.state as any)?.prefillDoctorId || "");
  const prefillDepartmentName = (location.state as any)?.prefillDepartmentName;
  const initialSearchQuery = String((location.state as any)?.initialSearchQuery || "");

  const getLocalISODate = (d: Date = new Date()) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // States
  const [workDate, setWorkDate] = useState<string>(() => {
    if (paramWorkDate) return paramWorkDate;
    return getLocalISODate(); // default to today
  });
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  
  // Base Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorOption[]>([]);
  const [viewDoctorDetail, setViewDoctorDetail] = useState<DoctorOption | null>(null);
  
  // Interactive Calendar States
  const todayDate = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const d = paramWorkDate ? new Date(paramWorkDate) : new Date();
    return d.getMonth();
  });
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const d = paramWorkDate ? new Date(paramWorkDate) : new Date();
    return d.getFullYear();
  });

  // Schedule Map to show indicators in calendar
  const [upcomingSchedules, setUpcomingSchedules] = useState<string[]>([]);

  // Doctors & Slots state for selected date
  const [scheduledDoctors, setScheduledDoctors] = useState<DoctorOption[]>([]);
  const [doctorSlotsMap, setDoctorSlotsMap] = useState<{ [key: number]: TimeSlot[] }>({});
  const [unscheduledDoctorsDates, setUnscheduledDoctorsDates] = useState<{ [key: number]: string[] }>({});
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  // Booking process states
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [bookingStep, setBookingStep] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Profile selection
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showAddProfile, setShowAddProfile] = useState<boolean>(false);
  const [newProfile, setNewProfile] = useState({
    fullName: "",
    gender: "OTHER",
    dateOfBirth: "",
    phone: "",
    relationshipToUser: "CHILD",
    patientCode: ""
  });

  const [visitReason, setVisitReason] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [consultationFee, setConsultationFee] = useState<number>(300000); // Default to 300k
  const [specialtyServices, setSpecialtyServices] = useState<any[]>([]);
  const [showPriceModal, setShowPriceModal] = useState<boolean>(false);
  const [bookingPayment, setBookingPayment] = useState<any>(null);
  const [verifyingDeposit, setVerifyingDeposit] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Generate calendar grid
  const daysInGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    // getDay() mapping: Sun -> 0, Mon -> 1, ..., Sat -> 6. 
    // We want Monday as start (0), so:
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6; // Sunday

    const days: Date[] = [];
    
    // Previous month filling
    const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push(new Date(currentYear, currentMonth - 1, prevMonthLast - i));
    }

    // Current month filling
    const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= currentMonthDays; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    // Next month filling
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(currentYear, currentMonth + 1, i));
    }

    return days;
  }, [currentMonth, currentYear]);

  const monthYearLabel = useMemo(() => {
    return `Tháng ${currentMonth + 1}, ${currentYear}`;
  }, [currentMonth, currentYear]);

  // Load baseline data (departments, doctors, services)
  useEffect(() => {
    let isActive = true;
    const fetchBaseData = async () => {
      try {
        const [depRes, docRes, servicesRes] = await Promise.all([
          getActiveDepartments(),
          getDoctors({ page: 0, size: 200, status: "ACTIVE", sortBy: "doctorId", direction: "asc" }),
          getActiveMedicalServices()
        ]);
        
        if (!isActive) return;

        setDepartments(depRes.data || []);
        setAllDoctors(docRes.data?.content || []);
        
        const services = servicesRes.data || [];
        const consultService = services.find((s: any) => s.serviceType === "CONSULTATION");
        if (consultService && consultService.price) {
          setConsultationFee(consultService.price);
        }
        setSpecialtyServices(services.filter((s: any) => s.serviceType !== "CONSULTATION"));

        // If direct doctor prefill is present
        if (initialDoctorId) {
          const doc = (docRes.data?.content || []).find((d: any) => String(d.doctorId) === initialDoctorId);
          if (doc) {
            setSelectedDoctor(doc);
            // Search calendar for that doctor's active schedule and auto-set date
            const todayStr = getLocalISODate();
            const toDateStr = getLocalISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
            const scheds: any = await getSchedules({ doctorId: initialDoctorId, fromDate: todayStr, toDate: toDateStr, status: "AVAILABLE" });
            const schedulesList = Array.isArray(scheds.data) ? scheds.data : [];
            if (schedulesList.length > 0) {
              const targetDate = schedulesList[0].workDate;
              setWorkDate(targetDate);
              const targetD = new Date(targetDate);
              setCurrentMonth(targetD.getMonth());
              setCurrentYear(targetD.getFullYear());
            }
          }
        }
        
        if (prefillDepartmentName) {
          const matchedDep = (depRes.data || []).find((d: any) => d.departmentName === prefillDepartmentName);
          if (matchedDep) setSelectedDepartmentId(String(matchedDep.departmentId));
        }
      } catch (err) {
        console.error("Failed to load baseline data", err);
      }
    };
    fetchBaseData();
    return () => { isActive = false; };
  }, [initialDoctorId, prefillDepartmentName]);

  // Load upcoming 30 days schedule highlights for calendar
  useEffect(() => {
    let isActive = true;
    const fetchSchedulesForIndicator = async () => {
      try {
        const todayStr = getLocalISODate();
        const endRangeStr = getLocalISODate(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000));
        const params: any = { fromDate: todayStr, toDate: endRangeStr, status: "AVAILABLE" };
        
        // If specific department or query is selected, we could filter but let's just get overall active dates
        const res: any = await getSchedules(params);
        if (!isActive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const uniqueDates = Array.from(new Set(list.map((s: any) => s.workDate)));
        setUpcomingSchedules(uniqueDates);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSchedulesForIndicator();
    return () => { isActive = false; };
  }, []);

  // Fetch doctors and their slots for the selected date
  const fetchDoctorsAndSlots = useCallback(async (date: string, deptId: string, search: string) => {
    if (!allDoctors.length) return;
    setSlotsLoading(true);
    setDoctorSlotsMap({});
    try {
      // 1. Get all available schedules on selected date
      const res: any = await getSchedules({ fromDate: date, toDate: date, status: "AVAILABLE" });
      const schedules: DoctorSchedule[] = Array.isArray(res.data) ? res.data : [];
      const scheduledDoctorIds = new Set(schedules.map((s) => s.doctorId));
      
      // 2. Filter doctors based on schedules, selected department, and search query
      let filtered = allDoctors.filter((doc) => scheduledDoctorIds.has(doc.doctorId));
      if (deptId) {
        filtered = filtered.filter((doc) => String(doc.departmentId) === deptId);
      }
      if (search.trim()) {
        filtered = filtered.filter((doc) => doc.fullName.toLowerCase().includes(search.toLowerCase()) || doc.specialization?.toLowerCase().includes(search.toLowerCase()));
      }
      
      setScheduledDoctors(filtered);

      // 3. Query slots for each doctor in parallel
      const slotsPromises = filtered.map(async (doc) => {
        try {
          const slotsRes: any = await getAvailableSlotsForPatient(doc.doctorId, date);
          const slotsData: TimeSlot[] = Array.isArray(slotsRes.data) ? slotsRes.data : [];
          return { doctorId: doc.doctorId, slots: slotsData.sort((a, b) => a.startTime.localeCompare(b.startTime)) };
        } catch (e) {
          return { doctorId: doc.doctorId, slots: [] };
        }
      });

      const slotsResults = await Promise.all(slotsPromises);
      const newMap: { [key: number]: TimeSlot[] } = {};
      slotsResults.forEach((r) => {
        newMap[r.doctorId] = r.slots;
      });
      setDoctorSlotsMap(newMap);
    } catch (err: any) {
      toast.error("Không thể tải danh sách ca khám. Vui lòng thử lại.");
    } finally {
      setSlotsLoading(false);
    }
  }, [allDoctors, toast]);

  // Trigger loading when criteria changes
  useEffect(() => {
    fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
  }, [workDate, selectedDepartmentId, searchQuery, fetchDoctorsAndSlots]);

  // Load profiles for booking modal when open
  useEffect(() => {
    if (bookingStep && user) {
      getMyProfiles().then((res: any) => {
        setProfiles(res.data || []);
        if (res.data && res.data.length > 0 && !selectedProfileId) {
          const selfProfile = res.data.find((p: any) => p.relationshipToUser === "SELF");
          setSelectedProfileId(selfProfile ? selfProfile.patientId : res.data[0].patientId);
        }
      }).catch(console.error);
    }
  }, [bookingStep, user, selectedProfileId]);

  // Slot lock holding timer count down
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

  // Auto clean lock when timer expired
  useEffect(() => {
    if (isExpired) {
      const timeout = setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setIsExpired(false);
        fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isExpired, workDate, selectedDepartmentId, searchQuery, fetchDoctorsAndSlots]);

  // Cleanup lock if patient leaves or closes tab without completing booking
  useEffect(() => {
    const slotToRelease = selectedSlot?.slotId;
    const isSuccess = bookingSuccess;
    return () => {
      if (slotToRelease && !isSuccess) {
        releaseLock(slotToRelease).catch(() => {});
      }
    };
  }, [selectedSlot, bookingSuccess]);

  // Helper selectors
  const nextAvailableDateForDoctor = async (doc: DoctorOption) => {
    try {
      const todayStr = getLocalISODate();
      const endRangeStr = getLocalISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const res: any = await getSchedules({ doctorId: doc.doctorId, fromDate: todayStr, toDate: endRangeStr, status: "AVAILABLE" });
      const schedulesList = Array.isArray(res.data) ? res.data : [];
      if (schedulesList.length > 0) {
        const nextDate = schedulesList[0].workDate;
        setWorkDate(nextDate);
        const nextD = new Date(nextDate);
        setCurrentMonth(nextD.getMonth());
        setCurrentYear(nextD.getFullYear());
        toast.info(`Đã chuyển lịch sang ngày có lịch tiếp theo của bác sĩ: ${nextDate}`);
      } else {
        toast.error("Bác sĩ này hiện không có lịch trống trong 30 ngày tới.");
      }
    } catch (e) {
      toast.error("Không thể lấy lịch trình của bác sĩ.");
    }
  };

  // Find other doctors matching query that do not have schedules on current workDate
  const unscheduledMatchingDoctors = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const scheduledIds = new Set(scheduledDoctors.map((d) => d.doctorId));
    return allDoctors.filter((doc) => {
      const matchesSearch = doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDepartmentId ? String(doc.departmentId) === selectedDepartmentId : true;
      return matchesSearch && matchesDept && !scheduledIds.has(doc.doctorId);
    });
  }, [searchQuery, scheduledDoctors, allDoctors, selectedDepartmentId]);

  const selectUpcomingDate = (dateStr: string) => {
    setWorkDate(dateStr);
    const d = new Date(dateStr);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    toast.info(`Đã chuyển lịch sang ngày khám: ${dateStr.split("-").reverse().join("/")}`);
  };

  // Fetch next available dates for unscheduled doctors
  useEffect(() => {
    let isActive = true;
    if (unscheduledMatchingDoctors.length === 0) {
      setUnscheduledDoctorsDates({});
      return;
    }

    const fetchUpcomingDates = async () => {
      const todayStr = getLocalISODate();
      const endRangeStr = getLocalISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
      const promises = unscheduledMatchingDoctors.map(async (doc) => {
        try {
          const res: any = await getSchedules({ 
            doctorId: doc.doctorId, 
            fromDate: todayStr, 
            toDate: endRangeStr, 
            status: "AVAILABLE" 
          });
          const list = Array.isArray(res.data) ? res.data : [];
          const dates = Array.from(new Set(list.map((s: any) => s.workDate))).sort().slice(0, 3);
          return { doctorId: doc.doctorId, dates };
        } catch (e) {
          return { doctorId: doc.doctorId, dates: [] };
        }
      });

      const results = await Promise.all(promises);
      if (!isActive) return;

      const newMap: { [key: number]: string[] } = {};
      results.forEach((r) => {
        newMap[r.doctorId] = r.dates;
      });
      setUnscheduledDoctorsDates(newMap);
    };

    fetchUpcomingDates();
    return () => { isActive = false; };
  }, [unscheduledMatchingDoctors]);

  // Button actions
  const handleResumePayment = async (slot: TimeSlot, doc: DoctorOption) => {
    if (!slot.appointmentId) return;
    try {
      setSlotsLoading(true);
      const paymentApiRes: any = await createOnlinePaymentUrl({
        appointmentId: slot.appointmentId
      });
      const paymentData = paymentApiRes.data ?? paymentApiRes;
      
      const resumedBookingRes = {
        appointment: { appointmentId: slot.appointmentId },
        depositPayment: {
          paymentId: paymentData.paymentId,
          paymentCode: paymentData.paymentCode,
          amount: paymentData.amount,
          expiresAt: paymentData.expiresAt
        },
        paymentUrl: paymentData.paymentUrl,
        amount: paymentData.amount,
        expiresAt: paymentData.expiresAt
      };
      
      setSelectedSlot(slot);
      setSelectedDoctor(doc);
      setBookingPayment(resumedBookingRes);
      setBookingStep(true);
      setTimer(secondsUntil(paymentData.expiresAt));
      setIsExpired(false);
      setBookingSuccess(false);
      toast.info("Vui lòng quét QR và xác nhận thanh toán.");
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Không thể tải thông tin thanh toán.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSelectSlot = async (slot: TimeSlot, doc: DoctorOption) => {
    if (slot.status !== "AVAILABLE") return;
    try {
      await lockSlot(slot.slotId);
      setSelectedSlot(slot);
      setSelectedDoctor(doc);
      setBookingStep(true);
      setTimer(600); // 10 minutes lock holding time
      setIsExpired(false);
      setBookingSuccess(false);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Lịch khám này đã được người khác đặt trước. Vui lòng tải lại và chọn lịch khác.");
      fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
    }
  };

  const handleClosePaymentModal = async () => {
    if (!bookingPayment && selectedSlot) {
      try {
        await releaseLock(selectedSlot.slotId);
      } catch (e) {}
    }
    setBookingStep(false);
    setSelectedSlot(null);
    setIsExpired(false);
      setBookingPayment(null);
    fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
  };

  const handleAbortBooking = async () => {
    const apptId = bookingPayment?.appointment?.appointmentId || bookingPayment?.appointmentId;
    if (apptId) {
      const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy yêu cầu đặt lịch này không? Ca khám này sẽ được mở lại cho người khác.");
      if (!confirmCancel) return;
      try {
        await appointmentService.cancelAppointment(apptId, {
          cancellationReason: "Bệnh nhân hủy thanh toán cọc"
        });
        toast.success("Đã hủy yêu cầu đặt lịch và giải phóng ca khám.");
      } catch (err: any) {
        toast.error("Không thể hủy lịch hẹn: " + (err.response?.data?.message || err.message));
        return;
      }
    } else {
      if (selectedSlot) {
        try {
          await releaseLock(selectedSlot.slotId);
        } catch (e) {}
      }
    }
    setBookingStep(false);
    setSelectedSlot(null);
    setIsExpired(false);
    setBookingPayment(null);
    fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      let finalPatientId = selectedProfileId;
      if (showAddProfile) {
        if (!newProfile.fullName.trim() || !newProfile.phone.trim()) {
          toast.error("Vui lòng nhập họ tên và số điện thoại người thân.");
          return;
        }
        if (!/^(0|\+84)[0-9]{8,10}$/.test(newProfile.phone.trim())) {
          toast.error("Số điện thoại không hợp lệ.");
          return;
        }

        const res: any = await createDependentProfile({
          ...newProfile,
          patientCode: `PAT${Date.now()}`
        });
        finalPatientId = res.data?.patientId || res.patientId;
      }

      setSubmittingBooking(true);
      const bookingApiRes: any = await appointmentService.bookAppointment({
        slotId: selectedSlot.slotId,
        patientId: finalPatientId!,
        reasonForVisit: visitReason,
        paymentMethod: paymentMethod
      });
      let bookingRes: any = bookingApiRes.data ?? bookingApiRes;

      if (!bookingRes?.paymentUrl) {
         try {
           const paymentApiRes: any = await createOnlinePaymentUrl({
             appointmentId: bookingRes.appointmentId
           });
           const paymentData = paymentApiRes.data ?? paymentApiRes;
           bookingRes = {
             appointment: bookingRes,
             depositPayment: {
               paymentId: paymentData.paymentId,
               paymentCode: paymentData.paymentCode,
               amount: paymentData.amount,
               expiresAt: paymentData.expiresAt
             },
             paymentUrl: paymentData.paymentUrl,
             amount: paymentData.amount,
             expiresAt: paymentData.expiresAt
           };
         } catch (e) {
           throw new Error("Không thể tạo mã QR thanh toán.");
         }
      }

      setBookingPayment(bookingRes);
      setTimer(secondsUntil(bookingRes.expiresAt || bookingRes.depositPayment?.expiresAt));
      setSubmittingBooking(false);
      toast.info("Lịch đã được tạm giữ. Vui lòng quét QR và xác nhận thanh toán.");
    } catch (err: any) {
      setSubmittingBooking(false);
      const apiMsg = err.response?.data?.message || err.message;
      toast.error(apiMsg || "Đặt lịch thất bại. Vui lòng thử lại.");
    }
  };

  const handleVerifyDepositPayment = async () => {
    const paymentId = bookingPayment?.depositPayment?.paymentId;
    if (!paymentId) return;

    try {
      setVerifyingDeposit(true);
      await verifySePayTransaction(paymentId);
      setBookingSuccess(true);
      window.dispatchEvent(new CustomEvent("notification-updated"));
      window.dispatchEvent(new CustomEvent("appointment-updated"));

      setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setBookingPayment(null);
        setShowAddProfile(false);
        setVisitReason("");
        fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
        navigate("/dashboard/my-appointments?tab=upcoming");
      }, 1800);
    } catch (err: any) {
      toast.error(err.message || "Chưa tìm thấy giao dịch. Vui lòng thử lại sau.");
    } finally {
      setVerifyingDeposit(false);
    }
  };

  // Auto-polling for QR payment
  useEffect(() => {
    const paymentId = bookingPayment?.depositPayment?.paymentId;
    if (!paymentId || bookingSuccess || isExpired) return;

    const intervalId = setInterval(async () => {
      try {
        await verifySePayTransaction(paymentId, { skipErrorToast: true });
        setBookingSuccess(true);
        clearInterval(intervalId);
        window.dispatchEvent(new CustomEvent("notification-updated"));
        window.dispatchEvent(new CustomEvent("appointment-updated"));

        setTimeout(() => {
          setBookingStep(false);
          setSelectedSlot(null);
          setBookingPayment(null);
          setShowAddProfile(false);
          setVisitReason("");
          fetchDoctorsAndSlots(workDate, selectedDepartmentId, searchQuery);
          navigate("/dashboard/my-appointments?tab=upcoming");
        }, 1800);
      } catch (err) {
        // Continue polling
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [bookingPayment, bookingSuccess, isExpired, workDate, selectedDepartmentId, searchQuery, fetchDoctorsAndSlots, navigate]);

  // Handle Month Changing
  const handlePrevMonth = () => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // Get realistic room based on doctorId
  const getDoctorRoom = (docId: number) => {
    if (docId % 5 === 0) return "Phòng VIP 1";
    if (docId % 4 === 0) return `Phòng 30${docId % 10}`;
    return `Phòng 40${docId % 10 || 1}`;
  };

  // Use the fee configured for the doctor on the backend. The QR amount is generated from this value.
  const getDoctorPrice = (doc: DoctorOption) => {
    const doctorFee = Number(doc.consultationFee);
    return Number.isFinite(doctorFee) && doctorFee > 0 ? doctorFee : consultationFee;
  };

  // Timer string helpers
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarningTime = timer < 60;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8 pr-1 relative">
      {/* Title Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 shadow-sm">
              <CalendarHeart size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đặt lịch khám bệnh</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px] max-w-[650px] leading-relaxed">
            Chọn thời gian và bác sĩ phù hợp để bắt đầu hành trình chăm sóc sức khỏe của bạn một cách thoải mái nhất.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-bold hover:bg-slate-50 transition-all text-xs shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} />
          Quay lại tổng quan
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Column: Calendar & Specialty filter */}
        <div className="w-full lg:w-[320px] flex flex-col gap-5 shrink-0">
          {/* Custom Calendar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-4 w-full">
            <div className="flex justify-between items-center mb-4 px-1">
              <strong className="text-sm font-black text-slate-800 tracking-wide">{monthYearLabel}</strong>
              <div className="flex gap-1">
                <button 
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#4A5D59] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#4A5D59] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Doctor Detail Modal */}
            {viewDoctorDetail && (
              <DoctorDetailModal
                selectedDoctor={viewDoctorDetail}
                onClose={() => setViewDoctorDetail(null)}
              />
            )}

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                <span key={day} className="text-[11px] font-bold text-[#4A5D59] uppercase tracking-wider py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInGrid.map((date, idx) => {
                const dateStr = getLocalISODate(date);
                const isSelected = workDate === dateStr;
                const isCurrentMonth = date.getMonth() === currentMonth;
                const isPast = date < new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                const isToday = date.getDate() === todayDate.getDate() && date.getMonth() === todayDate.getMonth() && date.getFullYear() === todayDate.getFullYear();
                
                // Indicators for available doctor schedule
                const hasSchedule = upcomingSchedules.includes(dateStr);

                return (
                  <button
                    key={idx}
                    disabled={isPast}
                    onClick={() => {
                      setWorkDate(dateStr);
                    }}
                    className={`relative w-9 h-9 rounded-full flex flex-col items-center justify-center text-xs font-black transition-all cursor-pointer ${
                      isPast 
                        ? "text-slate-300 cursor-not-allowed bg-transparent" 
                        : isSelected
                          ? "bg-[#0A604E] text-white shadow-[0_4px_10px_rgba(10,96,78,0.22)]"
                          : isToday
                            ? "border border-[#1DB896] text-slate-800 bg-teal-50/20"
                            : isCurrentMonth
                              ? "text-slate-850 hover:bg-slate-100"
                              : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <span>{date.getDate()}</span>
                    {hasSchedule && !isPast && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1DB896]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialty Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-4 w-full">
            <h3 className="text-xs font-extrabold text-[#4A5D59] uppercase tracking-widest mb-4 flex items-center gap-1.5 px-1">
              <Building size={14} className="text-[#1DB896]" /> Lọc theo chuyên khoa
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDepartmentId("")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedDepartmentId === ""
                    ? "bg-[#D1F2EB] text-[#0A604E] shadow-[0_2px_6px_rgba(29,184,150,0.15)] border border-[#1DB896]/20"
                    : "bg-slate-50 text-[#4A5D59] border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Tất cả
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.departmentId}
                  onClick={() => setSelectedDepartmentId(String(dept.departmentId))}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedDepartmentId === String(dept.departmentId)
                      ? "bg-[#D1F2EB] text-[#0A604E] shadow-[0_2px_6px_rgba(29,184,150,0.15)] border border-[#1DB896]/20"
                      : "bg-slate-50 text-[#4A5D59] border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {dept.departmentName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Search + Doctor List */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {/* Direct Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-3 flex items-center gap-2 px-4">
            <Search size={18} className="text-[#4A5D59] shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm bác sĩ hoặc chuyên môn trực tiếp tại đây..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-bold text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full hover:bg-slate-150 text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Doctor Cards Container */}
          <div className="flex flex-col gap-4">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1DB896] rounded-full animate-spin mb-4" />
                <span className="text-sm text-slate-500 font-bold">Đang tải lịch bác sĩ & ca khám...</span>
              </div>
            ) : scheduledDoctors.length === 0 && unscheduledMatchingDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl text-center px-6">
                <CalendarPlus size={52} strokeWidth={1.2} className="text-[#4A5D59] opacity-35 mb-4" />
                <h3 className="text-lg font-black text-slate-800 mb-1">Không có bác sĩ nào trực ca</h3>
                <p className="text-sm text-[#4A5D59] max-w-[450px]">
                  Trong ngày đã chọn ({workDate}), hiện chưa có lịch khám trực tuyến hoặc các bác sĩ đã hết ca trống.
                </p>
                <p className="text-xs text-teal-600 font-bold mt-2">
                  Hãy thử chọn các ngày có đánh dấu chấm xanh lá trong bộ lịch bên trái!
                </p>
              </div>
            ) : (
              <>
                {/* Active Doctors on Date */}
                {scheduledDoctors.map((doc) => {
                  const slots = (doctorSlotsMap[doc.doctorId] || []).filter(slot => slot.status !== "EXPIRED");
                  const rating = doc.doctorId % 3 === 0 ? 5.0 : doc.doctorId % 2 === 0 ? 4.8 : 4.9;
                  const exp = doc.yearsOfExperience || 10;
                  const price = getDoctorPrice(doc);
                  const room = getDoctorRoom(doc.doctorId);

                  return (
                    <div 
                      key={doc.doctorId}
                      className="bg-white rounded-3xl border border-slate-200 hover:border-slate-350 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all p-5 flex flex-col md:flex-row gap-5 relative overflow-hidden"
                    >
                      {/* Left: Avatar & Rating */}
                      <div className="flex flex-row md:flex-col items-center gap-3 shrink-0">
                        <div 
                          className="w-24 h-24 rounded-2xl bg-teal-50 border-2 border-[#1DB896]/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner cursor-pointer hover:border-[#1DB896]/50 transition-colors"
                          onClick={() => setViewDoctorDetail(doc)}
                        >
                          <img 
                            src={doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName)}&background=e2e8f0&color=0f172a`}
                            alt={doc.fullName} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-[#F0F9F7] text-teal-700 font-black text-[11px] px-2 py-1 rounded-lg border border-[#1DB896]/10">
                          <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                          <span>{rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Right: Info & Slots */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        {/* Name & Specialty Info */}
                        <div className="relative">
                          <span className="absolute top-0 right-0 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            Kinh nghiệm {exp} năm
                          </span>
                          
                          <h3 
                            className="text-lg font-black text-slate-800 pr-24 mb-1 cursor-pointer hover:text-[#0A604E] transition-colors"
                            onClick={() => setViewDoctorDetail(doc)}
                          >
                            {doc.degree ? `${doc.degree}. ` : "BS. "}{doc.fullName}
                          </h3>
                          <p className="text-[13px] font-extrabold text-[#198E75] mb-2">
                            Chuyên khoa {doc.departmentName || doc.specialization || "Khám Tổng quát"}
                          </p>
                          <p className="text-xs text-[#4A5D59] font-medium leading-relaxed mb-4 line-clamp-2 max-w-[650px]">
                            {doc.yearOfBirth && <span className="font-bold text-[#198E75] mr-2">Sinh năm: {doc.yearOfBirth}</span>}
                            {doc.hometown && <span className="font-bold text-[#198E75] mr-2">Quê quán: {doc.hometown}</span>}
                            {doc.yearOfBirth || doc.hometown ? <br/> : null}
                            {doc.biography || `Bác sĩ ${doc.fullName} là chuyên gia y tế uy tín, giàu kinh nghiệm trong hoạt động điều trị các ca bệnh và tư vấn lâm sàng.`}
                          </p>
                        </div>

                        {/* Slots */}
                        <div className="mb-4">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                            Giờ Trống
                          </span>
                          {slots.length === 0 ? (
                            <span className="text-xs font-bold text-rose-500">
                              Hết ca trống trong ngày
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {slots.map((slot) => {
                                  let isAvailable = false;
                                  let isResumePayment = false;
                                  let statusText = "Trống";
                                  let buttonClass = "";

                                  if (slot.status === "AVAILABLE") {
                                    isAvailable = true;
                                    statusText = "Trống";
                                    buttonClass = "bg-white border border-[#1DB896]/30 text-slate-700 hover:border-[#1DB896] hover:text-[#0A604E] hover:bg-[#D1F2EB] cursor-pointer shadow-sm";
                                  } else if (slot.status === "PENDING_PAYMENT") {
                                    isResumePayment = true;
                                    statusText = "Thanh toán tiếp";
                                    buttonClass = "bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 cursor-pointer shadow-sm animate-pulse";
                                  } else if (slot.status === "LOCKED") {
                                    isResumePayment = true;
                                    statusText = "Đang giữ";
                                    buttonClass = "bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 cursor-pointer shadow-sm";
                                  } else if (slot.status === "BOOKED" || slot.status === "BLOCKED") {
                                    statusText = "Đã kín";
                                    buttonClass = "bg-amber-50 border border-amber-200 text-amber-600 cursor-not-allowed opacity-90";
                                  } else if (slot.status === "EXPIRED") {
                                    statusText = "Đã qua";
                                    buttonClass = "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-70";
                                  } else {
                                    statusText = "Đã kín";
                                    buttonClass = "bg-amber-50 border border-amber-200 text-amber-600 cursor-not-allowed opacity-90";
                                  }

                                  return (
                                    <button
                                      key={slot.slotId}
                                      disabled={!isAvailable && !isResumePayment}
                                      onClick={() => {
                                        if ((slot.status === "PENDING_PAYMENT" || slot.status === "LOCKED") && slot.appointmentId) {
                                          handleResumePayment(slot, doc);
                                        } else if (!isResumePayment) {
                                          handleSelectSlot(slot, doc);
                                        }
                                      }}
                                      className={`px-3 py-2 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center min-w-[120px] ${buttonClass}`}
                                    >
                                      {formatTime(slot.startTime)} - {statusText}
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>

                        {/* Bottom Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 mt-2">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-xs text-[#4A5D59] font-bold">
                              <Coins size={14} className="text-[#1DB896]" />
                              {price.toLocaleString("vi-VN")} đ
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-[#4A5D59] font-bold">
                              <MapPin size={14} className="text-[#1DB896]" />
                              {room}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {slots.length > 0 && (
                              <span className="text-[11px] font-bold text-slate-400">
                                Chọn khung giờ trống ở trên rồi bấm đặt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Direct Search: Matches who are not on schedule today */}
                {unscheduledMatchingDoctors.length > 0 && (
                  <div className="mt-6 border-t border-dashed border-slate-200 pt-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      Bác sĩ khác phù hợp tìm kiếm (Không có lịch ngày {workDate.split("-").reverse().join("/")})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unscheduledMatchingDoctors.map((doc) => {
                        const rating = doc.doctorId % 3 === 0 ? 5.0 : doc.doctorId % 2 === 0 ? 4.8 : 4.9;
                        const exp = doc.yearsOfExperience || 10;
                        const dates = unscheduledDoctorsDates[doc.doctorId] || [];
                        
                        return (
                          <div 
                            key={doc.doctorId}
                            className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col gap-3 group relative hover:bg-white hover:border-[#1DB896] hover:shadow-md transition-all"
                          >
                            <div className="flex gap-4 items-center w-full">
                              <div 
                                className="w-16 h-16 rounded-xl bg-slate-200 shrink-0 overflow-hidden border border-white cursor-pointer hover:border-[#1DB896]"
                                onClick={() => setViewDoctorDetail(doc)}
                              >
                                <img 
                                  src={doc.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName)}&background=e2e8f0&color=0f172a`} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 
                                  className="font-black text-slate-800 text-sm truncate cursor-pointer hover:text-[#0A604E]"
                                  onClick={() => setViewDoctorDetail(doc)}
                                >
                                  {doc.degree ? `${doc.degree}. ` : "BS. "}{doc.fullName}
                                </h5>
                                <p className="text-xs text-[#198E75] font-bold truncate mb-1">Khoa: {doc.departmentName || doc.specialization}</p>
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-200/50 px-1.5 py-0.5 rounded">
                                  {exp} năm kinh nghiệm
                                </span>
                              </div>
                            </div>

                            {/* Gợi ý ngày trực tiếp */}
                            <div className="border-t border-slate-100 pt-2.5 w-full">
                              {dates.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                    Gợi ý ngày trực tiếp theo:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dates.map((dStr) => {
                                      const [y, m, d] = dStr.split("-");
                                      return (
                                        <button
                                          key={dStr}
                                          type="button"
                                          onClick={() => selectUpcomingDate(dStr)}
                                          className="px-2.5 py-1 rounded-xl bg-[#D1F2EB] text-[#0A604E] hover:bg-[#0A604E] hover:text-white transition-all text-[10px] font-black border border-[#1DB896]/20 cursor-pointer shadow-sm"
                                        >
                                          {`${d}/${m}/${y}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-rose-500 font-bold">
                                  Bác sĩ không có lịch trực trong 30 ngày tới
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal (Replaces the page view overlay in original code) */}
      {bookingStep && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-3xl w-full max-w-[620px] shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
            
            {/* Locked Countdown Banner */}
            <div className={`px-6 py-3 flex justify-between items-center text-xs font-black border-b select-none transition-colors ${
              isWarningTime 
                ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse" 
                : "bg-teal-50 text-teal-800 border-teal-100"
            }`}>
              <span className="flex items-center gap-1">
                <ShieldAlert size={14} />
                Lưu ý: Ca khám này đang được tạm giữ để bạn thanh toán.
              </span>
              <span className="flex items-center gap-1 bg-white border px-2 py-0.5 rounded-md font-extrabold shadow-sm">
                <Clock size={12} />
                {timeString}
              </span>
            </div>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D1F2EB] text-[#0A604E] flex items-center justify-center border border-[#1DB896]/15 shadow-sm">
                  <UserCheck size={18} />
                </div>
                <h3 className="text-md font-black text-slate-800">Xác nhận thông tin đặt lịch</h3>
              </div>
              <button 
                onClick={handleClosePaymentModal} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Form */}
            <div className="overflow-y-auto custom-scrollbar p-6 flex-1 text-slate-900">
              {isExpired ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <ShieldAlert size={56} className="text-rose-500 mb-3" strokeWidth={1.5} />
                  <h4 className="text-lg font-black mb-1">Hết thời gian giữ chỗ!</h4>
                  <p className="text-xs text-slate-500 max-w-[320px]">
                    Lịch khám đã được mở khóa. Hệ thống đang tự động quay trở lại danh sách...
                  </p>
                </div>
              ) : bookingSuccess ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <CheckCircle size={60} className="text-emerald-600 mb-4" strokeWidth={1.5} />
                  <h4 className="text-lg font-black mb-1">Đặt lịch thành công!</h4>
                  <p className="text-xs text-slate-500 max-w-[320px]">
                    Lịch khám của bạn đã được đặt. Hãy đến đúng giờ theo lịch hẹn.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="flex flex-col gap-4">
                  {/* Doctor & Date Summary */}
                  <div className="bg-[#F0F9F7] border border-[#1DB896]/15 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      <img 
                        src={selectedDoctor?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor?.fullName || "BS")}&background=e2e8f0&color=0f172a`} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-sm">{selectedDoctor?.fullName}</h4>
                      <p className="text-xs text-slate-500 font-bold mb-1">Chuyên khoa: {selectedDoctor?.departmentName}</p>
                      <div className="flex gap-4 text-xs font-black mt-1">
                        <span className="text-[#0A604E] bg-[#D1F2EB] px-2 py-0.5 rounded">
                          {workDate}
                        </span>
                        <span className="text-[#0A604E] bg-[#D1F2EB] px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock size={10} />
                          {selectedSlot ? `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!bookingPayment ? (
                    <>
                      {/* Profile Selection */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Chọn Hồ sơ Bệnh nhân</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profiles.map((p) => (
                            <label 
                              key={p.patientId} 
                              className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                selectedProfileId === p.patientId && !showAddProfile 
                                  ? 'border-[#0A604E] bg-teal-50/20' 
                                  : 'border-slate-200 hover:border-teal-200'
                              }`}
                            >
                              <input
                                  type="radio"
                                  name="profile"
                                  checked={selectedProfileId === p.patientId && !showAddProfile}
                                  onChange={() => {
                                    setSelectedProfileId(p.patientId);
                                    setShowAddProfile(false);
                                  }}
                                  className="w-4 h-4 text-[#0A604E] focus:ring-[#0A604E]/30"
                              />
                              <div className="flex flex-col">
                                <span className="font-black text-xs text-slate-800">{p.fullName}</span>
                                <span className="text-[10px] text-[#4A5D59] font-bold">
                                  {p.relationshipToUser === 'SELF' ? 'Bản thân' : p.relationshipToUser} • {p.phone}
                                </span>
                              </div>
                            </label>
                          ))}
                          
                          <label 
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                              showAddProfile 
                                ? 'border-[#0A604E] bg-teal-50/20' 
                                : 'border-slate-200 hover:border-[#1DB896]/30'
                            }`}
                          >
                            <input
                              type="radio"
                              name="profile"
                              checked={showAddProfile}
                              onChange={() => setShowAddProfile(true)}
                              className="w-4 h-4 text-[#0A604E] focus:ring-[#0A604E]/30"
                            />
                            <div className="flex flex-col">
                              <span className="font-black text-xs text-[#0A604E] flex items-center gap-1">
                                <Plus size={12} /> Thêm người thân
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">Tạo hồ sơ bệnh nhân mới</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Add Profile Form */}
                      {showAddProfile && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-black text-slate-700 uppercase">Họ tên Bệnh nhân *</label>
                            <input
                              type="text"
                              required
                              placeholder="Nhập đầy đủ họ tên người thân"
                              value={newProfile.fullName}
                              onChange={(e) => setNewProfile({...newProfile, fullName: e.target.value})}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-black text-slate-700 uppercase">Mối quan hệ *</label>
                              <select
                                value={newProfile.relationshipToUser}
                                onChange={(e) => setNewProfile({...newProfile, relationshipToUser: e.target.value})}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              >
                                <option value="CHILD">Con cái</option>
                                <option value="PARENT">Bố/Mẹ</option>
                                <option value="SPOUSE">Vợ/Chồng</option>
                                <option value="OTHER">Khác</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[11px] font-black text-slate-700 uppercase">Số điện thoại *</label>
                              <input
                                type="tel"
                                required
                                placeholder="Số điện thoại"
                                value={newProfile.phone}
                                onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Visit Reason */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="bk-reason" className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Lý do khám bệnh
                        </label>
                        <textarea
                          id="bk-reason"
                          rows={2}
                          placeholder="Mô tả tóm tắt triệu chứng hoặc lý do khám..."
                          value={visitReason}
                          onChange={(e) => setVisitReason(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] outline-none placeholder-slate-450"
                        />
                      </div>

                      {/* Fees Section */}
                      <div className="bg-[#F0F9F7] border border-[#1DB896]/20 rounded-2xl p-4 flex flex-col gap-2.5 mt-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-[#4A5D59]">Phí tư vấn của Bác sĩ (Dự kiến)</span>
                          <span className="text-slate-800">
                            {selectedDoctor ? getDoctorPrice(selectedDoctor).toLocaleString("vi-VN") : consultationFee.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <div className="flex justify-between items-start pt-2.5 border-t border-teal-200/50">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              Đặt cọc giữ ca (Thanh toán online)
                              <span className="text-[9px] font-bold bg-[#D1F2EB] text-[#0A604E] px-1.5 py-0.5 rounded">Tạm giữ</span>
                            </span>
                            <span className="text-[10px] text-[#4A5D59] font-medium leading-relaxed mt-0.5">
                              Phí này được hoàn trả/khấu trừ trực tiếp khi bạn đến khám.
                            </span>
                          </div>
                          <span className="text-base font-black text-rose-600">
                            {selectedDoctor ? getDoctorPrice(selectedDoctor).toLocaleString("vi-VN") : consultationFee.toLocaleString("vi-VN")} VNĐ
                          </span>
                        </div>
                      </div>

                      {/* Pricing Reference Link */}
                      <div className="flex justify-end pr-1">
                        <button 
                          type="button" 
                          onClick={() => setShowPriceModal(true)} 
                          className="text-[11px] font-bold text-[#0A604E] hover:text-[#1DB896] underline transition-colors cursor-pointer"
                        >
                          Xem bảng giá dịch vụ bổ sung tham khảo
                        </button>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          type="submit"
                          disabled={submittingBooking}
                          className="flex-1 bg-[#0A604E] hover:bg-[#084f40] text-white font-black text-xs py-3.5 rounded-xl hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                        >
                          {submittingBooking ? "Đang tạo QR..." : "Tạo QR thanh toán cọc"}
                        </button>
                        <button
                          type="button"
                          onClick={handleClosePaymentModal}
                          className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-95">
                      <div className="p-2 border border-slate-200 rounded-2xl bg-white shadow-sm inline-block">
                        <img 
                          src={bookingPayment.paymentUrl} 
                          alt="QR Code thanh toán" 
                          className="w-48 h-48 rounded-xl object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800 mt-3">Thanh toán đặt cọc: {bookingPayment.amount?.toLocaleString("vi-VN")} đ</p>
                        <p className="text-xs font-bold text-rose-500 mt-1">Mã đơn: {bookingPayment.depositPayment?.paymentCode}</p>
                      </div>
                      <div className="flex flex-col w-full gap-3 mt-4">
                        <button
                          type="button"
                          className="w-full bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1] font-black text-xs py-3.5 rounded-xl flex items-center justify-center cursor-wait"
                          disabled
                        >
                          <div style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #cbd5e1", borderTopColor: "#64748b", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: 8 }}></div>
                          Đang chờ nhận tiền tự động...
                        </button>
                        <button
                          type="button"
                          onClick={handleAbortBooking}
                          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-black text-xs py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Price Reference Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800">Bảng giá dịch vụ xét nghiệm & khám</h3>
              <button 
                onClick={() => setShowPriceModal(false)} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {specialtyServices.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">Đang tải bảng giá dịch vụ...</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {specialtyServices.map((s) => (
                    <div 
                      key={s.serviceId} 
                      className="flex justify-between items-center p-3 rounded-2xl border border-slate-150 bg-white hover:border-[#1DB896]/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-slate-700">{s.serviceName}</span>
                        {s.description && (
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">
                            {s.description}
                          </span>
                        )}
                      </div>
                      <span className="font-black text-xs text-[#0A604E] shrink-0 ml-4">
                        {s.price.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Animations Injection */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
