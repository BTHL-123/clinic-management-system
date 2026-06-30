import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Spacer vô hình - giữ chỗ trong flex layout để nội dung không bị đè */}
      <motion.div
        animate={{ width: isExpanded ? 244 : 70 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="hidden md:block shrink-0"
        aria-hidden="true"
      />

      {/* Sidebar cố định trên màn hình */}
      <motion.nav
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isExpanded ? 244 : 70 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="hidden md:flex flex-col justify-between bg-white/90 backdrop-blur-xl border border-teal-900/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[2rem] py-6 h-[calc(100vh-104px)] fixed top-[80px] left-3 z-[100]"
        aria-label="Điều hướng lễ tân"
      >
        <div className="flex flex-col gap-4 w-full px-3 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition-all shrink-0 ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
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
                  className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 font-bold ${
                    isActive ? "text-white shadow-md shadow-teal-900/20" : "text-[#1E3E37] hover:text-[#0A604E] hover:bg-teal-50/80"
                  } ${isExpanded ? "px-4" : "justify-center"}`}
                  title={!isExpanded ? item.label : ""}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeReceptionistNav"
                      className="absolute inset-0 bg-gradient-to-r from-[#0A604E] to-[#0D7862] rounded-2xl shadow-[0_4px_14px_rgba(10,96,78,0.3)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center ${isExpanded ? "gap-4" : ""}`}>
                    <Icon size={22} className="group-hover:scale-110 transition-transform" />
                    {isExpanded && <span className="whitespace-nowrap text-[15px] tracking-wide font-bold">{item.label}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full mt-auto pt-4 border-t border-teal-900/10">
            <button
              type="button"
              onClick={handleLogout}
              className={`w-full flex items-center h-12 rounded-2xl text-rose-600 font-bold hover:text-rose-700 hover:bg-rose-50 transition-all group ${
                isExpanded ? "px-4 gap-4" : "justify-center"
              }`}
              title={!isExpanded ? "Đăng xuất" : ""}
            >
              <LogOut size={22} className="group-hover:-translate-x-1 transition-transform text-rose-600" />
              {isExpanded && <span className="whitespace-nowrap tracking-wide text-[15px]">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
