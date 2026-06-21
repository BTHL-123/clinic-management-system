import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import {
  Home, Pill, Truck, ArrowRightLeft, Package, AlertTriangle, ClipboardPlus, Settings, Bell, LogOut, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";

export default function PharmacistSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("pharmacistSidebarExpanded") === "true";
  });

  React.useEffect(() => {
    localStorage.setItem("pharmacistSidebarExpanded", isExpanded);
  }, [isExpanded]);

  const { scrollY } = useScroll();
  const springY = useSpring(scrollY, { stiffness: 100, damping: 18, mass: 0.4 });

  // Determine active nav based on URL path
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path.includes("medicines")) return "medicines";
    if (path.includes("suppliers")) return "suppliers";
    if (path.includes("inventory/transactions")) return "transactions";
    if (path.includes("inventory/batches")) return "batches";
    if (path.includes("inventory/alerts")) return "alerts";
    if (path.includes("pharmacist/prescriptions")) return "prescriptions";
    if (path.includes("profile") || path.includes("change-password")) return "settings";
    return "home";
  };

  const activeNav = getActiveNav();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", icon: <Home size={22} strokeWidth={2.5} />, path: "/dashboard", label: "Tổng quan" },
    { id: "prescriptions", icon: <ClipboardPlus size={22} strokeWidth={2.5} />, path: "/dashboard/pharmacist/prescriptions", label: "Phát thuốc" },
    { id: "medicines", icon: <Pill size={22} strokeWidth={2.5} />, path: "/dashboard/medicines", label: "Danh mục Thuốc" },
    { id: "batches", icon: <Package size={22} strokeWidth={2.5} />, path: "/dashboard/inventory/batches", label: "Lô thuốc" },
    { id: "transactions", icon: <ArrowRightLeft size={22} strokeWidth={2.5} />, path: "/dashboard/inventory/transactions", label: "Xuất/Nhập kho" },
    { id: "suppliers", icon: <Truck size={22} strokeWidth={2.5} />, path: "/dashboard/suppliers", label: "Nhà cung cấp" },
    { id: "alerts", icon: <AlertTriangle size={22} strokeWidth={2.5} />, path: "/dashboard/inventory/alerts", label: "Cảnh báo" },
    { id: "settings", icon: <Settings size={22} strokeWidth={2.5} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  return (
    <motion.div style={{ y: springY }} className="hidden md:block relative h-[calc(100vh-104px)] z-[100] self-start">
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isExpanded ? 230 : 70 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col justify-between patient-glass-panel bg-white/10 shadow-xl border border-white/20 rounded-[2rem] py-6 h-full w-full"
      >
      <div className="flex flex-col gap-3 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
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
              className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 group overflow-hidden shrink-0 ${activeNav === item.id
                ? "text-white font-black drop-shadow-md"
                : "text-white/90 font-bold hover:text-white hover:bg-white/20 drop-shadow-sm"
                } ${isExpanded ? "px-4" : "justify-center"}`}
              title={!isExpanded ? item.label : ""}
            >
              {/* Active Indicator Background */}
              {activeNav === item.id && (
                <motion.div 
                  layoutId="activePharmacistNav"
                  className="absolute inset-0 bg-white/30 border border-white/50 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className={`relative z-10 flex items-center ${isExpanded ? "gap-4" : ""}`}>
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <AnimatePresence>
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
                </AnimatePresence>
              </div>

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

      <div className="flex flex-col gap-1.5 w-full px-3 relative pt-3 border-t border-white/25 mt-2 shrink-0">
        <button onClick={() => navigate('/dashboard/notifications')} className={`relative flex items-center h-12 rounded-2xl transition-all group overflow-hidden shrink-0 text-white/90 font-bold hover:text-white hover:bg-white/20 drop-shadow-sm ${isExpanded ? "px-4" : "justify-center"}`}>
          <div className={`relative z-10 flex items-center ${isExpanded ? "gap-4" : ""}`}>
            <div className="group-hover:scale-110 transition-transform duration-300"><Bell size={22} strokeWidth={2.5} /></div>
            <AnimatePresence>
              {isExpanded && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="whitespace-nowrap text-[15px] tracking-wide">Thông báo</motion.span>}
            </AnimatePresence>
          </div>
          {!isExpanded && <div className="absolute left-14 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">Thông báo</div>}
        </button>
        <button onClick={handleLogout} className={`w-full flex items-center h-12 rounded-2xl text-rose-100 font-bold hover:text-white hover:bg-rose-500/20 drop-shadow-sm transition-all duration-300 group ${isExpanded ? "px-4 gap-4" : "justify-center"}`}
          title={!isExpanded ? "Đăng xuất" : ""}
        >
          <LogOut size={22} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          {isExpanded && <span className="whitespace-nowrap tracking-wide text-[15px]">Đăng xuất</span>}
        </button>
      </div>
    </motion.nav>
    </motion.div>
  );
}
