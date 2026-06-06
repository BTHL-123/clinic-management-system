import React, { useState, useEffect } from "react";
import { 
  CalendarDays, FileText, Activity, Settings,
  HeartPulse, Sparkles, UserCircle, CalendarPlus, ListOrdered, Bell,
  QrCode, ArrowRight, ActivitySquare, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area
} from "recharts";
import appointmentService from "../../services/appointmentService.js";

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

  useEffect(() => {
    fetchUpcomingAppointment();
  }, []);

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
                    <div className="flex items-center gap-3 bg-teal-50 text-teal-700 w-max px-4 py-2 rounded-full text-sm font-bold border border-teal-100 mb-8 uppercase tracking-wider shadow-sm">
                      <ShieldCheck size={16} /> Phiếu Khám Sắp Tới
                    </div>

                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Thời gian</p>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
                          {new Date(`1970-01-01T${upcomingAppointment.estimatedStartTime}`).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p className="text-teal-600 font-extrabold text-xl mt-2">
                          {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Phòng khám</p>
                        <p className="text-3xl font-black text-slate-900">P. {upcomingAppointment.roomId || 'Đang chờ'}</p>
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
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Bác sĩ phụ trách</div>
                        <div className="text-slate-900 font-black text-xl">{upcomingAppointment.doctorName}</div>
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
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-teal-400/30 hover:-translate-y-1"
                  >
                    LẤY SỐ THỨ TỰ
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
          <div className="patient-glass-panel rounded-[3rem] p-8 md:p-10 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all">
            <div className="absolute right-0 top-1/2 w-64 h-64 bg-violet-200/30 rounded-full blur-[60px] translate-x-1/3 -translate-y-1/2 pointer-events-none group-hover:bg-violet-200/50 transition-colors duration-1000"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              {/* The Energy Orb */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_40px_rgba(45,212,191,0.35)] animate-pulse relative">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md mix-blend-overlay"></div>
                <Sparkles size={36} className="relative z-10 drop-shadow-md" />
              </div>

              <div className="flex-1 w-full">
                <h3 className="text-2xl font-black text-slate-900 mb-2 drop-shadow-sm">Trợ lý Sức khỏe AI</h3>
                <p className="text-slate-700 font-medium mb-5 drop-shadow-sm">Hệ thống AI sẽ phân tích triệu chứng và đề xuất chuyên khoa phù hợp nhất cho bạn.</p>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log("AI query submitted:", aiQuery);
                  }} 
                  className="relative group w-full"
                >
                  <div className="relative flex items-center patient-input-field rounded-2xl p-2 transition-all">
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
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ASYMMETRIC BENTO GRID */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full">
          
          {/* WELLNESS SCORE WIDGET */}
          <div className="patient-glass-panel rounded-[3rem] p-8 flex flex-col relative overflow-hidden flex-shrink-0 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all">
            <h3 className="text-slate-900 font-black text-xl mb-8 flex items-center gap-2">
              <ActivitySquare className="text-teal-600" /> Điểm Sức Khỏe
            </h3>
            
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke="url(#wellnessGradient)" strokeWidth="8" 
                    strokeDasharray="283" strokeDashoffset="42" /* 85% */
                    strokeLinecap="round" 
                  />
                  <defs>
                    <linearGradient id="wellnessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">85</span>
                  <span className="text-teal-600 font-bold text-sm uppercase tracking-widest mt-1">Tốt</span>
                </div>
              </div>
            </div>

            {/* Micro Area Chart */}
            <div className="h-20 w-full mt-auto relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorHeart)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#2dd4bf' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ASYMMETRIC ACTION BLOCKS */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/my-medical-history")}
              className="patient-glass-panel-sm rounded-[2.5rem] p-6 cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-400/25 text-fuchsia-200 flex items-center justify-center mb-6 shadow-sm group-hover:-translate-y-1 transition-transform border border-fuchsia-300/20">
                <FileText size={26} />
              </div>
              <div className="text-slate-900 font-black text-xl leading-tight">Hồ sơ<br/>Bệnh án</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard/my-lab-results")}
              className="patient-glass-panel-sm rounded-[2.5rem] p-6 cursor-pointer transition-all flex flex-col justify-between group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-400/25 text-sky-200 flex items-center justify-center mb-6 shadow-sm group-hover:-translate-y-1 transition-transform border border-sky-300/20">
                <ActivitySquare size={26} />
              </div>
              <div className="text-slate-900 font-black text-xl leading-tight">Kết quả<br/>Xét nghiệm</div>
            </motion.div>
          </div>

        </div>
      </div>

    </div>
  );
}
