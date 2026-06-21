import React, { useState, useEffect } from "react";
import {
  CalendarDays, FileText, Activity, HeartPulse, Sparkles,
  UserCircle, CalendarPlus, ListOrdered, ArrowRight,
  ActivitySquare, Clock, AlertCircle, ChevronRight,
  QrCode, ShieldCheck, Stethoscope, FlaskConical,
  CreditCard, MessageSquare, Star, GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import appointmentService from "../../services/appointmentService.js";
import { getDoctors } from "../../services/doctorService.js";

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState("");
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loadingAppt, setLoadingAppt] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors({ page: 0, size: 3, status: "ACTIVE" });
      setDoctors(res?.data?.content || []);
    } catch {
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchUpcomingAppointment = async () => {
    try {
      const res = await appointmentService.getMyAppointments({ upcoming: true, size: 1 });
      const list = res?.data?.content || [];
      setUpcomingAppointment(list[0] || null);
    } catch {
    } finally {
      setLoadingAppt(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const statusBadge = (status) => {
    const map = {
      PENDING:   { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      CONFIRMED: { label: "Đã xác nhận",  cls: "bg-teal-50 text-teal-700 border-teal-200" },
      CHECKED_IN:{ label: "Đã check-in",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
      COMPLETED: { label: "Hoàn thành",   cls: "bg-slate-50 text-slate-600 border-slate-200" },
      CANCELLED: { label: "Đã hủy",       cls: "bg-red-50 text-red-600 border-red-200" },
    };
    const s = map[status] || { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  const quickActions = [
    { icon: CalendarPlus,    label: "Đặt lịch khám",       sub: "Chọn bác sĩ & khung giờ", to: "/dashboard/available-slots", color: "text-teal-600",  bg: "bg-teal-50",  border: "border-teal-100" },
    { icon: FileText,        label: "Hồ sơ bệnh án",       sub: "Lịch sử khám chữa bệnh",  to: "/dashboard/my-medical-history", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { icon: FlaskConical,    label: "Kết quả xét nghiệm",  sub: "Xem kết quả cận lâm sàng", to: "/dashboard/my-lab-results",  color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100" },
    { icon: ListOrdered,     label: "Bảng giá dịch vụ",    sub: "Xem chi phí dịch vụ y tế", to: "/dashboard/service-prices",  color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { icon: MessageSquare,   label: "Tư vấn AI",           sub: "Hỏi triệu chứng với AI",   to: "/dashboard/ai-chat",         color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
    { icon: CalendarDays,    label: "Lịch hẹn của tôi",    sub: "Quản lý cuộc hẹn",         to: "/dashboard/my-appointments", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  ];

  return (
    <div className="w-full min-h-full p-6 flex flex-col gap-6 relative"
      style={{
        background: "#f8fafc",
        backgroundImage: `
          radial-gradient(circle, rgba(13,148,136,0.07) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Subtle corner glow */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top right, rgba(13,148,136,0.06) 0%, transparent 70%)" }}
      />

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
            <HeartPulse size={13} />
            <span>Hệ thống Y tế Tiêu chuẩn</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()},{" "}
            <span className="text-teal-600">{user?.fullName ?? "Bệnh nhân"}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/available-slots")}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-[0_2px_8px_rgba(13,148,136,0.25)] hover:shadow-[0_0_20px_rgba(13,148,136,0.35)]"
        >
          <CalendarPlus size={16} />
          Đặt lịch khám
        </button>
      </div>

      {/* ── MAIN GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT — 8 cols */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">

          {/* UPCOMING APPOINTMENT CARD */}
          <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <CalendarDays size={15} className="text-teal-600" />
                Lịch hẹn sắp tới
              </div>
              <button
                onClick={() => navigate("/dashboard/my-appointments")}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                Xem tất cả <ChevronRight size={13} />
              </button>
            </div>

            {loadingAppt ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : upcomingAppointment ? (
              <div className="p-5 flex flex-col sm:flex-row gap-5">
                {/* Time block */}
                <div className="flex-shrink-0 bg-teal-50 border border-teal-100 rounded-lg px-6 py-4 flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-3xl font-bold text-teal-700 tabular-nums">
                    {String(upcomingAppointment.startTime || "").slice(0, 5) || "--:--"}
                  </span>
                  <span className="text-xs text-teal-600 font-medium mt-1">
                    {new Date(upcomingAppointment.appointmentDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(upcomingAppointment.status)}
                    {upcomingAppointment.queueNumber && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                        STT #{upcomingAppointment.queueNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-900 font-semibold text-base">
                    {upcomingAppointment.doctorName || "Bác sĩ chưa phân công"}
                  </div>
                  <div className="text-slate-500 text-sm">
                    Chuyên khoa: <span className="text-slate-700 font-medium">{upcomingAppointment.departmentName || "—"}</span>
                  </div>
                  {upcomingAppointment.initialSymptoms && (
                    <div className="text-slate-500 text-sm">
                      Lý do: <span className="text-slate-700">{upcomingAppointment.initialSymptoms}</span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex flex-col gap-2 justify-center">
                  <button
                    onClick={() => navigate("/dashboard/queue-status")}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-[0_0_16px_rgba(13,148,136,0.30)]"
                  >
                    <Activity size={14} />
                    Theo dõi hàng đợi
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/my-appointments")}
                    className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <CalendarPlus size={22} />
                </div>
                <div>
                  <p className="text-slate-700 font-semibold text-sm">Chưa có lịch hẹn nào sắp tới</p>
                  <p className="text-slate-400 text-xs mt-0.5">Đặt lịch khám để được chăm sóc sức khỏe kịp thời</p>
                </div>
                <button
                  onClick={() => navigate("/dashboard/available-slots")}
                  className="mt-1 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-[0_0_16px_rgba(13,148,136,0.30)]"
                >
                  Đặt lịch ngay <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* AI ASSISTANT */}
          <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Sparkles size={15} className="text-violet-500" />
                Trợ lý Sức khỏe AI
              </div>
              <button
                onClick={() => navigate("/dashboard/ai-chat")}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <Clock size={12} /> Lịch sử tư vấn <ChevronRight size={13} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-slate-600 text-sm mb-3">
                Mô tả triệu chứng của bạn, AI sẽ phân tích và đề xuất chuyên khoa phù hợp.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  "Tôi bị đau đầu kéo dài và buồn nôn vào buổi sáng",
                  "Trẻ em bị sốt cao 39 độ và nổi mẩn đỏ",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setAiQuery(s)}
                    className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md transition-colors text-left"
                  >
                    "{s}"
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiQuery.trim()) navigate("/dashboard/ai-chat", { state: { initialQuery: aiQuery } });
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Mô tả triệu chứng (VD: Tôi hay bị đau đầu, buồn nôn...)"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Hỏi AI
                </button>
              </form>

              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Lưu ý:</strong> Trợ lý AI chỉ mang tính tham khảo, KHÔNG thay thế chẩn đoán của bác sĩ.
                </p>
              </div>
            </div>
          </div>

          {/* FEATURED DOCTORS */}
          <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Stethoscope size={15} className="text-teal-600" />
                Đội ngũ Bác sĩ Chuyên khoa
              </div>
              <button
                onClick={() => navigate("/dashboard/doctors")}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                Xem tất cả <ChevronRight size={13} />
              </button>
            </div>

            <div className="p-4">
              {loadingDoctors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : doctors.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">Chưa có dữ liệu bác sĩ.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {doctors.map((doc) => (
                    <div
                      key={doc.doctorId}
                      className="border border-slate-100 rounded-lg p-4 hover:border-teal-200 hover:bg-teal-50/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                          {doc.avatarUrl ? (
                            <img src={doc.avatarUrl} alt={doc.fullName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <UserCircle size={22} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-800 font-semibold text-sm truncate">{doc.fullName}</p>
                          <p className="text-teal-600 text-xs truncate">{doc.departmentName || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {doc.degree && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-medium">
                            <GraduationCap size={11} /> {doc.degree}
                          </span>
                        )}
                        {doc.yearsOfExperience != null && (
                          <span className="text-xs text-slate-400">{doc.yearsOfExperience} năm KN</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate("/dashboard/available-slots", { state: { doctorId: doc.doctorId } })}
                        className="w-full text-center text-xs font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 hover:border-teal-300 hover:bg-teal-50 py-1.5 rounded-md transition-colors"
                      >
                        Đặt lịch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — 4 cols */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">

          {/* QUICK ACTIONS */}
          <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
              <span className="text-slate-700 font-semibold text-sm">Truy cập nhanh</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {quickActions.map(({ icon: Icon, label, sub, to, color, bg, border }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={`flex flex-col items-start p-3 rounded-lg border ${border} ${bg} hover:opacity-80 transition-opacity text-left group`}
                >
                  <div className={`w-8 h-8 rounded-md bg-white flex items-center justify-center ${color} mb-2 shadow-sm`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-xs font-semibold ${color} leading-tight`}>{label}</span>
                  <span className="text-xs text-slate-400 mt-0.5 leading-tight">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HEALTH TIPS */}
          <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <ShieldCheck size={14} className="text-teal-600" />
                Lời khuyên sức khỏe
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { tip: "Uống đủ 2 lít nước mỗi ngày", color: "bg-blue-100 text-blue-600" },
                { tip: "Ngủ đủ 7-8 giờ mỗi đêm",      color: "bg-indigo-100 text-indigo-600" },
                { tip: "Tập thể dục ít nhất 30 phút",  color: "bg-teal-100 text-teal-600" },
                { tip: "Khám định kỳ 6 tháng/lần",     color: "bg-amber-100 text-amber-600" },
              ].map(({ tip, color }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {i + 1}
                  </div>
                  <span className="text-slate-600 text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONTACT */}
          <div className="bg-teal-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1">
              <HeartPulse size={15} />
              Cần hỗ trợ khẩn cấp?
            </div>
            <p className="text-teal-100 text-xs mb-3">Liên hệ đường dây hỗ trợ bệnh nhân 24/7</p>
            <a
              href="tel:19001234"
              className="flex items-center justify-center gap-2 bg-white text-teal-700 font-bold text-sm py-2 rounded-lg hover:bg-teal-50 transition-colors"
            >
              📞 1900 1234
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
