import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function PageHeader({
  title,
  icon: Icon,
  iconColor = "text-teal-400",
  subtitle,
  onBack,
  backText = "Quay lại",
  showBackButton = true,
  rightContent = null,
  className = "mb-10",
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roles = (user?.roles || []).map((r) => {
    const roleName = typeof r === "string" ? r : r?.roleName;
    return roleName?.replace(/^ROLE_/, "").toUpperCase();
  }).filter(Boolean);

  const isPatientOnly =
    roles.includes("PATIENT") &&
    !roles.includes("DOCTOR") &&
    !roles.includes("PHARMACIST") &&
    !roles.includes("LAB_TECHNICIAN") &&
    !roles.includes("RECEPTIONIST") &&
    !roles.includes("ADMIN");

  const isAdminShell =
    roles.includes("ADMIN") &&
    !roles.includes("DOCTOR") &&
    !roles.includes("PHARMACIST") &&
    !roles.includes("LAB_TECHNICIAN") &&
    !isPatientOnly;

  const resolvedIconColor = iconColor === "text-white" ? "text-teal-500" : iconColor;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (isPatientOnly || isAdminShell) {
    return (
      <div className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full ${className}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100/50 shrink-0">
                <Icon size={22} className="text-teal-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
          {subtitle && (
            <p className="text-slate-500 text-sm font-medium ml-[52px]">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {rightContent}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm"
            >
              <ArrowLeft size={16} />
              {backText}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full relative flex flex-col sm:flex-row justify-center items-center min-h-[80px] ${className}`}>
      <div className="w-auto sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0 z-20">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            {backText}
          </button>
        )}
      </div>

      <div className="flex flex-col items-center text-center mt-2 px-4 relative z-10">
        <h1 className={`inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight ${subtitle ? 'mb-4' : 'mb-0'}`}>
          {Icon && (
            <Icon size={32} className={`${resolvedIconColor} drop-shadow-md`} />
          )}
          <span className="drop-shadow-md">{title}</span>
        </h1>
        {subtitle && (
          <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            {subtitle}
          </p>
        )}
      </div>

      {rightContent && (
        <div className="w-auto sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 flex justify-end mt-4 sm:mt-0 px-4 sm:px-0 z-20">
          {rightContent}
        </div>
      )}
    </div>
  );
}
