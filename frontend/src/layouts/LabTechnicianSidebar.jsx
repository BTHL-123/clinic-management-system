import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import {
  LayoutDashboard, FlaskConical, Settings, LogOut, ChevronRight,
  FileText, ActivitySquare, Bell, UserSquare, KeyRound
} from "lucide-react";
import { motion } from "framer-motion";

export default function LabTechnicianSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("labSidebarExpanded") === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("labSidebarExpanded", isExpanded);
  }, [isExpanded]);

  const getActiveNav = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path.includes("lab-requests")) return "lab-management";
    if (path.includes("notifications")) return "notifications";
    if (path.includes("profile")) return "profile";
    if (path.includes("change-password")) return "settings";
    return "home";
  };

  const activeNav = getActiveNav();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", icon: <LayoutDashboard size={22} />, path: "/dashboard", label: "Trang chủ" },
    { id: "profile", icon: <UserSquare size={22} />, path: "/dashboard/profile", label: "Hồ sơ của tôi" },
    { id: "notifications", icon: <Bell size={22} />, path: "/dashboard/notifications", label: "Thông báo" },
    { id: "settings", icon: <KeyRound size={22} />, path: "/dashboard/change-password", label: "Đổi mật khẩu" },
    { id: "lab-management", icon: <FlaskConical size={22} />, path: "/dashboard/lab-requests", label: "Phòng xét nghiệm" },
  ];

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 240 : 70 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col justify-between bg-white shadow-sm border border-slate-100 rounded-[2rem] py-6 h-[calc(100vh-104px)] sticky top-[80px] z-[100]"
    >
      <div className="flex flex-col gap-4 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all shrink-0 ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
        >
          <ChevronRight size={22} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-1.5 w-full mt-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 ${activeNav === item.id
                  ? "text-[#0A604E] font-extrabold"
                  : "text-slate-500 font-bold hover:text-[#0A604E] hover:bg-[#F0F9F7]"
                } ${isExpanded ? "px-4" : "justify-center"}`}
              title={!isExpanded ? item.label : ""}
            >
              {activeNav === item.id && (
                <motion.div
                  layoutId="activeLabNav"
                  className="absolute inset-0 bg-[#E2F2EE] border border-[#1DB896]/20 rounded-2xl"
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

        <div className="w-full mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center h-12 rounded-2xl text-rose-500 font-extrabold hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group ${isExpanded ? "px-4 gap-4" : "justify-center"}`}
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
