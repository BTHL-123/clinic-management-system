import { Building2, CalendarDays, LayoutDashboard, Shield, UsersRound, UserRound, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/departments", label: "Chuyên khoa", icon: Building2 },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users },
  { to: "/dashboard/users", label: "Tài khoản", icon: UsersRound },
  { to: "/dashboard/security", label: "Bảo mật", icon: Shield },
  { to: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark">AI</span>
        <span>Clinic System</span>
      </div>
      <nav className="nav-list" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.label} to={item.to} end={item.end} className="nav-item">
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
