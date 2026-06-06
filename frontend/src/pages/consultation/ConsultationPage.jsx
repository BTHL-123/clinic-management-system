import { useEffect, useState, useCallback } from "react";
import { Stethoscope, RefreshCw, Play, PhoneCall, SkipForward, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { getMyDoctorProfile } from "../../services/doctorService";
import queueTicketService from "../../services/queueTicketService";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/useToast.js";

const STATUS_LABEL = {
  WAITING: { label: "Chờ khám", color: "text-amber-300", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  CALLED: { label: "Đã gọi", color: "text-blue-300", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  IN_EXAMINATION: { label: "Đang khám", color: "text-purple-300", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  WAITING_LAB: { label: "Chờ XN", color: "text-cyan-300", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  DONE: { label: "Hoàn thành", color: "text-emerald-300", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
  SKIPPED: { label: "Bỏ qua", color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-500/30" },
  CANCELLED: { label: "Đã hủy", color: "text-rose-300", bg: "bg-rose-500/20", border: "border-rose-500/30" },
};

const PRIORITY_LABEL = {
  NORMAL: { label: "Thường", color: "text-slate-300" },
  PRIORITY: { label: "Ưu tiên", color: "text-amber-400" },
  EMERGENCY: { label: "Cấp cứu", color: "text-rose-400" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-500/30" };
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
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Stethoscope size={28} className="text-teal-400" />
          Phòng khám — Hàng đợi bệnh nhân
        </h2>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Đang chờ / Đã gọi", value: waitingCount, color: "text-amber-300", bg: "bg-amber-500/10 border border-amber-500/20" },
          { label: "Đang khám", value: inExamCount, color: "text-purple-300", bg: "bg-purple-500/10 border border-purple-500/20" },
          { label: "Hoàn thành hôm nay", value: doneCount, color: "text-emerald-300", bg: "bg-emerald-500/10 border border-emerald-500/20" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-[1.5rem] p-5 backdrop-blur-xl flex justify-between items-center shadow-lg transition-transform hover:-translate-y-1`}>
            <span className="text-sm font-semibold text-white/70">{s.label}</span>
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
          className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium [color-scheme:dark]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-medium appearance-none min-w-[160px]"
        >
          <option value="" className="bg-slate-800">Tất cả trạng thái</option>
          <option value="WAITING" className="bg-slate-800">Chờ khám</option>
          <option value="CALLED" className="bg-slate-800">Đã gọi</option>
          <option value="IN_EXAMINATION" className="bg-slate-800">Đang khám</option>
          <option value="DONE" className="bg-slate-800">Hoàn thành</option>
          <option value="SKIPPED" className="bg-slate-800">Bỏ qua</option>
        </select>
        <button
          className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
          onClick={fetchQueue}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Queue Table */}
      <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-xl flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-white/80 text-sm sticky top-0 z-10 backdrop-blur-md">
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
                  <td colSpan={6} className="p-8 text-center text-white/50">Đang tải hàng đợi...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/50">Không có bệnh nhân trong hàng đợi.</td>
                </tr>
              ) : (
                queue.map((ticket) => {
                  const isActing = actionLoading === ticket.queueTicketId;
                  const priority = PRIORITY_LABEL[ticket.priorityLevel] || PRIORITY_LABEL.NORMAL;
                  return (
                    <tr key={ticket.queueTicketId} className={`border-b border-white/5 transition-colors ${ticket.queueStatus === "IN_EXAMINATION" ? "bg-purple-500/10 hover:bg-purple-500/20" : "hover:bg-white/5"
                      }`}>
                      <td className="p-4 text-center font-extrabold text-xl text-teal-400">
                        {ticket.queueNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{ticket.patientName || `Bệnh nhân #${ticket.patientId}`}</div>
                        <div className="text-xs text-white/60 font-mono mt-0.5">ID: {ticket.patientId}</div>
                      </td>
                      <td className="p-4">
                        <span className={`${priority.color} font-bold text-sm`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={ticket.queueStatus} />
                      </td>
                      <td className="p-4 text-center text-white/70 text-sm font-medium">
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
