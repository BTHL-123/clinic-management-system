import { useEffect, useState, useCallback } from "react";
import { Stethoscope, RefreshCw, Play, PhoneCall, SkipForward, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { getMyDoctorProfile } from "../../services/doctorService";
import queueTicketService from "../../services/queueTicketService";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/useToast.js";

const STATUS_LABEL = {
  WAITING: { label: "Chờ khám", color: "text-amber-800", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  CALLED: { label: "Đã gọi", color: "text-blue-800", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  IN_EXAMINATION: { label: "Đang khám", color: "text-purple-800", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  WAITING_LAB: { label: "Chờ XN", color: "text-cyan-800", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  DONE: { label: "Hoàn thành", color: "text-emerald-800", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  SKIPPED: { label: "Bỏ qua", color: "text-slate-800", bg: "bg-slate-500/20", border: "border-slate-500/30" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-800", bg: "bg-rose-500/20", border: "border-rose-500/30" },
};

const PRIORITY_LABEL = {
  NORMAL: { label: "Thường", color: "text-slate-700" },
  PRIORITY: { label: "Ưu tiên", color: "text-amber-700 font-extrabold" },
  EMERGENCY: { label: "Cấp cứu", color: "text-rose-700 font-black" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: "text-slate-800", bg: "bg-slate-500/20", border: "border-slate-500/30" };
  return (
    <span className={`${s.bg} ${s.color} border ${s.border} px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
      {s.label}
    </span>
  );
}

export default function ConsultationPage() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // queueTicketId đang xử lý
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Load doctor profile
  useEffect(() => {
    getMyDoctorProfile()
      .then((res) => setDoctor(res.data))
      .catch(() => setError("Không thể tải thông tin bác sĩ. Vui lòng đăng nhập lại."));
  }, []);

  // Load queue
  const fetchQueue = useCallback(async () => {
    if (!doctor?.doctorId) return;
    setLoading(true);
    try {
      const res = await queueTicketService.getQueue(
        doctor.doctorId,
        selectedDate,
        filterStatus || undefined
      );
      setQueue(res.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải hàng đợi.");
    } finally {
      setLoading(false);
    }
  }, [doctor?.doctorId, selectedDate, filterStatus]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleAction = async (ticketId, action, label) => {
    setActionLoading(ticketId);
    try {
      if (action === "call") {
        await queueTicketService.call(ticketId);
        toast.success("Đã gọi bệnh nhân vào phòng khám.");
      } else if (action === "start") {
        const res = await queueTicketService.startExamination(ticketId);
        toast.success("Bắt đầu khám thành công!");
        // Điều hướng sang trang khám bệnh với consultationId
        if (res.data?.consultationId) {
          navigate(`/dashboard/examination/${res.data.consultationId}`);
          return;
        }
      } else if (action === "done") {
        await queueTicketService.markDone(ticketId);
        toast.success("Đã hoàn thành ca khám.");
      } else if (action === "skip") {
        await queueTicketService.skip(ticketId, "Bệnh nhân không có mặt");
        toast.success("Đã bỏ qua số thứ tự này.");
      }
      await fetchQueue();
    } catch (err) {
      toast.error(err, `Không thể thực hiện: ${label}`);
    } finally {
      setActionLoading(null);
    }
  };

  const waitingCount = queue.filter((q) => q.queueStatus === "WAITING" || q.queueStatus === "CALLED").length;
  const inExamCount = queue.filter((q) => q.queueStatus === "IN_EXAMINATION").length;
  const doneCount = queue.filter((q) => q.queueStatus === "DONE").length;

  return (
    <div className="text-white flex flex-col h-full gap-6 pb-6">
      {/* Header */}
      <div className="w-full relative flex flex-col items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg text-center">
            <span className="text-white"><Stethoscope size={28} /></span>
            Phòng khám — Hàng đợi bệnh nhân
          </h2>
          {doctor && (
            <p className="text-white/70 font-medium mt-3 text-center drop-shadow-sm">
              Bác sĩ phụ trách: {doctor.fullName || doctor.user?.fullName}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Đang chờ / Đã gọi", value: waitingCount, color: "text-amber-800", bg: "patient-glass-panel border-amber-500/20" },
          { label: "Đang khám", value: inExamCount, color: "text-purple-800", bg: "patient-glass-panel border-purple-500/20" },
          { label: "Hoàn thành hôm nay", value: doneCount, color: "text-emerald-800", bg: "patient-glass-panel border-emerald-500/20" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-[1.5rem] p-5 backdrop-blur-xl flex justify-between items-center shadow-lg transition-transform hover:-translate-y-1`}>
            <span className="text-sm font-semibold text-teal-700">{s.label}</span>
            <span className={`text-3xl font-extrabold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="patient-glass-input text-slate-900 placeholder-teal-700/50 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-teal-500/50 font-semibold shadow-inner [color-scheme:light]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="patient-glass-input text-slate-900 text-sm rounded-xl py-2.5 px-4 focus:outline-none focus:border-teal-500/50 font-semibold shadow-inner min-w-[160px] [&>option]:bg-white [&>option]:text-slate-900"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="WAITING">Chờ khám</option>
          <option value="CALLED">Đã gọi</option>
          <option value="IN_EXAMINATION">Đang khám</option>
          <option value="DONE">Hoàn thành</option>
          <option value="SKIPPED">Bỏ qua</option>
        </select>
        <button
          className="patient-glass-panel-sm text-teal-700 hover:text-teal-900 font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-teal-600/20"
          onClick={fetchQueue}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Queue Table */}
      <div className="flex-1 patient-glass-panel rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/5 border-b border-slate-900/10 text-[#0f766e] text-sm sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold text-center w-20">STT</th>
                <th className="p-4 font-semibold">Bệnh nhân</th>
                <th className="p-4 font-semibold w-28">Ưu tiên</th>
                <th className="p-4 font-semibold w-36">Trạng thái</th>
                <th className="p-4 font-semibold text-center w-28">Chờ (phút)</th>
                <th className="p-4 font-semibold text-center w-64">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Đang tải hàng đợi...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">Không có bệnh nhân trong hàng đợi.</td>
                </tr>
              ) : (
                queue.map((ticket) => {
                  const isActing = actionLoading === ticket.queueTicketId;
                  const priority = PRIORITY_LABEL[ticket.priorityLevel] || PRIORITY_LABEL.NORMAL;
                  return (
                    <tr key={ticket.queueTicketId} className={`border-b border-slate-900/10 transition-colors ${ticket.queueStatus === "IN_EXAMINATION" ? "bg-purple-500/15 hover:bg-purple-500/25" : "hover:bg-white/30"
                      }`}>
                      <td className="p-4 text-center font-extrabold text-xl text-teal-800">
                        {ticket.queueNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{ticket.patientName || `Bệnh nhân #${ticket.patientId}`}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {ticket.patientId}</div>
                      </td>
                      <td className="p-4">
                        <span className={`${priority.color} font-bold text-sm`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={ticket.queueStatus} />
                      </td>
                      <td className="p-4 text-center text-slate-800 text-sm font-medium">
                        {ticket.estimatedWaitMinutes ?? "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          {/* Gọi bệnh nhân */}
                          {ticket.queueStatus === "WAITING" && (
                            <ActionBtn
                              icon={<PhoneCall size={14} />}
                              label="Gọi vào"
                              colorClass="text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30"
                              loading={isActing}
                              onClick={() => handleAction(ticket.queueTicketId, "call", "Gọi bệnh nhân")}
                            />
                          )}
                          {/* Bắt đầu khám */}
                          {(ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED") && (
                            <ActionBtn
                              icon={<Play size={14} />}
                              label="Bắt đầu khám"
                              colorClass="text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
                              loading={isActing}
                              onClick={() => handleAction(ticket.queueTicketId, "start", "Bắt đầu khám")}
                            />
                          )}
                          {/* Tiếp tục khám (đã có consultation) */}
                          {ticket.queueStatus === "IN_EXAMINATION" && ticket.consultationId && (
                            <ActionBtn
                              icon={<Stethoscope size={14} />}
                              label="Vào phòng khám"
                              colorClass="text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30"
                              loading={isActing}
                              onClick={() => navigate(`/dashboard/examination/${ticket.consultationId}`)}
                            />
                          )}
                          {/* Hoàn thành */}
                          {ticket.queueStatus === "IN_EXAMINATION" && (
                            <ActionBtn
                              icon={<CheckCircle size={14} />}
                              label="Hoàn thành"
                              colorClass="text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30"
                              loading={isActing}
                              onClick={() => handleAction(ticket.queueTicketId, "done", "Hoàn thành")}
                            />
                          )}
                          {/* Bỏ qua */}
                          {(ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED") && (
                            <ActionBtn
                              icon={<SkipForward size={14} />}
                              label="Bỏ qua"
                              colorClass="text-slate-300 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30"
                              loading={isActing}
                              onClick={() => handleAction(ticket.queueTicketId, "skip", "Bỏ qua")}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, colorClass, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${colorClass} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {icon} {label}
    </button>
  );
}
