import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { 
  Home, CalendarPlus, CalendarDays, FileText, Activity, 
  Settings, LogOut, ChevronRight, ListOrdered, MessageSquare, Users, Tag
} from "lucide-react";
import { motion } from "framer-motion";

export default function PatientSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("patientSidebarExpanded") === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("patientSidebarExpanded", isExpanded);
  }, [isExpanded]);

  // Determine active nav based on URL path
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path.includes("available-slots")) return "booking";
    if (path.includes("my-appointments")) return "appointments";
    if (path.includes("my-medical-history")) return "history";
    if (path.includes("my-lab-results")) return "labs";
    if (path.includes("queue-status")) return "queue";
    if (path.includes("our-doctors")) return "doctors";
    if (path.includes("service-prices")) return "prices";
    if (path.includes("ai-chat")) return "ai-chat";
    if (path.includes("profile") || path.includes("change-password") || path.includes("notifications")) return "settings";
    return "home";
  };

  const activeNav = getActiveNav();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", icon: <Home size={22} />, path: "/dashboard", label: "Tổng quan" },
    { id: "booking", icon: <CalendarPlus size={22} />, path: "/dashboard/available-slots", label: "Đặt lịch" },
    { id: "appointments", icon: <CalendarDays size={22} />, path: "/dashboard/my-appointments", label: "Lịch hẹn" },
    { id: "queue", icon: <ListOrdered size={22} />, path: "/dashboard/queue-status", label: "Hàng đợi" },
    { id: "history", icon: <FileText size={22} />, path: "/dashboard/my-medical-history", label: "Bệnh án" },
    { id: "labs", icon: <Activity size={22} />, path: "/dashboard/my-lab-results", label: "Xét nghiệm" },
    { id: "doctors", icon: <Users size={22} />, path: "/dashboard/our-doctors", label: "Bác sĩ" },
    { id: "prices", icon: <Tag size={22} />, path: "/dashboard/service-prices", label: "Bảng giá" },
    { id: "ai-chat", icon: <MessageSquare size={22} />, path: "/dashboard/ai-chat", label: "Trợ lý AI" },
    { id: "settings", icon: <Settings size={22} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 240 : 70 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col justify-between patient-glass-panel rounded-[2rem] py-6 h-[calc(100vh-104px)] sticky top-[80px] z-[100]"
    >
      <div className="flex flex-col gap-4 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Expand Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 hover:text-white transition-all shrink-0 drop-shadow-md ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
        >
          <ChevronRight size={22} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-1.5 w-full mt-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 ${
                activeNav === item.id 
                  ? "text-white font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                  : "text-white/95 font-extrabold hover:text-white hover:bg-white/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              } ${isExpanded ? "px-4" : "justify-center"}`}
              title={!isExpanded ? item.label : ""}
            >
              {/* Active Indicator Background */}
              {activeNav === item.id && (
                <motion.div 
                  layoutId="activePatientNav"
                  className="absolute inset-0 bg-white/25 border border-white/45 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={`relative z-10 flex items-center ${isExpanded ? "gap-4" : ""}`}>
                <div className={`group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap text-[15px] tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Logout Button at bottom */}
        <div className="w-full mt-auto pt-4 border-t border-white/25">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center h-12 rounded-2xl text-rose-100 font-extrabold hover:text-white hover:bg-rose-500/20 drop-shadow-md transition-all duration-300 group ${isExpanded ? "px-4 gap-4" : "justify-center"}`}
            title={!isExpanded ? "Đăng xuất" : ""}
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
            {isExpanded && <span className="whitespace-nowrap tracking-wide text-[15px]">Đăng xuất</span>}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
