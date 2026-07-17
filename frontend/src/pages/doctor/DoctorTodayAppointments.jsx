import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Play,
  SkipForward,
  Check,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FileSearch
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import queueService from "../../services/queueService";
import queueTicketService from "../../services/queueTicketService";
import { getMyDoctorProfile } from "../../services/doctorService";
import { getSchedules } from "../../services/scheduleService";
import { useToast } from "../../context/useToast.js";
import PatientRecordModal from "../../components/PatientRecordModal";

export default function DoctorTodayAppointments() {
  const toast = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Real-time timer and progress
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [progress, setProgress] = useState(0);

  // View patient history modal
  const [viewPatientId, setViewPatientId] = useState(null);

  // Helper date formatted in Vietnamese
  const getVietnameseDateString = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const d = new Date();
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthNum = d.getMonth() + 1;
    const yearNum = d.getFullYear();
    return `${dayName}, ${dateNum} Tháng ${monthNum}, ${yearNum}`;
  };

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let currentDoctor = doctor;
      if (!currentDoctor) {
        const docRes = await getMyDoctorProfile();
        currentDoctor = docRes?.data || docRes;
        setDoctor(currentDoctor);
      }

      if (currentDoctor && currentDoctor.doctorId) {
        // Fetch today's appointments for this doctor
        const appRes = await appointmentService.getDoctorTodayAppointments();
        setAppointments(appRes?.data || []);

        // Fetch today's queue tickets for this doctor
        const todayStr = new Date().toISOString().split("T")[0];
        const queueRes = await queueService.getQueue({
          date: todayStr,
          doctorId: currentDoctor.doctorId
        });
        setQueueTickets(queueRes?.data || []);

        const schedRes = await getSchedules({
          doctorId: currentDoctor.doctorId,
          workDate: todayStr
        });
        setTodaySchedules(schedRes?.data?.content || schedRes?.data || []);
      }
    } catch (err) {
      console.error(err);
      toast?.error(err, "Không thể tải danh sách khám");
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { shiftStart, shiftEnd } = useMemo(() => {
    let sH = 8, sM = 0;
    let eH = 17, eM = 0;

    if (todaySchedules && todaySchedules.length > 0) {
      const startTimes = todaySchedules.map(s => {
        if (!s.startTime) return 8 * 60;
        const parts = s.startTime.split(":");
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
      });
      const endTimes = todaySchedules.map(s => {
        if (!s.endTime) return 17 * 60;
        const parts = s.endTime.split(":");
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
      });

      const minStart = Math.min(...startTimes);
      const maxEnd = Math.max(...endTimes);

      sH = Math.floor(minStart / 60);
      sM = minStart % 60;
      eH = Math.floor(maxEnd / 60);
      eM = maxEnd % 60;
    }

    return { 
      shiftStart: { hour: sH, min: sM }, 
      shiftEnd: { hour: eH, min: eM } 
    };
  }, [todaySchedules]);

  // Real-time countdown timer & shift progress bar updater
  useEffect(() => {
    const updateTimeAndProgress = () => {
      const now = new Date();
      const endShift = new Date();
      endShift.setHours(shiftEnd.hour, shiftEnd.min, 0, 0);

      const diff = endShift - now;
      if (diff <= 0) {
        setTimeLeft("00:00:00");
      } else {
        const hrs = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setTimeLeft(`${hrs}:${mins}:${secs}`);
      }

      const startShift = new Date();
      startShift.setHours(shiftStart.hour, shiftStart.min, 0, 0);
      
      if (now < startShift) {
        setProgress(0);
      } else if (now > endShift) {
        setProgress(100);
      } else {
        const totalDuration = endShift - startShift;
        const elapsed = now - startShift;
        setProgress(Math.round((elapsed / totalDuration) * 100));
      }
    };

    updateTimeAndProgress();
    const timer = setInterval(updateTimeAndProgress, 1000);
    return () => clearInterval(timer);
  }, [shiftStart, shiftEnd]);

  // Queue actions
  const handleCall = async (id) => {
    try {
      await queueService.callPatient(id);
      toast?.success("Đã gọi khám bệnh nhân!");
      fetchData();
    } catch (err) {
      toast?.error(err, "Gọi khám thất bại");
    }
  };

  const handleSkip = async (id) => {
    try {
      await queueService.skipPatient(id);
      toast?.success("Đã bỏ qua lượt bệnh nhân.");
      fetchData();
    } catch (err) {
      toast?.error(err, "Không thể bỏ qua");
    }
  };

  const handleComplete = async (id) => {
    try {
      await queueService.completePatient(id);
      toast?.success("Đã hoàn tất ca khám!");
      fetchData();
    } catch (err) {
      toast?.error(err, "Không thể hoàn tất ca khám");
    }
  };

  const handleExamine = async (id) => {
    try {
      const res = await queueTicketService.startExamination(id);
      toast?.success("Bắt đầu khám thành công!");
      if (res.data?.consultationId) {
        navigate(`/dashboard/examination/${res.data.consultationId}`);
      }
    } catch (err) {
      toast?.error(err, "Không thể bắt đầu khám");
    }
  };

  // Group tickets by queueStatus
  const calledTicket = queueTickets.find(t => t.queueStatus === "CALLED" || t.queueStatus === "IN_EXAMINATION");
  const waitingTickets = queueTickets.filter(t => t.queueStatus === "WAITING" || t.queueStatus === "SKIPPED");
  const completedTickets = queueTickets.filter(t => t.queueStatus === "COMPLETED" || t.queueStatus === "DONE");

  // Stats calculation
  const totalCount = queueTickets.length;
  const completedCount = completedTickets.length;
  const remainingCount = waitingTickets.length + (calledTicket ? 1 : 0);

  return (
    <div className="w-full flex flex-col gap-6 p-1">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/50 flex items-center justify-center shrink-0">
            <Clock className="text-[#0A604E] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Ca trực hôm nay</h1>
            <p className="text-slate-500 font-bold text-xs mt-0.5">{getVietnameseDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/doctor-schedule")}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-655 font-bold text-xs tracking-wider transition-all"
          >
            Lịch sử ca trực
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-xs tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            LÀM MỚI
          </button>
        </div>
      </div>

      {/* Top Shift Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Progress Timer Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm col-span-1 lg:col-span-2 flex flex-col gap-3 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">THỜI GIAN CÒN LẠI</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black tracking-wide">
              ĐANG DIỄN RA
            </span>
          </div>

          <div className="text-3xl font-black text-slate-800 font-mono tracking-wider">
            {timeLeft}
          </div>

          {/* Shift progress bar */}
          <div className="mt-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
              <span>{String(shiftStart.hour).padStart(2, '0')}:{String(shiftStart.min).padStart(2, '0')}</span>
              <span>SHIFT PROGRESS: {progress}%</span>
              <span>{String(shiftEnd.hour).padStart(2, '0')}:{String(shiftEnd.min).padStart(2, '0')}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1DB896] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Patients Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all duration-300">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">TỔNG BỆNH NHÂN</span>
          <div className="text-4xl font-black text-slate-800 tracking-tight">
            {totalCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
            +12% so với hôm qua
          </span>
        </div>

        {/* Examined vs Remaining Status */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm grid grid-cols-2 divide-x divide-slate-150 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col justify-between pr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ĐÃ KHÁM</span>
            <div className="text-4xl font-black text-[#1DB896] tracking-tight">{completedCount}</div>
          </div>
          <div className="flex flex-col justify-between pl-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CÒN LẠI</span>
            <div className="text-4xl font-black text-slate-800 tracking-tight">{remainingCount}</div>
          </div>
        </div>
      </div>

      {/* 3 Column Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">

        {/* Column 1: ĐANG KHÁM */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">ĐANG KHÁM</h3>
          </div>

          {calledTicket ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-[#1DB896] rounded-xl font-black text-sm">
                  STT {String(calledTicket.queueNumber).padStart(3, '0')}
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  BẮT ĐẦU: {calledTicket.startTime ? calledTicket.startTime.slice(0, 5) : "14:15"}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-[#0A604E] tracking-tight">{calledTicket.patientName}</h4>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  {calledTicket.patientPhone ? `SĐT: ${calledTicket.patientPhone}` : "Nam • 45 tuổi"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">LÝ DO KHÁM</span>
                <p className="text-xs text-slate-655 font-bold leading-relaxed">
                  {calledTicket.reasonForVisit || "Đau tức ngực trái kéo dài, khó thở khi vận động mạnh trong 2 ngày qua."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewPatientId(calledTicket.patientId)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <FileSearch size={14} />
                  Hồ sơ cũ
                </button>

                {calledTicket.queueStatus === "IN_EXAMINATION" ? (
                  <button
                    onClick={() => {
                      if (calledTicket.consultationId) {
                        navigate(`/dashboard/examination/${calledTicket.consultationId}`);
                      } else {
                        handleExamine(calledTicket.queueTicketId);
                      }
                    }}
                    className="flex-1 py-3 bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Tiếp tục khám
                  </button>
                ) : (
                  <button
                    onClick={() => handleExamine(calledTicket.queueTicketId)}
                    className="flex-1 py-3 bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Bắt đầu khám
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-250 border-dashed rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                <Activity size={18} className="text-slate-400" />
              </div>
              <div>
                <strong className="block text-xs text-slate-700">Trống phòng khám</strong>
                <span className="block text-[10px] text-slate-400 mt-0.5">Hiện chưa có ca khám nào đang diễn ra</span>
              </div>
              {waitingTickets.length > 0 && (
                <button
                  onClick={() => handleCall(waitingTickets[0].queueTicketId)}
                  className="px-4 py-2 bg-[#0A604E] hover:bg-[#1DB896] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Gọi khám ca tiếp theo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Column 2: CHỜ TIẾP THEO */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              CHỜ TIẾP THEO ({waitingTickets.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {waitingTickets.length === 0 ? (
              <div className="bg-white border-2 border-slate-250 border-dashed rounded-3xl p-6 text-center text-slate-400 text-xs font-bold">
                Không có bệnh nhân nào trong hàng chờ
              </div>
            ) : (
              waitingTickets.map((ticket, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 hover:border-slate-350 rounded-2xl p-4 shadow-sm transition-all group flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        {String(ticket.queueNumber).padStart(3, '0')}
                      </span>
                      <strong className="text-sm font-extrabold text-slate-800">{ticket.patientName}</strong>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {ticket.startTime ? ticket.startTime.slice(0, 5) : "14:30"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-bold truncate">
                    {ticket.reasonForVisit || "Tái khám định kỳ cao huyết áp..."}
                  </p>

                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCall(ticket.queueTicketId)}
                      className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-extrabold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 border border-sky-100/50"
                    >
                      <Play size={10} /> Gọi khám
                    </button>

                    <button
                      onClick={() => handleSkip(ticket.queueTicketId)}
                      className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 border border-rose-100/50"
                    >
                      <SkipForward size={10} /> Bỏ qua
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: HOÀN THÀNH */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              HOÀN THÀNH ({completedTickets.length})
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {completedTickets.length === 0 ? (
              <div className="bg-white border-2 border-slate-250 border-dashed rounded-3xl p-6 text-center text-slate-400 text-xs font-bold">
                Chưa có ca khám nào hoàn thành hôm nay
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {completedTickets.slice(0, 5).map((ticket, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                        <div className="flex flex-col">
                          <strong className="text-xs font-extrabold text-slate-800">{ticket.patientName}</strong>
                          <span className="text-[9px] text-slate-400 font-bold">
                            STT: {String(ticket.queueNumber).padStart(3, '0')} • Xong lúc {ticket.endTime ? ticket.endTime.slice(0, 5) : "14:05"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewPatientId(ticket.patientId)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-655 transition-colors"
                        title="Xem bệnh án"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {completedTickets.length > 5 && (
                  <button
                    onClick={() => toast?.info("Đang hiển thị 5 bệnh nhân hoàn thành gần nhất.")}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-655 font-extrabold text-[10px] rounded-xl text-center transition-all border border-slate-200/50 mt-1"
                  >
                    Xem tất cả {completedTickets.length} bệnh nhân
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Patient Record Modal (Full History) */}
      {viewPatientId && (
        <PatientRecordModal
          patientId={viewPatientId}
          onClose={() => setViewPatientId(null)}
        />
      )}
    </div>
  );
}
