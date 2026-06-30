import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import {
  Home, Users, CalendarDays, MessageCircle, Settings, Bell, LogOut,
  ChevronRight, Search, SlidersHorizontal, Activity, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Shield, Globe, User, Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";
import { getMyDoctorProfile } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { getDoctorPerformance } from "../../services/reportService";
import { toLocalDateString } from "../../lib/utils";
import { emitToast } from "../../services/toastService";


export default function DoctorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [completedCount, setCompletedCount] = useState(1420);
  const [activePatientsCount, setActivePatientsCount] = useState(315);
  const [loading, setLoading] = useState(true);

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

        // 3. Fetch performance data if available
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
            console.warn("Failed to fetch performance stats", err);
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

  // Helper date formatter
  const getCurrentDateStr = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${dayName}, ${dateStr}`;
  };

  // Map status from db format to visual status
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

  const getStatusStyle = (status) => {
    switch (status) {
      case "Đang chờ":
      case "Sắp tới":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "Đang khám":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "Đã xong":
      case "Hoàn thành":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Khẩn cấp":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  // Generate simple calendar days
  const currentMonth = "Tháng 6, 2026";
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const displayedAppointments = appointments.length > 0 ? appointments.slice(0, 5) : fallbackAppointments;

  // Stats calculation
  const totalToday = appointments.length > 0 ? appointments.length : 24;
  const waitingToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Đang chờ").length : 8;
  const completedToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Đã xong").length : 16;
  const emergencyToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Khẩn cấp").length : 2;

  const waitingPct = totalTodayCount > 0 ? (waitingCount / totalTodayCount) * 100 : 0;
  const completedPct = totalTodayCount > 0 ? (completedTodayCount / totalTodayCount) * 100 : 0;
  const cancelledPct = totalTodayCount > 0 ? (cancelledTodayCount / totalTodayCount) * 100 : 0;

  const donutGradient = totalTodayCount === 0 
    ? "conic-gradient(rgb(226, 232, 240) 0% 100%)" 
    : `conic-gradient(#2dd4bf 0% ${waitingPct}%, #60a5fa ${waitingPct}% ${waitingPct + completedPct}%, #f87171 ${waitingPct + completedPct}% 100%)`;

  return (
    <div className="w-full h-full relative text-slate-800 flex gap-6 pb-6">

      {/* Left Navbar moved to DashboardLayout globally */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Left Column: Timeline (7 cols) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="xl:col-span-7 patient-glass-panel rounded-[2rem] p-6 shadow-xl flex flex-col"
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bệnh nhân</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Thời gian</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Trạng thái</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedAppointments.map((app) => {
                    const status = getMappedStatus(app);
                    const formattedTime = app.startTime ? app.startTime.slice(0, 5) : "--:--";
                    const initials = app.patientName
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((p) => p[0])
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
                              <div className="font-extrabold text-slate-800 text-sm leading-tight">{app.patientName}</div>
                              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{app.reasonForVisit || "Khám tổng quát"}</div>
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

          {/* Right Column: Stats, Calendar, Profile (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-6">

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
                  <p className="text-sm patient-label font-bold mb-4">Tình trạng Bệnh nhân ({totalTodayCount})</p>
                  {/* CSS Donut Chart Dynamic */}
                  <div 
                    className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-inner"
                    style={{ background: donutGradient }}
                  >
                    <div className="absolute w-[88px] h-[88px] rounded-full bg-white flex items-center justify-center shadow-md">
                      <span className="text-2xl font-black patient-data">{totalTodayCount}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-4 w-full">
                    <div className="flex items-center gap-2 text-xs patient-data font-bold"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Đang chờ/khám: {waitingCount}</div>
                    <div className="flex items-center gap-2 text-xs patient-data font-bold"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Hoàn thành: {completedTodayCount}</div>
                    <div className="flex items-center gap-2 text-xs patient-data font-bold"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Hủy: {cancelledTodayCount}</div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-end h-[180px]">
                  <p className="text-sm patient-label font-bold mb-auto text-center">Thuốc phổ biến nhất</p>
                  <div className="flex items-end justify-center gap-4 h-[120px] pb-2 border-b border-slate-900/10">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-extrabold patient-data">85%</span>
                      <div className="w-8 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md h-[90px] shadow-[0_0_15px_rgba(45,212,191,0.3)]"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-extrabold patient-data">82%</span>
                      <div className="w-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-md h-[85px]"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-extrabold patient-data">37%</span>
                      <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md h-[40px]"></div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 mt-2 text-[10px] text-slate-600 font-bold">
                    <span>Paracetamol</span>
                    <span>Metformin</span>
                    <span>Vitamin C</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 justify-center items-stretch">
              {/* Bottom Left: Calendar */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="patient-glass-panel rounded-[2rem] px-3.5 py-4 shadow-xl flex flex-col h-[260px] max-w-[210px] w-full mx-auto"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-bold patient-card-title truncate">Nội dung & Nghỉ phép</h2>
                  <MoreHorizontal size={16} className="text-teal-700/60" />
                </div>
                <div className="flex justify-between items-center mb-3">
                  <button className="text-teal-700/60 hover:text-teal-900"><ChevronRight size={14} className="rotate-180" /></button>
                  <span className="font-bold text-xs patient-data">{currentMonth}</span>
                  <button className="text-teal-700/60 hover:text-teal-900"><ChevronRight size={14} /></button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <div key={d} className="patient-label text-[10px] font-bold">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center items-center justify-items-center">
                  {Array.from({ length: 4 }).map((_, i) => <div key={`empty-${i}`} className="w-5.5 h-5.5"></div>)}
                  {days.map(d => (
                    <div
                      key={d}
                      className={`text-[10px] w-5.5 h-5.5 flex items-center justify-center rounded-full cursor-pointer transition-colors
                        ${d === 29 ? 'bg-teal-600 text-white font-extrabold shadow-[0_0_8px_rgba(15,118,110,0.3)]' :
                          d === 2 || d === 15 ? 'border border-teal-600 text-teal-700 font-bold' :
                            d === 10 || d === 22 ? 'text-rose-600 font-extrabold bg-rose-50/50' : 'patient-data hover:bg-slate-900/10'}
                      `}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-3 flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1 patient-label"><div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div> Ca trực</div>
                  <div className="flex items-center gap-1 patient-label"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Nghỉ phép</div>
                </div>
              </motion.div>

              {/* Bottom Right: Profile Summary */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="patient-glass-panel rounded-[2rem] px-3.5 py-4 shadow-xl flex flex-col h-[260px] max-w-[210px] w-full mx-auto"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xs font-bold patient-card-title truncate">Cài đặt Cá nhân</h2>
                  <MoreHorizontal size={16} className="text-teal-700/60" />
                </div>

                <div className="flex items-center gap-2 bg-slate-900/5 p-2 rounded-xl border border-slate-900/10 mb-3">
                  <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=doc"} className="w-8 h-8 rounded-full border border-teal-600/50" alt="Doctor" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs leading-none patient-data truncate">{profile?.fullName || user?.fullName || "BS. Hùng Lê"}</h3>
                    <p className="text-[9px] text-teal-700 font-extrabold mt-1 uppercase truncate">{profile?.departmentName || profile?.specialization || user?.specialty || "Chuyên khoa II"}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="patient-label">Ca khám hoàn thành:</span>
                    <span className="font-bold patient-data">{completedCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="patient-label">Bệnh nhân hoạt động:</span>
                    <span className="font-bold patient-data">{activePatientsCount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 mt-auto">
                  <button onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-1.5 text-xs p-1 rounded-lg hover:bg-teal-50 text-teal-700 font-extrabold transition-colors whitespace-nowrap">
                    <User size={14} /> Profile
                  </button>
                  <button onClick={() => navigate('/dashboard/doctor-appointments')} className="flex items-center gap-1.5 text-xs p-1 rounded-lg hover:bg-teal-50 text-teal-700 font-extrabold transition-colors whitespace-nowrap">
                    <CalendarDays size={14} /> Lịch khám
                  </button>
                  <button onClick={() => navigate('/dashboard/change-password')} className="flex items-center gap-1.5 text-xs p-1 rounded-lg hover:bg-teal-50 text-teal-700 font-extrabold transition-colors whitespace-nowrap">
                    <Shield size={14} /> Bảo mật
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/examination')}
                    className="flex items-center gap-1.5 text-xs p-1 rounded-lg hover:bg-teal-50 text-teal-700 font-extrabold transition-colors whitespace-nowrap"
                  >
                    <Stethoscope size={14} /> Khám bệnh
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Thống kê tuần */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
                <i className="ti ti-chart-bar text-lg text-[#1DB896]" /> Thống kê tuần
              </h2>
            </div>

            {/* Simulated Chart */}
            <div className="flex items-end justify-between h-32 px-2 pb-2 pt-6 border-b border-slate-100">
              {[
                { day: "T2", height: "h-20" },
                { day: "T3", height: "h-12" },
                { day: "T4", height: "h-24" },
                { day: "T5", height: "h-16" },
                { day: "T6", height: "h-20" },
                { day: "T7", height: "h-8" },
                { day: "CN", height: "h-10" },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-5 bg-slate-50 rounded-t-md h-24 flex items-end">
                    <div className={`w-full bg-gradient-to-t from-[#0A604E] to-[#1DB896] rounded-t-md ${bar.height}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">Tổng bệnh nhân</span>
              <span className="font-extrabold text-slate-800">148</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Hiệu suất trung bình</span>
              <span className="font-extrabold text-[#0A604E]">92%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. LOWER ROW GRID (2 COLUMNS: RECENT PATIENTS + NOTIFICATIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Card: Bệnh nhân gần đây */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
              <i className="ti ti-users text-lg text-[#1DB896]" /> Bệnh nhân gần đây
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { name: "Bà Nguyễn Thị Lan", clinic: "Khám tim mạch", time: "2 giờ trước" },
              { name: "Anh Đặng Văn Nam", clinic: "Kiểm tra phổi", time: "4 giờ trước" },
              { name: "Chị Mai Phương", clinic: "Xét nghiệm tổng quát", time: "Hôm qua" },
            ].map((p, idx) => {
              const pInitials = p.name.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
              return (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-xs">
                      {pInitials}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{p.name}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">{p.clinic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">{p.time}</span>
                    <i className="ti ti-chevron-right text-slate-400 text-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Thông báo & Nhắc nhở */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
              <i className="ti ti-bell-ringing text-lg text-[#1DB896]" /> Thông báo / Nhắc nhở
            </h2>
          </div>

          <div className="flex flex-col gap-3.5">

            {/* Note 1 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0A604E] flex items-center justify-center shrink-0">
                <i className="ti ti-mail-opened text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Kết quả xét nghiệm mới</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Hồ sơ BN Lê Hoàng đã có kết quả xét nghiệm máu từ phòng Lab.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">15 phút trước</span>
              </div>
            </div>

            {/* Note 2 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <i className="ti ti-device-laptop text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Hội chẩn chuyên khoa</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Cuộc họp hội chẩn khoa Nội lúc 14:00 tại phòng họp số 3.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">1 giờ trước</span>
              </div>
            </div>

            {/* Note 3 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <i className="ti ti-package text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Cảnh báo thuốc sắp hết</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Khoa thuốc báo cáo lượng Insulin tồn kho đang ở mức thấp.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">3 giờ trước</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
