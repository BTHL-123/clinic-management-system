import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { 
  Home, Users, CalendarDays, Stethoscope, Settings, Bell, LogOut, ChevronRight, ClipboardList, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("doctorSidebarExpanded") === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("doctorSidebarExpanded", isExpanded);
  }, [isExpanded]);

  // Determine active nav based on URL path
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path.includes("patients")) return "patients";
    if (path.includes("doctor-schedule")) return "schedule";
    if (path.includes("doctor-appointments")) return "calendar";
    if (path.includes("consultation") || path.includes("examination")) return "examination";
    if (path.includes("doctor-leave-requests")) return "leave-requests";
    if (path.includes("articles")) return "articles";
    if (path.includes("profile") || path.includes("change-password")) return "settings";
    return "home";
  };

  const activeNav = getActiveNav();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", icon: <Home size={22} />, path: "/dashboard", label: "Trang chủ" },
    { id: "patients", icon: <Users size={22} />, path: "/dashboard/patients", label: "Bệnh nhân" },
    { id: "schedule", icon: <CalendarDays size={22} />, path: "/dashboard/doctor-schedule", label: "Lịch làm việc" },
    { id: "calendar", icon: <CalendarDays size={22} />, path: "/dashboard/doctor-appointments", label: "Ca trực hôm nay" },
    { id: "examination", icon: <Stethoscope size={22} />, path: "/dashboard/consultation", label: "Khám bệnh" },
    { id: "leave-requests", icon: <ClipboardList size={22} />, path: "/dashboard/doctor-leave-requests", label: "Nghỉ phép" },
    { id: "articles", icon: <FileText size={22} />, path: "/dashboard/articles", label: "Bài viết y tế" },
    { id: "settings", icon: <Settings size={22} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 240 : 70 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col justify-between bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] py-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-[calc(100vh-104px)] sticky top-[80px] z-[100]"
    >
      <div className="flex flex-col gap-4 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Expand Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
        >
          <ChevronRight size={22} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-2 w-full mt-2">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`h-12 rounded-2xl flex items-center transition-all duration-300 group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} ${activeNav === item.id ? 'bg-teal-400/20 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="shrink-0">{item.icon}</div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-semibold whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {!isExpanded && (
                <div className="absolute left-14 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full px-3 relative">
        <button className={`h-12 rounded-2xl flex items-center transition-all group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} text-white/60 hover:bg-white/10 hover:text-white`}>
          <div className="shrink-0"><Bell size={22} /></div>
          <AnimatePresence>
            {isExpanded && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:"auto"}} exit={{opacity:0, width:0}} className="font-semibold whitespace-nowrap overflow-hidden">Thông báo</motion.span>}
          </AnimatePresence>
          {!isExpanded && <div className="absolute left-14 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">Thông báo</div>}
        </button>
        <button onClick={handleLogout} className={`h-12 rounded-2xl flex items-center transition-all group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} text-rose-300/70 hover:bg-rose-500/20 hover:text-rose-300`}>
          <div className="shrink-0"><LogOut size={22} /></div>
          <AnimatePresence>
            {isExpanded && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:"auto"}} exit={{opacity:0, width:0}} className="font-semibold whitespace-nowrap overflow-hidden">Đăng xuất</motion.span>}
          </AnimatePresence>
          {!isExpanded && <div className="absolute left-14 bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">Đăng xuất</div>}
        </button>
      </div>
    </motion.nav>
  );
}
