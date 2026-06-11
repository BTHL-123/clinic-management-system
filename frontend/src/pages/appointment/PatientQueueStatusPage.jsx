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
    color: "text-sky-800",
    bg: "bg-sky-500/20",
    border: "border-sky-500/30",
    gradient: "from-sky-500/15 to-sky-500/5",
    message: "Vui lòng chờ đến lượt của bạn.",
  },
  CALLED: {
    label: "Đã được gọi",
    color: "text-amber-800",
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    gradient: "from-amber-500/15 to-amber-500/5",
    message: "Đến lượt bạn rồi! Vui lòng vào phòng khám.",
  },
  IN_CONSULTATION: {
    label: "Đang khám",
    color: "text-purple-800",
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    gradient: "from-purple-500/15 to-purple-500/5",
    message: "Bác sĩ đang khám cho bạn.",
  },
  COMPLETED: {
    label: "Hoàn tất",
    color: "text-emerald-800",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    message: "Buổi khám đã hoàn tất. Chúc bạn sức khỏe!",
  },
  SKIPPED: {
    label: "Đã bỏ qua",
    color: "text-rose-800",
    bg: "bg-rose-500/20",
    border: "border-rose-500/30",
    gradient: "from-rose-500/15 to-rose-500/5",
    message: "Bạn đã bị bỏ qua. Vui lòng liên hệ lễ tân.",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "text-slate-800",
    bg: "bg-slate-500/20",
    border: "border-slate-500/30",
    gradient: "from-slate-500/15 to-slate-500/5",
    message: "Lịch khám đã bị hủy.",
  },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white/30 backdrop-blur-md border border-white/40 rounded-[1.5rem] p-6 shadow-xl flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/5 border border-black/5 ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-sm font-semibold patient-label text-center">{label}</span>
      <span className="text-4xl font-extrabold leading-none mt-1 patient-data">{value ?? "—"}</span>
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
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <Activity size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Trạng thái hàng đợi</span>
          </h1>
          <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            Theo dõi số thứ tự khám của bạn hôm nay và thời gian chờ ước tính.
          </p>
        </div>
      </div>

      <div className="patient-glass-card p-6 md:p-8 w-full max-w-[800px] mx-auto mb-10">
        <div className="flex justify-end mb-6">
          <button
            className="bg-black/5 hover:bg-black/10 text-slate-900 border border-slate-300 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col justify-center items-center min-h-[300px] gap-4 text-slate-600">
            <RefreshCw size={36} className="animate-spin text-teal-600" />
            <span className="text-lg font-medium">Đang tải trạng thái hàng đợi...</span>
          </div>
        )}

        {/* No Active Queue */}
        {!loading && isNoQueue && (
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 bg-black/5 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center">
              <Users size={40} className="text-teal-600" />
            </div>
            <h2 className="text-2xl patient-card-title m-0">Không có lịch hẹn hôm nay</h2>
            <p className="text-base patient-data m-0 max-w-[380px] font-semibold leading-relaxed">
              Bạn chưa có lịch khám nào được check-in hôm nay.
              Vui lòng đặt lịch hoặc liên hệ lễ tân để check-in.
            </p>
          </div>
        )}

        {/* Generic Error */}
        {!loading && error && !isNoQueue && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Queue Status Card */}
        {!loading && data && statusCfg && (
          <div className="flex flex-col gap-6">

            {/* Status Banner */}
            <div className={`bg-gradient-to-br ${statusCfg.gradient} backdrop-blur-md border-2 ${statusCfg.border} rounded-3xl p-8 flex flex-col gap-4 shadow-xl`}>
              <div className="flex items-center gap-3">
                <span className={`${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${statusCfg.color}`}>
                {statusCfg.message}
              </p>

              {/* Appointment info */}
              <div className="mt-2 p-5 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-bold patient-label uppercase tracking-wider">Bệnh nhân</span>
                  <p className="mt-1 text-lg patient-data truncate">{data.patientName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold patient-label uppercase tracking-wider">Bác sĩ</span>
                  <p className="mt-1 text-lg patient-data truncate">{data.doctorName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold patient-label uppercase tracking-wider">Mã lịch hẹn</span>
                  <p className="mt-1 text-lg patient-data truncate">{data.appointmentCode || "—"}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Hash}
                label="Số thứ tự của bạn"
                value={`#${data.myQueueNumber}`}
                color="text-teal-700"
              />
              <StatCard
                icon={UserCheck}
                label="Đang khám số"
                value={data.currentServingNumber > 0 ? `#${data.currentServingNumber}` : "—"}
                color="text-sky-700"
              />
              <StatCard
                icon={Users}
                label="Người phía trước"
                value={data.patientsAhead}
                color={data.patientsAhead === 0 ? "text-emerald-700" : "text-amber-700"}
              />
              <StatCard
                icon={Clock}
                label="Thời gian chờ"
                value={
                  data.patientsAhead === 0
                    ? "~0 p"
                    : `~${data.estimatedWaitMinutes} p`
                }
                color="text-purple-700"
              />
            </div>

            {/* Auto-refresh note */}
            <p className="text-center text-xs text-slate-500 mt-2">
              Tự động cập nhật mỗi 30 giây. Nhấn <strong>Làm mới</strong> để cập nhật ngay.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
