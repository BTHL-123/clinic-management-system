import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Activity,
  ArrowLeft,
  Stethoscope
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import queueService from "../../services/queueService";
import queueTicketService from "../../services/queueTicketService";
import { getMyDoctorProfile } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";

export default function DoctorTodayAppointments() {
  const toast = useToast();
  const navigate = useNavigate();
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

  const handleExamine = async (id) => {
    try {
      const res = await queueTicketService.startExamination(id);
      toast.success("Bắt đầu khám thành công!");
      if (res.data?.consultationId) {
        navigate(`/dashboard/examination/${res.data.consultationId}`);
      }
    } catch (err) {
      toast.error(err, "Không thể bắt đầu khám");
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
        return <span className="bg-sky-500/20 text-sky-800 border border-sky-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Đang chờ</span>;
      case "CALLED":
        return <span className="bg-amber-500/20 text-amber-800 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Đang khám</span>;
      case "SKIPPED":
        return <span className="bg-rose-500/20 text-rose-800 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Bỏ qua</span>;
      case "COMPLETED":
      case "DONE":
        return <span className="bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">Hoàn tất</span>;
      default:
        return <span className="bg-slate-900/10 text-slate-700 border border-slate-900/20 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full relative flex flex-col items-center mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><Calendar size={28} /></span>
            Lịch khám hôm nay
          </h1>
          {doctor && (
            <p className="text-white/70 font-medium mt-3 text-center drop-shadow-sm">
              Bác sĩ phụ trách: {doctor.fullName || doctor.user?.fullName}
            </p>
          )}
        </div>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-teal-400/30 transition-all flex items-center gap-2"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-6">
        {[
          { label: "Chưa check-in", count: stats.notCheckedIn, color: "text-slate-700", icon: Clock },
          { label: "Đang chờ khám", count: stats.waiting, color: "text-sky-700", icon: Users },
          { label: "Đang khám", count: stats.called, color: "text-amber-700", icon: Activity },
          { label: "Hoàn tất khám", count: stats.completed, color: "text-emerald-700", icon: CheckCircle2 },
          { label: "Tổng lịch hẹn", count: stats.total, color: "text-teal-700", icon: Calendar }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="patient-glass-panel rounded-[1.5rem] p-5 shadow-xl flex justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold patient-label">{stat.label}</span>
                <span className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</span>
              </div>
              <div className={`${stat.color} opacity-60 flex items-center`}>
                <Icon size={32} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 w-full justify-start mb-4">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "queue"
              ? "bg-teal-600/35 text-teal-800 border border-teal-600 shadow-lg font-black"
              : "bg-white/10 text-teal-700 hover:bg-white/20 hover:text-teal-900 border border-slate-900/10 font-bold"
            }`}
        >
          Hàng đợi khám ({queueTickets.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "all"
              ? "bg-teal-600/35 text-teal-800 border border-teal-600 shadow-lg font-black"
              : "bg-white/10 text-teal-700 hover:bg-white/20 hover:text-teal-900 border border-slate-900/10 font-bold"
            }`}
        >
          Tất cả lịch hẹn hôm nay ({appointments.length})
        </button>
      </div>

      {/* Main content table */}
      <div className="patient-glass-panel rounded-[3rem] p-8 md:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.22)] border-0 w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/5 border-b border-slate-900/10 text-[#0f766e] text-sm sticky top-0 z-10 backdrop-blur-md">
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
                  <td colSpan="8" className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : activeTab === "queue" ? (
                queueTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">Không có bệnh nhân nào trong hàng đợi khám lúc này.</td>
                  </tr>
                ) : (
                  queueTickets.map((ticket) => {
                    const canCall = ticket.queueStatus === "WAITING" || ticket.queueStatus === "SKIPPED" || ticket.queueStatus === "CALLED";
                    const canSkip = ticket.queueStatus === "WAITING" || ticket.queueStatus === "CALLED";
                    const canComplete = ticket.queueStatus === "CALLED" || ticket.queueStatus === "WAITING";

                    return (
                      <tr key={ticket.queueTicketId} className="border-b border-slate-900/10 hover:bg-white/30 transition-colors">
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1.5 rounded-lg font-extrabold text-sm shadow-md ${ticket.queueStatus === "CALLED" ? "bg-gradient-to-br from-amber-500 to-amber-400 text-amber-900" :
                              ticket.queueStatus === "COMPLETED" ? "bg-gradient-to-br from-emerald-500 to-emerald-400 text-emerald-900" :
                                "bg-gradient-to-br from-teal-500 to-teal-400 text-teal-900"
                            }`}>
                            #{ticket.queueNumber}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-teal-700">{ticket.appointmentCode}</td>
                        <td className="p-4 font-bold text-slate-900">{ticket.patientName}</td>
                        <td className="p-4 text-slate-800 font-medium">{ticket.patientPhone || "—"}</td>
                        <td className="p-4 text-center font-semibold text-slate-800">{ticket.startTime?.slice(0, 5)} - {ticket.endTime?.slice(0, 5)}</td>
                        <td className="p-4 text-sm text-slate-600">{ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</td>
                        <td className="p-4">{getStatusBadge(ticket.queueStatus)}</td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            {canCall && (
                              <button
                                onClick={() => handleCall(ticket.queueTicketId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ticket.queueStatus === "CALLED"
                                    ? "bg-slate-500/20 text-slate-700 hover:bg-slate-500/30 border border-slate-500/30"
                                    : "bg-sky-500/20 text-sky-700 hover:bg-sky-500/30 border border-sky-500/30"
                                  }`}
                              >
                                <Play size={14} />
                                {ticket.queueStatus === "CALLED" ? "Gọi lại" : "Gọi vào"}
                              </button>
                            )}
                            {canSkip && (
                              <button
                                onClick={() => handleSkip(ticket.queueTicketId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                              >
                                <SkipForward size={14} /> Bỏ qua
                              </button>
                            )}
                            {canComplete && (
                              <button
                                onClick={() => handleExamine(ticket.queueTicketId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-700 hover:bg-purple-500/30 border border-purple-500/30 transition-all"
                              >
                                <Stethoscope size={14} /> Khám bệnh
                              </button>
                            )}
                            {canComplete && (
                              <button
                                onClick={() => handleComplete(ticket.queueTicketId)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
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
                    <td colSpan="8" className="p-8 text-center text-slate-500">Không có lịch hẹn nào được đăng ký cho hôm nay.</td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.appointmentId} className="border-b border-slate-900/10 hover:bg-white/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-teal-700">{app.appointmentCode}</td>
                      <td className="p-4 font-bold text-slate-900">{app.patientName}</td>
                      <td className="p-4 text-slate-800 font-medium">{app.patientPhone || "—"}</td>
                      <td className="p-4 text-center font-semibold text-slate-800">{app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${app.status === "CONFIRMED" ? "bg-teal-500/20 text-teal-800 border-teal-500/30" :
                            app.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-800 border-emerald-500/30" :
                              "bg-slate-900/10 text-slate-700 border-slate-900/20"
                          }`}>
                          {app.status === "CONFIRMED" ? "Đã xác nhận" :
                            app.status === "COMPLETED" ? "Đã khám" :
                              app.status === "CANCELLED" ? "Đã hủy" : app.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{app.checkedInAt ? new Date(app.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Chưa Check-in"}</td>
                      <td className="p-4 text-center font-bold text-teal-700">{app.queueNumber ? `#${app.queueNumber}` : "—"}</td>
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
