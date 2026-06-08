import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { 
  Home, Pill, Truck, ArrowRightLeft, Package, AlertTriangle, ClipboardPlus, Settings, Bell, LogOut, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    { id: "home", icon: <Home size={22} />, path: "/dashboard", label: "Tổng quan" },
    { id: "prescriptions", icon: <ClipboardPlus size={22} />, path: "/dashboard/pharmacist/prescriptions", label: "Phát thuốc" },
    { id: "medicines", icon: <Pill size={22} />, path: "/dashboard/medicines", label: "Danh mục Thuốc" },
    { id: "batches", icon: <Package size={22} />, path: "/dashboard/inventory/batches", label: "Lô thuốc" },
    { id: "transactions", icon: <ArrowRightLeft size={22} />, path: "/dashboard/inventory/transactions", label: "Xuất/Nhập kho" },
    { id: "suppliers", icon: <Truck size={22} />, path: "/dashboard/suppliers", label: "Nhà cung cấp" },
    { id: "alerts", icon: <AlertTriangle size={22} />, path: "/dashboard/inventory/alerts", label: "Cảnh báo" },
    { id: "settings", icon: <Settings size={22} />, path: "/dashboard/profile", label: "Cài đặt" },
  ];

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 260 : 70 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col justify-between bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] py-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-[calc(100vh-104px)] sticky top-[80px] z-[100]"
    >
      <div className="flex flex-col gap-3 w-full px-3 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Expand Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all shrink-0 ${isExpanded ? "self-end mr-1" : "mx-auto"}`}
        >
          <ChevronRight size={22} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col gap-1.5 w-full mt-2 flex-1">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`h-11 shrink-0 rounded-2xl flex items-center transition-all duration-300 group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} ${activeNav === item.id ? 'bg-teal-400/20 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="shrink-0">{item.icon}</div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-semibold text-sm whitespace-nowrap overflow-hidden text-left"
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

      <div className="flex flex-col gap-1.5 w-full px-3 relative pt-3 border-t border-white/10 mt-2 shrink-0">
        <button onClick={() => navigate('/dashboard/notifications')} className={`h-11 rounded-2xl flex items-center transition-all group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} text-white/60 hover:bg-white/10 hover:text-white`}>
          <div className="shrink-0"><Bell size={22} /></div>
          <AnimatePresence>
            {isExpanded && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:"auto"}} exit={{opacity:0, width:0}} className="font-semibold text-sm whitespace-nowrap overflow-hidden">Thông báo</motion.span>}
          </AnimatePresence>
          {!isExpanded && <div className="absolute left-14 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">Thông báo</div>}
        </button>
        <button onClick={handleLogout} className={`h-11 rounded-2xl flex items-center transition-all group relative ${isExpanded ? "px-4 justify-start gap-4" : "w-11 mx-auto justify-center"} text-rose-300/70 hover:bg-rose-500/20 hover:text-rose-300`}>
          <div className="shrink-0"><LogOut size={22} /></div>
          <AnimatePresence>
            {isExpanded && <motion.span initial={{opacity:0, width:0}} animate={{opacity:1, width:"auto"}} exit={{opacity:0, width:0}} className="font-semibold text-sm whitespace-nowrap overflow-hidden">Đăng xuất</motion.span>}
          </AnimatePresence>
          {!isExpanded && <div className="absolute left-14 bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">Đăng xuất</div>}
        </button>
      </div>
    </motion.nav>
  );
}
