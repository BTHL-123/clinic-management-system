import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Headset,
  ListOrdered,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";

const actions = [
  {
    title: "Check-in bệnh nhân",
    description: "Xác nhận bệnh nhân đã đến và cấp số thứ tự.",
    path: "/dashboard/receptionist-appointments",
    icon: UserCheck,
  },
  {
    title: "Quản lý hàng đợi",
    description: "Theo dõi, gọi và điều phối lượt khám hiện tại.",
    path: "/dashboard/queue-management",
    icon: ListOrdered,
  },
  {
    title: "Tạo lịch trực tiếp",
    description: "Tiếp nhận nhanh bệnh nhân chưa có lịch hẹn.",
    path: "/dashboard/walk-in",
    icon: UserPlus,
  },
  {
    title: "Tra cứu bệnh nhân",
    description: "Tìm hồ sơ và thông tin liên hệ của bệnh nhân.",
    path: "/dashboard/patients",
    icon: Search,
  },
];

export default function ReceptionistHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="receptionist-home custom-scrollbar">
      <header className="receptionist-hero">
        <div>
          <p className="receptionist-eyebrow"><Headset size={18} /> Trung tâm tiếp đón</p>
          <h1>
            Chào bạn, <span>{user?.fullName ?? "Lễ tân"}</span>
          </h1>
          <p className="receptionist-hero-copy">
            Mọi thao tác tiếp nhận trong một màn hình, để bệnh nhân được hướng dẫn nhanh và rõ ràng.
          </p>
        </div>
        <div className="receptionist-date-card">
          <CalendarDays size={22} />
          <span>Ca làm việc hôm nay</span>
          <strong>{today}</strong>
        </div>
      </header>

      <section className="receptionist-command-grid" aria-label="Thao tác nhanh">
        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className="receptionist-primary-command"
          onClick={() => navigate("/dashboard/receptionist-appointments")}
        >
          <span className="receptionist-command-icon"><CalendarCheck2 size={34} /></span>
          <span>
            <small>Ưu tiên đầu ca</small>
            <strong>Tiếp nhận lịch hẹn hôm nay</strong>
            <em>Kiểm tra thông tin, check-in và cấp số thứ tự cho bệnh nhân.</em>
          </span>
          <ArrowRight size={24} />
        </motion.button>

        <div className="receptionist-shift-panel patient-glass-panel">
          <div className="receptionist-shift-heading">
            <Clock3 size={22} />
            <div>
              <span>Nhịp vận hành</span>
              <strong>Sẵn sàng tiếp đón</strong>
            </div>
          </div>
          <div className="receptionist-shift-steps">
            <span><b>01</b> Xác minh lịch hẹn</span>
            <span><b>02</b> Cấp số thứ tự</span>
            <span><b>03</b> Điều phối phòng khám</span>
          </div>
        </div>
      </section>

      <section>
        <div className="receptionist-section-heading">
          <div>
            <span>Quy trình tiếp đón</span>
            <h2>Thao tác thường dùng</h2>
          </div>
          <button type="button" onClick={() => navigate("/dashboard/appointments")}>
            Xem toàn bộ lịch khám <ArrowRight size={17} />
          </button>
        </div>

        <div className="receptionist-action-grid">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                key={action.path}
                onClick={() => navigate(action.path)}
                className="receptionist-action-card patient-glass-panel"
              >
                <span className="receptionist-action-icon"><Icon size={25} /></span>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
                <span className="receptionist-action-link">Mở tác vụ <ArrowRight size={16} /></span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="receptionist-support-strip patient-glass-panel">
        <Users size={24} />
        <div>
          <strong>Tiếp đón có chủ động</strong>
          <span>Ưu tiên xác minh danh tính và hướng dẫn bệnh nhân trước khi chuyển sang hàng đợi.</span>
        </div>
      </section>
    </div>
  );
}
