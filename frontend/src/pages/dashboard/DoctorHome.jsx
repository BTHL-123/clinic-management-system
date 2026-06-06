import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { 
  Home, Users, CalendarDays, MessageCircle, Settings, Bell, LogOut,
  ChevronRight, Search, SlidersHorizontal, Activity, MoreHorizontal,
  Clock, CheckCircle2, XCircle, Shield, Globe, User
} from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");

  const todayAppointments = [
    { id: 1, name: "Nguyễn Văn A", age: 12, time: "09:00 AM", status: "Đang chờ", type: "Tái khám Tim", avatar: "https://i.pravatar.cc/150?u=1" },
    { id: 2, name: "Lê Thị B", age: 28, time: "10:30 AM", status: "Hoàn thành", type: "Tái khám Tim", avatar: "https://i.pravatar.cc/150?u=2" },
    { id: 3, name: "Trần Văn C", age: 45, time: "13:30 PM", status: "Hủy", type: "Khám tổng quát", avatar: "https://i.pravatar.cc/150?u=3" },
    { id: 4, name: "Phạm Thị D", age: 34, time: "14:30 PM", status: "Đang chờ", type: "Khám chuyên khoa", avatar: "https://i.pravatar.cc/150?u=4" },
    { id: 5, name: "Hoàng Văn E", age: 50, time: "15:30 PM", status: "Đang chờ", type: "Đọc kết quả XN", avatar: "https://i.pravatar.cc/150?u=5" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", icon: <Home size={22} />, path: "/dashboard", label: "Trang chủ" },
    { id: "patients", icon: <Users size={22} />, path: "/dashboard/patients", label: "Bệnh nhân" },
    { id: "calendar", icon: <CalendarDays size={22} />, path: "/dashboard/doctor-appointments", label: "Lịch khám" },
    { id: "messages", icon: <MessageCircle size={22} />, path: "/dashboard/consultation", label: "Tư vấn" },
    { id: "settings", icon: <Settings size={22} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang chờ": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Hoàn thành": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Hủy": return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default: return "bg-white/10 text-white/70";
    }
  };

  // Generate simple calendar days
  const currentMonth = "Tháng 6, 2026";
  const days = Array.from({length: 30}, (_, i) => i + 1);

  return (
    <div className="w-full h-full relative text-white flex gap-6 pb-6">
      
      {/* Left Navbar moved to DashboardLayout globally */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Custom Doctor Topbar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <button className="md:hidden w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white">
              <ChevronRight size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Xin chào, {user?.fullName || "BS. Hùng Lê"} <span className="text-xl">👋</span>
              </h1>
              <p className="text-teal-200/80 text-sm font-medium tracking-wide uppercase mt-1">
                {user?.specialty || "CHUYÊN KHOA TIM MẠCH"}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/50">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm bệnh nhân hoặc lịch hẹn..." 
              className="w-full bg-slate-900/40 border border-white/10 text-white placeholder-white/40 text-sm rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-teal-400/50 transition-colors"
            />
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: Timeline (7 cols) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="xl:col-span-7 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Phòng khám <span className="text-teal-300">&bull; Hôm nay</span>
              </h2>
              <button className="text-white/60 hover:text-white"><MoreHorizontal size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-white/10"></div>

              <div className="flex flex-col gap-4">
                {todayAppointments.map((apt, idx) => (
                  <div key={apt.id} className="flex gap-4 relative group">
                    {/* Timeline Dot & Time */}
                    <div className="flex flex-col items-center w-[80px] shrink-0 z-10 bg-transparent pt-4">
                      <div className={`w-3 h-3 rounded-full border-2 border-[#115e59] mb-1 ${apt.status === 'Đang chờ' ? 'bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-white/30'}`}></div>
                      <span className="text-xs font-medium text-white/60">{apt.time.split(' ')[0]}</span>
                    </div>

                    {/* Appointment Card */}
                    <div className="flex-1 bg-slate-900/30 hover:bg-slate-900/50 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all duration-300 group-hover:-translate-y-0.5 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <img src={apt.avatar} alt={apt.name} className="w-12 h-12 rounded-full border border-white/20 object-cover" />
                        <div>
                          <h3 className="font-bold text-lg text-white">{apt.name}</h3>
                          <p className="text-white/60 text-sm">{apt.age} tuổi</p>
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <h4 className="font-bold text-white mb-0.5">{apt.time}</h4>
                        <p className="text-white/60 text-sm">{apt.type}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                        <div className="hidden md:flex gap-2 text-white/50">
                          <button className="p-1.5 hover:bg-white/10 hover:text-teal-300 rounded-lg transition-colors"><MessageCircle size={18} /></button>
                          <button className="p-1.5 hover:bg-white/10 hover:text-teal-300 rounded-lg transition-colors" onClick={() => navigate(`/dashboard/examination/${apt.id}`)}><Activity size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-6">Bệnh nhân & Thuốc</h2>
              <div className="flex gap-6 items-center">
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-sm text-white/70 mb-4">Tình trạng Bệnh nhân (35)</p>
                  {/* CSS Donut Chart Mockup */}
                  <div className="relative w-28 h-28 rounded-full border-[12px] border-white/10 flex items-center justify-center">
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-teal-400 border-r-teal-400 rotate-45"></div>
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-b-rose-400 -rotate-12"></div>
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-l-blue-400 -rotate-[80deg]"></div>
                    <span className="text-2xl font-bold">15</span>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-4 w-full">
                    <div className="flex items-center gap-2 text-xs text-white/80"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Đang chờ: 15</div>
                    <div className="flex items-center gap-2 text-xs text-white/80"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Hoàn thành: 18</div>
                    <div className="flex items-center gap-2 text-xs text-white/80"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Hủy: 2</div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-end h-[180px]">
                  <p className="text-sm text-white/70 mb-auto text-center">Thuốc phổ biến nhất</p>
                  <div className="flex items-end justify-center gap-4 h-[120px] pb-2 border-b border-white/10">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-bold">85%</span>
                      <div className="w-8 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md h-[90px] shadow-[0_0_15px_rgba(45,212,191,0.3)]"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-bold">82%</span>
                      <div className="w-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-md h-[85px]"></div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-bold">37%</span>
                      <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md h-[40px]"></div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 mt-2 text-[10px] text-white/60">
                    <span>Paracetamol</span>
                    <span>Metformin</span>
                    <span>Vitamin C</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {/* Bottom Left: Calendar */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-5 shadow-xl flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-md font-bold">Nội dung & Nghỉ phép</h2>
                  <MoreHorizontal size={18} className="text-white/50" />
                </div>
                <div className="flex justify-between items-center mb-4">
                  <button className="text-white/60 hover:text-white"><ChevronRight size={16} className="rotate-180" /></button>
                  <span className="font-semibold text-sm">{currentMonth}</span>
                  <button className="text-white/60 hover:text-white"><ChevronRight size={16} /></button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
                    <div key={d} className="text-[10px] text-white/50 font-medium">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({length: 4}).map((_, i) => <div key={`empty-${i}`}></div>)}
                  {days.map(d => (
                    <div 
                      key={d} 
                      className={`text-xs w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors
                        ${d === 15 ? 'bg-teal-400 text-slate-900 font-bold shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 
                          d === 2 ? 'border border-teal-400 text-teal-300' : 
                          d === 10 ? 'text-rose-400' : 'text-white/80 hover:bg-white/10'}
                      `}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-4 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-white/70"><div className="w-2 h-2 rounded-full bg-teal-400"></div> Ca trực</div>
                  <div className="flex items-center gap-1.5 text-white/70"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Nghỉ phép</div>
                </div>
              </motion.div>

              {/* Bottom Right: Profile Summary */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-5 shadow-xl flex flex-col"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-md font-bold">Cài đặt Cá nhân</h2>
                  <MoreHorizontal size={18} className="text-white/50" />
                </div>
                
                <div className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-xl border border-white/10 mb-4">
                  <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=doc"} className="w-10 h-10 rounded-full border border-teal-400/50" alt="Doctor" />
                  <div>
                    <h3 className="font-bold text-sm leading-none">{user?.fullName || "BS. Hùng Lê"}</h3>
                    <p className="text-[10px] text-white/60 mt-1 uppercase">{user?.specialty || "Chuyên khoa II"}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Ca khám đã hoàn thành:</span>
                    <span className="font-bold">1,420</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Bệnh nhân hoạt động:</span>
                    <span className="font-bold">315</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors">
                    <User size={14} /> Profile
                  </button>
                  <button onClick={() => navigate('/dashboard/doctor-appointments')} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors">
                    <CalendarDays size={14} /> Lịch khám
                  </button>
                  <button onClick={() => navigate('/dashboard/change-password')} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors">
                    <Shield size={14} /> Bảo mật
                  </button>
                  <button className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-white/10 text-white/80 transition-colors">
                    <Globe size={14} /> Ngôn ngữ
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
