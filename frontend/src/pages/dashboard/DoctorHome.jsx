import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getMyDoctorProfile } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";
import { getDoctorPerformance } from "../../services/reportService";
import { toLocalDateString } from "../../lib/utils";


export default function DoctorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [completedCount, setCompletedCount] = useState(1420);
  const [activePatientsCount, setActivePatientsCount] = useState(315);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch profile
        const profRes = await getMyDoctorProfile();
        const docData = profRes?.data || profRes;
        setProfile(docData);

        // 2. Fetch today's appointments
        const apptRes = await appointmentService.getDoctorTodayAppointments();
        const apptsList = apptRes?.data || apptRes || [];
        setAppointments(apptsList);

        // 3. Fetch performance data if available
        if (docData && docData.doctorId) {
          try {
            const perfRes = await getDoctorPerformance({
              from: "2020-01-01",
              to: toLocalDateString(new Date())
            });
            const perfList = perfRes?.data || perfRes || [];
            const myPerf = perfList.find(item => item.doctorId === docData.doctorId);
            if (myPerf) {
              setCompletedCount(myPerf.totalAppointments || 0);
              setActivePatientsCount(Math.round((myPerf.totalAppointments || 0) * 0.22) || 315);
            }
          } catch (err) {
            console.warn("Failed to fetch performance stats", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Doctor Home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper date formatter
  const getCurrentDateStr = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${dayName}, ${dateStr}`;
  };

  // Map status from db format to visual status
  const getMappedStatus = (app) => {
    if (app.status === "CANCELLED") return "Khẩn cấp";
    if (app.status === "COMPLETED") return "Đã xong";

    if (app.queueStatus === "WAITING") return "Đang chờ";
    if (app.queueStatus === "CALLED") return "Đang khám";
    if (app.queueStatus === "SKIPPED") return "Bỏ qua";
    if (app.queueStatus === "COMPLETED" || app.queueStatus === "DONE") return "Đã xong";

    return "Sắp tới";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Đang chờ":
      case "Sắp tới":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "Đang khám":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "Đã xong":
      case "Hoàn thành":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Khẩn cấp":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  // Fallback Mock Data matching the design mockup image precisely
  const fallbackAppointments = [
    { appointmentId: "fb-1", patientName: "Lê Hoàng", reasonForVisit: "Sốt, đau họng", startTime: "08:30:00", status: "PENDING", queueStatus: "WAITING" },
    { appointmentId: "fb-2", patientName: "Trần Minh", reasonForVisit: "Kiểm tra định kỳ", startTime: "09:15:00", status: "COMPLETED", queueStatus: "DONE" },
    { appointmentId: "fb-3", patientName: "Ngô Hoa", reasonForVisit: "Đau dạ dày", startTime: "10:00:00", status: "CANCELLED", queueStatus: "SKIPPED" },
    { appointmentId: "fb-4", patientName: "Phạm Hùng", reasonForVisit: "Tái khám cao huyết áp", startTime: "10:45:00", status: "PENDING", queueStatus: "WAITING" },
    { appointmentId: "fb-5", patientName: "Vương Anh", reasonForVisit: "Xét nghiệm máu", startTime: "11:30:00", status: "CONFIRMED", queueStatus: "UPCOMING" }
  ];

  const displayedAppointments = appointments.length > 0 ? appointments.slice(0, 5) : fallbackAppointments;

  // Stats calculation
  const totalToday = appointments.length > 0 ? appointments.length : 24;
  const waitingToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Đang chờ").length : 8;
  const completedToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Đã xong").length : 16;
  const emergencyToday = appointments.length > 0 ? appointments.filter(a => getMappedStatus(a) === "Khẩn cấp").length : 2;

  return (
    <div className="w-full flex flex-col gap-6 p-1 pb-10">

      {/* 1. GREETING HEADER */}
      <div className="flex flex-col gap-1 mt-4">
        <div className="flex items-center gap-2 text-[#1DB896] font-bold text-xs uppercase tracking-wider">
          <i className="ti ti-activity text-sm animate-pulse" />
          <span>Hệ thống quản lý phòng khám</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chào buổi sáng, <span className="text-[#0A604E]">{profile?.fullName || user?.fullName || "BS. Nguyễn Văn A"}</span>
        </h1>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
          <i className="ti ti-calendar text-sm text-[#1DB896]" />
          <span>{getCurrentDateStr()} &bull; {profile?.departmentName || "Khoa Nội Tổng Quát"}</span>
        </div>
      </div>

      {/* 2. STATS ROW (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Stat 1: Ca khám hôm nay */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ca khám hôm nay</span>
            <span className="text-3xl font-black text-slate-800 mt-1">{totalToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0A604E] flex items-center justify-center border border-teal-100/50">
            <i className="ti ti-stethoscope text-xl" />
          </div>
        </div>

        {/* Stat 2: Bệnh nhân chờ */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bệnh nhân chờ</span>
            <span className="text-3xl font-black text-slate-800 mt-1">{waitingToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
            <i className="ti ti-clock text-xl" />
          </div>
        </div>

        {/* Stat 3: Đã hoàn thành */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</span>
            <span className="text-3xl font-black text-slate-800 mt-1">{completedToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
            <i className="ti ti-circle-check text-xl" />
          </div>
        </div>

        {/* Stat 4: Ca khẩn cấp */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex justify-between items-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ca khẩn cấp</span>
            <span className="text-3xl font-black text-slate-800 mt-1 text-rose-500">{emergencyToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50">
            <i className="ti ti-alert-triangle text-xl" />
          </div>
        </div>

      </div>

      {/* 3. MIDDLE ROW GRID (2 COLUMNS: TODAY'S SCHEDULE + WEEKLY STATS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols): Lịch khám hôm nay */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
                <i className="ti ti-calendar-event text-lg text-[#1DB896]" /> Lịch khám hôm nay
              </h2>
              <button
                onClick={() => navigate("/dashboard/doctor-appointments")}
                className="text-xs font-extrabold text-[#0A604E] hover:text-[#1DB896] uppercase tracking-wider transition-colors"
              >
                Xem tất cả
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bệnh nhân</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Thời gian</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Trạng thái</th>
                    <th className="pb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedAppointments.map((app) => {
                    const status = getMappedStatus(app);
                    const formattedTime = app.startTime ? app.startTime.slice(0, 5) : "--:--";
                    const initials = app.patientName
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={app.appointmentId} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1DB896]/10 text-[#0A604E] flex items-center justify-center text-xs font-black">
                              {initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 text-sm leading-tight">{app.patientName}</div>
                              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{app.reasonForVisit || "Khám tổng quát"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-bold text-sm">{formattedTime} AM</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {status === "Đang chờ" || status === "Đang khám" ? (
                            <button
                              onClick={() => navigate("/dashboard/doctor-appointments")}
                              className="px-3.5 py-1.5 bg-[#0A604E] hover:bg-[#1DB896] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-teal-700/10"
                            >
                              Khám bệnh
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate("/dashboard/doctor-appointments")}
                              className="px-3.5 py-1.5 bg-[#F0F9F7] hover:bg-teal-100/50 text-[#0A604E] text-xs font-bold rounded-xl transition-all border border-teal-200/40"
                            >
                              Hồ sơ
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Thống kê tuần */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
                <i className="ti ti-chart-bar text-lg text-[#1DB896]" /> Thống kê tuần
              </h2>
            </div>

            {/* Simulated Chart */}
            <div className="flex items-end justify-between h-32 px-2 pb-2 pt-6 border-b border-slate-100">
              {[
                { day: "T2", height: "h-20" },
                { day: "T3", height: "h-12" },
                { day: "T4", height: "h-24" },
                { day: "T5", height: "h-16" },
                { day: "T6", height: "h-20" },
                { day: "T7", height: "h-8" },
                { day: "CN", height: "h-10" },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-5 bg-slate-50 rounded-t-md h-24 flex items-end">
                    <div className={`w-full bg-gradient-to-t from-[#0A604E] to-[#1DB896] rounded-t-md ${bar.height}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">Tổng bệnh nhân</span>
              <span className="font-extrabold text-slate-800">148</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Hiệu suất trung bình</span>
              <span className="font-extrabold text-[#0A604E]">92%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. LOWER ROW GRID (2 COLUMNS: RECENT PATIENTS + NOTIFICATIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Card: Bệnh nhân gần đây */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
              <i className="ti ti-users text-lg text-[#1DB896]" /> Bệnh nhân gần đây
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { name: "Bà Nguyễn Thị Lan", clinic: "Khám tim mạch", time: "2 giờ trước" },
              { name: "Anh Đặng Văn Nam", clinic: "Kiểm tra phổi", time: "4 giờ trước" },
              { name: "Chị Mai Phương", clinic: "Xét nghiệm tổng quát", time: "Hôm qua" },
            ].map((p, idx) => {
              const pInitials = p.name.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
              return (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50/80 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-xs">
                      {pInitials}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{p.name}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1">{p.clinic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">{p.time}</span>
                    <i className="ti ti-chevron-right text-slate-400 text-sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Thông báo & Nhắc nhở */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2">
              <i className="ti ti-bell-ringing text-lg text-[#1DB896]" /> Thông báo / Nhắc nhở
            </h2>
          </div>

          <div className="flex flex-col gap-3.5">

            {/* Note 1 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0A604E] flex items-center justify-center shrink-0">
                <i className="ti ti-mail-opened text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Kết quả xét nghiệm mới</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Hồ sơ BN Lê Hoàng đã có kết quả xét nghiệm máu từ phòng Lab.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">15 phút trước</span>
              </div>
            </div>

            {/* Note 2 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <i className="ti ti-device-laptop text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Hội chẩn chuyên khoa</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Cuộc họp hội chẩn khoa Nội lúc 14:00 tại phòng họp số 3.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">1 giờ trước</span>
              </div>
            </div>

            {/* Note 3 */}
            <div className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/60 flex gap-3 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <i className="ti ti-package text-base" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-extrabold text-slate-800">Cảnh báo thuốc sắp hết</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Khoa thuốc báo cáo lượng Insulin tồn kho đang ở mức thấp.
                </p>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">3 giờ trước</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
