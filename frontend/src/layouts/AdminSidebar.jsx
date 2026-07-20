import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileClock,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Pill,
  Settings,
  Shield,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const groups = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    items: [{ path: "/dashboard", label: "Bảng điều khiển", end: true }],
  },
  {
    id: "operations",
    label: "Vận hành",
    icon: CalendarDays,
    items: [
      { path: "/dashboard/appointments", label: "Lịch khám" },
      { path: "/dashboard/patients", label: "Bệnh nhân" },
      { path: "/dashboard/doctors", label: "Bác sĩ" },
      { path: "/dashboard/lab-requests", label: "Xét nghiệm" },
      { path: "/dashboard/queue-management", label: "Hàng đợi" },
      { path: "/dashboard/admin/doctor-leave-requests", label: "Duyệt nghỉ phép" },
      { path: "/dashboard/articles", label: "Bài viết y tế" },
    ],
  },
  {
    id: "services",
    label: "Dịch vụ & kho",
    icon: HeartPulse,
    items: [
      { path: "/dashboard/departments", label: "Chuyên khoa" },
      { path: "/dashboard/medical-services", label: "Dịch vụ y tế" },
      { path: "/dashboard/medicines", label: "Thuốc" },
      { path: "/dashboard/suppliers", label: "Nhà cung cấp" },
      { path: "/dashboard/inventory/batches", label: "Lô thuốc" },
      { path: "/dashboard/inventory/transactions", label: "Giao dịch kho" },
      { path: "/dashboard/inventory/alerts", label: "Cảnh báo kho" },
    ],
  },
  {
    id: "finance",
    label: "Tài chính",
    icon: TrendingUp,
    items: [
      { path: "/dashboard/reports/revenue", label: "Báo cáo doanh thu" },
      { path: "/dashboard/payments", label: "Thanh toán" },
      { path: "/dashboard/invoices", label: "Hóa đơn" },
      { path: "/dashboard/refunds", label: "Hoàn tiền" },
      { path: "/dashboard/reviews", label: "Đánh giá" },
    ],
  },
  {
    id: "system",
    label: "Quản trị",
    icon: Shield,
    items: [
      { path: "/dashboard/users", label: "Tài khoản" },
      { path: "/dashboard/security", label: "Vai trò & phân quyền" },
      { path: "/dashboard/system-settings", label: "Cấu hình hệ thống" },
      { path: "/dashboard/audit-logs", label: "Nhật ký hệ thống" },
    ],
  },
];

const quickItems = [
  { path: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { path: "/dashboard/appointments", label: "Lịch khám", icon: CalendarDays },
  { path: "/dashboard/patients", label: "Bệnh nhân", icon: Users },
  { path: "/dashboard/doctors", label: "Bác sĩ", icon: UserRound },
  { path: "/dashboard/articles", label: "Bài viết", icon: FileText },
  { path: "/dashboard/users", label: "Tài khoản", icon: UsersRound },
  { path: "/dashboard/medicines", label: "Thuốc", icon: Pill },
  { path: "/dashboard/inventory/batches", label: "Kho thuốc", icon: PackageOpen },
  { path: "/dashboard/reports/revenue", label: "Tài chính", icon: CreditCard },
  { path: "/dashboard/audit-logs", label: "Nhật ký", icon: FileClock },
  { path: "/dashboard/system-settings", label: "Cấu hình", icon: Settings },
];

const isItemActive = (pathname, item) =>
  item.end ? pathname === item.path : pathname.startsWith(item.path);

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => localStorage.getItem("adminSidebarExpanded") === "true");
  const activeGroup = groups.find((group) => group.items.some((item) => isItemActive(location.pathname, item)))?.id;
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const stored = localStorage.getItem("adminSidebarOpenGroups");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore invalid persisted menu state and use the defaults below.
    }
    return {
      overview: true,
      ...(activeGroup ? { [activeGroup]: true } : {})
    };
  });

  useEffect(() => {
    localStorage.setItem("adminSidebarExpanded", isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem("adminSidebarOpenGroups", JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    if (activeGroup) {
      // Keep the current route visible when navigating between admin sections.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenGroups((prev) => ({ ...prev, [activeGroup]: true }));
    }
  }, [activeGroup]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <motion.nav
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isExpanded ? 260 : 70 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="admin-floating-sidebar hidden md:flex"
      aria-label="Điều hướng quản trị"
    >
      <button
        type="button"
        className={`admin-sidebar-expand ${isExpanded ? "expanded" : ""}`}
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-label={isExpanded ? "Thu gọn menu" : "Mở rộng menu"}
      >
        <ChevronRight size={22} />
      </button>

      <div className="admin-floating-menu custom-scrollbar">
        {isExpanded ? (
          groups.map((group) => {
            const Icon = group.icon;
            const isOpen = !!openGroups[group.id];
            const isActive = activeGroup === group.id;
            return (
              <section className="admin-floating-group" key={group.id}>
                <button
                  type="button"
                  className={`admin-floating-group-trigger ${isActive ? "active" : ""}`}
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <Icon size={20} />
                  <span>{group.label}</span>
                  <ChevronDown size={16} className={isOpen ? "open" : ""} />
                </button>
                {isOpen && (
                  <div className="admin-floating-children">
                    {group.items.map((item) => (
                      <button
                        type="button"
                        key={item.path}
                        className={isItemActive(location.pathname, item) ? "active" : ""}
                        onClick={() => navigate(item.path)}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        ) : (
          quickItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.path}
                className={`admin-floating-quick ${isItemActive(location.pathname, item) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <Icon size={21} />
              </button>
            );
          })
        )}
      </div>

      <button type="button" className="admin-floating-logout" onClick={handleLogout} title="Đăng xuất">
        <LogOut size={21} />
        {isExpanded && <span>Đăng xuất</span>}
      </button>
    </motion.nav>
  );
}
