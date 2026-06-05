import React, { useState } from "react";
import { Search, CalendarDays, Clock, FileText, Settings, Shield, Bell, ChevronRight, X, HeartPulse, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";

const clusters = [
  {
    id: "booking",
    title: "Quản lý Khám bệnh",
    subtitle: "Đặt lịch, theo dõi hàng đợi và lịch hẹn của bạn",
    color: "from-teal-500 to-emerald-600",
    icon: <CalendarDays size={32} />,
    items: [
      { label: "Tìm ca khám trống", path: "/dashboard/available-slots", icon: <Search size={20} />, desc: "Đặt lịch mới ngay" },
      { label: "Lịch hẹn của tôi", path: "/dashboard/my-appointments", icon: <CalendarDays size={20} />, desc: "Quản lý các lịch sắp tới" },
      { label: "Trạng thái hàng đợi", path: "/dashboard/queue-status", icon: <Clock size={20} />, desc: "Theo dõi số thứ tự hôm nay" },
    ]
  },
  {
    id: "records",
    title: "Hồ sơ Y tế",
    subtitle: "Tra cứu bệnh án, kết quả xét nghiệm, và đơn thuốc",
    color: "from-blue-500 to-indigo-600",
    icon: <HeartPulse size={32} />,
    items: [
      { label: "Lịch sử khám bệnh", path: "/dashboard/my-medical-history", icon: <FileText size={20} />, desc: "Xem lại các lần khám trước" },
      { label: "Kết quả xét nghiệm", path: "/dashboard/my-lab-results", icon: <Search size={20} />, desc: "Xem chỉ số xét nghiệm" },
    ]
  },
  {
    id: "settings",
    title: "Cài đặt Cá nhân",
    subtitle: "Bảo mật tài khoản và thông báo",
    color: "from-slate-600 to-slate-800",
    icon: <Settings size={32} />,
    items: [
      { label: "Hồ sơ cá nhân", path: "/dashboard/profile", icon: <Settings size={20} />, desc: "Cập nhật thông tin cá nhân" },
      { label: "Đổi mật khẩu", path: "/dashboard/change-password", icon: <Shield size={20} />, desc: "Bảo mật tài khoản" },
      { label: "Thông báo", path: "/dashboard/notifications", icon: <Bell size={20} />, desc: "Quản lý thông báo nhận được" },
    ]
  }
];

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const openedFromState = !!location.state?.activeClusterId;

  const [activeCluster, setActiveCluster] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isFromState, setIsFromState] = useState(false);
  const [aiQuery, setAiQuery] = useState("");

  // When returning from a feature page, delay the modal slightly so the page settles first
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (openedFromState && !didMount.current) {
      const stateClusterId = location.state?.activeClusterId;
      const cluster = clusters.find((c) => c.id === stateClusterId);
      if (cluster) {
        setActiveCluster(cluster);
        setIsFromState(true);
        // Small delay lets the page fade in first, then popup slides up
        const t = setTimeout(() => setShowModal(true), 80);
        return () => clearTimeout(t);
      }
    }
    didMount.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full relative min-h-[calc(100vh-120px)] flex flex-col justify-center">
      <div className="mb-16 text-center mt-6">
        {/* Personalized Greeting Badge & Trust Badge */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white/15 border border-white/20 text-white px-5 py-2 rounded-full text-[15px] font-extrabold backdrop-blur-md shadow-[0_4px_15px_rgba(255,255,255,0.05)] hover:bg-white/25 transition-colors">
            <span className="text-lg leading-none">👋</span>
            Xin chào, {user?.fullName ?? "Bệnh nhân"}
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
            <HeartPulse size={16} className="text-teal-300 animate-pulse" />
            Hệ thống Y tế Tiêu chuẩn
          </div>
        </div>

        {/* Grand Hero Title */}
        <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.1] mb-6 text-white drop-shadow-lg">
          Chăm sóc Sức khỏe <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-teal-100 filter drop-shadow-[0_0_15px_rgba(94,234,212,0.3)]">
            Toàn diện & Tận tâm
          </span>
        </h1>

        {/* Elegant Subtitle */}
        <p className="text-lg md:text-xl text-white max-w-2xl mx-auto font-semibold leading-relaxed drop-shadow-sm">
          Nền tảng đặt lịch khám thông minh, kết nối bạn với hàng ngàn bác sĩ chuyên khoa. Hãy chọn một khu vực để bắt đầu.
        </p>

        {/* AI Query Bar (UI Layout Only) */}
        <div className="max-w-2xl mx-auto w-full px-4 mt-10 relative z-20">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              console.log("AI query submitted:", aiQuery);
            }} 
            className="relative group"
          >
            {/* Glowing Aura Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/25 to-emerald-500/25 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Main Bar Wrapper */}
            <div className="relative flex items-center bg-slate-950/70 backdrop-blur-md border border-white/20 hover:border-teal-400/40 focus-within:border-teal-400/60 rounded-full px-6 py-3.5 shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 shrink-0 mr-3.5 border border-teal-500/30">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <input
                type="text"
                placeholder="Tra cứu AI đề xuất khoa và bác sĩ: Nhập triệu chứng của bạn (ví dụ: đau bụng, ho sốt...)"
                className="bg-transparent border-none outline-none text-white font-medium w-full text-[15px] ai-search-input"
                style={{ color: '#ffffff' }}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={!aiQuery.trim()}
                className="ml-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-900 font-bold hover:shadow-[0_0_20px_rgba(94,234,212,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                <span>Hỏi AI</span>
                <Search size={14} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4">
        {clusters.map((cluster) => (
          <motion.div
            // Only use layoutId when NOT in back-navigation mode to avoid conflicts
            layoutId={isFromState ? undefined : cluster.id}
            key={cluster.id}
            onClick={() => {
              setIsFromState(false);
              setActiveCluster(cluster);
              setShowModal(true);
            }}
            className={`relative bg-gradient-to-br ${cluster.color} rounded-[2rem] p-8 text-white cursor-pointer shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group min-h-[260px] flex flex-col justify-end`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Decorative abstract circle */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-[40px] group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/20">
                {cluster.icon}
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="font-extrabold text-2xl mb-2">{cluster.title}</h2>
              <p className="text-white/80 font-medium text-sm leading-relaxed">
                {cluster.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Cluster Modal */}
      <AnimatePresence>
        {showModal && activeCluster && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              onClick={() => { setActiveCluster(null); setShowModal(false); }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            
            {/* Expanded Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 pointer-events-none">
              <motion.div
                // No layoutId when returning — pure standalone animation, zero conflict
                layoutId={isFromState ? undefined : activeCluster.id}
                initial={{ opacity: 0, y: 36, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`bg-gradient-to-br ${activeCluster.color} w-full max-w-4xl h-full max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col pointer-events-auto border border-white/20`}
              >
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

                <div className="p-8 md:p-10 flex items-center justify-between relative z-10 border-b border-white/10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-white">
                      {activeCluster.icon}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-3xl md:text-4xl text-white">{activeCluster.title}</h2>
                      <p className="text-white/80 font-medium mt-1 hidden md:block">{activeCluster.subtitle}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => { setActiveCluster(null); setShowModal(false); }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 backdrop-blur-md"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 p-8 md:p-10 overflow-y-auto relative z-10 custom-scrollbar">
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.4, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {activeCluster.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigate(item.path)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-[1.5rem] p-6 cursor-pointer transition-all hover:-translate-y-1 group flex items-start gap-5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                            {item.label} <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                          </h3>
                          <p className="text-white/70 text-sm leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      <style>{`
        .ai-search-input::placeholder {
          color: rgba(255, 255, 255, 0.75) !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
