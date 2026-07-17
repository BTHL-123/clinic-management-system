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
    { id: "home", icon: <Home size={20} />, path: "/dashboard", label: "Tổng quan" },
    { id: "booking", icon: <CalendarPlus size={20} />, path: "/dashboard/available-slots", label: "Đặt lịch" },
    { id: "appointments", icon: <CalendarDays size={20} />, path: "/dashboard/my-appointments", label: "Lịch hẹn" },
    { id: "queue", icon: <ListOrdered size={20} />, path: "/dashboard/queue-status", label: "Hàng đợi" },
    { id: "history", icon: <FileText size={20} />, path: "/dashboard/my-medical-history", label: "Bệnh án" },
    { id: "labs", icon: <Activity size={20} />, path: "/dashboard/my-medical-history?tab=history", label: "Xét nghiệm" },
    { id: "doctors", icon: <Users size={20} />, path: "/dashboard/our-doctors", label: "Bác sĩ" },
    { id: "prices", icon: <Tag size={20} />, path: "/dashboard/service-prices", label: "Bảng giá" },
    { id: "ai-chat", icon: <MessageSquare size={20} />, path: "/dashboard/ai-chat", label: "Trợ lý AI" },
    { id: "settings", icon: <Settings size={20} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 240 : 68 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col justify-between bg-white border-r border-slate-200/80 py-4 h-[calc(100vh-68px)] sticky top-[68px] z-[100] shadow-[1px_0_8px_rgba(0,0,0,0.03)]"
    >
      <div className="flex flex-col gap-2 w-full px-2.5 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Expand Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0 ${isExpanded ? "self-end mr-0.5" : "mx-auto"}`}
        >
          <ChevronRight size={18} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-1 w-full mt-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center h-11 transition-all duration-200 group overflow-hidden shrink-0 ${
                activeNav === item.id 
                  ? "bg-[#0A604E] text-white font-bold rounded-full shadow-[0_4px_12px_rgba(10,96,78,0.15)]" 
                  : "text-[#4A5D59] font-medium hover:text-slate-850 hover:bg-[#F0F9F7] rounded-xl"
              } ${isExpanded ? "px-3" : "justify-center"}`}
              title={!isExpanded ? item.label : ""}
            >
              <div className={`relative z-10 flex items-center ${isExpanded ? "gap-3" : ""}`}>
                <div className={`transition-colors duration-200 ${
                  activeNav === item.id ? "text-white" : "text-[#4A5D59]/75 group-hover:text-slate-850"
                }`}>
                  {item.icon}
                </div>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="whitespace-nowrap text-[14px] tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Logout Button at bottom */}
        <div className="w-full mt-auto pt-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center h-11 rounded-xl text-slate-400 font-medium hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 group ${isExpanded ? "px-3 gap-3" : "justify-center"}`}
            title={!isExpanded ? "Đăng xuất" : ""}
          >
            <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            {isExpanded && <span className="whitespace-nowrap tracking-wide text-[14px]">Đăng xuất</span>}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
