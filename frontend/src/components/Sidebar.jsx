import {
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  FlaskConical,
  KeyRound,
  MessageSquare,
  History,
  CreditCard,
  PackageOpen,
  HeartPulse,
  LayoutDashboard,
  Pill,
  Receipt,
  Search,
  Shield,
  Siren,
  Stethoscope,
  Truck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  UserSquare,
  UserCheck,
  Star,
  FileText,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Logo from "./Logo.jsx";

const adminItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare, roles: ["PATIENT", "DOCTOR", "STAFF"] },
  { to: "/dashboard/notifications", label: "Thông báo", icon: Bell },
  { to: "/dashboard/doctor-appointments", label: "Lịch khám hôm nay", icon: CalendarDays, roles: ["DOCTOR"] },
  { to: "/dashboard/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  { to: "/dashboard/departments", label: "Chuyên khoa", icon: Building2, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/medical-services", label: "Dịch vụ y tế", icon: HeartPulse, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/invoices", label: "Hóa đơn", icon: Receipt, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/payments", label: "Thanh toán", icon: CreditCard, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/medicines", label: "Thuốc", icon: Pill, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/batches", label: "Lô thuốc", icon: PackageOpen, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/transactions", label: "Giao dịch kho", icon: History, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/alerts", label: "Cảnh báo kho", icon: Siren, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/pharmacist/prescriptions", label: "Cấp phát thuốc", icon: ClipboardList, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users, roles: ["ADMIN", "STAFF", "DOCTOR"] },
  { to: "/dashboard/users", label: "Tài khoản", icon: UsersRound, roles: ["ADMIN"] },
  { to: "/dashboard/security", label: "Bảo mật", icon: Shield, roles: ["ADMIN"] },
  { to: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/consultation", label: "Phòng khám", icon: Stethoscope, roles: ["DOCTOR"] },
  { to: "/dashboard/lab-requests", label: "Phòng xét nghiệm", icon: FlaskConical, roles: ["LAB_TECHNICIAN", "ADMIN"] },
  { to: "/dashboard/walk-in", label: "Khám trực tiếp", icon: UserPlus, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/receptionist-appointments", label: "Check-in Bệnh nhân", icon: UserCheck, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/queue-management", label: "Quản lý hàng đợi", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/reviews", label: "Đánh giá", icon: Star, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/articles", label: "Bài viết y tế", icon: FileText, roles: ["ADMIN", "DOCTOR"] },
  { to: "/dashboard/doctor-leave-requests", label: "Yêu cầu nghỉ", icon: CalendarOff, roles: ["DOCTOR"] },
  { to: "/dashboard/admin/doctor-leave-requests", label: "Duyệt yêu cầu nghỉ", icon: CalendarOff, roles: ["ADMIN"] },
];

const patientItems = [
  { to: "/dashboard", label: "Trang chủ", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare },
  { to: "/dashboard/notifications", label: "Thông báo", icon: Bell },
  { to: "/dashboard/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  { to: "/dashboard/available-slots", label: "Tìm ca khám trống", icon: Search },
  { to: "/dashboard/ai-chat", label: "Tư vấn AI", icon: MessageSquare },
  { to: "/dashboard/my-appointments", label: "Lịch hẹn của tôi", icon: CalendarDays },
  { to: "/dashboard/queue-status", label: "Trạng thái hàng đợi", icon: ClipboardList },
  { to: "/dashboard/my-medical-history", label: "Lịch sử bệnh án", icon: History },
  { to: "/dashboard/my-lab-results", label: "Kết quả xét nghiệm", icon: FlaskConical },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRoles = user?.roles?.map(r => r.roleName ? r.roleName : r) || [];
  
  const isStaffOrAdmin = userRoles.some(role => 
    ["ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF", "PHARMACIST", "LAB_TECHNICIAN"].includes(role)
  );
  
  const items = isStaffOrAdmin ? adminItems : patientItems;

  const filteredItems = items.filter(item => {
    if (!item.roles) return true; // No roles defined = accessible to everyone
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white/70 backdrop-blur-2xl border border-white/60 flex flex-col h-full z-30 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative rounded-[2rem] overflow-hidden">
      <div className="h-[88px] flex items-center justify-center border-b border-white/60 hover:bg-white/40 transition-colors cursor-pointer" onClick={() => navigate('/')}>
        <Logo size={42} />
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
        <nav className="flex flex-col gap-1.5" aria-label="Main navigation">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-[1rem] font-extrabold transition-all duration-300 group ${
                  isActive 
                    ? "bg-gradient-to-r from-teal-50 to-emerald-50/30 text-teal-700 shadow-sm border border-teal-100/50 relative overflow-hidden" 
                    : "text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-800 border border-transparent"
                }`}
                end={item.end}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-r-md"></div>}
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-sm" : "group-hover:scale-110"}`} />
                    <span className="text-[14.5px] whitespace-nowrap">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      {/* Footer Branding */}
      <div className="p-6 border-t border-white/60 bg-gradient-to-t from-white/80 to-transparent">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
           <span>Medical Clinic</span>
           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
           <span>v2.0</span>
        </div>
      </div>
    </aside>
  );
}
