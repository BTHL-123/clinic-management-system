import React, { useState, useEffect } from "react";
import { 
  FlaskConical, CheckCircle, Clock,
  HeartPulse, Sparkles, UserCircle, ArrowRight, ActivitySquare, ShieldCheck, FileText, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AreaChart, Area, ResponsiveContainer, Tooltip
} from "recharts";
import { getAllLabRequests } from "../../services/labRequestService";

const mockPerformanceData = [
  { time: '08:00', value: 12 }, { time: '10:00', value: 25 },
  { time: '12:00', value: 18 }, { time: '14:00', value: 30 },
  { time: '16:00', value: 22 }, { time: '18:00', value: 15 },
  { time: '20:00', value: 8 },
];

export default function LabTechnicianHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingRequest, setUpcomingRequest] = useState(null);
  const [loadingReq, setLoadingReq] = useState(true);
  const [stats, setStats] = useState({ waiting: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingReq(true);
      const res = await getAllLabRequests({ size: 100 });
      const content = res.data?.content || res.content || [];
      
      const waiting = content.filter(r => r.status === "REQUESTED");
      const inProgress = content.filter(r => r.status === "IN_PROGRESS");
      const completed = content.filter(r => r.status === "COMPLETED");

      setStats({
        waiting: waiting.length,
        inProgress: inProgress.length,
        completed: completed.length
      });

      if (waiting.length > 0) {
        setUpcomingRequest(waiting[0]);
      } else if (inProgress.length > 0) {
        setUpcomingRequest(inProgress[0]);
      }
    } catch (err) {
      console.error("Failed to fetch lab requests", err);
    } finally {
      setLoadingReq(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col gap-8 pb-8 px-4 sm:px-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 mt-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-2 font-extrabold text-[11px] uppercase tracking-wider">
            <FlaskConical size={16} className="animate-pulse" />
            <span>Trung tâm Xét nghiệm Tiêu chuẩn</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            {getGreeting()}, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">
              {user?.fullName ?? "Kỹ thuật viên"}
            </span>
          </h1>
        </div>
      </div>

      {/* CREATIVE DASHBOARD WIDGETS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN: UPCOMING REQUEST & AI SECTION */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* FLOATING TICKET UI */}
          <AnimatePresence>
            {!loadingReq && upcomingRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col md:flex-row transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-teal-100"
              >
                {/* Decorative Pattern - Frosted Glass blob */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-50/40 to-emerald-50/30 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
                
                {/* Main Ticket Info */}
                <div className="p-6 md:p-8 flex-1 relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 bg-teal-50 text-teal-600 w-max px-3 py-1 rounded-full text-xs font-bold border border-teal-100/50 mb-6 uppercase tracking-wider shadow-sm">
                      <ShieldCheck size={14} /> Phiếu Xét Nghiệm Ưu Tiên
                    </div>

                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Mã Phiếu</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1DB896] tracking-tight">
                          {upcomingRequest.requestCode}
                        </h2>
                        <p className="text-slate-500 font-extrabold text-sm mt-2 flex items-center gap-1.5">
                          <Clock size={16} className="text-teal-500" /> 
                          {new Date(upcomingRequest.requestedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Trạng thái</p>
                        <p className={`text-xl font-black ${upcomingRequest.status === "REQUESTED" ? "text-amber-600" : "text-blue-600"}`}>
                          {upcomingRequest.status === "REQUESTED" ? "Chờ tiếp nhận" : "Đang xử lý"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100/50 shadow-sm">
                        <UserCircle size={28} />
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Mã bệnh nhân</div>
                        <div className="text-slate-800 font-bold text-base">ID: {upcomingRequest.patientId}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Stub */}
                <div className="w-full md:w-64 bg-slate-50/50 backdrop-blur-sm border-t md:border-t-0 md:border-l border-slate-100 p-6 flex flex-col items-center justify-center relative">
                  <div className="hidden md:block absolute left-[-1px] top-6 bottom-6 w-[2px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(148,163,184,0.15)_50%)] bg-[length:100%_20px]"></div>
                  
                  <div className="bg-white p-4 rounded-xl mb-6 shadow-sm border border-slate-100">
                    <FlaskConical size={52} className="text-teal-600" />
                  </div>
                  
                  <button 
                    onClick={() => navigate('/dashboard/lab-requests')}
                    className="w-full bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-teal-500/20 text-sm cursor-pointer"
                  >
                    XỬ LÝ NGAY
                  </button>
                </div>
              </motion.div>
            ) : (
              !loadingReq && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-teal-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-50/10 to-transparent pointer-events-none"></div>
                  <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6 relative z-10 border border-teal-100/50">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Hoàn thành xuất sắc</h3>
                  <p className="text-slate-500 mb-8 max-w-md text-center text-sm relative z-10 font-medium">Không còn phiếu xét nghiệm nào đang chờ xử lý. Mọi thứ đã được cập nhật đầy đủ.</p>
                  <button 
                    onClick={() => navigate("/dashboard/lab-requests")}
                    className="bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 shadow-md shadow-teal-500/20 relative z-10 flex items-center gap-2 text-sm cursor-pointer"
                  >
                    Xem lịch sử <ArrowRight size={18} />
                  </button>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* AI AUTOMATION SECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-teal-100">
            <div className="absolute right-0 top-1/2 w-64 h-64 bg-teal-50/30 rounded-full blur-[60px] translate-x-1/3 -translate-y-1/2 pointer-events-none transition-colors duration-1000"></div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 border border-teal-100/50 shadow-sm">
                <Sparkles size={28} />
              </div>

              <div className="flex-1 w-full">
                <h3 className="text-lg font-black text-slate-800 mb-1">Hệ thống Tự động hóa</h3>
                <p className="text-slate-500 text-xs font-semibold mb-4">Các kết quả xét nghiệm từ máy phân tích có thể được đồng bộ trực tiếp vào hệ thống.</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-max">
                  <RefreshCw size={16} className="text-teal-600 animate-spin" />
                  <span className="text-slate-600 text-xs font-bold tracking-wide">Đang đồng bộ ngầm...</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STATS AND PROGRESS */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full">
          
          {/* LAB PERFORMANCE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col relative overflow-hidden flex-shrink-0 transition-all duration-300 hover:shadow-md hover:border-teal-100">
            <h3 className="text-slate-700 font-extrabold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
              <ActivitySquare size={18} className="text-teal-600" /> Tiến độ Xét nghiệm
            </h3>
            
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke="url(#wellnessGradient)" strokeWidth="8" 
                    strokeDasharray="283" strokeDashoffset={stats.completed + stats.inProgress + stats.waiting > 0 ? 283 - (283 * (stats.completed / (stats.completed + stats.inProgress + stats.waiting))) : 283}
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
                  <span className="text-4xl font-black text-slate-800 tracking-tighter">{stats.completed}</span>
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Đã xong</span>
                </div>
              </div>
            </div>

            <div className="h-16 w-full mt-auto relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorHeart)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#0f766e', fontSize: '12px' }}
                    labelStyle={{ display: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTION BLOCKS */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/lab-requests")}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group hover:shadow-md hover:border-teal-100"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 border border-amber-100/50 group-hover:scale-105 transition-transform duration-300">
                <FileText size={22} />
              </div>
              <div>
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider block mb-0.5">Chờ tiếp nhận</span>
                <span className="text-2xl font-black text-slate-800 leading-none">{stats.waiting}</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dashboard/lab-requests")}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group hover:shadow-md hover:border-teal-100"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 border border-blue-100/50 group-hover:scale-105 transition-transform duration-300">
                <ActivitySquare size={22} />
              </div>
              <div>
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider block mb-0.5">Đang xử lý</span>
                <span className="text-2xl font-black text-slate-800 leading-none">{stats.inProgress}</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
