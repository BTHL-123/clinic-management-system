import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import {
  Home, Users, CalendarDays, MessageCircle, Settings, Bell, LogOut,
  ChevronRight, Search, SlidersHorizontal, Activity, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Shield, Globe, User, Stethoscope,
  Headset
} from "lucide-react";
import { motion } from "framer-motion";
import { getMyDoctorProfile } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { getDoctorPerformance } from "../../services/reportService";
import { toLocalDateString } from "../../lib/utils";
import { emitToast } from "../../services/toastService";
import { getSchedules } from "../../services/scheduleService";
import doctorLeaveRequestService from "../../services/doctorLeaveRequestService";

export default function DoctorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [completedCount, setCompletedCount] = useState(1420);
  const [activePatientsCount, setActivePatientsCount] = useState(315);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleDays, setScheduleDays] = useState(new Set());
  const [leaveDays, setLeaveDays] = useState(new Set());

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const formatFullDateTime = (d) => {
    const days = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"];
    const dayName = days[d.getDay()];
    const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dayName}, ${dateStr} - ${timeStr} • PHÒNG KHÁM CHUYÊN KHOA`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch profile
        const profRes = await getMyDoctorProfile();
        const docData = profRes?.data || profRes;
        setProfile(docData);

        // 2. Fetch today's appointments
        const apptRes = await appointmentService.getDoctorTodayAppointments();
        const apptsList = apptRes?.data || apptRes || [];
        setAppointments(apptsList);

        // 3. Fetch doctor performance reports for completed count
        if (docData && docData.doctorId) {
          try {
            const perfRes = await getDoctorPerformance({
              from: "2020-01-01",
              to: toLocalDateString(new Date())
            });
            const perfList = perfRes?.data || perfRes || [];
            const myPerf = perfList.find(item => item.doctorId === docData.doctorId);
            if (myPerf) {
              setCompletedCount(myPerf.totalAppointments || 0);
              setActivePatientsCount(Math.round((myPerf.totalAppointments || 0) * 0.22) || 315);
            }
          } catch (err) {
            console.warn("Failed to fetch performance stats, using default values", err);
          }

          // 4. Fetch real schedule and leave data for the current month
          try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const fromDateStr = new Date(year, month, 1).toISOString().split('T')[0];
            const toDateStr = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const [schedRes, leaveRes] = await Promise.all([
              getSchedules({ doctorId: docData.doctorId, fromDate: fromDateStr, toDate: toDateStr }),
              doctorLeaveRequestService.getMyLeaveRequests()
            ]);

            const sData = schedRes?.data || schedRes || [];
            const lData = leaveRes?.data || leaveRes || [];

            const sSet = new Set(sData.map(s => {
               if(s.status !== "AVAILABLE") return null;
               const d = new Date(s.workDate);
               return (d.getMonth() === month && d.getFullYear() === year) ? d.getDate() : null;
            }).filter(Boolean));
            
            const lSet = new Set(lData.map(l => {
               if(l.status !== "APPROVED") return null;
               const d = new Date(l.leaveDate);
               return (d.getMonth() === month && d.getFullYear() === year) ? d.getDate() : null;
            }).filter(Boolean));

            setScheduleDays(sSet);
            setLeaveDays(lSet);
          } catch (err) {
            console.warn("Failed to fetch schedules or leave requests", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Doctor Home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMappedStatus = (app) => {
    if (app.status === "CANCELLED") return "Hủy";
    if (app.status === "COMPLETED") return "Hoàn thành";

    // Check queue status
    if (app.queueStatus === "WAITING") return "Đang chờ";
    if (app.queueStatus === "CALLED") return "Đang khám";
    if (app.queueStatus === "SKIPPED") return "Bỏ qua";
    if (app.queueStatus === "COMPLETED" || app.queueStatus === "DONE") return "Hoàn thành";

    if (app.checkedInAt) return "Đang chờ";
    return "Đang chờ"; // Fallback default for Confirmed/today
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang chờ": return "bg-amber-500/20 text-amber-800 border-amber-500/30";
      case "Đang khám": return "bg-sky-500/20 text-sky-800 border-sky-500/30";
      case "Hoàn thành": return "bg-emerald-500/20 text-emerald-800 border-emerald-500/30";
      case "Hủy": return "bg-rose-500/20 text-rose-800 border-rose-500/30";
      case "Bỏ qua": return "bg-slate-500/20 text-slate-700 border-slate-500/30";
      default: return "bg-slate-900/10 text-slate-700";
    }
  };

  // Generate real calendar days based on current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentMonthName = new Date(year, month, 1).toLocaleDateString("vi-VN", { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Start on Monday
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: offset });

  // Filter appointments
  const filteredAppointments = appointments.filter(app => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      app.patientName?.toLowerCase().includes(query) ||
      app.patientPhone?.toLowerCase().includes(query) ||
      app.appointmentCode?.toLowerCase().includes(query) ||
      (app.reasonForVisit || "").toLowerCase().includes(query)
    );
  });

  const waitingCount = appointments.filter(app => {
    const status = getMappedStatus(app);
    return status === "Đang chờ" || status === "Đang khám";
  }).length;
  const completedTodayCount = appointments.filter(app => getMappedStatus(app) === "Hoàn thành").length;
  const cancelledTodayCount = appointments.filter(app => getMappedStatus(app) === "Hủy").length;
  const totalTodayCount = appointments.length;

  const waitingPct = totalTodayCount > 0 ? (waitingCount / totalTodayCount) * 100 : 0;
  const completedPct = totalTodayCount > 0 ? (completedTodayCount / totalTodayCount) * 100 : 0;
  const cancelledPct = totalTodayCount > 0 ? (cancelledTodayCount / totalTodayCount) * 100 : 0;

  const donutGradient = totalTodayCount === 0 
    ? "conic-gradient(rgb(226, 232, 240) 0% 100%)" 
    : `conic-gradient(#2dd4bf 0% ${waitingPct}%, #60a5fa ${waitingPct}% ${waitingPct + completedPct}%, #f87171 ${waitingPct + completedPct}% 100%)`;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full h-full text-slate-800">
      
      {/* Header section matching Receptionist */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mb-2">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1 font-extrabold text-xs uppercase tracking-widest">
            <Headset size={14} />
            <span>HỆ THỐNG QUẢN LÝ PHÒNG KHÁM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-teal-600">Bác sĩ {profile?.fullName || user?.fullName?.split(" ").pop() || "Hùng"}</span>
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            {formatFullDateTime(currentTime)}
          </p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/examination')} 
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all hover:-translate-y-0.5 text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Bắt đầu khám bệnh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Lịch khám hôm nay</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarDays size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{loading ? "-" : totalTodayCount}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Đang chờ khám</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-amber-600">{loading ? "-" : waitingCount}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Đã khám xong</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{loading ? "-" : completedTodayCount}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">Hủy / Bỏ qua</p>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><XCircle size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-rose-600">{loading ? "-" : cancelledTodayCount}</h3>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch flex-1">
        {/* Left Column: Timeline (7 cols on XL, 8 on LG) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8 patient-glass-panel rounded-[2rem] p-6 shadow-xl flex flex-col h-full min-h-[500px]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-extrabold flex items-center gap-2 patient-card-title shrink-0">
              Phòng khám <span className="text-teal-600 font-bold">&bull; Hôm nay</span>
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10 text-teal-800/60">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm bệnh nhân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 text-slate-800 placeholder-slate-400 text-sm focus:outline-none transition-all font-semibold rounded-full border border-teal-600/20 bg-teal-50/50 hover:bg-teal-50/80 focus:bg-white focus:border-teal-600/50 focus:ring-2 focus:ring-teal-100"
                  style={{
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    paddingLeft: "2.5rem",
                    paddingRight: "1rem",
                    outline: "none"
                  }}
                />
              </div>
              <button className="text-teal-700/60 hover:text-teal-900 shrink-0"><MoreHorizontal size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative max-h-[600px]">
            {/* Vertical Timeline Line */}
            {filteredAppointments.length > 0 && (
              <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
            )}

            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="text-center py-12 text-slate-500 font-bold">Đang tải lịch hẹn...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-bold">Không có lịch hẹn nào hôm nay.</div>
              ) : (
                filteredAppointments.map((app) => {
                  const mappedStatus = getMappedStatus(app);
                  const formattedTime = app.startTime ? app.startTime.slice(0, 5) : "";
                  const reason = app.reasonForVisit || "Khám bệnh";
                  const avatarInitials = (app.patientName || "BN")
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <div key={app.appointmentId} className="flex gap-4 relative group animate-fade-in">
                      {/* Timeline Dot & Time */}
                      <div className="flex flex-col items-center w-[80px] shrink-0 z-10 bg-transparent pt-4">
                        <div className={`w-3 h-3 rounded-full border-2 border-[#115e59] mb-1 ${mappedStatus === 'Đang chờ' || mappedStatus === 'Đang khám' ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-white/30'}`}></div>
                        <span className="text-xs font-bold patient-label">{formattedTime}</span>
                      </div>

                      {/* Appointment Card */}
                      <div
                        className="flex-1 patient-glass-subcard hover:bg-white/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all duration-300 group-hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => navigate(`/dashboard/doctor-appointments`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-extrabold border border-white/20 shadow-md">
                            {avatarInitials}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg patient-data leading-tight">{app.patientName}</h3>
                            <p className="text-slate-600 text-sm font-semibold mt-1">SĐT: {app.patientPhone || "—"}</p>
                          </div>
                        </div>

                        <div className="hidden sm:block">
                          <h4 className="font-bold patient-data mb-0.5">{formattedTime}</h4>
                          <p className="text-teal-600 font-bold text-sm">{reason}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(mappedStatus)}`}>
                            {mappedStatus}
                          </span>
                          <div className="hidden md:flex gap-2 text-teal-700/60">
                            <button
                              className="p-1.5 hover:bg-white/10 hover:text-teal-900 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/consultation`);
                              }}
                            >
                              <MessageCircle size={18} />
                            </button>
                            <button
                              className="p-1.5 hover:bg-white/10 hover:text-teal-900 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/doctor-appointments`);
                              }}
                            >
                              <Activity size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Stats, Calendar, Profile (4 cols on LG) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full h-full">

          {/* Top Right: Patients & Medicine Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="patient-glass-panel rounded-[2rem] p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-6 patient-card-title">Bệnh nhân & Thuốc</h2>
            <div className="flex gap-6 items-center">
              <div className="flex-1 flex flex-col items-center">
                <p className="text-sm patient-label font-bold mb-4">Tình trạng ({totalTodayCount})</p>
                {/* CSS Donut Chart Dynamic */}
                <div 
                  className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                  style={{ background: donutGradient }}
                >
                  <div className="absolute w-[76px] h-[76px] rounded-full bg-white flex items-center justify-center shadow-md">
                    <span className="text-xl font-black patient-data">{totalTodayCount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4 w-full">
                  <div className="flex items-center gap-2 text-xs patient-data font-bold"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Đang chờ: {waitingCount}</div>
                  <div className="flex items-center gap-2 text-xs patient-data font-bold"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Hoàn thành: {completedTodayCount}</div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end h-[160px]">
                <p className="text-xs patient-label font-bold mb-auto text-center">Thuốc phổ biến</p>
                <div className="flex items-end justify-center gap-3 h-[110px] pb-2 border-b border-slate-900/10">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-extrabold patient-data">85%</span>
                    <div className="w-6 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md h-[80px] shadow-[0_0_15px_rgba(45,212,191,0.3)]"></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-extrabold patient-data">82%</span>
                    <div className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-md h-[75px]"></div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-extrabold patient-data">37%</span>
                    <div className="w-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md h-[30px]"></div>
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-2 text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                  <span>Para</span>
                  <span>Met</span>
                  <span>Vit C</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Bottom Left: Calendar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="patient-glass-panel rounded-3xl p-4 shadow-xl flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold patient-card-title truncate">Lịch Trực</h2>
                <MoreHorizontal size={14} className="text-teal-700/60" />
              </div>
              <div className="flex justify-between items-center mb-3">
                <button className="text-teal-700/60 hover:text-teal-900"><ChevronRight size={14} className="rotate-180" /></button>
                <span className="font-bold text-[10px] uppercase patient-data">{currentMonthName}</span>
                <button className="text-teal-700/60 hover:text-teal-900"><ChevronRight size={14} /></button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="patient-label text-[9px] font-extrabold">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center items-center justify-items-center">
                {emptyDays.map((_, i) => <div key={`empty-${i}`} className="w-5 h-5"></div>)}
                {daysArray.map(d => {
                  const isToday = d === today.getDate();
                  const isScheduled = scheduleDays.has(d);
                  const isLeave = leaveDays.has(d);
                  
                  let circleClass = 'patient-data hover:bg-slate-900/10';
                  if (isToday) circleClass = 'bg-teal-600 text-white font-extrabold shadow-[0_0_8px_rgba(15,118,110,0.3)]';
                  else if (isLeave) circleClass = 'text-rose-600 font-extrabold bg-rose-50/50';
                  else if (isScheduled) circleClass = 'border border-teal-600 text-teal-700 font-bold';

                  return (
                    <div
                      key={d}
                      className={`text-[9px] w-5 h-5 flex items-center justify-center rounded-full cursor-pointer transition-colors ${circleClass}`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
              <div className="mt-auto pt-3 flex flex-col gap-1.5 text-[9px]">
                <div className="flex items-center gap-1.5 patient-label"><div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div> Ca trực phòng khám</div>
                <div className="flex items-center gap-1.5 patient-label"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Đã xin nghỉ phép</div>
              </div>
            </motion.div>

            {/* Bottom Right: Profile Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="patient-glass-panel rounded-3xl p-4 shadow-xl flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold patient-card-title truncate">Cá Nhân</h2>
                <MoreHorizontal size={14} className="text-teal-700/60" />
              </div>

              <div className="flex flex-col items-center text-center mb-4">
                {typeof user?.avatarUrl === "string" && user.avatarUrl.trim() && user.avatarUrl !== "null" ? (
                  <img src={user.avatarUrl} className="w-12 h-12 rounded-full border-2 border-teal-600/50 mb-2 shadow-sm object-cover" alt="Ảnh bác sĩ" />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-teal-600/50 mb-2 shadow-sm bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Stethoscope size={22} aria-label="Chưa có ảnh bác sĩ" />
                  </div>
                )}
                <h3 className="font-black text-xs leading-tight patient-data line-clamp-1">{profile?.fullName || user?.fullName || "BS. Hùng Lê"}</h3>
                <p className="text-[9px] text-teal-600 font-extrabold mt-1 uppercase truncate">{profile?.departmentName || profile?.specialization || user?.specialty || "Nội khoa"}</p>
              </div>

              <div className="flex flex-col gap-2 mb-4 bg-slate-50/50 p-2.5 rounded-xl">
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Bệnh nhân:</span>
                  <span className="font-black text-slate-800">{activePatientsCount}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Ca khám:</span>
                  <span className="font-black text-slate-800">{completedCount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button onClick={() => navigate('/dashboard/profile')} className="flex items-center justify-center gap-1 p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors">
                  <User size={14} /> <span className="text-[10px] font-bold">Hồ sơ</span>
                </button>
                <button onClick={() => navigate('/dashboard/doctor-appointments')} className="flex items-center justify-center gap-1 p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors">
                  <CalendarDays size={14} /> <span className="text-[10px] font-bold">Lịch</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
