import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Calendar,
  RefreshCw,
  Play,
  SkipForward,
  Check,
  Stethoscope,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import queueService from "../../services/queueService";
import { getDoctors } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

export default function QueueManagementPage() {
  const toast = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const [date, setDate] = useState(todayStr);
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");

  // Data lists
  const [queueTickets, setQueueTickets] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch doctors for filter dropdown
  useEffect(() => {
    const fetchDoctorsData = async () => {
      try {
        const res = await getDoctors({ page: 0, size: 100 });
        const list = res?.data?.content || res?.data || [];
        setDoctors(list);
      } catch (err) {
        console.error("Lỗi lấy danh sách bác sĩ", err);
      }
    };
    fetchDoctorsData();
  }, []);

  // Fetch queue tickets
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (date) filters.date = date;
      if (doctorId) filters.doctorId = doctorId;
      if (status) filters.status = status;

      const response = await queueService.getQueue(filters);
      const list = response?.data || [];
      setQueueTickets(list);
    } catch (err) {
      toast.error(err, "Không thể tải danh sách hàng đợi");
    } finally {
      setLoading(false);
    }
  }, [date, doctorId, status]);

  useEffect(() => {
    fetchQueue();

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
      : "http://localhost:8080/ws-queue";

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP for queue management updates");
        client.subscribe("/topic/queue", (message) => {
          if (message.body === "QUEUE_UPDATED") {
            fetchQueue();
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [fetchQueue]);

  // Actions
  const handleCall = async (id) => {
    try {
      await queueService.callPatient(id);
      toast.success("Đã gọi khám bệnh nhân thành công!");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Gọi khám thất bại");
    }
  };

  const handleSkip = async (id) => {
    try {
      await queueService.skipPatient(id);
      toast.success("Đã bỏ qua bệnh nhân.");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Không thể bỏ qua");
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      toast.success("Đã hoàn tất ca khám.");
      fetchQueue();
    } catch (err) {
      toast.error(err, "Không thể hoàn tất");
    }
  };

  const getStatusBadge = (ticketStatus) => {
    switch (ticketStatus) {
      case "WAITING":
        return <span className="bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Đang chờ</span>;
      case "CALLED":
        return <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Đang khám</span>;
      case "SKIPPED":
        return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Bỏ qua</span>;
      case "COMPLETED":
        return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Hoàn tất</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">{ticketStatus}</span>;
    }
  };

  // Quick stats computed
  const stats = {
    waiting: queueTickets.filter(t => t.queueStatus === "WAITING").length,
    called: queueTickets.filter(t => t.queueStatus === "CALLED").length,
    skipped: queueTickets.filter(t => t.queueStatus === "SKIPPED").length,
    completed: queueTickets.filter(t => t.queueStatus === "COMPLETED").length,
    total: queueTickets.length
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Quản lý hàng đợi"
        icon={Users}
        iconColor="text-teal-500"
        rightContent={
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Sync
            </span>
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        }
      />

      {/* Grid of stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Đang chờ", count: stats.waiting, color: "text-sky-600", bg: "bg-sky-50/50 border-sky-100" },
          { label: "Đang khám (Đã gọi)", count: stats.called, color: "text-amber-600", bg: "bg-amber-50/50 border-amber-100" },
          { label: "Bỏ qua", count: stats.skipped, color: "text-rose-600", bg: "bg-rose-50/50 border-rose-100" },
          { label: "Hoàn tất", count: stats.completed, color: "text-emerald-600", bg: "bg-emerald-50/50 border-emerald-100" },
          { label: "Tổng số hàng đợi", count: stats.total, color: "text-teal-700", bg: "bg-teal-50/50 border-teal-100" }
        ].map((stat, i) => (
          <div key={i} className={`flex flex-col p-5 rounded-2xl border ${stat.bg} shadow-sm`}>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{stat.label}</span>
            <span className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <label className="w-full md:w-1/3">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Ngày khám</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </label>

          <label className="w-full md:w-1/3">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Bác sĩ phụ trách</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Stethoscope size={18} />
              </div>
              <select 
                value={doctorId} 
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Tất cả bác sĩ</option>
                {doctors.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.user?.fullName || d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </label>

          <label className="w-full md:w-1/3">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái hàng đợi</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SlidersHorizontal size={18} />
              </div>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="WAITING">Đang chờ</option>
                <option value="CALLED">Đang khám</option>
                <option value="SKIPPED">Bỏ qua</option>
                <option value="COMPLETED">Hoàn tất</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 text-center">STT</th>
                <th className="px-5 py-4">Mã Lịch Hẹn</th>
                <th className="px-5 py-4">Bệnh Nhân</th>
                <th className="px-5 py-4">Số Điện Thoại</th>
                <th className="px-5 py-4">Bác Sĩ</th>
                <th className="px-5 py-4 text-center">Giờ Hẹn</th>
                <th className="px-5 py-4">Check-in</th>
                <th className="px-5 py-4">Trạng Thái</th>
                <th className="px-5 py-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin"></div>
                      <p className="text-sm font-medium">Đang tải dữ liệu hàng đợi...</p>
                    </div>
                  </td>
                </tr>
              ) : queueTickets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500 text-sm font-medium">
                    Không có bệnh nhân nào trong hàng đợi hôm nay.
                  </td>
                </tr>
              ) : (
                queueTickets.map((ticket) => {
                  const canCall = ticket.queueStatus === "WAITING" || ticket.queueStatus === "SKIPPED" || ticket.queueStatus === "CALLED";
                  const canSkip = ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED";
                  const canComplete = ticket.queueStatus === "CALLED" || ticket.queueStatus === "WAITING";

                  return (
                    <tr key={ticket.queueTicketId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1.5 rounded-lg font-black text-sm shadow-sm text-white ${
                            ticket.queueStatus === "CALLED" ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                            ticket.queueStatus === "COMPLETED" ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                            "bg-gradient-to-r from-teal-600 to-teal-500"
                          }`}
                        >
                          #{ticket.queueNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-extrabold text-teal-600">{ticket.appointmentCode}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">{ticket.patientName}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">{ticket.patientPhone || "—"}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">{ticket.doctorName}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700 text-center">
                        {ticket.startTime?.slice(0, 5)} - {ticket.endTime?.slice(0, 5)}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(ticket.queueStatus)}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {canCall && (
                            <button
                              title="Gọi khám bệnh nhân"
                              onClick={() => handleCall(ticket.queueTicketId)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white transition-all shadow-sm ${
                                ticket.queueStatus === "CALLED" 
                                  ? "bg-slate-600 hover:bg-slate-700 shadow-slate-500/20" 
                                  : "bg-sky-600 hover:bg-sky-700 shadow-sky-500/20"
                              }`}
                            >
                              <Play size={14} />
                              {ticket.queueStatus === "CALLED" ? "Gọi lại" : "Gọi khám"}
                            </button>
                          )}
                          {canSkip && (
                            <button
                              title="Bỏ qua lượt bệnh nhân"
                              onClick={() => handleSkip(ticket.queueTicketId)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                            >
                              <SkipForward size={14} />
                              Bỏ qua
                            </button>
                          )}
                          {canComplete && (
                            <button
                              title="Hoàn tất lượt khám"
                              onClick={() => handleComplete(ticket.queueTicketId)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all"
                            >
                              <Check size={14} />
                              Hoàn tất
                            </button>
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
