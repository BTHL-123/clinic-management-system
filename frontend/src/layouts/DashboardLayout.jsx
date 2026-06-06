import { LogOut, User as UserIcon, Bell } from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/useAuth.js";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (user?.fullName || "AI")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const rolesText = user?.roles?.map(r => r.roleName ? r.roleName : r).join(", ") || "User";

  return (
    <div className="flex flex-col min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 font-sans overflow-y-auto overflow-x-hidden">

      {/* Global Background from LandingPage */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#14b8a6] to-[#0f766e]">
        {/* Glow Effects */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-teal-300/20 blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-900/40 blur-[120px] mix-blend-multiply"></div>

        {/* Abstract Wavy Layers */}
        <div className="absolute bottom-0 left-0 w-full h-[70%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#0d9488" fillOpacity="0.6" d="M0,224 C288,100 600,300 1440,120 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[55%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#0f766e" fillOpacity="0.8" d="M0,160 C400,320 800,100 1440,160 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[40%]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
            <path fill="#115e59" fillOpacity="0.9" d="M0,288 C500,100 900,320 1440,240 L1440,320 L0,320 Z"></path>
          </svg>
        </div>
      </div>

      {/* Floating Context Pill (Top Right) */}
      <header className="fixed top-6 right-6 z-50 flex justify-end">
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-2.5 px-5 rounded-[2rem] flex items-center gap-4 md:gap-6">

          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-white hover:bg-teal-50 hover:border-teal-100 text-slate-500 hover:text-teal-600 transition-all shadow-sm group"
            aria-label="Home"
            onClick={() => navigate('/dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </button>

          <NotificationBell />

          <div className="hidden md:block h-8 w-[2px] bg-slate-200/60 rounded-full"></div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <strong className="text-[14px] font-extrabold text-slate-800 leading-tight">{user?.fullName || "Clinic Admin"}</strong>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">{rolesText}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-extrabold shadow-md border-2 border-white overflow-hidden relative">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
            </div>
          </div>

          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-white hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-500 transition-all shadow-sm group"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 w-full relative z-10 flex flex-col"
        >
          <main className="flex-1 w-full max-w-[1400px] mx-auto pt-[80px] px-4 md:px-6 pb-4 md:pb-6 flex flex-col">
            <Outlet />
          </main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
