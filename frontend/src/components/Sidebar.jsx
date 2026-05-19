import { Building2, CalendarDays, LayoutDashboard, Shield, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/departments", label: "Chuyên khoa", icon: Building2 },
  { to: "/dashboard", label: "Users", icon: UsersRound },
  { to: "/dashboard", label: "Security", icon: Shield },
  { to: "/dashboard", label: "Appointments", icon: CalendarDays },
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
