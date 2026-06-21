import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import {
  LayoutDashboard, FlaskConical, Settings, LogOut, ChevronRight,
  FileText, ActivitySquare, Bell, UserSquare, KeyRound
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

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

  const { scrollY } = useScroll();
  const springY = useSpring(scrollY, { stiffness: 100, damping: 18, mass: 0.4 });

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
    <motion.div style={{ y: springY }} className="hidden md:block relative h-[calc(100vh-104px)] z-[100] self-start">
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isExpanded ? 240 : 70 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col justify-between patient-glass-panel rounded-[2rem] py-6 h-full w-full"
      >
      <div className="flex flex-col gap-4 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
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
              className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 ${activeNav === item.id
                  ? "text-white font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                  : "text-white/95 font-extrabold hover:text-white hover:bg-white/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                } ${isExpanded ? "px-4" : "justify-center"}`}
              title={!isExpanded ? item.label : ""}
            >
              {activeNav === item.id && (
                <motion.div
                  layoutId="activeLabNav"
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
    </motion.div>
  );
}
