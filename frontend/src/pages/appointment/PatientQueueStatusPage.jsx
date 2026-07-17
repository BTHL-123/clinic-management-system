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
import PageHeader from "../../components/PageHeader";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

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
    <div className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-sm font-semibold patient-label text-center text-slate-500">{label}</span>
      <span className="text-4xl font-extrabold leading-none mt-1 text-slate-800">{value ?? "—"}</span>
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

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
      : "http://localhost:8080/ws-queue";

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP for queue updates");
        client.subscribe("/topic/queue", (message) => {
          if (message.body === "QUEUE_UPDATED") {
            fetchStatus();
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      client.deactivate();
    };
  }, [fetchStatus]);

  // Effect to trigger notification when status changes to CALLED
  useEffect(() => {
    if (data?.queueStatus === "CALLED") {
      // Create a beep sound using AudioContext
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.value = 800; // 800Hz beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Lower volume
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3); // 300ms beep
      } catch (e) {
        console.error("Audio beep failed", e);
      }

      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Đến lượt bạn rồi!", {
          body: `Bạn đã được gọi vào phòng khám của bác sĩ ${data.doctorName}. Vui lòng vào phòng khám ngay.`,
          icon: "/favicon.ico"
        });
      }
    }
  }, [data?.queueStatus]);

  const statusCfg = data ? (STATUS_CONFIG[data.queueStatus] || STATUS_CONFIG["WAITING"]) : null;
  const isNoQueue = error?.toLowerCase().includes("no active queue");

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8 pr-2">
      <PageHeader
        title="Trạng thái hàng đợi"
        icon={Activity}
        iconColor="text-teal-600"
        subtitle="Theo dõi số thứ tự khám của bạn hôm nay và thời gian chờ ước tính."
        onBack={() => navigate("/dashboard")}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 w-full mb-10 mt-6">
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
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Users size={40} className="text-teal-600" />
            </div>
            <h2 className="text-2xl text-slate-800 font-bold m-0">Không có lịch hẹn hôm nay</h2>
            <p className="text-base text-slate-600 m-0 max-w-[380px] font-semibold leading-relaxed">
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
            <div className={`bg-white border-2 ${statusCfg.border} rounded-3xl p-8 flex flex-col gap-4 shadow-sm`}>
              <div className="flex items-center gap-3">
                <span className={`${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border} rounded-full px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className={`text-xl md:text-2xl font-bold ${statusCfg.color}`}>
                {statusCfg.message}
              </p>

              {/* Appointment info */}
              <div className="mt-2 p-5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bệnh nhân</span>
                  <p className="mt-1 text-lg font-bold text-slate-800 truncate">{data.patientName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bác sĩ</span>
                  <p className="mt-1 text-lg font-bold text-slate-800 truncate">{data.doctorName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã lịch hẹn</span>
                  <p className="mt-1 text-lg font-bold text-slate-800 truncate">{data.appointmentCode || "—"}</p>
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
            <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kết nối thời gian thực (Real-time). Tự động cập nhật khi có thay đổi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
