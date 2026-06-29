import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, UserRound, ArrowRight, ClipboardList } from "lucide-react";
import { getMyDoctorProfile } from "../../services/doctorService";
import { getSchedules, getSlotsByScheduleId } from "../../services/scheduleService";
import appointmentService from "../../services/appointmentService";
import PageHeader from "../../components/PageHeader";
import PatientRecordModal from "../../components/PatientRecordModal";
import { X, Phone, User, FileText, AlertCircle, FileSearch } from "lucide-react";

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function DoctorSchedulePage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Detail View state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Appointment details modal state
  const [selectedSlotAppointment, setSelectedSlotAppointment] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [viewPatientId, setViewPatientId] = useState(null);

  // Calculate Calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Adjusted to make Monday the first day of week
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6
  
  const daysInMonth = lastDay.getDate();

  const fetchDoctorAndSchedules = useCallback(async () => {
    setLoading(true);
    try {
      // Get Doctor Profile
      const profileRes = await getMyDoctorProfile();
      const doctor = profileRes.data;
      setDoctorProfile(doctor);

      // Get Schedules for the current month view (padding a bit before and after)
      const fromDate = new Date(year, month, 1).toISOString().split("T")[0];
      const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const schedRes = await getSchedules({
        doctorId: doctor.doctorId,
        fromDate,
        toDate
      });
      setSchedules(schedRes.data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchDoctorAndSchedules();
  }, [fetchDoctorAndSchedules]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = async (day, sched) => {
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(fullDate);
    setSelectedSchedule(sched);
    setSlots([]);

    if (sched) {
      setLoadingSlots(true);
      try {
        const res = await getSlotsByScheduleId(sched.scheduleId);
        setSlots(res.data || []);
      } catch (err) {
        console.error("Error fetching slots", err);
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const handleSlotClick = async (slot) => {
    if (slot.status !== "BOOKED") return;
    setLoadingAppointment(true);
    setShowAppointmentModal(true);
    try {
      const res = await appointmentService.getAppointmentBySlotId(slot.slotId);
      setSelectedSlotAppointment(res.data);
    } catch (err) {
      console.error("Error fetching appointment details", err);
      setShowAppointmentModal(false);
      // maybe show toast error
    } finally {
      setLoadingAppointment(false);
    }
  };

  const calendarCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="p-2 border border-slate-200/50 bg-slate-50/50 rounded-xl"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sched = schedules.find(s => s.workDate === fullDate);
    const isToday = fullDate === new Date().toISOString().split("T")[0];
    const isSelected = selectedDate === fullDate;

    calendarCells.push(
      <button
        key={`day-${day}`}
        onClick={() => handleDateClick(day, sched)}
        className={`relative min-h-[100px] p-3 rounded-xl border transition-all text-left flex flex-col gap-1
          ${isSelected ? "bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-200" : "bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm"}
        `}
      >
        <div className="flex justify-between items-start w-full">
          <span className={`text-sm font-extrabold w-8 h-8 flex items-center justify-center rounded-full ${isToday ? "bg-teal-600 text-white" : "text-slate-700"}`}>
            {day}
          </span>
        </div>
        
        {sched ? (
          <div className="mt-auto flex flex-col gap-1 w-full">
            <div className="flex flex-col items-start gap-1">
              <span className={`text-[11px] font-bold px-2 py-1 rounded-md w-max ${sched.status === "AVAILABLE" ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"}`}>
                {sched.status === "AVAILABLE" ? "Có ca trực" : "Đã hủy"}
              </span>
              {sched.status === "AVAILABLE" && sched.totalSlots > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md w-max ${sched.bookedSlots === sched.totalSlots ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                  {sched.bookedSlots}/{sched.totalSlots} đã đặt
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium line-clamp-1">
              {sched.startTime.slice(0, 5)} - {sched.endTime.slice(0, 5)}
            </span>
          </div>
        ) : (
          <div className="mt-auto">
            <span className="text-[11px] text-slate-400 font-medium">Trống</span>
          </div>
        )}
      </button>
    );
  }

  // Calculate statistics for the selected schedule
  const totalSlots = slots.length;
  const bookedSlots = slots.filter(s => s.status === "BOOKED").length;
  const availableSlots = slots.filter(s => s.status === "AVAILABLE").length;
  const blockedSlots = slots.filter(s => s.status === "BLOCKED").length;

  return (
    <div className="w-full flex flex-col items-center">
      <PageHeader
        title="Lịch Làm Việc Của Tôi"
        icon={CalendarDays}
        iconColor="text-white"
        subtitle="Quản lý lịch làm việc, theo dõi ca khám và xin nghỉ phép."
        onBack={() => navigate("/dashboard")}
      />

      <div className="flex flex-col xl:flex-row gap-6 w-full px-4 md:px-0">
        
        {/* Lịch (Calendar Grid) */}
        <div className="flex-1 patient-glass-panel rounded-[2rem] p-6 shadow-xl border-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">
              Tháng {month + 1}, {year}
            </h2>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date().toISOString().split("T")[0]);
              }} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors">
                Hôm nay
              </button>
              <button onClick={handleNextMonth} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center text-slate-500 font-medium">
              Đang tải lịch làm việc...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center font-bold text-slate-500 text-xs py-2">
                  {day}
                </div>
              ))}
              {calendarCells}
            </div>
          )}
        </div>

        {/* Chi tiết ngày (Sidebar) */}
        <div className="w-full xl:w-[380px] shrink-0">
          <div className="patient-glass-panel rounded-[2rem] p-6 shadow-xl border-0 sticky top-6">
            {!selectedDate ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <CalendarDays size={28} className="text-slate-400" />
                </div>
                <p className="font-medium">Chọn một ngày trên lịch để xem chi tiết</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <CalendarDays size={20} className="text-teal-600" />
                    Ngày {selectedDate.split("-").reverse().join("/")}
                  </h3>
                  {!selectedSchedule && (
                    <p className="text-sm text-slate-500 mt-2 font-medium">Bạn không có lịch làm việc trong ngày này.</p>
                  )}
                </div>

                {selectedSchedule && (
                  <>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Trạng thái</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${selectedSchedule.status === "AVAILABLE" ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"}`}>
                          {selectedSchedule.status === "AVAILABLE" ? "Đang hoạt động" : "Đã hủy"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">Thời gian trực</span>
                        <span className="text-sm font-bold text-slate-900">
                          {selectedSchedule.startTime.slice(0, 5)} - {selectedSchedule.endTime.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm">Thống kê ca khám</h4>
                      
                      {loadingSlots ? (
                        <div className="text-sm text-slate-500 text-center py-4">Đang tải...</div>
                      ) : totalSlots === 0 ? (
                        <div className="text-sm text-slate-500 text-center py-4">Chưa có slot khám nào được tạo.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-center">
                            <span className="block text-2xl font-black text-teal-700">{availableSlots}</span>
                            <span className="block text-xs font-bold text-teal-600 mt-1">Còn trống</span>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                            <span className="block text-2xl font-black text-blue-700">{bookedSlots}</span>
                            <span className="block text-xs font-bold text-blue-600 mt-1">Đã đặt</span>
                          </div>
                          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex justify-between items-center px-4">
                            <span className="text-sm font-bold text-slate-600">Tổng số ca khám:</span>
                            <span className="text-lg font-black text-slate-800">{totalSlots}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {slots.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                        <h4 className="font-bold text-slate-800 text-sm mb-1">Danh sách ca khám</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {slots.map((slot, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => handleSlotClick(slot)}
                              disabled={slot.status !== "BOOKED"}
                              className={`p-2 rounded-lg border text-center flex flex-col justify-center gap-1 transition-all ${
                                slot.status === "AVAILABLE" ? "bg-teal-50 border-teal-200 text-teal-800" :
                                slot.status === "BOOKED" ? "bg-blue-50 border-blue-300 text-blue-900 cursor-pointer hover:bg-blue-100 hover:shadow-md" :
                                "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                              <span className="text-xs font-bold">{slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</span>
                              <span className="text-[10px] font-semibold opacity-80">
                                {slot.status === "AVAILABLE" ? "Trống" : slot.status === "BOOKED" ? "Đã đặt (Xem)" : "Khóa"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <hr className="border-slate-200" />
                
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-slate-800 text-sm">Thao tác nhanh</h4>
                  <button
                    onClick={() => navigate("/dashboard/doctor-leave-requests", { 
                      state: { prefillDate: selectedDate } 
                    })}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700">
                        <ClipboardList size={16} />
                      </div>
                      <div className="text-left">
                        <strong className="block text-sm text-rose-800">Xin nghỉ phép / Đổi lịch</strong>
                        <span className="block text-xs text-rose-600">Gửi yêu cầu lên Admin</span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Appointment Detail Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Chi Tiết Lịch Hẹn
              </h3>
              <button 
                onClick={() => { setShowAppointmentModal(false); setSelectedSlotAppointment(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {loadingAppointment ? (
                <div className="py-10 text-center text-slate-500 font-medium animate-pulse">
                  Đang tải thông tin...
                </div>
              ) : selectedSlotAppointment ? (
                <>
                  <div className="flex items-start gap-4 w-full">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-extrabold text-slate-800 text-lg">
                        {selectedSlotAppointment.patientName}
                      </span>
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                        <Phone size={14} />
                        {selectedSlotAppointment.patientPhone || "Không có SĐT"}
                      </span>
                    </div>
                    {selectedSlotAppointment.patientId && (
                      <button
                        onClick={() => setViewPatientId(selectedSlotAppointment.patientId)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-lg border border-teal-200 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <FileSearch size={14} /> Hồ sơ
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3 mt-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mã lịch hẹn</span>
                      <span className="font-semibold text-slate-800">{selectedSlotAppointment.appointmentCode}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thời gian khám</span>
                      <span className="font-semibold text-slate-800">
                        {selectedSlotAppointment.startTime?.slice(0, 5)} - {selectedSlotAppointment.endTime?.slice(0, 5)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lý do khám</span>
                      <span className="font-medium text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1 block">
                        {selectedSlotAppointment.reasonForVisit || "Không có ghi chú"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-rose-500 flex flex-col items-center gap-2">
                  <AlertCircle size={32} />
                  <span className="font-medium">Không thể tải thông tin chi tiết.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
