import { useState } from "react";
import { ChevronDown, Home, KeyRound, LogOut, UserSquare } from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/useAuth.js";
import Sidebar from "../components/Sidebar.jsx";
import DoctorSidebar from "./DoctorSidebar.jsx";
import PharmacistSidebar from "./PharmacistSidebar.jsx";
import PatientSidebar from "./PatientSidebar.jsx";
import LabTechnicianSidebar from "./LabTechnicianSidebar.jsx";
import ReceptionistSidebar from "./ReceptionistSidebar.jsx";
import AdminSidebar from "./AdminSidebar.jsx";

const normalizeRole = (role) => {
  const roleName = typeof role === "string" ? role : role?.roleName;
  return roleName?.replace(/^ROLE_/, "").toUpperCase();
};

/* Logo SVG matching the landing page */
const LogoSVG = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <mask id="crossMaskDash">
      <path d="M32 15 h36 v22 h22 v26 h-22 v22 h-36 v-22 h-22 v-26 h22 z" fill="white" stroke="white" strokeWidth="4" strokeLinejoin="round" />
    </mask>
    <g mask="url(#crossMaskDash)">
      <rect x="0" y="0" width="100" height="100" fill="#12c3d6" />
      <path d="M0 0 H100 V20 C45 35, 30 55, 20 100 H0 Z" fill="#064e8a" />
      <path d="M20 100 C30 55, 45 35, 100 20" stroke="white" strokeWidth="6" fill="none" />
    </g>
  </svg>
);

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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

  const isDoctor = roles.includes("DOCTOR");
  const isPharmacist = roles.includes("PHARMACIST");
  const isLabTechnician = roles.includes("LAB_TECHNICIAN");
  const isReceptionist = roles.includes("RECEPTIONIST") && !roles.includes("ADMIN");
  const isPatientOnly = roles.includes("PATIENT") && !isDoctor && !isPharmacist && !isLabTechnician;
  const isAdminShell = roles.includes("ADMIN") && !isDoctor && !isPharmacist && !isPatientOnly && !isLabTechnician;
  const usePatientVisualShell = isPatientOnly || isAdminShell || isPharmacist || isLabTechnician || isReceptionist;
  const useTopNavbarLayout = isPatientOnly || isDoctor;
  const isLightShell = isPharmacist || isLabTechnician;

  const getNavLinks = () => {
    if (!isPatientOnly) return [];

    return [
      { label: "Tổng quan", path: "/dashboard" },
      { label: "Đặt lịch khám", path: "/dashboard/available-slots" },
      { label: "Lịch hẹn", path: "/dashboard/my-appointments" },
      { label: "Bệnh án", path: "/dashboard/my-medical-history" },
      { label: "Trợ lý AI", path: "/dashboard/ai-chat" },
    ];
  };

  /* ─── PATIENT & DOCTOR: Full-width top header bar (matching landing page) ─── */
  const renderPatientHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 md:px-7">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => navigate(isDoctor ? '/dashboard' : '/')}>
          <LogoSVG className="w-9 h-9 drop-shadow-sm group-hover:scale-105 transition-transform" />
          <div className="hidden sm:flex flex-col justify-center leading-none">
            <span className="font-extrabold text-[1.1rem] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Medical</span>
            <span className="font-semibold text-[0.7rem] tracking-widest text-teal-600">Clinic</span>
          </div>
        </div>

        {/* Center: Top Horizontal Navigation Links */}
        {getNavLinks().length > 0 && (
          <nav className="hidden md:flex items-center gap-1.5">
            {getNavLinks().map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path)) ||
                (item.path === "/dashboard/pharmacist/prescriptions" && location.pathname.startsWith("/dashboard/prescriptions"));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all ${isActive
                    ? "bg-[#0A604E] !text-white shadow-sm shadow-[#0A604E]/10"
                    : "!text-slate-700 hover:bg-[#F0F9F7] hover:!text-[#0A604E]"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 !text-slate-500 hover:bg-teal-50 hover:!text-teal-600 hover:border-teal-200 transition-all"
            aria-label="Home"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={18} />
          </button>

          <NotificationBell theme="light" />

          <div className="hidden md:block h-7 w-px bg-slate-200"></div>

          <div className="relative flex items-center gap-2.5">
            <div className="hidden md:flex flex-col items-end">
              <strong className="text-[13px] font-bold leading-tight !text-slate-800">{user?.fullName || "Clinic Admin"}</strong>
              <span className="text-[10px] font-semibold uppercase tracking-wider !text-teal-600">{rolesText}</span>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-teal-400/30 bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white shadow-sm transition hover:scale-105"
              aria-label="Mở menu tài khoản"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
            </button>
            {accountMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-[60] w-52 overflow-hidden rounded-2xl border border-[#DDEDEA] bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,.14)]">
                <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/profile"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#F3FFFB] hover:text-[#007D68]"><UserSquare size={17} /> Hồ sơ cá nhân</button>
                <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/change-password"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#F3FFFB] hover:text-[#007D68]"><KeyRound size={17} /> Đổi mật khẩu</button>
                <div className="mx-2 my-1 border-t border-[#E8F1EF]" />
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"><LogOut size={17} /> Đăng xuất</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );

  /* ─── NON-PATIENT: Keep original floating pill header ─── */
  const renderOriginalHeader = () => (
    <header className="fixed top-6 right-6 z-50 flex justify-end">
      <div className={`${isLightShell ? "bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-slate-800" : usePatientVisualShell ? "patient-glass-panel" : "bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"} py-2.5 px-5 rounded-[2rem] flex items-center gap-4 md:gap-6`}>

        <button
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all group ${isLightShell ? "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 shadow-sm" : usePatientVisualShell ? "patient-header-icon-btn" : "bg-white/80 border border-white hover:bg-teal-50 hover:border-teal-100 text-slate-500 hover:text-teal-600 shadow-sm"}`}
          aria-label="Home"
          onClick={() => navigate('/dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </button>

        <NotificationBell />

        <div className={`hidden md:block h-8 w-[2px] rounded-full ${isLightShell ? "bg-slate-200" : usePatientVisualShell ? "bg-white/20" : "bg-slate-200/60"}`}></div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <strong className={`text-[14px] font-extrabold leading-tight ${isLightShell ? "text-slate-800" : usePatientVisualShell ? "text-white" : "text-slate-800"}`}>{user?.fullName || "Clinic Admin"}</strong>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLightShell ? "text-teal-600" : usePatientVisualShell ? "text-teal-200" : "text-teal-600"}`}>{rolesText}</span>
          </div>
          {isAdminShell ? (
            <div className="admin-account-menu">
              <button
                className="admin-account-trigger"
                type="button"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                <span className="admin-account-avatar">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
                </span>
                <ChevronDown size={15} className={accountMenuOpen ? "open" : ""} />
              </button>
              {accountMenuOpen && (
                <div className="admin-account-dropdown">
                  <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/profile"); }}>
                    <UserSquare size={16} />
                    Hồ sơ của tôi
                  </button>
                  <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/change-password"); }}>
                    <KeyRound size={16} />
                    Đổi mật khẩu
                  </button>
                  <button className="danger" type="button" onClick={handleLogout}>
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-extrabold shadow-md border-2 border-white overflow-hidden relative">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span>{initials}</span>}
            </div>
          )}
        </div>

        {!isAdminShell && (
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all group ${isLightShell ? "bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 shadow-sm" : usePatientVisualShell ? "patient-header-icon-btn patient-header-icon-btn-danger" : "bg-white/80 border border-white hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-500 shadow-sm"}`}
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOut size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </header>
  );

  const renderAdminHeader = () => (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="admin-topbar-title">
          <span className="admin-topbar-mark"><LogoSVG className="w-8 h-8" /></span>
          <div>
            <span className="admin-topbar-kicker">Medical Clinic</span>
            <strong>{getPageTitle(location.pathname)}</strong>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <button className="admin-topbar-home" type="button" aria-label="Về bảng điều khiển" onClick={() => navigate("/dashboard")}>
            <Home size={18} />
          </button>
          <NotificationBell />
          <div className="admin-topbar-divider" />
          <div className="admin-account-menu">
            <button
              className="admin-account-trigger"
              type="button"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <span className="admin-account-avatar">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials}
              </span>
              <span className="hidden sm:grid text-left leading-tight">
                <strong>{user?.fullName || "Clinic Admin"}</strong>
                <small>{rolesText}</small>
              </span>
              <ChevronDown size={15} className={accountMenuOpen ? "open" : ""} />
            </button>
            {accountMenuOpen && (
              <div className="admin-account-dropdown">
                <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/profile"); }}><UserSquare size={16} />Hồ sơ của tôi</button>
                <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/dashboard/change-password"); }}><KeyRound size={16} />Đổi mật khẩu</button>
                <button className="danger" type="button" onClick={handleLogout}><LogOut size={16} />Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className={`flex flex-col min-h-screen w-full relative selection:bg-teal-200 selection:text-teal-900 font-sans overflow-y-auto overflow-x-hidden ${useTopNavbarLayout ? "" : usePatientVisualShell ? "patient-shell" : ""} ${isAdminShell ? "admin-shell" : ""} ${isReceptionist ? "receptionist-shell" : ""} ${isPatientOnly ? "patient-web-theme" : ""}`}>
      {/* Global Background */}
      {isAdminShell ? (
        <div className="admin-page-background" />
      ) : isDoctor ? (
        /* ─── DOCTOR: Solid light teal background matching design ─── */
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#E2F2EE]" />
      ) : isPatientOnly ? (
        /* ─── PATIENT: Solid light teal background matching design ─── */
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F8FFFC]" />
      ) : usePatientVisualShell ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a3d38]">
          {/* Rich teal base — darker & more saturated */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#134e4a]"></div>

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
        <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200" />
      )}

      {/* Header */}
      {isAdminShell ? renderAdminHeader() : (isPatientOnly || isDoctor) ? renderPatientHeader() : renderOriginalHeader()}

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 w-full relative z-10 flex flex-col"
      >
        <main className={`flex-1 w-full mx-auto ${(isPatientOnly || isDoctor) ? "pt-[68px] px-0 pb-0" : isAdminShell ? "admin-main" : "max-w-[1700px] pt-[80px] px-4 md:px-6 pb-4 md:pb-6"} flex gap-0 h-full`}>
          {isAdminShell ? (
            <AdminSidebar />
          ) : roles.includes("DOCTOR") ? (
            <DoctorSidebar />
          ) : roles.includes("PHARMACIST") ? (
            <PharmacistSidebar />
          ) : roles.includes("PATIENT") && !isPatientOnly ? (
            <PatientSidebar />
          ) : roles.includes("LAB_TECHNICIAN") ? (
            <LabTechnicianSidebar />
          ) : isReceptionist ? (
            <ReceptionistSidebar />
          ) : (
            <Sidebar />
          )}

          <div className={`flex-1 min-w-0 flex flex-col h-full ${isDoctor ? "px-6 py-6" : isPatientOnly ? "px-4 py-7 md:px-6 md:py-8" : ""}`}>
            <Outlet />
          </div>
        </main>
      </motion.div>
    </div>
  );
}
