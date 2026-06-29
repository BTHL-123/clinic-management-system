import React, { useState, useEffect } from "react";
import {
  CalendarDays, FileText, HeartPulse, UserCircle, CalendarPlus, ListOrdered,
  QrCode, ArrowRight, ActivitySquare, ShieldCheck, Star, X, Calendar, Clock, BookOpen, GraduationCap, Activity, ThumbsUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { motion, AnimatePresence } from "framer-motion";
import appointmentService from "../../services/appointmentService.js";
import { getDoctors } from "../../services/doctorService.js";

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const quickAccessItems = [
    {
      title: "Đặt lịch khám",
      desc: "Chọn bác sĩ & khung giờ",
      icon: CalendarPlus,
      path: "/dashboard/available-slots",
      bgClass: "bg-emerald-50/70 border-emerald-100/50 hover:bg-emerald-100/80 hover:border-emerald-200",
      iconBgClass: "bg-emerald-100 text-emerald-600",
      titleClass: "text-emerald-800",
      descClass: "text-emerald-650",
    },
    {
      title: "Hồ sơ bệnh án",
      desc: "Lịch sử khám chữa bệnh",
      icon: FileText,
      path: "/dashboard/my-medical-history",
      bgClass: "bg-purple-50/70 border-purple-100/50 hover:bg-purple-100/80 hover:border-purple-200",
      iconBgClass: "bg-purple-100 text-purple-600",
      titleClass: "text-purple-800",
      descClass: "text-purple-650",
    },
    {
      title: "Kết quả xét nghiệm",
      desc: "Xem kết quả cận lâm sàng",
      icon: ActivitySquare,
      path: "/dashboard/my-medical-history?tab=history",
      bgClass: "bg-blue-50/70 border-blue-100/50 hover:bg-blue-100/80 hover:border-blue-200",
      iconBgClass: "bg-blue-100 text-blue-600",
      titleClass: "text-blue-800",
      descClass: "text-blue-650",
    },
    {
      title: "Bảng giá dịch vụ",
      desc: "Xem chi phí dịch vụ y tế",
      icon: ListOrdered,
      path: "/dashboard/service-prices",
      bgClass: "bg-amber-50/70 border-amber-100/50 hover:bg-amber-100/80 hover:border-amber-200",
      iconBgClass: "bg-amber-100 text-amber-600",
      titleClass: "text-amber-800",
      descClass: "text-amber-650",
    },
    {
      title: "Tư vấn AI",
      desc: "Hỏi triệu chứng với AI",
      icon: HeartPulse,
      path: "/dashboard/ai-chat",
      bgClass: "bg-teal-50/70 border-teal-100/50 hover:bg-teal-100/80 hover:border-teal-200",
      iconBgClass: "bg-teal-100 text-teal-650",
      titleClass: "text-teal-800",
      descClass: "text-teal-650",
    },
    {
      title: "Lịch hẹn của tôi",
      desc: "Quản lý cuộc hẹn",
      icon: CalendarDays,
      path: "/dashboard/my-appointments",
      bgClass: "bg-rose-50/70 border-rose-100/50 hover:bg-rose-100/80 hover:border-rose-200",
      iconBgClass: "bg-rose-100 text-rose-600",
      titleClass: "text-rose-800",
      descClass: "text-rose-650",
    },
  ];

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors({ page: 0, size: 4, status: "ACTIVE" });
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
    <div className="w-full flex flex-col gap-6 h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-2 pb-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mt-2">
        <div>
          <div className="flex items-center gap-2 text-[#1DB896] mb-1 font-semibold text-xs uppercase tracking-wider">
            <HeartPulse size={14} className="animate-pulse" />
            <span>Hệ thống Y tế Phòng khám</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-[#0A604E]">{user?.fullName ?? "Bệnh nhân"}</span>
          </h1>
        </div>
        <button
          onClick={() => navigate("/dashboard/available-slots")}
          className="flex items-center gap-2 bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-[#0A604E]/10 hover:-translate-y-0.5 text-xs"
        >
          <CalendarPlus size={16} />
          <span>Đặt lịch khám ngay</span>
        </button>
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1 items-start">

        {/* LEFT COLUMN: UPCOMING TICKET & DOCTORS */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* UPCOMING APPOINTMENT TICKET */}
          <AnimatePresence mode="wait">
            {!loadingAppt && upcomingAppointment ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 relative overflow-hidden group flex flex-col md:flex-row transition-all hover:shadow-md shadow-sm"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-teal-100/30 to-emerald-50/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                {/* Main Ticket Info */}
                <div className="p-6 md:p-8 flex-1 relative z-10 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 w-max px-3.5 py-1.5 rounded-full text-[10px] font-bold border border-teal-200/50 uppercase tracking-wider">
                        <ShieldCheck size={13} /> Phiếu Khám Sắp Tới
                      </div>
                      {upcomingAppointment.queueNumber && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 w-max px-3.5 py-1.5 rounded-full text-[10px] font-bold border border-amber-200/50 uppercase tracking-wider animate-pulse">
                          Số thứ tự: #{upcomingAppointment.queueNumber}
                        </div>
                      )}
                      {upcomingAppointment.queueStatus === 'CALLED' && (
                        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 w-max px-3.5 py-1.5 rounded-full text-[10px] font-bold border border-rose-200/55 uppercase tracking-wider animate-bounce">
                          Đã đến lượt khám!
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-widest mb-1.5">Giờ hẹn khám</p>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
                          {String(upcomingAppointment.estimatedStartTime || upcomingAppointment.startTime || '').slice(0, 5) || '--:--'}
                        </h2>
                        <p className="text-[#0A604E] font-bold text-sm mt-2 flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#1DB896]" />
                          {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-widest mb-1.5">Phòng khám</p>
                        <p className="text-xl font-bold text-slate-800">
                          {upcomingAppointment.queueStatus === 'CALLED'
                            ? `Phòng Khám (${upcomingAppointment.departmentName || 'Chuyên khoa'})`
                            : `Phòng Chờ (${upcomingAppointment.departmentName || 'Chuyên khoa'})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 p-1 shrink-0 overflow-hidden">
                        {upcomingAppointment.doctorAvatarUrl ? (
                          <img src={upcomingAppointment.doctorAvatarUrl} alt="Dr." className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          <UserCircle size={28} className="text-[#1DB896]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[9px] text-[#4A5D59] font-extrabold uppercase tracking-widest">Bác sĩ khám</div>
                        <div className="font-extrabold text-sm text-slate-800">{upcomingAppointment.doctorName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Stub */}
                <div className="w-full md:w-56 bg-[#F0F9F7]/70 border-l border-slate-100 p-6 flex flex-col items-center justify-center relative border-t md:border-t-0 shrink-0">
                  <div className="hidden md:block absolute left-[-1px] top-6 bottom-6 w-[2px] bg-[linear-gradient(to_bottom,transparent_50%,rgba(148,163,184,0.18)_50%)] bg-[length:100%_16px]"></div>

                  <div className="bg-white p-2.5 rounded-2xl mb-4 shadow-sm border border-slate-200/50">
                    <QrCode size={90} className="text-slate-850" />
                  </div>

                  <button
                    onClick={() => navigate('/dashboard/queue-status')}
                    className={`w-full text-white font-extrabold py-3 rounded-xl transition-all shadow-sm text-xs ${upcomingAppointment.queueStatus === 'CALLED'
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-100"
                      : "bg-[#0A604E] hover:bg-[#1DB896] shadow-teal-150"
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
                  className="bg-white rounded-3xl border border-slate-200/80 p-8 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden shadow-sm"
                >
                  <div className="w-16 h-16 bg-[#F0F9F7] rounded-2xl flex items-center justify-center text-[#1DB896] mb-4 border border-[#D1F2EB]">
                    <CalendarPlus size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1.5">Bạn chưa có lịch hẹn sắp tới</h3>
                  <p className="text-slate-500 mb-5 max-w-sm text-center text-xs font-semibold">Đặt lịch khám định kỳ giúp kiểm soát tốt sức khỏe cá nhân của bạn.</p>
                  <button
                    onClick={() => navigate("/dashboard/available-slots")}
                    className="bg-[#0A604E] hover:bg-[#1DB896] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all hover:-translate-y-0.5 shadow-sm flex items-center gap-1.5"
                  >
                    Đặt khám ngay <ArrowRight size={14} />
                  </button>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* COMPACT DOCTORS GRID */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between pl-1">
              <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
                <UserCircle className="text-[#1DB896]" size={20} /> Đội ngũ Bác sĩ Chuyên khoa
              </h2>
              <button
                onClick={() => navigate('/dashboard/our-doctors')}
                className="text-[#1DB896] hover:text-[#0A604E] font-bold text-xs flex items-center gap-0.5 transition-colors"
              >
                Xem tất cả Bác sĩ <ArrowRight size={14} />
              </button>
            </div>

            {loadingDoctors ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1DB896]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                {doctors.map((doc, i) => (
                  <div key={doc.doctorId || i} className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-md transition-all flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-0 w-full h-14 bg-gradient-to-b from-[#F0F9F7] to-transparent"></div>
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-100 z-10 flex items-center justify-center overflow-hidden mb-2 relative">
                      {doc.avatarUrl ? (
                        <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600">
                          <UserCircle size={32} strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-slate-800 z-10 text-center mb-0.5 truncate w-full">{doc.fullName}</h3>
                    <p className="text-[#1DB896] font-semibold text-[11px] mb-2.5 z-10 truncate w-full text-center">{doc.departmentName || doc.specialization || "Chuyên khoa"}</p>

                    <div className="flex gap-1 text-[10px] font-bold text-slate-450 mb-3.5 z-10">
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-150">{doc.degree || "Bác sĩ"}</span>
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-150">{doc.yearsOfExperience || 0} năm KN</span>
                    </div>

                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="w-full mt-auto bg-slate-50 hover:bg-[#0A604E] text-slate-700 hover:text-white font-bold py-2 rounded-xl transition-all z-10 border border-slate-200/80 hover:border-[#0A604E] text-[11px]"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: QUICK ACCESS & USER GUIDE */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">

          {/* QUICK ACCESS GRID */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-base font-extrabold text-[#0A604E] pl-1">Truy cập nhanh</h2>

            <div className="grid grid-cols-2 gap-4 w-full">
              {quickAccessItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.01, translateY: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(item.path)}
                    className={`${item.bgClass} rounded-2xl border p-4.5 cursor-pointer transition-all flex flex-col gap-3.5 shadow-sm`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${item.iconBgClass} flex items-center justify-center border border-current/10 shrink-0`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className={`${item.titleClass} font-bold text-xs md:text-sm leading-tight`}>
                        {item.title}
                      </h3>
                      <p className={`${item.descClass} text-[10px] font-semibold leading-normal`}>
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* USER QUICK GUIDE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col gap-4 shadow-sm w-full">
            <div className="flex items-center gap-2 text-[#0A604E] font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#F0F9F7] flex items-center justify-center text-[#1DB896] border border-[#D1F2EB] shrink-0">
                <BookOpen size={16} />
              </div>
              <span>Hướng dẫn sử dụng nhanh</span>
            </div>

            <div className="divide-y divide-slate-100 flex flex-col">
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] border border-blue-150 shrink-0">
                  1
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold text-xs leading-tight mb-0.5">Đặt lịch khám bệnh</span>
                  <span className="text-slate-500 text-[10px] leading-snug font-semibold">Chọn bác sĩ và thời gian phù hợp để khám.</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] border border-purple-150 shrink-0">
                  2
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold text-xs leading-tight mb-0.5">Theo dõi tiến trình</span>
                  <span className="text-slate-500 text-[10px] leading-snug font-semibold">Lấy số thứ tự và theo dõi lượt khám thực tế.</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-[10px] border border-teal-150 shrink-0">
                  3
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold text-xs leading-tight mb-0.5">Xem hồ sơ y tế</span>
                  <span className="text-slate-500 text-[10px] leading-snug font-semibold">Xem lịch sử khám bệnh và các xét nghiệm.</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] border border-amber-150 shrink-0">
                  4
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold text-xs leading-tight mb-0.5">Tư vấn sức khỏe AI</span>
                  <span className="text-slate-500 text-[10px] leading-snug font-semibold">Hỏi đáp triệu chứng nhanh với Trợ lý AI.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DOCTOR DETAIL MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 rounded-xl transition-colors shadow-sm border border-slate-200/80"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="h-28 bg-gradient-to-r from-teal-500 to-[#1DB896] relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="px-6 pb-6 relative -mt-12">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-end mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md shrink-0 border border-slate-100 overflow-hidden">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-teal-50 flex items-center justify-center">
                      {selectedDoctor.avatarUrl ? (
                        <img src={selectedDoctor.avatarUrl} alt={selectedDoctor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={56} className="text-teal-400" strokeWidth={1} />
                      )}
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <div className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-200/50 mb-1">
                      <ShieldCheck size={12} /> Bác sĩ phòng khám
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-0.5">{selectedDoctor.fullName}</h2>
                    <p className="text-teal-600 font-bold text-sm">{selectedDoctor.departmentName || selectedDoctor.specialization || "Chuyên khoa"}</p>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={() => navigate('/dashboard/available-slots', { state: { prefillDoctorId: selectedDoctor.doctorId } })}
                      className="w-full sm:w-auto bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold py-2.5 px-6 rounded-xl transition-all shadow-sm text-xs"
                    >
                      Đặt lịch khám bác sĩ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">Học vị</p>
                      <p className="font-bold text-slate-800 text-xs">{selectedDoctor.degree || "Bác sĩ"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0A604E] flex items-center justify-center shrink-0">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">Kinh nghiệm</p>
                      <p className="font-bold text-slate-800 text-xs">{selectedDoctor.yearsOfExperience || 0} năm</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Star size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase">Đánh giá</p>
                      <p className="font-bold text-slate-800 flex items-center gap-0.5 text-xs">4.9 <span className="text-slate-400 font-medium text-[9px]">(120+)</span></p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <FileText className="text-[#1DB896]" size={15} /> Giới thiệu chuyên môn
                    </h3>
                    <div className="text-slate-600 font-semibold leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                      {selectedDoctor.yearOfBirth && <p className="mb-1"><span className="font-bold text-[#0A604E] mr-1">Sinh năm:</span> {selectedDoctor.yearOfBirth}</p>}
                      {selectedDoctor.hometown && <p className="mb-2"><span className="font-bold text-[#0A604E] mr-1">Quê quán:</span> {selectedDoctor.hometown}</p>}
                      {selectedDoctor.biography ? (
                        <p>{selectedDoctor.biography}</p>
                      ) : (
                        <p>Bác sĩ {selectedDoctor.fullName} là một chuyên gia tận tâm trong lĩnh vực {selectedDoctor.departmentName || "y tế"}. Với nhiều năm kinh nghiệm công tác và nghiên cứu lâm sàng, bác sĩ luôn ưu tiên sự an toàn và chăm sóc chu đáo tốt nhất cho sức khỏe của từng bệnh nhân.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <ThumbsUp className="text-blue-500" size={15} /> Chỉ số hiệu quả khám chữa bệnh
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                        <div className="text-lg font-black text-blue-600">98%</div>
                        <div className="text-[10px] font-bold text-[#4A5D59]">Bệnh nhân phản hồi hài lòng</div>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                        <div className="text-lg font-black text-emerald-600">1,500+</div>
                        <div className="text-[10px] font-bold text-[#4A5D59]">Số lượt khám hoàn tất</div>
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
