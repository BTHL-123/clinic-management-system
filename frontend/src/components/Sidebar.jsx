import {
  Building2,
  CalendarDays,
  CreditCard,
  HeartPulse,
  LayoutDashboard,
  Receipt,
  Search,
  Shield,
  UserRound,
  Users,
  UsersRound,
  UserSquare,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const adminItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare, roles: ["PATIENT", "DOCTOR", "STAFF"] },
  { to: "/dashboard/departments", label: "Chuyên khoa", icon: Building2, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/medical-services", label: "Dịch vụ y tế", icon: HeartPulse, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/invoices", label: "Hóa đơn", icon: Receipt, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/payments", label: "Thanh toán", icon: CreditCard, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users, roles: ["ADMIN", "STAFF", "DOCTOR"] },
  { to: "/dashboard/users", label: "Tài khoản", icon: UsersRound, roles: ["ADMIN"] },
  { to: "/dashboard/security", label: "Bảo mật", icon: Shield, roles: ["ADMIN"] },
  { to: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays },
];

const patientItems = [
  { to: "/dashboard", label: "Trang chủ", icon: LayoutDashboard, end: true },
  { to: "/dashboard/available-slots", label: "Tìm ca khám trống", icon: Search },
  { to: "/dashboard/my-appointments", label: "Lịch hẹn của tôi", icon: CalendarDays },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare },
];

export default function Sidebar() {
  const { user } = useAuth();

  const isPatient = user?.roles?.includes("PATIENT");
  const items = isPatient ? patientItems : adminItems;

  const userRoles = user?.roles || [];

  const filteredItems = items.filter(item => {
    if (!item.roles) return true; // No roles defined = accessible to everyone
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark">AI</span>
        <span>Clinic System</span>
      </div>
      <nav className="nav-list" aria-label="Main navigation">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              end={item.end}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
