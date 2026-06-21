import { useEffect, useState } from "react";
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
  Undo2,
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
  FileClock,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Logo from "./Logo.jsx";
import { getActiveAlerts } from "../services/inventoryService";
import { motion, useScroll, useSpring } from "framer-motion";

const menuItems = [
  { to: "/dashboard", label: "Trang chủ", icon: LayoutDashboard, end: true },
  { to: "/dashboard/profile", label: "Hồ sơ của tôi", icon: UserSquare },
  { to: "/dashboard/notifications", label: "Thông báo", icon: Bell },
  { to: "/dashboard/doctor-appointments", label: "Lịch khám hôm nay", icon: CalendarDays, roles: ["DOCTOR"] },
  { to: "/dashboard/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  { to: "/dashboard/departments", label: "Chuyên khoa", icon: Building2, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/medical-services", label: "Dịch vụ y tế", icon: HeartPulse, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/invoices", label: "Hóa đơn", icon: Receipt, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/payments", label: "Thanh toán", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/refunds", label: "Hoàn tiền", icon: Undo2, roles: ["ADMIN"] },
  { to: "/dashboard/medicines", label: "Thuốc", icon: Pill, roles: ["ADMIN", "DOCTOR", "PHARMACIST"] },
  { to: "/dashboard/suppliers", label: "Nhà cung cấp", icon: Truck, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/batches", label: "Lô thuốc", icon: PackageOpen, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/transactions", label: "Giao dịch kho", icon: History, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/inventory/alerts", label: "Cảnh báo kho", icon: Siren, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/pharmacist/prescriptions", label: "Cấp phát thuốc", icon: ClipboardList, roles: ["ADMIN", "PHARMACIST"] },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users, roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  { to: "/dashboard/users", label: "Tài khoản", icon: UsersRound, roles: ["ADMIN"] },
  { to: "/dashboard/security", label: "Bảo mật", icon: Shield, roles: ["ADMIN"] },
  { to: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays, roles: ["ADMIN", "RECEPTIONIST", "DOCTOR"] },
  { to: "/dashboard/consultation", label: "Phòng khám", icon: Stethoscope, roles: ["DOCTOR"] },
  { to: "/dashboard/lab-requests", label: "Phòng xét nghiệm", icon: FlaskConical, roles: ["LAB_TECHNICIAN", "ADMIN"] },
  { to: "/dashboard/lab-tests", label: "Danh mục xét nghiệm", icon: FlaskConical, roles: ["LAB_TECHNICIAN", "ADMIN"] },
  { to: "/dashboard/walk-in", label: "Khám trực tiếp", icon: UserPlus, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/receptionist-appointments", label: "Check-in Bệnh nhân", icon: UserCheck, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/queue-management", label: "Quản lý hàng đợi", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/reviews", label: "Đánh giá", icon: Star, roles: ["ADMIN", "RECEPTIONIST"] },
  { to: "/dashboard/articles", label: "Bài viết y tế", icon: FileText, roles: ["ADMIN", "DOCTOR"] },
  { to: "/dashboard/audit-logs", label: "Nhật ký hệ thống", icon: FileClock, roles: ["ADMIN"] },
  { to: "/dashboard/system-settings", label: "Cấu hình hệ thống", icon: Settings, roles: ["ADMIN"] },
  { to: "/dashboard/doctor-schedule", label: "Lịch làm việc", icon: CalendarDays, roles: ["DOCTOR"] },
  { to: "/dashboard/doctor-leave-requests", label: "Yêu cầu nghỉ", icon: CalendarOff, roles: ["DOCTOR"] },
  { to: "/dashboard/admin/doctor-leave-requests", label: "Duyệt yêu cầu nghỉ", icon: CalendarOff, roles: ["ADMIN"] },
  { to: "/dashboard/available-slots", label: "Tìm ca khám trống", icon: Search, roles: ["PATIENT"] },
  { to: "/dashboard/ai-chat", label: "Tư vấn AI", icon: MessageSquare, roles: ["PATIENT"] },
  { to: "/dashboard/my-appointments", label: "Lịch hẹn của tôi", icon: CalendarDays, roles: ["PATIENT"] },
  { to: "/dashboard/queue-status", label: "Trạng thái hàng đợi", icon: ClipboardList, roles: ["PATIENT"] },
  { to: "/dashboard/my-medical-history", label: "Lịch sử bệnh án", icon: History, roles: ["PATIENT"] },
  { to: "/dashboard/my-lab-results", label: "Kết quả xét nghiệm", icon: FlaskConical, roles: ["PATIENT"] },
];

const adminMenuGroups = [
  {
    key: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { to: "/dashboard", label: "Tổng quan", end: true },
    ],
  },
  {
    key: "operations",
    label: "Vận hành",
    icon: CalendarDays,
    items: [
      { to: "/dashboard/appointments", label: "Lịch hẹn" },
      { to: "/dashboard/patients", label: "Bệnh nhân" },
      { to: "/dashboard/doctors", label: "Bác sĩ" },
      { to: "/dashboard/lab-requests", label: "Hồ sơ khám / xét nghiệm" },
      { to: "/dashboard/walk-in", label: "Khám trực tiếp" },
      { to: "/dashboard/queue-management", label: "Hàng đợi" },
      { to: "/dashboard/admin/doctor-leave-requests", label: "Duyệt nghỉ phép" },
    ],
  },
  {
    key: "services",
    label: "Dịch vụ",
    icon: HeartPulse,
    items: [
      { to: "/dashboard/departments", label: "Chuyên khoa" },
      { to: "/dashboard/medical-services", label: "Dịch vụ y tế" },
      { to: "/dashboard/medicines", label: "Thuốc" },
      { to: "/dashboard/lab-tests", label: "Danh mục xét nghiệm" },
      { to: "/dashboard/suppliers", label: "Nhà cung cấp" },
      { to: "/dashboard/inventory/batches", label: "Lô thuốc" },
      { to: "/dashboard/inventory/transactions", label: "Giao dịch kho" },
      { to: "/dashboard/inventory/alerts", label: "Cảnh báo kho" },
    ],
  },
  {
    key: "administration",
    label: "Quản trị",
    icon: Shield,
    items: [
      { to: "/dashboard/users", label: "Người dùng" },
      { to: "/dashboard/security", label: "Vai trò / phân quyền" },
      { to: "/dashboard/system-settings", label: "Cấu hình hệ thống" },
      { to: "/dashboard/audit-logs", label: "Nhật ký hệ thống" },
    ],
  },
  {
    key: "reports",
    label: "Báo cáo",
    icon: TrendingUp,
    items: [
      { to: "/dashboard/payments", label: "Doanh thu" },
      { to: "/dashboard/invoices", label: "Hóa đơn" },
      { to: "/dashboard/refunds", label: "Hoàn tiền" },
      { to: "/dashboard/reviews", label: "Đánh giá" },
      { to: "/dashboard/articles", label: "Bài viết" },
    ],
  },
];

const adminQuickItems = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/dashboard/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { to: "/dashboard/patients", label: "Bệnh nhân", icon: Users },
  { to: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound },
  { to: "/dashboard/users", label: "Người dùng", icon: UsersRound },
  { to: "/dashboard/medicines", label: "Dịch vụ / thuốc", icon: Pill },
  { to: "/dashboard/security", label: "Phân quyền", icon: Shield },
  { to: "/dashboard/system-settings", label: "Cấu hình", icon: Settings },
];

const normalizeRole = (role) => {
  const roleName = typeof role === "string" ? role : role?.roleName;
  return roleName?.replace(/^ROLE_/, "").toUpperCase();
};

export default function Sidebar() {
  const { user } = useAuth();
  const userRoles = new Set((user?.roles || []).map(normalizeRole));
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = userRoles.has("ADMIN");
  const [adminSidebarExpanded, setAdminSidebarExpanded] = useState(() => {
    return localStorage.getItem("adminSidebarExpanded") === "true";
  });
  const activeAdminGroup = adminMenuGroups.find((group) =>
    group.items.some((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ),
  )?.key;
  const [openAdminGroups, setOpenAdminGroups] = useState(() => new Set(["overview", "operations"]));

  const hasInventoryRoles =
    userRoles.has("ADMIN") || userRoles.has("PHARMACIST");

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem("adminSidebarExpanded", adminSidebarExpanded);
    }
  }, [adminSidebarExpanded, isAdmin]);

  useEffect(() => {
    if (!hasInventoryRoles) {
      setAlertCount(0);
      return undefined;
    }

    const fetchAlerts = async () => {
      try {
        const res = await getActiveAlerts({ page: 0, size: 1 });
        setAlertCount(res.data?.totalElements || 0);
      } catch (error) {
        console.error("Error fetching inventory alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasInventoryRoles]);

  const filteredItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => userRoles.has(role));
  });

  useEffect(() => {
    if (!activeAdminGroup) return;
    setOpenAdminGroups((current) => {
      if (current.has(activeAdminGroup)) return current;
      const next = new Set(current);
      next.add(activeAdminGroup);
      return next;
    });
  }, [activeAdminGroup]);

  const { scrollY } = useScroll();
  const springY = useSpring(scrollY, { stiffness: 100, damping: 18, mass: 0.4 });

  const toggleAdminGroup = (groupKey) => {
    setOpenAdminGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <motion.div style={{ y: springY }} className="hidden md:block relative h-[calc(100vh-104px)] z-[100] self-start flex-none">
      <aside className={`dashboard-sidebar ${isAdmin ? `admin-sidebar ${adminSidebarExpanded ? "admin-sidebar-expanded" : "admin-sidebar-collapsed"}` : ""} h-full`}>
      <div className="sidebar-brand" onClick={() => navigate('/dashboard')} title="Trang chủ">
        <Logo size={42} showText={!isAdmin || adminSidebarExpanded} />
        {isAdmin && adminSidebarExpanded && (
          <div>
            <strong>Clinic Admin</strong>
            <span>Operations</span>
          </div>
        )}
      </div>
      
      <div className="sidebar-scroll custom-scrollbar">
        {isAdmin && (
          <button
            className="admin-sidebar-toggle"
            type="button"
            aria-label={adminSidebarExpanded ? "Thu gọn sidebar" : "Mở rộng sidebar"}
            onClick={() => setAdminSidebarExpanded((expanded) => !expanded)}
          >
            <ChevronRight size={22} className={adminSidebarExpanded ? "rotate" : ""} />
          </button>
        )}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {isAdmin && !adminSidebarExpanded ? (
            adminQuickItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) => `admin-quick-link ${isActive ? "active" : ""}`}
                  end={item.end}
                  title={item.label}
                >
                  <Icon size={22} strokeWidth={2.25} />
                </NavLink>
              );
            })
          ) : isAdmin ? (
            adminMenuGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openAdminGroups.has(group.key);
              const isActiveGroup = activeAdminGroup === group.key;

              return (
                <div className="admin-nav-group" key={group.key}>
                  <button
                    className={`admin-nav-trigger ${isActiveGroup ? "active" : ""}`}
                    type="button"
                    onClick={() => toggleAdminGroup(group.key)}
                    aria-expanded={isOpen}
                  >
                    <GroupIcon size={19} strokeWidth={isActiveGroup ? 2.5 : 2} />
                    <span>{group.label}</span>
                    <ChevronDown className={isOpen ? "open" : ""} size={16} />
                  </button>

                  {isOpen && (
                    <div className="admin-nav-children">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.label}
                          to={item.to}
                          className={({ isActive }) => `admin-child-link ${isActive ? "active" : ""}`}
                          end={item.end}
                        >
                          <span>{item.label}</span>
                          {item.to === "/dashboard/inventory/alerts" && alertCount > 0 && (
                            <span className="sidebar-badge">
                              {alertCount > 99 ? "99+" : alertCount}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                end={item.end}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {item.to === "/dashboard/inventory/alerts" && alertCount > 0 && (
                      <span className="sidebar-badge">
                        {alertCount > 99 ? "99+" : alertCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      
      <div className="sidebar-footer">
        <div>
          {isAdmin && !adminSidebarExpanded ? (
            <strong>v2</strong>
          ) : (
            <>
              <span>Medical Clinic</span>
              <strong>v2.0</strong>
            </>
          )}
        </div>
      </div>
      </aside>
    </motion.div>
  );
}
