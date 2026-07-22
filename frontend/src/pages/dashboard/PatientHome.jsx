import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CalendarPlus,
  Clock3,
  FileText,
  MapPin,
  Activity,
  Users,
  Hash,
  UserCheck,
  Stethoscope,
  TestTube,
  Smile,
  Bone,
  HeartPulse
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import appointmentService from "../../services/appointmentService.js";
import queueService from "../../services/queueService.js";
import { getDoctors } from "../../services/doctorService.js";
import notificationService from "../../services/notificationService.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import DoctorDetailModal from "../../components/DoctorDetailModal";

import bookingCardImage from "../../assets/Icon/booking.png";
import profileCardImage from "../../assets/Icon/profile.png";
import clipboardDecoration from "../../assets/decorations/clipboard.png-removebg-preview.png";
import leafLeftDecoration from "../../assets/decorations/leaf-left.png";
import leafRightDecoration from "../../assets/decorations/leaf-right.png";
import stethoscopeDecoration from "../../assets/decorations/stethoscope-removebg-preview.png";
import stickyNoteDecoration from "../../assets/decorations/sticky-note-removebg-preview.png";

const doctors = [
  { name: "BS. Hoàng Minh", specialty: "Da liễu", detail: "Chăm sóc da và điều trị chuyên sâu", experience: "12+ năm kinh nghiệm" },
  { name: "BS. Lan Anh", specialty: "Nội khoa", detail: "Tận tâm trong từng lần thăm khám", experience: "8+ năm kinh nghiệm" },
  { name: "BS. Trần Quốc", specialty: "Tim mạch", detail: "Đồng hành cùng sức khỏe trái tim", experience: "12+ năm kinh nghiệm" },
  { name: "BS. Ngọc Mai", specialty: "Nhi khoa", detail: "Nhẹ nhàng với mọi mầm non", experience: "9+ năm kinh nghiệm" },
  { name: "BS. Kim Oanh", specialty: "Sản phụ khoa", detail: "Lắng nghe và thấu hiểu phụ nữ", experience: "10+ năm kinh nghiệm" },
];

const guides = [
  { title: "Đặt lịch khám", text: "Chọn bác sĩ và thời gian phù hợp", icon: CalendarPlus, tone: "text-emerald-700" },
  { title: "Theo dõi lịch hẹn", text: "Luôn nhớ lịch khám của bạn", icon: Clock3, tone: "text-sky-700" },
  { title: "Xem hồ sơ bệnh án", text: "Tra cứu lịch sử khám bệnh", icon: FileText, tone: "text-violet-700" },
  { title: "Tư vấn với AI", text: "Hỏi nhanh các vấn đề sức khỏe", icon: Bot, tone: "text-rose-700" },
];

const getStatusConfig = (status) => {
  switch (status) {
    case "PENDING_PAYMENT": return { label: "Chờ thanh toán", color: "bg-amber-50 text-amber-600" };
    case "CONFIRMED": return { label: "Đã xác nhận", color: "bg-sky-50 text-sky-600" };
    case "CHECKED_IN": return { label: "Đã tới viện", color: "bg-indigo-50 text-indigo-600" };
    case "COMPLETED": return { label: "Hoàn thành", color: "bg-emerald-50 text-emerald-600" };
    case "CANCELLED": return { label: "Đã hủy", color: "bg-rose-50 text-rose-600" };
    case "NO_SHOW": return { label: "Vắng mặt", color: "bg-slate-100 text-slate-600" };
    case "RESCHEDULED": return { label: "Đổi lịch", color: "bg-purple-50 text-purple-600" };
    default: return { label: "Sắp tới", color: "bg-orange-50 text-orange-600" };
  }
};

const APPOINTMENT_TABS = [
  { key: "upcoming", label: "Sắp tới" },
  { key: "history", label: "Lịch sử" },
  { key: "all", label: "Tất cả" },
];

const TERMINAL_APPOINTMENT_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"]);

const getAppointmentStartDate = (appointment) => {
  if (!appointment?.appointmentDate) return new Date(0);
  const startTime = appointment.startTime ? String(appointment.startTime).slice(0, 8) : "00:00:00";
  return new Date(`${appointment.appointmentDate}T${startTime}`);
};

const isUpcomingAppointment = (appointment, now = new Date()) => {
  if (TERMINAL_APPOINTMENT_STATUSES.has(appointment?.status)) return false;
  return getAppointmentStartDate(appointment) >= now;
};

const QUEUE_STATUS_CONFIG = {
  WAITING: { label: "Đang chờ", color: "text-sky-800", bg: "bg-sky-500/20", border: "border-sky-500/30" },
  CALLED: { label: "Đã được gọi", color: "text-amber-800", bg: "bg-amber-500/20", border: "border-amber-500/30" },
  IN_CONSULTATION: { label: "Đang khám", color: "text-purple-800", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  COMPLETED: { label: "Hoàn tất", color: "text-emerald-800", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
};

function DoctorAvatar({ index, className = "", src, doctorName }) {
  const isValidSrc = src && typeof src === "string" && src.trim() !== "" && src !== "null";
  const defaultName = doctorName || "Bác sĩ";
  if (isValidSrc) {
    return <img className={`object-cover ${className}`} src={src} alt={defaultName} />;
  }
  return (
    <span className={`inline-flex items-center justify-center bg-emerald-50 text-[#0A604E] ${className}`} title="Chưa có ảnh bác sĩ">
      <Stethoscope size={20} aria-label="Chưa có ảnh bác sĩ" />
    </span>
  );
}

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const patientName = user?.fullName || "Bệnh Nhân A";

  const [appointments, setAppointments] = useState([]);
  const [appointmentTab, setAppointmentTab] = useState("upcoming");
  const [doctorsList, setDoctorsList] = useState([]);
  const [queueData, setQueueData] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const result = await queueService.getMyQueueStatus();
      console.log("Queue status fetched:", result);
      setQueueData(result?.data ?? result);
    } catch (err) {
      console.error("Queue status error:", err);
      setQueueData(null);
    }
  }, []);

  const fetchHomeData = useCallback(async () => {
    try {
      const [apptsRes, docsRes, notifRes] = await Promise.all([
        appointmentService.getMyAppointments(null, 0, 50),
        getDoctors({ page: 0, size: 10, sortBy: 'yearsOfExperience', direction: 'DESC' }),
        notificationService.getNotifications(0, 3)
      ]);

      const apptsData = apptsRes.data?.content || apptsRes.content || apptsRes.data || [];
      setAppointments(apptsData);

      const docsData = docsRes.data?.content || docsRes.content || docsRes.data || [];
      setDoctorsList(docsData.length > 0 ? docsData : doctors); // fallback to mock if no doctors

      const notifData = notifRes.data?.content || notifRes.content || notifRes.data || [];
      setNotifications(notifData.slice(0, 3));
    } catch (err) {
      console.error("Failed to load home data", err);
      setDoctorsList(doctors); // fallback
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    fetchQueueStatus();
    
    // Setup STOMP WebSocket for real-time queue updates
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
      : "http://localhost:8080/ws-queue";

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/queue", (message) => {
          if (message.body === "QUEUE_UPDATED" || message.body === "CHECK_IN") {
            fetchQueueStatus();
          }
        });
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [fetchHomeData, fetchQueueStatus]);

  useEffect(() => {
    const refreshHome = () => {
      fetchHomeData();
      fetchQueueStatus();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshHome();
      }
    };

    window.addEventListener("appointment-updated", refreshHome);
    window.addEventListener("focus", refreshHome);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("appointment-updated", refreshHome);
      window.removeEventListener("focus", refreshHome);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchHomeData, fetchQueueStatus]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  }, []);

  useEffect(() => {
    const rail = carouselRef.current;
    if (!rail) return undefined;
    const updateActiveSlide = () => {
      const card = rail.querySelector("[data-doctor-card]");
      if (!card) return;
      setActiveSlide(Math.round(rail.scrollLeft / (card.getBoundingClientRect().width + 16)) % doctors.length);
    };
    rail.addEventListener("scroll", updateActiveSlide, { passive: true });
    return () => rail.removeEventListener("scroll", updateActiveSlide);
  }, []);

  const moveCarousel = (direction) => {
    const rail = carouselRef.current;
    const card = rail?.querySelector("[data-doctor-card]");
    if (!rail || !card) return;
    if (rail.scrollWidth <= rail.clientWidth + 2) {
      setCarouselOffset((offset) => (offset + direction + doctorsList.length) % doctorsList.length);
      setActiveSlide((slide) => (slide + direction + doctorsList.length) % doctorsList.length);
      return;
    }
    rail.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  const jumpToSlide = (index) => {
    const rail = carouselRef.current;
    const card = rail?.querySelector("[data-doctor-card]");
    if (!rail || !card) return;
    if (rail.scrollWidth <= rail.clientWidth + 2) {
      setCarouselOffset(index);
      setActiveSlide(index);
      return;
    }
    rail.scrollTo({ left: index * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  const groupedAppointments = useMemo(() => {
    const now = new Date();
    const normalized = [...appointments].sort((left, right) => getAppointmentStartDate(left) - getAppointmentStartDate(right));
    const upcoming = normalized.filter((appointment) => isUpcomingAppointment(appointment, now));
    const history = normalized
      .filter((appointment) => !isUpcomingAppointment(appointment, now))
      .sort((left, right) => getAppointmentStartDate(right) - getAppointmentStartDate(left));
    return {
      upcoming,
      history,
      all: [...upcoming, ...history],
    };
  }, [appointments]);

  const visibleAppointments = (groupedAppointments[appointmentTab] || []).slice(0, 4);
  const appointmentEmptyText = appointmentTab === "upcoming"
    ? "Bạn chưa có lịch hẹn sắp tới."
    : appointmentTab === "history"
      ? "Chưa có lịch sử lịch hẹn."
      : "Bạn chưa có lịch hẹn nào.";

  return (
    <div className="patient-home relative mx-auto w-full max-w-[1200px] pb-24 text-slate-800">
      <img src={stethoscopeDecoration} alt="" aria-hidden="true" className="pointer-events-none absolute -left-44 -top-7 hidden h-[210px] w-[210px] object-contain opacity-85 xl:block" />
      <img src={leafLeftDecoration} alt="" aria-hidden="true" className="pointer-events-none absolute -left-20 top-[230px] hidden h-[165px] w-auto object-contain opacity-75 xl:block" />
      <img src={leafRightDecoration} alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 top-[205px] hidden h-[190px] w-auto object-contain opacity-75 xl:block" />
      <section className="relative min-h-[164px] overflow-hidden px-4 pb-5 pt-5 md:px-[164px] md:pb-8 md:pt-8">
        <img src={stickyNoteDecoration} alt="" aria-hidden="true" className="pointer-events-none absolute right-12 -top-14 hidden h-[185px] w-[185px] rotate-[6deg] object-contain opacity-90 lg:block" />
        <div className="relative max-w-[680px] text-center md:text-left">
          <h1 className="text-3xl font-black tracking-[-0.035em] text-[#0F172A] md:text-[34px]">{greeting}, <span className="text-[#007D68]">{patientName}</span></h1>
          <p className="mt-1.5 text-sm text-slate-500 md:text-[15px]">Chúc bạn một ngày tuyệt vời và luôn giữ gìn sức khỏe! 💙</p>
        </div>
      </section>

      <section className="grid gap-5 px-1 md:grid-cols-2">
        {[
          { label: "Đặt lịch khám", image: bookingCardImage, path: "/dashboard/available-slots", scaleClass: "scale-[1.035] group-hover:scale-[1.055]" },
          { label: "Hồ sơ bệnh án", image: profileCardImage, path: "/dashboard/my-medical-history", scaleClass: "scale-[1.075] group-hover:scale-[1.095]" },
        ].map((item) => (
          <button key={item.label} type="button" aria-label={item.label} onClick={() => navigate(item.path)} className="group aspect-[1672/941] w-full overflow-hidden rounded-[24px] bg-white shadow-[0_10px_26px_rgba(22,78,65,.045)] transition duration-300 hover:-translate-y-1 hover:cursor-pointer hover:shadow-[0_18px_36px_rgba(22,78,65,.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007D68] focus-visible:ring-offset-2">
            <img src={item.image} alt={item.label} className={`h-full w-full object-cover transition duration-500 ${item.scaleClass}`} />
          </button>
        ))}
      </section>

      <section className="relative mt-5 rounded-[22px] border border-[#DDEDEA] bg-white px-6 py-5 shadow-[0_10px_26px_rgba(22,78,65,.035)] md:px-7">
        <img src={clipboardDecoration} alt="" aria-hidden="true" className="pointer-events-none absolute -right-[116px] top-12 hidden h-[155px] w-[155px] -rotate-[10deg] object-contain opacity-70 xl:block" />
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-[19px] font-black text-[#007D68]"><CalendarDays className="text-[#007D68]" size={20} /> Lịch hẹn của tôi</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Theo dõi lịch sắp tới, lịch đã qua và toàn bộ lịch hẹn ở cùng một nơi.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-emerald-100 bg-emerald-50/60 p-1">
              {APPOINTMENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAppointmentTab(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition ${appointmentTab === tab.key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-emerald-700"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={() => navigate("/dashboard/my-appointments")} className="text-sm font-bold text-[#007D68] hover:text-[#006955]">Xem tất cả <ArrowRight className="ml-1 inline" size={15} /></button>
          </div>
        </div>
        <div className="space-y-3">
          {visibleAppointments.length > 0 ? (
            visibleAppointments.map((appointment, index) => {
              const dateObj = new Date(appointment.appointmentDate);
              const weekday = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });
              const day = dateObj.getDate().toString().padStart(2, "0");
              const month = `Tháng ${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
              const time = appointment.startTime ? appointment.startTime.substring(0, 5) : "--:--";
              const conf = getStatusConfig(appointment.status);
              return (
                <div key={appointment.appointmentId || index} className="grid min-h-[72px] items-center gap-4 rounded-xl border border-[#E8F1EF] px-4 py-3 transition hover:border-emerald-100 hover:bg-[#F8FFFC] md:grid-cols-[145px_72px_1fr_1fr_auto_auto]">
                  <div className="border-r border-[#E8F1EF] pr-4"><p className="text-[11px] text-slate-500 capitalize">{weekday}</p><p className="text-xl font-black">{day} <span className="text-[11px] font-semibold text-slate-500">{month}</span></p></div>
                  <p className="text-[15px] font-black text-slate-800">{time}</p>
                  <div className="flex items-center gap-2"><DoctorAvatar index={index} doctorName={appointment.doctorName} className="h-10 w-10 rounded-full" src={appointment.doctorAvatar} /><div><p className="text-xs text-slate-400">Bác sĩ khám</p><p className="text-sm font-bold">BS. {appointment.doctorName}</p></div></div>
                  <p className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={15} className="text-emerald-600" /> {appointment.departmentName || "Phòng khám chung"}</p>
                  <span className={`w-max rounded-lg px-3 py-1.5 text-xs font-bold ${conf.color}`}>{conf.label}</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/appointments/${appointment.appointmentId}`)}
                    className="w-max rounded-xl border border-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Chi tiết
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[#DDEDEA] px-4 py-8 text-center text-sm font-semibold text-slate-500">{appointmentEmptyText}</div>
          )}
        </div>
      </section>

      {queueData && (
        <section className="mt-3 rounded-[22px] border border-[#BEE7DD] bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-[0_10px_26px_rgba(22,78,65,.05)] md:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <h2 className="mb-4 flex items-center gap-3 text-[19px] font-black text-[#007D68] cursor-pointer" onClick={() => navigate("/dashboard/queue-status")}>
            <Activity className="text-[#007D68]" size={20} /> Đang trong hàng đợi khám
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ml-2" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" onClick={() => navigate("/dashboard/queue-status")}>
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition">
              <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><Hash size={14} /> Số của bạn</span>
              <span className="text-4xl font-black text-teal-700">#{queueData.myQueueNumber}</span>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition">
              <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><Users size={14} /> Chờ phía trước</span>
              <span className={`text-4xl font-black ${queueData.patientsAhead === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {queueData.patientsAhead}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition">
              <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><Clock3 size={14} /> Thời gian chờ</span>
              <span className="text-4xl font-black text-purple-700">~{queueData.patientsAhead === 0 ? "0" : queueData.estimatedWaitMinutes}p</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition">
              <span className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><UserCheck size={14} /> Trạng thái</span>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${QUEUE_STATUS_CONFIG[queueData.queueStatus]?.bg} ${QUEUE_STATUS_CONFIG[queueData.queueStatus]?.color}`}>
                {QUEUE_STATUS_CONFIG[queueData.queueStatus]?.label || queueData.queueStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-emerald-700 mt-4 font-medium text-center">Bấm vào các ô trên để xem chi tiết hàng đợi trực tiếp</p>
        </section>
      )}

      <section className="relative mt-9 overflow-visible rounded-[24px] border border-[#BEE7DD] bg-gradient-to-b from-[#F6FFFC] via-white to-white px-8 py-9 md:px-10">
        <div className="pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-br-full border-b border-r border-[#DDEDEA]" />
        <div className="relative mx-auto max-w-3xl text-center"><p className="inline-flex rounded-full border border-[#DDEDEA] bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-[#007D68]">BÁC SĨ NỔI BẬT TẠI PHÒNG KHÁM</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#007D68] md:text-[34px]">Đội ngũ bác sĩ chuyên khoa</h2><p className="mt-2 text-[13px] text-slate-500">Đội ngũ giàu kinh nghiệm, tận tâm và được hàng ngàn bệnh nhân tin tưởng lựa chọn.</p></div>
        <button aria-label="Bác sĩ trước" onClick={() => moveCarousel(-1)} className="absolute -left-6 top-[54%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8F1EF] bg-white text-[#007D68] shadow-[0_8px_20px_rgba(22,78,65,.10)] transition hover:bg-[#007D68] hover:text-white lg:flex"><ArrowLeft size={20} /></button>
        <button aria-label="Bác sĩ tiếp theo" onClick={() => moveCarousel(1)} className="absolute -right-6 top-[54%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8F1EF] bg-white text-[#007D68] shadow-[0_8px_20px_rgba(22,78,65,.10)] transition hover:bg-[#007D68] hover:text-white lg:flex"><ArrowRight size={20} /></button>
        <div ref={carouselRef} className="relative mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {doctorsList.map((_, index) => { const doctor = doctorsList[(index + carouselOffset) % doctorsList.length]; return <article data-doctor-card key={`doc-${index}`} onClick={() => setSelectedDoctor(doctor)} className="cursor-pointer min-w-[220px] flex-1 snap-start rounded-2xl border border-[#E8F1EF] bg-white px-3 pb-4 pt-4 text-center shadow-[0_5px_14px_rgba(22,78,65,.035)] transition hover:-translate-y-1 hover:shadow-md md:min-w-[calc((100%-48px)/5)]"><DoctorAvatar index={(index + carouselOffset) % doctorsList.length} doctorName={doctor.fullName || doctor.name} src={doctor.avatarUrl} className="mx-auto h-[112px] w-[112px] rounded-t-[56px] rounded-b-[20px] bg-slate-50" /><span className="-mt-2 relative inline-flex rounded-full bg-[#E9FBF5] px-3 py-1 text-[10px] font-bold text-[#007D68]">{doctor.departmentName || doctor.specialty || "Bác sĩ"}</span><h3 className="mt-2 text-[13px] font-black text-slate-800">BS. {doctor.fullName || doctor.name}</h3><p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500 line-clamp-2">{doctor.biography || doctor.detail}</p><p className="mt-2 text-[10px] font-semibold text-[#007D68]">✳ {doctor.yearsOfExperience ? `${doctor.yearsOfExperience}+ năm kinh nghiệm` : doctor.experience}</p></article>; })}
        </div>
        <div className="mt-3 flex justify-center gap-2">{doctorsList.map((_, index) => <button key={`dot-${index}`} onClick={() => jumpToSlide(index)} aria-label={`Xem bác sĩ ${index + 1}`} className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-6 bg-emerald-600" : "w-2.5 bg-emerald-100 hover:bg-emerald-300"}`} />)}</div>
        <button onClick={() => navigate("/dashboard/our-doctors")} className="mx-auto mt-7 flex items-center gap-4 rounded-full bg-white py-2 pl-5 pr-3 text-sm font-bold text-emerald-800 shadow-md transition hover:-translate-y-0.5"><span>Xem tất cả bác sĩ</span><span className="flex -space-x-2">{doctorsList.slice(0, 4).map((doctor, index) => <DoctorAvatar key={index} index={index} doctorName={doctor.fullName || doctor.name} src={doctor.avatarUrl} className="h-7 w-7 rounded-full border-2 border-white" />)}</span><ArrowRight size={16} /></button>
      </section>

      <section className="relative mt-9 overflow-visible rounded-[24px] border border-[#BEE7DD] bg-gradient-to-b from-[#F6FFFC] via-white to-white px-8 py-9 md:px-10">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-[#DDEDEA] bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-[#007D68]">DỊCH VỤ NỔI BẬT</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#007D68] md:text-[34px]">Các Dịch Vụ Y Tế</h2>
          <p className="mt-2 text-[13px] text-slate-500">Đa dạng các dịch vụ khám, xét nghiệm và tầm soát với công nghệ hiện đại nhất.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {[
            { serviceName: "Khám Tổng quát", description: "Đánh giá toàn diện chức năng các cơ quan", price: 500000, icon: Stethoscope },
            { serviceName: "Nội soi Tiêu hóa", description: "Công nghệ NBI phóng đại không đau", price: 1200000, icon: Activity },
            { serviceName: "Xét nghiệm Máu", description: "Bộ 20 chỉ số cơ bản và nâng cao", price: 350000, icon: TestTube },
            { serviceName: "Siêu âm 4D", description: "Tầm soát dị tật thai nhi chính xác cao", price: 400000, icon: Smile },
            { serviceName: "Chụp X-Quang", description: "Hệ thống X-Quang kỹ thuật số liều thấp", price: 200000, icon: Bone },
            { serviceName: "Điện tim (ECG)", description: "Phát hiện sớm các bất thường về tim mạch", price: 150000, icon: HeartPulse }
          ].map((srv, i) => {
            const Icon = srv.icon;
            return (
              <div key={i} onClick={() => navigate('/dashboard/available-slots')} className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-[#E8F1EF] bg-white p-5 shadow-[0_5px_14px_rgba(22,78,65,.025)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 transition-colors group-hover:text-emerald-700">{srv.serviceName}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{srv.description}</p>
                  <p className="mt-2 text-sm font-black text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(srv.price)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-14"><h2 className="mb-5 text-2xl font-black text-[#007D68]">Hướng dẫn sử dụng nhanh</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{guides.map((guide, index) => { const Icon = guide.icon; return <article key={guide.title} className={`${guide.tone} rounded-2xl border border-[#DDEDEA] bg-white p-5 shadow-[0_8px_20px_rgba(22,78,65,.035)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md`}><div className="mb-5 flex items-center justify-between"><span className="text-2xl font-black opacity-40">{index + 1}</span><Icon size={22} /></div><h3 className="font-black text-slate-800">{guide.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{guide.text}</p></article>; })}</div></section>

      <section className="mt-14 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(22,78,65,.05)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-black text-emerald-800"><Bell size={20} /> Thông báo</h2>
            <button onClick={() => navigate("/dashboard/notifications")} className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition">Xem tất cả</button>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notice, index) => (
                <div key={notice.notificationId || notice.id || index} className="flex gap-3 py-4">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notice.isRead ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{notice.title || notice.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {notice.createdAt ? new Date(notice.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "Mới đây"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm font-medium text-slate-400">Không có thông báo mới nào</div>
            )}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(22,78,65,.05)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-black text-emerald-800"><Bot size={20} /> Trợ lý y tế AI</h2>
            <button onClick={() => navigate("/dashboard/ai-chat")} className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition">Mở chat</button>
          </div>
          <div className="mt-5 text-sm text-slate-600 leading-relaxed bg-[#F0F9F7] p-5 rounded-xl border border-[#1DB896]/10 h-[calc(100%-48px)] flex flex-col justify-between">
            <div>
              <p className="mb-3 font-semibold text-slate-700">Bạn không biết nên đăng ký khám chuyên khoa nào? Đừng lo, hãy để Trợ lý AI của chúng tôi giúp bạn!</p>
              <ul className="space-y-2.5 list-disc list-inside text-[13px]">
                <li>Mô tả chi tiết triệu chứng (VD: "tôi bị đau đầu, buồn nôn, chóng mặt...")</li>
                <li>AI sẽ tự động phân tích và chẩn đoán bệnh sơ bộ</li>
                <li>Gợi ý chính xác chuyên khoa và bác sĩ phù hợp nhất</li>
              </ul>
            </div>
            <button onClick={() => navigate("/dashboard/ai-chat")} className="mt-6 w-full bg-[#007D68] hover:bg-[#006955] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,125,104,0.2)]">
              <Bot size={18} /> Nhắn tin với AI ngay
            </button>
          </div>
        </article>
      </section>
      <DoctorDetailModal 
        selectedDoctor={selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
      />
    </div>
  );
}
