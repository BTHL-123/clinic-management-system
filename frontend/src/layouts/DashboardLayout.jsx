import { LogOut } from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/useAuth.js";
import Sidebar from "../components/Sidebar.jsx";
import DoctorSidebar from "./DoctorSidebar.jsx";
import PharmacistSidebar from "./PharmacistSidebar.jsx";
import PatientSidebar from "./PatientSidebar.jsx";
import bgImage from "../assets/images/background_2k.png";
import patientBgImage from "../assets/images/patient_bg.png";

const normalizeRole = (role) => {
  const roleName = typeof role === "string" ? role : role?.roleName;
  return roleName?.replace(/^ROLE_/, "").toUpperCase();
};

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

  const roles = (user?.roles || []).map(normalizeRole).filter(Boolean);
  const rolesText = roles.join(", ") || "User";

  const isDoctorOrPharmacist = roles.includes("DOCTOR") || roles.includes("PHARMACIST");
  const isPatientOnly = roles.includes("PATIENT") && !isDoctorOrPharmacist;

  return (
    <div className={`flex flex-col min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 font-sans overflow-y-auto overflow-x-hidden ${isPatientOnly ? "patient-shell" : ""}`}>
      {/* Global Background */}
      {isDoctorOrPharmacist ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0d9488] to-[#042f2e] opacity-80"></div>
          
          <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-teal-500/30 rounded-full blur-[160px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[80vw] h-[80vw] bg-emerald-600/20 rounded-full blur-[180px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
          <div className="absolute top-[20%] left-[40%] w-[50vw] h-[50vw] bg-cyan-700/20 rounded-full blur-[140px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>

          <div 
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
            }}
          ></div>
          <div className="absolute inset-0 bg-slate-900/30"></div>
        </div>
      ) : isPatientOnly ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a3d38]">
          {/* Rich teal base — darker & more saturated */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#134e4a]"></div>

          {/* Patient background artwork — boosted saturation & contrast */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-75 saturate-[1.45] contrast-[1.15] brightness-[0.82]"
            style={{ backgroundImage: `url(${patientBgImage})` }}
          ></div>

          {/* Vivid aurora mesh blobs */}
          <div className="absolute -top-[15%] -left-[5%] w-[55vw] h-[55vw] bg-teal-400/55 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: "10s" }}></div>
          <div className="absolute top-[5%] right-[-8%] w-[50vw] h-[50vw] bg-cyan-400/50 rounded-full blur-[90px] mix-blend-screen animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }}></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[65vw] h-[65vw] bg-emerald-500/45 rounded-full blur-[110px] mix-blend-screen animate-pulse" style={{ animationDuration: "14s", animationDelay: "4s" }}></div>
          <div className="absolute bottom-[0%] right-[5%] w-[45vw] h-[45vw] bg-teal-300/40 rounded-full blur-[80px] mix-blend-screen animate-pulse" style={{ animationDuration: "11s", animationDelay: "1s" }}></div>
          <div className="absolute top-[40%] left-[35%] w-[35vw] h-[35vw] bg-sky-400/30 rounded-full blur-[90px] mix-blend-screen animate-pulse" style={{ animationDuration: "13s", animationDelay: "3s" }}></div>

          {/* Depth vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b]/30 via-transparent to-[#022c22]/50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,44,34,0.45)_100%)]"></div>

          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
      ) : (
        <div 
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        >
          <div className="absolute inset-0 bg-slate-900/40"></div>
        </div>
      )}

      {/* Floating Context Pill (Top Right) - Hidden for Doctors as they have a custom topbar */}
      {!roles.includes("DOCTOR") && (
        <header className="fixed top-6 right-6 z-50 flex justify-end">
          <div className={`${isPatientOnly ? "patient-glass-panel" : "bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"} py-2.5 px-5 rounded-[2rem] flex items-center gap-4 md:gap-6`}>

            <button
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all group ${isPatientOnly ? "patient-header-icon-btn" : "bg-white/80 border border-white hover:bg-teal-50 hover:border-teal-100 text-slate-500 hover:text-teal-600 shadow-sm"}`}
              aria-label="Home"
              onClick={() => navigate('/dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </button>

            <NotificationBell />

            <div className={`hidden md:block h-8 w-[2px] rounded-full ${isPatientOnly ? "bg-white/20" : "bg-slate-200/60"}`}></div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <strong className={`text-[14px] font-extrabold leading-tight ${isPatientOnly ? "text-white" : "text-slate-800"}`}>{user?.fullName || "Clinic Admin"}</strong>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isPatientOnly ? "text-teal-200" : "text-teal-600"}`}>{rolesText}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-extrabold shadow-md border-2 border-white overflow-hidden relative">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
              </div>
            </div>

            <button
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all group ${isPatientOnly ? "patient-header-icon-btn patient-header-icon-btn-danger" : "bg-white/80 border border-white hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-500 shadow-sm"}`}
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>
      )}

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 w-full relative z-10 flex flex-col"
      >
        <main className="flex-1 w-full max-w-[1700px] mx-auto pt-[80px] px-4 md:px-6 pb-4 md:pb-6 flex gap-6 h-full">
          {roles.includes("DOCTOR") ? (
            <DoctorSidebar />
          ) : roles.includes("PHARMACIST") ? (
            <PharmacistSidebar />
          ) : roles.includes("PATIENT") ? (
            <PatientSidebar />
          ) : (
            <Sidebar />
          )}

          <div className="flex-1 min-w-0 flex flex-col h-full">
            <Outlet />
          </div>
        </main>
      </motion.div>
    </div>
  );
}
