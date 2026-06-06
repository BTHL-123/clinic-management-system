import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  Play,
  SkipForward,
  Check,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Activity
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import queueService from "../../services/queueService";
import { getMyDoctorProfile } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";

export default function DoctorTodayAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "all"

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Doctor Profile if not fetched yet
      let currentDoctor = doctor;
      if (!currentDoctor) {
        const docRes = await getMyDoctorProfile();
        currentDoctor = docRes?.data || docRes;
        setDoctor(currentDoctor);
      }

      if (currentDoctor && currentDoctor.doctorId) {
        // 2. Fetch today's appointments for this doctor
        const appRes = await appointmentService.getDoctorTodayAppointments();
        const appList = appRes?.data || [];
        setAppointments(appList);

        // 3. Fetch today's queue tickets for this doctor
        const todayStr = new Date().toISOString().split("T")[0];
        const queueRes = await queueService.getQueue({
          date: todayStr,
          doctorId: currentDoctor.doctorId
        });
        const queueList = queueRes?.data || [];
        setQueueTickets(queueList);
      }
    } catch (err) {
      console.error(err);
      toast.error(err, "Không thể tải dữ liệu hôm nay");
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Queue actions
  const handleCall = async (id) => {
    try {
      await queueService.callPatient(id);
      toast.success("Đã gọi khám bệnh nhân!");
      fetchData();
    } catch (err) {
      toast.error(err, "Gọi khám thất bại");
    }
  };

  const handleSkip = async (id) => {
    try {
      await queueService.skipPatient(id);
      toast.success("Đã bỏ qua lượt bệnh nhân.");
      fetchData();
    } catch (err) {
      toast.error(err, "Không thể bỏ qua");
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      toast.success("Đã hoàn tất ca khám!");
      fetchData();
    } catch (err) {
      toast.error(err, "Không thể hoàn tất ca khám");
    }
  };

  // Compute stats
  const stats = {
    total: appointments.length,
    waiting: queueTickets.filter(t => t.queueStatus === "WAITING").length,
    called: queueTickets.filter(t => t.queueStatus === "CALLED").length,
    completed: queueTickets.filter(t => t.queueStatus === "COMPLETED" || t.queueStatus === "DONE").length,
    notCheckedIn: appointments.filter(a => a.status === "CONFIRMED" && !a.checkedInAt).length
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "WAITING":
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Đang chờ</span>;
      case "CALLED":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Đang khám</span>;
      case "SKIPPED":
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Bỏ qua</span>;
      case "COMPLETED":
      case "DONE":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Hoàn tất</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="text-white flex flex-col h-full gap-6 pb-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Calendar size={28} className="text-teal-400" />
          Lịch khám hôm nay
          {doctor && (
            <span className="text-sm font-medium text-white/60 ml-2">
              (Bác sĩ: {doctor.fullName || doctor.user?.fullName})
            </span>
          )}
        </h1>
        <button
          className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Chưa check-in", count: stats.notCheckedIn, color: "text-slate-300", icon: Clock },
          { label: "Đang chờ khám", count: stats.waiting, color: "text-sky-300", icon: Users },
          { label: "Đang khám", count: stats.called, color: "text-amber-300", icon: Activity },
          { label: "Hoàn tất khám", count: stats.completed, color: "text-emerald-300", icon: CheckCircle2 },
          { label: "Tổng lịch hẹn", count: stats.total, color: "text-teal-300", icon: Calendar }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-5 shadow-xl flex justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white/60">{stat.label}</span>
                <span className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.count}</span>
              </div>
              <div className={`${stat.color} opacity-60 flex items-center`}>
                <Icon size={32} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "queue"
              ? "bg-teal-500/30 text-teal-300 border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
        >
          Hàng đợi khám ({queueTickets.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "all"
              ? "bg-teal-500/30 text-teal-300 border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
        >
          Tất cả lịch hẹn hôm nay ({appointments.length})
        </button>
      </div>

      {/* Main content table */}
      <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-xl flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/5 border-b border-white/10 text-white/80 text-sm sticky top-0 z-10 backdrop-blur-md">
              {activeTab === "queue" ? (
                <tr>
                  <th className="p-4 font-semibold text-center w-20">STT</th>
                  <th className="p-4 font-semibold">Mã Lịch Hẹn</th>
                  <th className="p-4 font-semibold">Bệnh Nhân</th>
                  <th className="p-4 font-semibold">Số Điện Thoại</th>
                  <th className="p-4 font-semibold text-center">Giờ Hẹn</th>
                  <th className="p-4 font-semibold">Check-in</th>
                  <th className="p-4 font-semibold">Trạng Thái</th>
                  <th className="p-4 font-semibold text-center w-60">Thao Tác</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-4 font-semibold">Mã Lịch Hẹn</th>
                  <th className="p-4 font-semibold">Bệnh Nhân</th>
                  <th className="p-4 font-semibold">Số Điện Thoại</th>
                  <th className="p-4 font-semibold text-center">Giờ Hẹn</th>
                  <th className="p-4 font-semibold">Trạng Thái</th>
                  <th className="p-4 font-semibold">Check-in</th>
                  <th className="p-4 font-semibold text-center">Số Thứ Tự</th>
                  <th className="p-4 font-semibold">Hàng Đợi</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-white/50">Đang tải dữ liệu...</td>
                </tr>
              ) : activeTab === "queue" ? (
                queueTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-white/50">Không có bệnh nhân nào trong hàng đợi khám lúc này.</td>
                  </tr>
                ) : (
                  queueTickets.map((ticket) => {
                    const canCall = ticket.queueStatus === "WAITING" || ticket.queueStatus === "SKIPPED" || ticket.queueStatus === "CALLED";
                    const canSkip = ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED";
                    const canComplete = ticket.queueStatus === "CALLED" || ticket.queueStatus === "WAITING";

                    return (
                      <tr key={ticket.queueTicketId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1.5 rounded-lg font-extrabold text-sm shadow-md ${ticket.queueStatus === "CALLED" ? "bg-gradient-to-br from-amber-500 to-amber-400 text-amber-900" :
                              ticket.queueStatus === "COMPLETED" ? "bg-gradient-to-br from-emerald-500 to-emerald-400 text-emerald-900" :
                                "bg-gradient-to-br from-teal-500 to-teal-400 text-teal-900"
                            }`}>
                            #{ticket.queueNumber}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-teal-300">{ticket.appointmentCode}</td>
                        <td className="p-4 font-bold text-white">{ticket.patientName}</td>
                        <td className="p-4 text-white/80">{ticket.patientPhone || "—"}</td>
                        <td className="p-4 text-center font-medium text-white/90">{ticket.startTime?.slice(0, 5)} - {ticket.endTime?.slice(0, 5)}</td>
                        <td className="p-4 text-sm text-white/60">{ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                        <td className="p-4">{getStatusBadge(ticket.queueStatus)}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            {canCall && (
                              <button
                                onClick={() => handleCall(ticket.queueTicketId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ticket.queueStatus === "CALLED"
                                    ? "bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/30"
                                    : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30"
                                  }`}
                              >
                                <Play size={14} />
                                {ticket.queueStatus === "CALLED" ? "Gọi lại" : "Gọi vào"}
                              </button>
                            )}
                            {canSkip && (
                              <button
                                onClick={() => handleSkip(ticket.queueTicketId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                              >
                                <SkipForward size={14} /> Bỏ qua
                              </button>
                            )}
                            {canComplete && (
                              <button
                                onClick={() => handleComplete(ticket.queueTicketId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
                              >
                                <Check size={14} /> Hoàn tất
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                appointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-white/50">Không có lịch hẹn nào được đăng ký cho hôm nay.</td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.appointmentId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-teal-300">{app.appointmentCode}</td>
                      <td className="p-4 font-bold text-white">{app.patientName}</td>
                      <td className="p-4 text-white/80">{app.patientPhone || "—"}</td>
                      <td className="p-4 text-center font-medium text-white/90">{app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${app.status === "CONFIRMED" ? "bg-teal-500/20 text-teal-300 border-teal-500/30" :
                            app.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                              "bg-white/10 text-white/60 border-white/20"
                          }`}>
                          {app.status === "CONFIRMED" ? "Đã xác nhận" :
                            app.status === "COMPLETED" ? "Đã khám" :
                              app.status === "CANCELLED" ? "Đã hủy" : app.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-white/60">{app.checkedInAt ? new Date(app.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Chưa Check-in"}</td>
                      <td className="p-4 text-center font-bold text-teal-400">{app.queueNumber ? `#${app.queueNumber}` : "—"}</td>
                      <td className="p-4">{app.queueStatus ? getStatusBadge(app.queueStatus) : "—"}</td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
