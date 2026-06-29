import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock,
  ArrowRight, ClipboardList, AlertTriangle, Printer,
  User, Phone, FileSearch, RefreshCw, CheckCircle, HelpCircle
} from "lucide-react";
import { getMyDoctorProfile } from "../../services/doctorService";
import { getSchedules, getSlotsByScheduleId } from "../../services/scheduleService";
import appointmentService from "../../services/appointmentService";
import queueTicketService from "../../services/queueTicketService";
import PatientRecordModal from "../../components/PatientRecordModal";
import { useToast } from "../../context/useToast.js";

const DAYS_OF_WEEK = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CHỦ NHẬT"];

// Helper function to get Monday of the week
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export default function DoctorSchedulePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected schedule and slots details
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointmentsInShift, setAppointmentsInShift] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient record modal
  const [viewPatientId, setViewPatientId] = useState(null);

  // Calculate week days based on currentDate
  const monday = getMonday(currentDate);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }

  // Get week number
  const getWeekNumber = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  };

  const formatDayMonth = (d) => {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Helper to fetch data
  const fetchDoctorAndSchedules = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profile
      const profileRes = await getMyDoctorProfile();
      const profile = profileRes.data || profileRes;
      setDoctorProfile(profile);

      if (profile && profile.doctorId) {
        const fromDateStr = weekDays[0].toISOString().split("T")[0];
        const toDateStr = weekDays[6].toISOString().split("T")[0];

        const schedRes = await getSchedules({
          doctorId: profile.doctorId,
          fromDate: fromDateStr,
          toDate: toDateStr
        });
        const fetchedSchedules = schedRes.data || [];
        setSchedules(fetchedSchedules);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast?.error(error, "Không thể tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchDoctorAndSchedules();
  }, [fetchDoctorAndSchedules]);

  // Handle schedule select
  const handleScheduleSelect = async (sched) => {
    setSelectedSchedule(sched);
    setSelectedDate(sched.workDate);
    setSlots([]);
    setAppointmentsInShift([]);

    setLoadingSlots(true);
    try {
      const res = await getSlotsByScheduleId(sched.scheduleId);
      const slotsData = res.data || [];
      setSlots(slotsData);

      const bookedSlotsList = slotsData.filter(s => s.status === "BOOKED");
      if (bookedSlotsList.length > 0) {
        const apptPromises = bookedSlotsList.map(async (slot) => {
          try {
            const appRes = await appointmentService.getAppointmentBySlotId(slot.slotId);
            return { ...appRes.data, slot };
          } catch (e) {
            console.error("Error loading appointment details", e);
            return null;
          }
        });
        const appts = (await Promise.all(apptPromises)).filter(Boolean);
        setAppointmentsInShift(appts);
      }
    } catch (err) {
      console.error("Error loading slots/appointments", err);
      toast?.error(err, "Không thể tải chi tiết ca trực");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Auto select schedule when schedules load
  useEffect(() => {
    if (schedules.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const todaySched = schedules.find(s => s.workDate === todayStr);
      if (todaySched) {
        handleScheduleSelect(todaySched);
      } else {
        handleScheduleSelect(schedules[0]);
      }
    } else {
      setSelectedSchedule(null);
      setSelectedDate(null);
      setSlots([]);
      setAppointmentsInShift([]);
    }
  }, [schedules]);

  const handlePrevWeek = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isDateToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Start examination
  const handleStartExam = async (appt) => {
    if (!appt.queueTicket) {
      toast?.info("Bệnh nhân chưa có trong hàng đợi khám.");
      return;
    }
    try {
      const res = await queueTicketService.startExamination(appt.queueTicket.queueTicketId);
      toast?.success("Bắt đầu khám thành công!");
      if (res.data?.consultationId) {
        navigate(`/dashboard/examination/${res.data.consultationId}`);
      }
    } catch (err) {
      console.error(err);
      toast?.error(err, "Không thể bắt đầu ca khám");
    }
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Helper check for emergency reasons
  const isEmergency = (appt) => {
    const reason = (appt.reasonForVisit || "").toLowerCase();
    return reason.includes("khẩn cấp") || reason.includes("cấp cứu") || reason.includes("đau ngực") || reason.includes("nguy kịch");
  };

  return (
    <div className="w-full flex flex-col gap-6 p-1">
      {/* Title & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Lịch làm việc</h1>
          <p className="text-slate-500 font-bold text-xs mt-0.5">Lịch trực và danh sách bệnh nhân</p>
        </div>

        {/* Week navigation control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200/80 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="px-4 text-xs font-bold text-slate-700 tracking-wide">
              Tuần {getWeekNumber(monday)} – {formatDayMonth(weekDays[0])} đến {formatDayMonth(weekDays[6])}/{weekDays[6].getFullYear()}
            </span>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-xs tracking-wider transition-all shadow-sm active:scale-95"
          >
            Hôm nay
          </button>

          <button
            onClick={fetchDoctorAndSchedules}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="Làm mới"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="flex flex-col xl:flex-row gap-6 w-full items-start">

        {/* Left Side: Week Calendar Grid */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400 font-medium">
              <RefreshCw size={32} className="animate-spin text-teal-500" />
              <span>Đang tải lịch trực tuần này...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
              {weekDays.map((day, idx) => {
                const dateStr = day.toISOString().split("T")[0];
                const schedsForDay = schedules.filter(s => s.workDate === dateStr);
                const isToday = isDateToday(day);
                const isWeekend = idx === 6; // Sunday index

                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-3 min-h-[400px] p-2 rounded-2xl transition-all ${isToday ? "bg-emerald-50/20 border border-emerald-100/50" : ""
                      }`}
                  >
                    {/* Column Day Header */}
                    <div className="text-center py-2 flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-extrabold tracking-wider ${isWeekend ? "text-rose-400" : "text-slate-400"
                        }`}>
                      {DAYS_OF_WEEK[idx]}
                      </span>

                      <div className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-extrabold transition-all ${isToday
                          ? "bg-[#0A604E] text-white shadow-sm"
                          : isWeekend
                            ? "text-rose-500"
                            : "text-slate-800"
                        }`}>
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Schedule block items in this day */}
                    <div className="flex flex-col gap-2 flex-1">
                      {schedsForDay.length === 0 ? (
                        <div className="flex-1 rounded-xl border border-dashed border-slate-100 flex items-center justify-center p-3 text-center">
                          <span className="text-[10px] text-slate-300 font-medium font-sans">Trống</span>
                        </div>
                      ) : (
                        schedsForDay.map((sched, sIdx) => {
                          const isSelected = selectedSchedule?.scheduleId === sched.scheduleId;
                          const total = sched.totalSlots || 0;
                          const booked = sched.bookedSlots || 0;

                          // Mock emergency style if shift is marked or has emergencies
                          const hasEmergency = sched.status === "EMERGENCY" || (booked > 0 && sIdx % 3 === 2); // mockup or actual
                          const isNightShift = sched.startTime && parseInt(sched.startTime.split(":")[0]) >= 18;

                          let cardBg = "bg-slate-50/80 border-slate-100 hover:bg-slate-100/60 text-slate-700";
                          let borderStyle = "border";

                          if (isSelected) {
                            cardBg = "bg-teal-50/40 border-[#0A604E] text-[#0A604E]";
                            borderStyle = "border-2";
                          } else if (hasEmergency) {
                            cardBg = "bg-rose-50/40 border-rose-100 hover:bg-rose-50/70 text-rose-800";
                          }

                          return (
                            <button
                              key={sIdx}
                              onClick={() => handleScheduleSelect(sched)}
                              className={`w-full rounded-2xl p-4 text-left transition-all flex flex-col gap-2.5 ${borderStyle} ${cardBg}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${hasEmergency
                                    ? "bg-rose-100 text-rose-700"
                                    : isSelected
                                      ? "bg-teal-100/60 text-teal-850"
                                      : "bg-slate-100 text-slate-600"
                                  }`}>
                                  {booked} ca
                                </span>

                                {isToday && !isNightShift && sched.status === "AVAILABLE" && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                              </div>

                              <div className="flex flex-col">
                                <span className="text-xs font-extrabold tracking-tight">
                                  {hasEmergency
                                    ? "Hội chẩn khẩn"
                                    : isNightShift
                                      ? "Trực Đêm"
                                      : doctorProfile?.department?.departmentName || "Khoa Khám Bệnh"}
                                </span>
                                {hasEmergency && (
                                  <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle size={10} /> Phòng VIP 102
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] opacity-75 font-semibold font-sans mt-auto">
                                {sched.startTime.slice(0, 5)} - {sched.endTime.slice(0, 5)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend section */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-5 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Trường hợp khẩn cấp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#1DB896] bg-transparent" />
              <span>Ngày hiện tại</span>
            </div>
          </div>
        </div>

        {/* Right Side: Shift Details / Patient Queue */}
        <div className="w-full xl:w-[420px] shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sticky top-6">
          {!selectedDate ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <CalendarDays size={26} className="text-slate-400" />
              </div>
              <p className="font-bold text-sm">Chọn một ca trực để xem danh sách bệnh nhân</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">

              {/* Right Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    {selectedSchedule && selectedSchedule.startTime
                      ? `${parseInt(selectedSchedule.startTime.split(":")[0]) >= 18 ? "Ca Đêm" : "Ca Sáng"} - ${selectedDate.split("-").reverse().slice(0, 2).join("/")}`
                      : `Lịch Trực - ${selectedDate.split("-").reverse().join("/")}`
                    }
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Danh sách bệnh nhân ({appointmentsInShift.length})
                  </p>
                </div>

                {selectedSchedule && (
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${selectedSchedule.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}>
                    {selectedSchedule.status === "AVAILABLE" ? "Hoạt động" : "Đã hủy"}
                  </span>
                )}
              </div>

              {/* Patient list view */}
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {loadingSlots ? (
                  <div className="py-12 text-center text-slate-400 font-medium animate-pulse flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-teal-500" />
                    <span>Đang tải danh sách...</span>
                  </div>
                ) : appointmentsInShift.length === 0 ? (
                  <div className="text-center py-14 text-slate-400 flex flex-col items-center gap-3 border border-dashed border-slate-200 rounded-2xl">
                    <User size={24} className="text-slate-300" />
                    <span className="text-xs font-bold">Chưa có bệnh nhân đặt lịch ca này</span>
                  </div>
                ) : (
                  appointmentsInShift.map((appt, idx) => {
                    const isUrgent = isEmergency(appt);
                    const initials = (appt.patientName || "BN")
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map(p => p[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 border transition-all flex flex-col gap-3 ${isUrgent
                            ? "bg-rose-50/30 border-rose-200/60"
                            : "bg-slate-50/40 border-slate-200/60"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[#0A604E] flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 text-sm">{appt.patientName}</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                ID: #{appt.appointmentCode || appt.appointmentId}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[11px] font-black font-sans px-2 py-0.5 rounded-lg ${isUrgent ? "bg-rose-100 text-rose-700" : "bg-teal-50 text-[#0A604E]"
                            }`}>
                            {appt.slot?.startTime.slice(0, 5) || "08:00"}
                          </span>
                        </div>

                        {/* Description / Reason */}
                        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100/50">
                          {appt.reasonForVisit || "Kiểm tra sức khỏe định kỳ."}
                        </p>

                        {/* Actions footer */}
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => setViewPatientId(appt.patientId)}
                            className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <FileSearch size={14} />
                            Hồ sơ
                          </button>

                          <button
                            onClick={() => handleStartExam(appt)}
                            className={`flex-1 py-2 font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ${isUrgent
                                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10"
                                : "bg-[#0A604E] hover:bg-[#1DB896] text-white shadow-teal-500/10"
                              }`}
                          >
                            {isUrgent ? "XỬ LÝ NGAY" : "Bắt đầu"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Actions & Print */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePrint}
                  disabled={appointmentsInShift.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={15} />
                  In danh sách ca trực
                </button>

                <button
                  onClick={() => navigate("/dashboard/doctor-leave-requests", {
                    state: { prefillDate: selectedDate }
                  })}
                  className="w-full flex items-center justify-between p-3.5 bg-rose-50/30 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <ClipboardList size={16} />
                    </div>
                    <div className="text-left">
                      <strong className="block text-xs text-rose-800">Xin nghỉ phép / Đổi lịch</strong>
                      <span className="block text-[10px] text-rose-500 mt-0.5">Gửi yêu cầu đổi ca trực</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Patient Record Modal (Full History) */}
      {viewPatientId && (
        <PatientRecordModal
          patientId={viewPatientId}
          onClose={() => setViewPatientId(null)}
        />
      )}
    </div>
  );
}
