import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  Home,
  ListOrdered,
  LogOut,
  Settings,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../context/useAuth.js";

const navItems = [
  { id: "home", icon: Home, path: "/dashboard", label: "Tổng quan", end: true },
  { id: "check-in", icon: UserCheck, path: "/dashboard/receptionist-appointments", label: "Check-in" },
  { id: "queue", icon: ListOrdered, path: "/dashboard/queue-management", label: "Hàng đợi" },
  { id: "walk-in", icon: UserPlus, path: "/dashboard/walk-in", label: "Khám trực tiếp" },
  { id: "appointments", icon: CalendarDays, path: "/dashboard/appointments", label: "Lịch khám" },
  { id: "patients", icon: Users, path: "/dashboard/patients", label: "Bệnh nhân" },
  { id: "payments", icon: CreditCard, path: "/dashboard/payments", label: "Thanh toán" },
  { id: "settings", icon: Settings, path: "/dashboard/profile", label: "Cài đặt" },
];

export default function ReceptionistSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("receptionistSidebarExpanded") === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("receptionistSidebarExpanded", isExpanded);
  }, [isExpanded]);

  const { scrollY } = useScroll();
  const springY = useSpring(scrollY, { stiffness: 100, damping: 18, mass: 0.4 });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <motion.div style={{ y: springY }} className="hidden md:block relative h-[calc(100vh-104px)] z-[100] self-start">
      <motion.nav
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isExpanded ? 244 : 70 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-col justify-between patient-glass-panel rounded-[2rem] py-6 h-full w-full"
        aria-label="Điều hướng lễ tân"
      >
      <div className="flex flex-col gap-4 w-full px-3 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0 ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
          aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
        >
          <ChevronRight size={22} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-1.5 w-full mt-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 text-white font-extrabold ${
                  isActive ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" : "text-white/90 hover:text-white hover:bg-white/20"
                } ${isExpanded ? "px-4" : "justify-center"}`}
                title={!isExpanded ? item.label : ""}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeReceptionistNav"
                    className="absolute inset-0 bg-white/25 border border-white/45 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center ${isExpanded ? "gap-4" : ""}`}>
                  <Icon size={22} className="group-hover:scale-110 transition-transform" />
                  {isExpanded && <span className="whitespace-nowrap text-[15px] tracking-wide">{item.label}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full mt-auto pt-4 border-t border-white/25">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center h-12 rounded-2xl text-rose-100 font-extrabold hover:text-white hover:bg-rose-500/20 transition-all group ${
              isExpanded ? "px-4 gap-4" : "justify-center"
            }`}
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
