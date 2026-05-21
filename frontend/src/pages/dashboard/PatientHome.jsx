import { Search, CalendarDays, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
          Xin chào, {user?.fullName ?? "Bệnh nhân"} 👋
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Chào mừng bạn đến với hệ thống đặt lịch khám trực tuyến.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          onClick={() => navigate("/dashboard/available-slots")}
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
            borderRadius: "14px",
            padding: "28px 24px",
            color: "#ffffff",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(15, 118, 110, 0.25)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(15, 118, 110, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 118, 110, 0.25)";
          }}
        >
          <Search size={32} style={{ marginBottom: "14px", opacity: 0.9 }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "6px" }}>
            Tìm ca khám trống
          </div>
          <div style={{ fontSize: "13px", opacity: 0.85, lineHeight: 1.5 }}>
            Chọn bác sĩ và ngày khám để xem các khung giờ còn trống.
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe5ec",
            borderRadius: "14px",
            padding: "28px 24px",
            color: "#334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <CalendarDays size={32} style={{ marginBottom: "14px", color: "#0f766e" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "6px", color: "#0f172a" }}>
            Lịch hẹn của tôi
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
            Xem và quản lý các lịch hẹn khám bệnh của bạn.
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: "20px",
              background: "#f1f5f9",
              color: "#94a3b8",
            }}
          >
            Sắp ra mắt
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe5ec",
            borderRadius: "14px",
            padding: "28px 24px",
            color: "#334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Clock size={32} style={{ marginBottom: "14px", color: "#0f766e" }} />
          <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "6px", color: "#0f172a" }}>
            Lịch sử khám bệnh
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
            Tra cứu hồ sơ và kết quả khám bệnh trước đây.
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: "20px",
              background: "#f1f5f9",
              color: "#94a3b8",
            }}
          >
            Sắp ra mắt
          </div>
        </div>
      </div>
    </>
  );
}
