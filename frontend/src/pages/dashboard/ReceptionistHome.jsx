import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  UserCheck,
  ListOrdered,
  UserPlus,
  Search,
  ArrowRight,
  Headset,
  Users,
  CheckCircle2,
  Clock,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import appointmentService from "../../services/appointmentService";
import queueService from "../../services/queueService";

const quickActions = [
  {
    title: "Check-in bệnh nhân",
    desc: "Xác nhận đến và cấp số",
    path: "/dashboard/receptionist-appointments",
    icon: UserCheck,
    bgClass: "bg-teal-50 border-teal-100 hover:bg-teal-100/50 hover:border-teal-200",
    iconBgClass: "bg-teal-100 text-teal-600",
  },
  {
    title: "Quản lý hàng đợi",
    desc: "Theo dõi, điều phối khám",
    path: "/dashboard/queue-management",
    icon: ListOrdered,
    bgClass: "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-200",
    iconBgClass: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Khám trực tiếp",
    desc: "Tiếp nhận không hẹn trước",
    path: "/dashboard/walk-in",
    icon: UserPlus,
    bgClass: "bg-blue-50 border-blue-100 hover:bg-blue-100/50 hover:border-blue-200",
    iconBgClass: "bg-blue-100 text-blue-600",
  },
  {
    title: "Tra cứu bệnh nhân",
    desc: "Tìm hồ sơ lịch sử",
    path: "/dashboard/patients",
    icon: Search,
    bgClass: "bg-amber-50 border-amber-100 hover:bg-amber-100/50 hover:border-amber-200",
    iconBgClass: "bg-amber-100 text-amber-600",
  },
];

export default function ReceptionistHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    checkedIn: 0,
    waitingInQueue: 0,
    completed: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const [apptRes, qRes] = await Promise.all([
          appointmentService.getReceptionistAppointments({ date: todayStr }, 0, 5),
          queueService.getQueue({ date: todayStr })
        ]);

        const appts = apptRes?.data?.content || apptRes?.data || [];
        const qList = qRes?.data || [];

        setAppointments(appts);
        setQueue(qList.slice(0, 5)); // Just take top 5 for overview

        setStats({
          totalAppointments: apptRes?.data?.totalElements || appts.length,
          checkedIn: qList.length,
          waitingInQueue: qList.filter(q => q.queueStatus === "WAITING").length,
          completed: qList.filter(q => q.queueStatus === "COMPLETED").length,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full h-full">
      {/* Header section (Compact) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1 font-semibold text-xs uppercase tracking-wider">
            <Headset size={14} />
            <span>Trung tâm tiếp đón</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            {getGreeting()}, <span className="text-teal-600">{user?.fullName ?? "Lễ tân"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold py-2.5 px-4 rounded-xl shadow-sm border border-emerald-100 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sẵn sàng làm việc
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Lịch khám hôm nay</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarDays size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{loading ? "-" : stats.totalAppointments}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Đã Check-in</p>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><UserCheck size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{loading ? "-" : stats.checkedIn}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Đang chờ khám</p>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-amber-600">{loading ? "-" : stats.waitingInQueue}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Đã hoàn tất</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={14}/></div>
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{loading ? "-" : stats.completed}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Quick Actions (Replaces Hero Banner) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              Thao tác nhanh
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => {
                const IconComponent = action.icon;
                return (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    key={idx}
                    className={`${action.bgClass} rounded-2xl border p-4 text-left transition-all flex flex-col gap-3`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.iconBgClass} flex items-center justify-center border border-current/10 shrink-0`}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{action.title}</h3>
                      <p className="text-[10px] font-semibold text-slate-500 leading-normal">{action.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Today's appointments brief */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Lịch hẹn sắp tới</h2>
              <button 
                onClick={() => navigate("/dashboard/receptionist-appointments")}
                className="text-teal-600 hover:text-teal-700 font-bold text-xs flex items-center gap-1 transition-colors"
              >
                Xem tất cả <ArrowRight size={14} />
              </button>
            </div>
            
            {loading ? (
               <div className="py-8 text-center text-slate-400 text-sm font-medium">Đang tải dữ liệu...</div>
            ) : appointments.length === 0 ? (
               <div className="py-8 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-2xl">Không có lịch hẹn nào sắp tới.</div>
            ) : (
               <div className="flex flex-col gap-3">
                 {appointments.slice(0, 4).map(appt => (
                   <div key={appt.appointmentId} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-700 shrink-0 shadow-sm">
                         <span className="text-[9px] font-black uppercase">{appt.startTime?.slice(0, 5)}</span>
                       </div>
                       <div>
                         <p className="font-bold text-sm text-slate-800">{appt.patientName}</p>
                         <p className="text-[11px] font-medium text-slate-500">{appt.patientPhone || "Chưa có SĐT"} • Bác sĩ {appt.doctorName}</p>
                       </div>
                     </div>
                     <div>
                       <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                         appt.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                         appt.status === 'CONFIRMED' ? 'bg-sky-50 text-sky-600' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {appt.status}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Queue Overview */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                Hàng đợi hiện tại
              </h2>
              <button 
                onClick={() => navigate("/dashboard/queue-management")}
                className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
               <div className="py-6 text-center text-slate-400 text-sm font-medium">Đang tải...</div>
            ) : queue.length === 0 ? (
               <div className="py-8 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-2xl">Hàng đợi đang trống.</div>
            ) : (
               <div className="flex flex-col gap-3">
                 {queue.map(q => (
                   <div key={q.queueTicketId} className="flex items-center justify-between p-3 border-l-2 border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm shrink-0">
                         {q.queueNumber}
                       </div>
                       <div>
                         <p className="font-bold text-xs text-slate-800">{q.patientName}</p>
                         <p className="text-[10px] font-medium text-slate-500">BS. {q.doctorName}</p>
                       </div>
                     </div>
                     <span className={`w-2 h-2 rounded-full ${
                        q.queueStatus === 'WAITING' ? 'bg-amber-400' :
                        q.queueStatus === 'CALLED' ? 'bg-sky-500 animate-pulse' :
                        'bg-slate-300'
                     }`}></span>
                   </div>
                 ))}
               </div>
            )}
            
            <button 
              onClick={() => navigate("/dashboard/queue-management")}
              className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              Mở bảng điều khiển hàng đợi
            </button>
          </div>

          {/* User guide mini */}
          <div className="bg-teal-50/50 rounded-3xl border border-teal-100 shadow-sm p-6 flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 border border-teal-200 shrink-0">
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-800 mb-1">Ca làm việc hiệu quả</p>
              <p className="text-[11px] font-medium text-teal-700/80 leading-relaxed">
                Hãy ưu tiên check-in các bệnh nhân đã đặt lịch trước. Nếu phòng khám đang trống, sử dụng chức năng Khám trực tiếp để thêm bệnh nhân vãng lai.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
