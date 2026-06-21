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
    { id: "home",         icon: <Home size={18} />,         path: "/dashboard",                    label: "Tổng quan" },
    { id: "booking",      icon: <CalendarPlus size={18} />, path: "/dashboard/available-slots",    label: "Đặt lịch" },
    { id: "appointments", icon: <CalendarDays size={18} />, path: "/dashboard/my-appointments",    label: "Lịch hẹn" },
    { id: "queue",        icon: <ListOrdered size={18} />,  path: "/dashboard/queue-status",       label: "Hàng đợi" },
    { id: "history",      icon: <FileText size={18} />,     path: "/dashboard/my-medical-history", label: "Bệnh án" },
    { id: "labs",         icon: <Activity size={18} />,     path: "/dashboard/my-lab-results",     label: "Xét nghiệm" },
    { id: "doctors",      icon: <Users size={18} />,        path: "/dashboard/our-doctors",        label: "Bác sĩ" },
    { id: "prices",       icon: <Tag size={18} />,          path: "/dashboard/service-prices",     label: "Bảng giá" },
    { id: "ai-chat",      icon: <MessageSquare size={18} />,path: "/dashboard/ai-chat",            label: "Trợ lý AI" },
    { id: "settings",     icon: <Settings size={18} />,     path: "/dashboard/profile",            label: "Cài đặt" },
  ];

  return (
    <motion.nav
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 220 : 64 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="hidden md:flex flex-col rounded-2xl py-4 h-[calc(100vh-104px)] sticky top-[80px] z-[100] overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #0b1329 55%, #0d1f3c 100%)",
        boxShadow: "2px 0 20px rgba(13,148,136,0.10), inset -1px 0 0 rgba(94,234,212,0.08)",
        border: "1px solid rgba(94,234,212,0.08)",
      }}
    >
      {/* Dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(94,234,212,0.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* Top teal hairline */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

      <div className="flex flex-col gap-3 w-full px-2.5 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">

        {/* Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all shrink-0 border border-slate-700/40 hover:border-teal-500/25 ${isExpanded ? "self-end" : "mx-auto"}`}
        >
          <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 w-full flex-1">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                title={!isExpanded ? item.label : ""}
                className={`relative flex items-center h-10 rounded-xl transition-all duration-200 group overflow-hidden shrink-0 ${
                  isExpanded ? "px-3 gap-3" : "justify-center"
                } ${isActive ? "text-teal-300" : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePatientNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(13,148,136,0.22) 0%, rgba(14,165,233,0.10) 100%)",
                      borderLeft: "2px solid #2dd4bf",
                      boxShadow: "0 0 12px rgba(13,148,136,0.12)",
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  />
                )}

                <div className={`relative z-10 flex items-center ${isExpanded ? "gap-3" : ""}`}>
                  <span className={isActive ? "text-teal-400 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]" : ""}>
                    {item.icon}
                  </span>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="mt-auto pt-3 border-t border-slate-700/40">
          <button
            onClick={handleLogout}
            title={!isExpanded ? "Đăng xuất" : ""}
            className={`w-full flex items-center h-10 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20 group ${isExpanded ? "px-3 gap-3" : "justify-center"}`}
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            {isExpanded && <span className="whitespace-nowrap text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
