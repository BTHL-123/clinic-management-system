import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Users,
  Hash,
  Activity,
  UserCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import queueService from "../../services/queueService";

const STATUS_CONFIG = {
  WAITING: {
    label: "Đang chờ",
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#bae6fd",
    message: "Vui lòng chờ đến lượt của bạn.",
  },
  CALLED: {
    label: "Đã được gọi",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    message: "Đến lượt bạn rồi! Vui lòng vào phòng khám.",
  },
  IN_CONSULTATION: {
    label: "Đang khám",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    message: "Bác sĩ đang khám cho bạn.",
  },
  COMPLETED: {
    label: "Hoàn tất",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    message: "Buổi khám đã hoàn tất. Chúc bạn sức khỏe!",
  },
  SKIPPED: {
    label: "Đã bỏ qua",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    message: "Bạn đã bị bỏ qua. Vui lòng liên hệ lễ tân.",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1",
    message: "Lịch khám đã bị hủy.",
  },
};

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      style={{
        background: bg || "#f8fafc",
        border: `1px solid ${color}20`,
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "transform 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", textAlign: "center" }}>
        {label}
      </span>
      <span style={{ fontSize: "32px", fontWeight: 800, color, lineHeight: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function PatientQueueStatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await queueService.getMyQueueStatus();
      setData(result?.data ?? result);
    } catch (err) {
      setData(null);
      setError(err.message || "Không thể tải trạng thái hàng đợi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const statusCfg = data ? (STATUS_CONFIG[data.queueStatus] || STATUS_CONFIG["WAITING"]) : null;
  const isNoQueue = error?.toLowerCase().includes("no active queue");

  return (
    <div className="content">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <Activity size={24} style={{ color: "#0f766e" }} />
          Trạng thái hàng đợi
        </h1>
        <button
          className="ghost-button"
          onClick={fetchStatus}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          Làm mới
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            flexDirection: "column",
            gap: "16px",
            color: "#64748b",
          }}
        >
          <RefreshCw size={32} className="spin-animation" style={{ color: "#0f766e" }} />
          <span style={{ fontSize: "15px", fontWeight: 500 }}>Đang tải trạng thái hàng đợi...</span>
        </div>
      )}

      {/* No Active Queue */}
      {!loading && isNoQueue && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "320px",
            gap: "16px",
            background: "#f8fafc",
            borderRadius: "16px",
            border: "2px dashed #e2e8f0",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={36} style={{ color: "#94a3b8" }} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#334155", margin: 0 }}>
            Không có lịch hẹn hôm nay
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, maxWidth: "380px" }}>
            Bạn chưa có lịch khám nào được check-in hôm nay.
            Vui lòng đặt lịch hoặc liên hệ lễ tân để check-in.
          </p>
        </div>
      )}

      {/* Generic Error */}
      {!loading && error && !isNoQueue && (
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Queue Status Card */}
      {!loading && data && statusCfg && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Status Banner */}
          <div
            style={{
              background: `linear-gradient(135deg, ${statusCfg.color}15 0%, ${statusCfg.color}08 100%)`,
              border: `2px solid ${statusCfg.border}`,
              borderRadius: "20px",
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  border: `1px solid ${statusCfg.border}`,
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                {statusCfg.label}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: statusCfg.color,
              }}
            >
              {statusCfg.message}
            </p>

            {/* Appointment info */}
            <div
              style={{
                marginTop: "8px",
                padding: "16px",
                background: "rgba(255,255,255,0.7)",
                borderRadius: "12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BỆNH NHÂN</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                  {data.patientName}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>BÁC SĨ</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                  {data.doctorName}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>MÃ LỊCH HẸN</span>
                <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 700, color: "#0f766e" }}>
                  {data.appointmentCode || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              icon={Hash}
              label="Số thứ tự của bạn"
              value={`#${data.myQueueNumber}`}
              color="#0f766e"
              bg="#f0fdfa"
            />
            <StatCard
              icon={UserCheck}
              label="Đang khám số"
              value={data.currentServingNumber > 0 ? `#${data.currentServingNumber}` : "—"}
              color="#0284c7"
              bg="#f0f9ff"
            />
            <StatCard
              icon={Users}
              label="Người phía trước"
              value={data.patientsAhead}
              color={data.patientsAhead === 0 ? "#15803d" : "#d97706"}
              bg={data.patientsAhead === 0 ? "#f0fdf4" : "#fffbeb"}
            />
            <StatCard
              icon={Clock}
              label="Thời gian chờ ước tính"
              value={
                data.patientsAhead === 0
                  ? "~0 phút"
                  : `~${data.estimatedWaitMinutes} phút`
              }
              color="#7c3aed"
              bg="#f5f3ff"
            />
          </div>

          {/* Auto-refresh note */}
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Tự động cập nhật mỗi 30 giây. Nhấn <strong>Làm mới</strong> để cập nhật ngay.
          </p>
        </div>
      )}
    </div>
  );
}
