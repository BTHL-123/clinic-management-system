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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Generate simple calendar days
  const currentMonth = "Tháng 6, 2026";
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

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

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
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
      </div>

    </div>
  );
}
