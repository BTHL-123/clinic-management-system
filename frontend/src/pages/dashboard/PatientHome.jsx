import React, { useState, useEffect } from "react";
import { 
  CalendarDays, FileText, Activity, Settings,
  HeartPulse, Sparkles, UserCircle, CalendarPlus, ListOrdered, Bell,
  QrCode, ArrowRight, ActivitySquare, ShieldCheck, Star, ThumbsUp, GraduationCap, X,
  Clock, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area
} from "recharts";
import appointmentService from "../../services/appointmentService.js";
import { getDoctors } from "../../services/doctorService.js";

const heartRateData = [
  { time: '08:00', value: 72 }, { time: '10:00', value: 75 },
  { time: '12:00', value: 85 }, { time: '14:00', value: 70 },
  { time: '16:00', value: 78 }, { time: '18:00', value: 74 },
  { time: '20:00', value: 68 },
];

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState("");
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors({ page: 0, size: 5, status: "ACTIVE" });
      setDoctors(res?.data?.content || []);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchUpcomingAppointment = async () => {
    try {
      const res = await appointmentService.getMyAppointments(true, 0, 1);
      const content = res.data?.content || res.content;
      if (content && content.length > 0) {
        setUpcomingAppointment(content[0]);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming appointment", err);
    } finally {
      setLoadingAppt(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="w-full flex flex-col gap-8 h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-2 pb-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 mt-4">
        <div>
          <div className="flex items-center gap-2 text-teal-200 mb-2 font-medium">
            <HeartPulse size={18} className="animate-pulse" />
            <span>Hệ thống Y tế Tiêu chuẩn</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
            {getGreeting()}, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-200">
              {user?.fullName ?? "Bệnh nhân"}
            </span>
          </h1>
        </div>
      </div>

      {/* CREATIVE AURORA DASHBOARD WIDGETS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
        
        {/* LEFT COLUMN: UPCOMING APPOINTMENT & AI ORB */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          {/* FLOATING TICKET UI */}
          <AnimatePresence>
            {!loadingAppt && upcomingAppointment ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="patient-glass-panel rounded-[3rem] relative overflow-hidden group flex flex-col md:flex-row transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
              >
                {/* Decorative Pattern - Frosted Glass blob */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-200/40 to-cyan-200/30 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>
                
                {/* Main Ticket Info */}
                <div className="p-8 md:p-10 flex-1 relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-8">
                      <div className="flex items-center gap-3 bg-teal-50 text-teal-700 w-max px-4 py-2 rounded-full text-sm font-bold border border-teal-100 uppercase tracking-wider shadow-sm">
                        <ShieldCheck size={16} /> Phiếu Khám Sắp Tới
                      </div>
                      {upcomingAppointment.queueNumber && (
                        <div className="flex items-center gap-2 bg-amber-100 text-amber-950 w-max px-4 py-2 rounded-full text-sm font-extrabold border border-amber-300 uppercase tracking-wider shadow-sm backdrop-blur-sm animate-pulse">
                          Số thứ tự: #{upcomingAppointment.queueNumber}
                        </div>
                      )}
                      {upcomingAppointment.queueStatus === 'CALLED' && (
                        <div className="flex items-center gap-2 bg-rose-100 text-rose-950 w-max px-4 py-2 rounded-full text-sm font-extrabold border border-rose-300 uppercase tracking-wider shadow-sm backdrop-blur-sm animate-bounce">
                          Đã được gọi!
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className="patient-label text-sm font-bold uppercase tracking-widest mb-1">Thời gian</p>
                        <h2 className="text-5xl md:text-6xl font-black patient-data tracking-tight">
                          {String(upcomingAppointment.estimatedStartTime || upcomingAppointment.startTime || '').slice(0, 5) || '--:--'}
                        </h2>
                        <p className="text-teal-600 font-extrabold text-xl mt-2">
                          {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="patient-label text-sm font-bold uppercase tracking-widest mb-1">Phòng khám</p>
                        <p className="text-3xl font-black patient-data">
                          {upcomingAppointment.queueStatus === 'CALLED'
                            ? `P. Khám (${upcomingAppointment.departmentName || 'Chuyên khoa'})`
                            : `P. Chờ (${upcomingAppointment.departmentName || 'Chuyên khoa'})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 border border-teal-100 p-1 shadow-sm">
                        {upcomingAppointment.doctorAvatarUrl ? (
                          <img src={upcomingAppointment.doctorAvatarUrl} alt="Dr." className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserCircle size={36} />
                        )}
                      </div>
                      <div>
                        <div className="patient-label text-xs font-bold uppercase tracking-widest">Bác sĩ phụ trách</div>
                        <div className="patient-data font-black text-xl">{upcomingAppointment.doctorName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Stub */}
                <div className="w-full md:w-72 bg-gradient-to-b from-teal-50 to-cyan-50 backdrop-blur-md border-l border-slate-100 p-8 flex flex-col items-center justify-center relative border-t md:border-t-0">
                  {/* Dashed tear line */}
                  <div className="hidden md:block absolute left-[-1px] top-6 bottom-6 w-[2px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(148,163,184,0.35)_50%)] bg-[length:100%_20px]"></div>
                  
                  <div className="bg-white p-4 rounded-3xl mb-8 shadow-md border border-slate-100">
                    <QrCode size={120} className="text-slate-900" />
                  </div>
                  
                  <button 
                    onClick={() => navigate('/dashboard/queue-status')}
                    className={`w-full text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-1 ${
                      upcomingAppointment.queueStatus === 'CALLED'
                        ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-red-400/30 hover:shadow-red-400/40"
                        : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 shadow-teal-400/30 hover:shadow-teal-400/40"
                    }`}
                  >
                    {upcomingAppointment.queueStatus === 'CALLED'
                      ? "VÀO PHÒNG KHÁM"
                      : upcomingAppointment.queueNumber
                      ? "THEO DÕI HÀNG ĐỢI"
                      : "LẤY SỐ THỨ TỰ"}
                  </button>
                </div>
              </motion.div>
            ) : (
              !loadingAppt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="patient-glass-panel rounded-[3rem] p-12 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent"></div>
                  <div className="w-28 h-28 patient-glass-panel-sm rounded-[2.5rem] rotate-12 flex items-center justify-center text-teal-200 mb-8 relative z-10">
                    <CalendarPlus size={56} className="-rotate-12" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 relative z-10 drop-shadow-sm">Sức khỏe là vô giá</h3>
                  <p className="text-slate-700 mb-10 max-w-md text-center text-lg relative z-10 font-medium drop-shadow-sm">Hãy đặt lịch hẹn định kỳ để chúng tôi có thể chăm sóc sức khỏe cho bạn và gia đình một cách tốt nhất.</p>
                  <button 
                    onClick={() => navigate("/dashboard/available-slots")}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-black text-lg py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(45,212,191,0.25)] relative z-10 flex items-center gap-3"
                  >
                    Đặt khám ngay <ArrowRight size={22} />
                  </button>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* AI ENERGY ORB WIDGET */}
          <div className="patient-glass-panel patient-glass-panel-clear rounded-[3rem] p-8 md:p-10 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all">
            <div className="absolute right-0 top-1/2 w-64 h-64 bg-violet-200/30 rounded-full blur-[60px] translate-x-1/3 -translate-y-1/2 pointer-events-none group-hover:bg-violet-200/50 transition-colors duration-1000"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              {/* The Energy Orb */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_40px_rgba(45,212,191,0.35)] animate-pulse relative">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md mix-blend-overlay"></div>
                <Sparkles size={36} className="relative z-10 drop-shadow-md" />
              </div>

              <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">Trợ lý Sức khỏe AI</h3>
                  <button 
                    onClick={() => navigate('/dashboard/ai-chat')}
                    className="text-white/80 hover:text-white text-sm font-bold flex items-center gap-1 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full"
                  >
                    <Clock size={14} /> Lịch sử tư vấn
                  </button>
                </div>
                
                <p className="text-white/95 font-extrabold mb-3 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                  Mô tả triệu chứng của bạn, AI sẽ phân tích và đề xuất chuyên khoa phù hợp.
                </p>
                
                <div className="bg-white/10 rounded-xl p-3 mb-4 border border-white/20 backdrop-blur-sm">
                  <p className="text-white/90 text-xs font-semibold mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-teal-200" /> Ví dụ bạn có thể hỏi:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAiQuery("Tôi bị đau đầu kéo dài và buồn nôn vào buổi sáng")} className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg transition-colors text-left">"Tôi bị đau đầu kéo dài và buồn nôn vào buổi sáng"</button>
                    <button onClick={() => setAiQuery("Trẻ em bị sốt cao 39 độ và nổi mẩn đỏ thì khám khoa nào?")} className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg transition-colors text-left">"Trẻ em bị sốt cao 39 độ và nổi mẩn đỏ..."</button>
                  </div>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (aiQuery.trim()) {
                      navigate('/dashboard/ai-chat', { state: { initialQuery: aiQuery } });
                    }
                  }} 
                  className="relative group w-full"
                >
                  <div className="relative flex items-center patient-glass-input-clear rounded-2xl p-2 transition-all">
                    <input
                      type="text"
                      placeholder="Mô tả triệu chứng (VD: Tôi hay bị đau đầu, buồn nôn...)"
                      className="bg-transparent border-none outline-none font-medium w-full px-4 text-[16px]"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!aiQuery.trim()}
                      className="px-8 py-3 rounded-[14px] bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all disabled:opacity-40 disabled:bg-slate-400 shrink-0 shadow-[0_4px_14px_rgba(13,148,136,0.4)]"
                    >
                      Hỏi AI
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex items-start gap-1.5 text-white/70 text-[11px] font-medium bg-black/10 p-2 rounded-lg border border-white/5">
                  <AlertCircle size={14} className="shrink-0 text-amber-300/80" />
                  <p><strong>Lưu ý:</strong> Trợ lý AI chỉ mang tính chất tham khảo định hướng chuyên khoa, KHÔNG thay thế cho chẩn đoán và chỉ định điều trị của bác sĩ chuyên môn.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ASYMMETRIC BENTO GRID */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full">
          


          {/* ASYMMETRIC ACTION BLOCKS */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/my-medical-history")}
              className="patient-glass-panel-sm patient-glass-panel-sm-clear rounded-[2.5rem] p-6 cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-400/25 text-fuchsia-200 flex items-center justify-center mb-6 shadow-sm group-hover:-translate-y-1 transition-transform border border-fuchsia-300/20">
                <FileText size={26} />
              </div>
              <div className="text-white font-black text-xl leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">Hồ sơ<br/>Bệnh án</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/my-lab-results")}
              className="patient-glass-panel-sm patient-glass-panel-sm-clear rounded-[2.5rem] p-6 cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-400/25 text-sky-200 flex items-center justify-center mb-6 shadow-sm group-hover:-translate-y-1 transition-transform border border-sky-300/20">
                <ActivitySquare size={26} />
              </div>
              <div className="text-white font-black text-xl leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">Kết quả<br/>Xét nghiệm</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/service-prices")}
              className="patient-glass-panel-sm patient-glass-panel-sm-clear rounded-[2.5rem] p-6 cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)] col-span-2 flex-row items-center"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/25 text-amber-200 flex items-center justify-center shadow-sm group-hover:-translate-y-1 transition-transform border border-amber-300/20 shrink-0">
                  <ListOrdered size={26} />
                </div>
                <div className="text-white font-black text-xl leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">Bảng giá<br/>Dịch vụ y tế</div>
              </div>
              <div className="text-amber-200/50 group-hover:text-amber-200 transition-colors">
                <ArrowRight size={24} />
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* FEATURED DOCTORS SECTION */}
      <div className="w-full flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 drop-shadow-sm flex items-center gap-2">
            <UserCircle className="text-teal-600" /> Đội ngũ Bác sĩ Chuyên khoa
          </h2>
          <button 
            onClick={() => navigate('/dashboard/our-doctors')}
            className="text-teal-600 hover:text-teal-800 font-bold text-sm flex items-center gap-1 transition-colors"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>

        {loadingDoctors ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {doctors.map((doc, i) => (
              <div key={doc.doctorId || i} className="patient-glass-panel patient-glass-panel-clear rounded-3xl p-6 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all flex flex-col items-center relative overflow-hidden group border border-white">
                <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-teal-100/50 to-transparent"></div>
                <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-white z-10 flex items-center justify-center overflow-hidden mb-4 relative">
                  {doc.avatarUrl ? (
                    <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                     <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600">
                        <UserCircle size={48} strokeWidth={1} />
                     </div>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 z-10 text-center mb-1">{doc.fullName}</h3>
                <p className="text-teal-600 font-bold text-sm mb-3 z-10">{doc.departmentName || doc.specialization || "Chuyên khoa"}</p>
                
                <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-500 mb-4 z-10">
                  <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{doc.degree || "Bác sĩ"}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{doc.yearsOfExperience || 0} năm KN</span>
                </div>

                <button 
                  onClick={() => setSelectedDoctor(doc)}
                  className="w-full mt-auto bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-bold py-2.5 rounded-xl transition-colors z-10 shadow-sm border border-teal-200 hover:border-teal-600"
                >
                  Xem chi tiết
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOCTOR DETAIL MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full transition-colors backdrop-blur-md"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="h-40 bg-gradient-to-r from-teal-500 to-emerald-400 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="px-8 pb-8 relative -mt-20">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-8">
                  <div className="w-40 h-40 rounded-full bg-white p-2 shadow-xl shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-teal-50 flex items-center justify-center">
                      {selectedDoctor.avatarUrl ? (
                        <img src={selectedDoctor.avatarUrl} alt={selectedDoctor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={80} className="text-teal-400" strokeWidth={1} />
                      )}
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      <ShieldCheck size={14} /> Chuyên gia Y tế
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">{selectedDoctor.fullName}</h2>
                    <p className="text-teal-600 font-bold text-lg">{selectedDoctor.departmentName || selectedDoctor.specialization || "Chuyên khoa"}</p>
                  </div>
                  <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => navigate('/dashboard/available-slots', { state: { prefillDoctorId: selectedDoctor.doctorId } })}
                      className="w-full md:w-auto bg-slate-900 hover:bg-teal-600 text-white font-black py-3 px-8 rounded-xl transition-colors shadow-lg"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Học vấn</p>
                      <p className="font-bold text-slate-900">{selectedDoctor.degree || "Bác sĩ Chuyên khoa"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Kinh nghiệm</p>
                      <p className="font-bold text-slate-900">{selectedDoctor.yearsOfExperience || 0} năm</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Đánh giá</p>
                      <p className="font-bold text-slate-900 flex items-center gap-1">4.9/5 <span className="text-slate-400 text-sm font-medium">(120+)</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="text-teal-500" /> Tiểu sử & Chuyên môn
                    </h3>
                    <div className="text-slate-600 font-medium leading-relaxed bg-white p-5 rounded-2xl border border-slate-100">
                      {selectedDoctor.biography ? (
                        <p>{selectedDoctor.biography}</p>
                      ) : (
                        <p>Bác sĩ {selectedDoctor.fullName} là một chuyên gia tận tâm trong lĩnh vực {selectedDoctor.departmentName || "y tế"}. Với {selectedDoctor.yearsOfExperience || "nhiều"} năm kinh nghiệm công tác và làm việc tại các bệnh viện lớn, bác sĩ luôn đề cao y đức và sự tận tâm đối với bệnh nhân. Bác sĩ đã điều trị thành công hàng ngàn ca bệnh và luôn không ngừng cập nhật các phương pháp điều trị tiên tiến nhất để mang lại hiệu quả tốt nhất cho người bệnh.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                      <ThumbsUp className="text-blue-500" /> Hiệu suất & Thành tựu
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <div className="text-3xl font-black text-blue-600 mb-1">98%</div>
                        <div className="text-sm font-bold text-slate-600">Bệnh nhân hài lòng</div>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                        <div className="text-3xl font-black text-emerald-600 mb-1">1,500+</div>
                        <div className="text-sm font-bold text-slate-600">Ca khám thành công</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
