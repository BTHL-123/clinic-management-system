import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import bookingCardImage from "../../assets/Icon/booking.png";
import profileCardImage from "../../assets/Icon/profile.png";
import clipboardDecoration from "../../assets/decorations/clipboard.png-removebg-preview.png";
import leafLeftDecoration from "../../assets/decorations/leaf-left.png";
import leafRightDecoration from "../../assets/decorations/leaf-right.png";
import stethoscopeDecoration from "../../assets/decorations/stethoscope-removebg-preview.png";
import stickyNoteDecoration from "../../assets/decorations/sticky-note-removebg-preview.png";

const doctorPhotos = [
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=420&q=85",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=420&q=85",
];

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

function DoctorAvatar({ index, className = "" }) {
  return <img className={`object-cover ${className}`} src={doctorPhotos[index % doctorPhotos.length]} alt="Bác sĩ" />;
}

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const patientName = user?.fullName || "Bệnh Nhân A";

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
      setCarouselOffset((offset) => (offset + direction + doctors.length) % doctors.length);
      setActiveSlide((slide) => (slide + direction + doctors.length) % doctors.length);
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
        <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-3 text-[19px] font-black text-[#007D68]"><CalendarDays className="text-[#007D68]" size={20} /> Lịch hẹn của tôi</h2><button onClick={() => navigate("/dashboard/my-appointments")} className="text-sm font-bold text-[#007D68] hover:text-[#006955]">Xem tất cả <ArrowRight className="ml-1 inline" size={15} /></button></div>
        <div className="space-y-3">
          {[{ weekday: "Thứ Hai", day: "22", month: "Tháng 04", time: "19:30", room: "Phòng Chẩn Đoán (Lầu)", doctor: "BS. Hoàng Minh", status: "Sắp tới", color: "bg-orange-50 text-orange-600" }, { weekday: "Thứ Tư", day: "01", month: "Tháng 07", time: "10:00", room: "Phòng khám 2 (Tim mạch)", doctor: "BS. Trần Quốc", status: "Đã xác nhận", color: "bg-sky-50 text-sky-600" }].map((appointment, index) => (
            <div key={appointment.time} className="grid min-h-[68px] items-center gap-4 rounded-xl border border-[#E8F1EF] px-4 py-3 transition hover:border-emerald-100 hover:bg-[#F8FFFC] md:grid-cols-[145px_72px_1fr_1fr_auto]">
              <div className="border-r border-[#E8F1EF] pr-4"><p className="text-[11px] text-slate-500">{appointment.weekday}</p><p className="text-xl font-black">{appointment.day} <span className="text-[11px] font-semibold text-slate-500">{appointment.month}</span></p></div>
              <p className="text-[15px] font-black text-slate-800">{appointment.time}</p>
              <div className="flex items-center gap-2"><DoctorAvatar index={index} className="h-10 w-10 rounded-full" /><div><p className="text-xs text-slate-400">Bác sĩ khám</p><p className="text-sm font-bold">{appointment.doctor}</p></div></div>
              <p className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={15} className="text-emerald-600" /> {appointment.room}</p>
              <span className={`w-max rounded-lg px-3 py-1.5 text-xs font-bold ${appointment.color}`}>{appointment.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[22px] border border-[#DDEDEA] bg-white p-5 shadow-[0_10px_26px_rgba(22,78,65,.035)] md:p-7">
        <h2 className="mb-4 flex items-center gap-3 text-[19px] font-black text-[#007D68]"><ClipboardList className="text-[#007D68]" size={20} /> Phiếu khám / Lịch hẹn sắp tới</h2>
        <div className="grid overflow-hidden rounded-xl border border-[#DDEDEA] bg-white md:grid-cols-[210px_1fr_auto]">
          <div className="bg-[#F3FFFB] px-6 py-5"><p className="text-xs font-bold uppercase tracking-wider text-[#007D68]">Thứ Năm, 22 Tháng 04</p><p className="mt-2 text-3xl font-black">19:30</p><p className="mt-1 text-sm text-slate-500">Phòng Chẩn Đoán (Lầu)</p></div>
          <div className="flex items-center gap-4 px-6 py-5"><DoctorAvatar index={0} className="h-14 w-14 rounded-2xl" /><div><p className="text-xs text-slate-400">Bác sĩ tư vấn</p><h3 className="font-black">BS. Hoàng Minh</h3><p className="mt-1 text-sm text-slate-500">Bác sĩ chuyên khoa Da liễu</p></div></div>
          <div className="flex items-center px-6 py-5"><button onClick={() => navigate("/dashboard/my-appointments")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50">Xem chi tiết <ChevronRight size={16} /></button></div>
        </div>
      </section>

      <section className="relative mt-9 overflow-visible rounded-[24px] border border-[#BEE7DD] bg-gradient-to-b from-[#F6FFFC] via-white to-white px-8 py-9 md:px-10">
        <div className="pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-br-full border-b border-r border-[#DDEDEA]" />
        <div className="relative mx-auto max-w-3xl text-center"><p className="inline-flex rounded-full border border-[#DDEDEA] bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-[#007D68]">BÁC SĨ NỔI BẬT TẠI PHÒNG KHÁM</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#007D68] md:text-[34px]">Đội ngũ bác sĩ chuyên khoa</h2><p className="mt-2 text-[13px] text-slate-500">Đội ngũ giàu kinh nghiệm, tận tâm và được hàng ngàn bệnh nhân tin tưởng lựa chọn.</p></div>
        <button aria-label="Bác sĩ trước" onClick={() => moveCarousel(-1)} className="absolute -left-6 top-[54%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8F1EF] bg-white text-[#007D68] shadow-[0_8px_20px_rgba(22,78,65,.10)] transition hover:bg-[#007D68] hover:text-white lg:flex"><ArrowLeft size={20} /></button>
        <button aria-label="Bác sĩ tiếp theo" onClick={() => moveCarousel(1)} className="absolute -right-6 top-[54%] z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8F1EF] bg-white text-[#007D68] shadow-[0_8px_20px_rgba(22,78,65,.10)] transition hover:bg-[#007D68] hover:text-white lg:flex"><ArrowRight size={20} /></button>
        <div ref={carouselRef} className="relative mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {doctors.map((_, index) => { const doctor = doctors[(index + carouselOffset) % doctors.length]; return <article data-doctor-card key={`${doctor.name}-${index}`} className="min-w-[220px] flex-1 snap-start rounded-2xl border border-[#E8F1EF] bg-white px-3 pb-4 pt-4 text-center shadow-[0_5px_14px_rgba(22,78,65,.035)] transition hover:-translate-y-1 hover:shadow-md md:min-w-[calc((100%-48px)/5)]"><DoctorAvatar index={(index + carouselOffset) % doctors.length} className="mx-auto h-[112px] w-[112px] rounded-t-[56px] rounded-b-[20px] bg-slate-50" /><span className="-mt-2 relative inline-flex rounded-full bg-[#E9FBF5] px-3 py-1 text-[10px] font-bold text-[#007D68]">{doctor.specialty}</span><h3 className="mt-2 text-[13px] font-black text-slate-800">{doctor.name}</h3><p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500">{doctor.detail}</p><p className="mt-2 text-[10px] font-semibold text-[#007D68]">✳ {doctor.experience}</p></article>; })}
        </div>
        <div className="mt-3 flex justify-center gap-2">{doctors.map((doctor, index) => <button key={doctor.name} onClick={() => jumpToSlide(index)} aria-label={`Xem bác sĩ ${index + 1}`} className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-6 bg-emerald-600" : "w-2.5 bg-emerald-100 hover:bg-emerald-300"}`} />)}</div>
        <button onClick={() => navigate("/dashboard/our-doctors")} className="mx-auto mt-7 flex items-center gap-4 rounded-full bg-white py-2 pl-5 pr-3 text-sm font-bold text-emerald-800 shadow-md transition hover:-translate-y-0.5"><span>Xem tất cả bác sĩ</span><span className="flex -space-x-2">{doctorPhotos.slice(0, 4).map((_, index) => <DoctorAvatar key={index} index={index} className="h-7 w-7 rounded-full border-2 border-white" />)}</span><ArrowRight size={16} /></button>
      </section>

      <section className="mt-14"><h2 className="mb-5 text-2xl font-black text-[#007D68]">Hướng dẫn sử dụng nhanh</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{guides.map((guide, index) => { const Icon = guide.icon; return <article key={guide.title} className={`${guide.tone} rounded-2xl border border-[#DDEDEA] bg-white p-5 shadow-[0_8px_20px_rgba(22,78,65,.035)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md`}><div className="mb-5 flex items-center justify-between"><span className="text-2xl font-black opacity-40">{index + 1}</span><Icon size={22} /></div><h3 className="font-black text-slate-800">{guide.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{guide.text}</p></article>; })}</div></section>

      <section className="mt-14 grid gap-5 lg:grid-cols-2"><article className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(22,78,65,.05)]"><div className="flex items-center justify-between"><h2 className="flex items-center gap-3 text-xl font-black text-emerald-800"><Bell size={20} /> Thông báo</h2><button onClick={() => navigate("/dashboard/notifications")} className="text-sm font-bold text-emerald-700">Xem tất cả</button></div><div className="mt-5 divide-y divide-slate-100">{["Phiếu khám Phòng Khám Nhi ngày 25/04 - 19:15", "Nhắc nhở tái khám da liễu định kỳ", "Cập nhật hồ sơ sức khỏe"].map((notice, index) => <div key={notice} className="flex gap-3 py-4"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" /><div><p className="text-sm font-bold">{notice}</p><p className="mt-1 text-xs text-slate-400">{index + 1} ngày trước</p></div></div>)}</div></article><article className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(22,78,65,.05)]"><h2 className="text-xl font-black text-emerald-800">Truy cập nhanh</h2><div className="mt-5 grid grid-cols-2 gap-3">{[["Thanh toán viện phí", "/dashboard/payments"], ["Bảo hiểm y tế", "/dashboard/profile"], ["Cài đặt hồ sơ", "/dashboard/profile"], ["Liên hệ hỗ trợ", "/dashboard/ai-chat"]].map(([label, path]) => <button key={label} onClick={() => navigate(path)} className="rounded-xl bg-slate-50 px-4 py-4 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800">{label}<ArrowRight className="float-right" size={16} /></button>)}</div></article></section>
    </div>
  );
}
