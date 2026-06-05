import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Hash,
  Activity,
  UserCheck,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
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
  let glassBg = "rgba(255, 255, 255, 0.45)";
  if (bg === "#f0fdfa") glassBg = "rgba(240, 253, 250, 0.5)";
  else if (bg === "#f0f9ff") glassBg = "rgba(240, 249, 255, 0.5)";
  else if (bg === "#fffbeb") glassBg = "rgba(255, 251, 235, 0.5)";
  else if (bg === "#f5f3ff") glassBg = "rgba(245, 243, 255, 0.5)";

  return (
    <div
      style={{
        background: glassBg,
        backdropFilter: "blur(8px)",
        border: `1px solid ${color}30`,
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        transition: "all 0.22s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.02)";
      }}
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
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569", textAlign: "center" }}>
        {label}
      </span>
      <span style={{ fontSize: "32px", fontWeight: 800, color, lineHeight: 1 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function PatientQueueStatusPage() {
  const navigate = useNavigate();
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
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center">
      <div className="w-full mb-10 flex flex-col items-center">
        <button 
          onClick={() => navigate("/dashboard", { state: { activeClusterId: "booking" } })}
          className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group"
        >
          <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Quay lại Màn hình chính
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <Activity size={32} className="text-teal-300 drop-shadow-md" />
            <span className="drop-shadow-md">Trạng thái hàng đợi</span>
          </h1>
          <p className="text-teal-50/90 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Theo dõi số thứ tự khám của bạn hôm nay và thời gian chờ ước tính.
          </p>
        </div>
      </div>

      <div className="patient-glass-card p-6 md:p-8 w-full max-w-[800px] mx-auto mb-10">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
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
            background: "rgba(255,255,255,0.3)",
            backdropFilter: "blur(8px)",
            borderRadius: "24px",
            border: "2px dashed rgba(255,255,255,0.45)",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={36} style={{ color: "#0f766e" }} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Không có lịch hẹn hôm nay
          </h2>
          <p style={{ fontSize: "14px", color: "#475569", margin: 0, maxWidth: "380px", fontWeight: 500 }}>
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
              background: `linear-gradient(135deg, ${statusCfg.color}18 0%, ${statusCfg.color}0a 100%)`,
              backdropFilter: "blur(12px)",
              border: `2px solid ${statusCfg.border}a0`,
              borderRadius: "24px",
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
                background: "rgba(255,255,255,0.45)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "16px",
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
    </div>
  );
}
