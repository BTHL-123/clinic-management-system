import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
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
  Undo2,
  Stethoscope,
  Truck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  UserSquare,
  UserCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Logo from "./Logo.jsx";
import { getActiveAlerts } from "../services/inventoryService";

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
  { to: "/dashboard/refunds", label: "Hoàn tiền", icon: Undo2, roles: ["ADMIN"] },
  { to: "/dashboard/medicines", label: "Thuốc", icon: Pill, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/batches", label: "Lô thuốc", icon: PackageOpen, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/transactions", label: "Giao dịch kho", icon: History, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/alerts", label: "Cảnh báo kho", icon: Siren, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound, roles: ["ADMIN", "STAFF"] },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users, roles: ["ADMIN", "STAFF", "DOCTOR"] },
  { to: "/dashboard/users", label: "Tài khoản", icon: UsersRound, roles: ["ADMIN"] },
  { to: "/dashboard/security", label: "Bảo mật", icon: Shield, roles: ["ADMIN"] },
  { to: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays },
  { to: "/dashboard/consultation", label: "Phòng khám", icon: Stethoscope, roles: ["DOCTOR"] },
  { to: "/dashboard/lab-requests", label: "Phòng xét nghiệm", icon: FlaskConical, roles: ["LAB_TECHNICIAN", "ADMIN"] },
  { to: "/dashboard/walk-in", label: "Walk-in Appointment", icon: UserPlus, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/receptionist-appointments", label: "Check-in Bệnh nhân", icon: UserCheck, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/queue-management", label: "Quản lý hàng đợi", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
];

const patientItems = [
  { to: "/dashboard", label: "Trang chủ", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare },
  { to: "/dashboard/notifications", label: "Thông báo", icon: Bell },
  { to: "/dashboard/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  { to: "/dashboard/available-slots", label: "Tìm ca khám trống", icon: Search },
  { to: "/dashboard/ai-chat", label: "Tư vấn AI", icon: MessageSquare },
  { to: "/dashboard/my-appointments", label: "Lịch hẹn của tôi", icon: CalendarDays },
  { to: "/dashboard/my-medical-history", label: "Lịch sử bệnh án", icon: History },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  const isPatient = user?.roles?.includes("PATIENT");
  const items = isPatient ? patientItems : adminItems;

  const userRoles = user?.roles || [];
  const hasInventoryRoles = userRoles.includes("ADMIN") || userRoles.includes("PHARMACIST");

  useEffect(() => {
    if (hasInventoryRoles) {
      const fetchAlerts = async () => {
        try {
          const res = await getActiveAlerts({ page: 0, size: 1 });
          setAlertCount(res.data?.totalElements || 0);
        } catch (error) {
          console.error("Error fetching inventory alerts:", error);
        }
      };
      
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // refresh every 5 mins
      return () => clearInterval(interval);
    }
  }, [hasInventoryRoles]);

  const filteredItems = items.filter(item => {
    if (!item.roles) return true; // No roles defined = accessible to everyone
    return item.roles.some(role => userRoles.includes(role));
  });

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <Logo size={36} />
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
              {item.to === "/dashboard/inventory/alerts" && alertCount > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  lineHeight: 1,
                  marginLeft: "auto"
                }}>
                  {alertCount > 99 ? "99+" : alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
