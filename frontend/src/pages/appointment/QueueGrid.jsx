import React from "react";
import { Clock, LockKeyhole, User, CheckCircle2, UserCheck, Stethoscope, AlertCircle } from "lucide-react";

function getDynamicTimeRows(schedules) {
  let minMinutes = 7 * 60; // Default 07:00
  let maxMinutes = 21 * 60; // Default 21:00

  if (schedules && schedules.length > 0) {
    const startTimes = schedules.map(s => {
      const [h, m] = (s.startTime || "").split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    });
    const endTimes = schedules.map(s => {
      const [h, m] = (s.endTime || "").split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    });
    const actMin = Math.min(...startTimes.filter(t => t > 0));
    const actMax = Math.max(...endTimes.filter(t => t > 0));
    
    if (actMin < minMinutes && actMin > 0) minMinutes = Math.floor(actMin / 30) * 30;
    if (actMax > maxMinutes) maxMinutes = Math.ceil(actMax / 30) * 30;
  }

  const rows = [];
  const limit = Math.min(maxMinutes, 1440 - 30);
  for (let t = minMinutes; t <= limit; t += 30) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    rows.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return rows;
}

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

export default function QueueGrid({ doctors, schedules, slotsBySchedule, onSlotClick, onSlotRightClick, selectedSlotId }) {
  const columns = doctors;
  const TIME_ROWS = React.useMemo(() => getDynamicTimeRows(schedules), [schedules]);

  const boardRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  const handleMouseDown = (e) => {
    // Only drag if left click and not clicking directly on a interactive button
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    if (boardRef.current) {
      scrollLeft.current = boardRef.current.scrollLeft;
      boardRef.current.style.cursor = 'grabbing';
      boardRef.current.dataset.dragged = "false";
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (boardRef.current) boardRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (boardRef.current) boardRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !boardRef.current) return;
    const x = e.clientX;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      boardRef.current.dataset.dragged = "true";
    }
    boardRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Helper to count available slots per doctor
  const getAvailableCountForDoctor = (doctorId) => {
    const docSchedules = schedules.filter(s => s.doctorId === doctorId);
    let count = 0;
    docSchedules.forEach(sched => {
      const slots = slotsBySchedule[sched.scheduleId] || [];
      count += slots.filter(st => st.status === "AVAILABLE").length;
    });
    return count;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Legend & Grid Header Bar */}
      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 m-0 flex items-center gap-2">
              Sơ đồ lịch khám ca làm việc
              <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                {columns.length} Bác sĩ
              </span>
            </h3>
            <p className="text-[11px] font-medium text-slate-500 m-0">
              Nhấp chuột trái để chọn ca trống · Nhấp chuột phải vào ca để Chặn/Mở ca
            </p>
          </div>
        </div>

        {/* Color Legend Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trống (Khả dụng)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Đã đặt</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80">
            <LockKeyhole size={11} />
            <span>Bị chặn</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Chưa tạo lịch</span>
          </div>
        </div>
      </div>

      {/* Grid Matrix View with Sticky Headers & Frozen Time Column */}
      {columns.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="text-sm font-bold text-slate-700">Chưa có lịch làm việc trong ngày đã chọn</div>
          <div className="text-xs text-slate-500 max-w-sm mx-auto">
            Vui lòng chọn ngày khác trên bộ lọc hoặc kiểm tra lại phân công lịch trực bác sĩ.
          </div>
        </div>
      ) : (
        <div 
          ref={boardRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="relative max-h-[calc(100vh-270px)] min-h-[500px] overflow-auto select-none cursor-grab bg-slate-50/40 custom-scrollbar"
        >
          <table className="w-full border-collapse text-left min-w-max">
            <thead>
              <tr>
                {/* Frozen Top-Left Corner Header */}
                <th className="sticky top-0 left-0 z-40 bg-slate-100/95 backdrop-blur border-b border-r border-slate-200/90 p-3 text-center min-w-[80px] w-[80px] shadow-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">GIỜ \ BS</div>
                </th>

                {/* Sticky Doctor Columns Headers */}
                {columns.map((doctor) => {
                  const availableCount = getAvailableCountForDoctor(doctor.doctorId);
                  return (
                    <th 
                      key={doctor.doctorId}
                      className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-r border-slate-200/90 p-3 min-w-[200px] w-[200px] shadow-xs transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        <div className="flex items-center gap-1.5 max-w-full">
                          <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-[11px] font-black shrink-0 border border-teal-200/60">
                            {doctor.fullName?.charAt(0) || "D"}
                          </div>
                          <span className="font-extrabold text-xs text-slate-800 truncate" title={doctor.fullName}>
                            {doctor.fullName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-bold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-100">
                            {doctor.doctorCode || `BS${doctor.doctorId}`}
                          </span>
                          <span className={`font-semibold ${availableCount > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                            {availableCount > 0 ? `${availableCount} ca trống` : "Hết ca"}
                          </span>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {TIME_ROWS.map((time) => (
                <tr key={time} className="hover:bg-slate-100/30 transition-colors">
                  {/* Sticky Time Slot Left Label */}
                  <td className="sticky left-0 z-30 bg-slate-50/95 backdrop-blur border-b border-r border-slate-200/90 p-2 text-center text-xs font-black text-slate-500 shadow-xs">
                    {time}
                  </td>

                  {/* Doctor Slots Cells */}
                  {columns.map((doctor) => {
                    const doctorSchedules = schedules.filter((schedule) => schedule.doctorId === doctor.doctorId);
                    const schedule = doctorSchedules.find(
                      (item) => formatTime(item.startTime) <= time && formatTime(item.endTime) > time
                    );

                    if (!schedule) {
                      return (
                        <td key={doctor.doctorId} className="border-b border-r border-slate-200/50 p-1.5 bg-slate-50/20">
                          <div className="h-11 rounded-xl border border-dashed border-slate-200/60 bg-transparent flex items-center justify-center text-[10px] font-medium text-slate-300">
                            —
                          </div>
                        </td>
                      );
                    }

                    const slots = slotsBySchedule[schedule.scheduleId] || [];
                    const slot = slots.find((item) => formatTime(item.startTime) === time);
                    const status = slot?.status || "UNKNOWN";
                    const isSelected = selectedSlotId && slot && (slot.slotId === selectedSlotId || slot.id === selectedSlotId);

                    return (
                      <td key={doctor.doctorId} className="border-b border-r border-slate-200/60 p-1.5 bg-white/40">
                        {status === "AVAILABLE" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (boardRef.current?.dataset.dragged === "true") {
                                e.preventDefault();
                                return;
                              }
                              onSlotClick(doctor, schedule, slot);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (slot) onSlotRightClick(slot);
                            }}
                            className={`group relative w-full h-11 px-3 rounded-xl border flex items-center justify-between text-xs transition-all duration-200 ${
                              isSelected
                                ? "bg-teal-600 text-white font-black border-teal-600 ring-2 ring-teal-500/40 shadow-md scale-[1.01] z-10"
                                : "bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 border-emerald-200/80 hover:border-emerald-400 shadow-2xs cursor-pointer"
                            }`}
                            title={`Nhấp để chọn ca ${formatTime(slot?.startTime)} - ${formatTime(slot?.endTime)}`}
                          >
                            <span className="font-extrabold flex items-center gap-1.5">
                              {isSelected ? <CheckCircle2 size={14} className="text-white animate-bounce" /> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {formatTime(slot?.startTime)}
                            </span>

                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-emerald-200/60 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white"
                            }`}>
                              {isSelected ? "Đang chọn" : "Chọn ca"}
                            </span>
                          </button>
                        ) : status === "BOOKED" || status === "LOCKED" ? (
                          <div
                            className="w-full h-11 px-3 rounded-xl bg-sky-50/80 border border-sky-200/80 text-sky-800 flex items-center justify-between text-xs font-bold cursor-not-allowed"
                            title="Ca khám đã có bệnh nhân đặt"
                          >
                            <span className="flex items-center gap-1.5">
                              <UserCheck size={13} className="text-sky-600" />
                              {formatTime(slot?.startTime)}
                            </span>
                            <span className="text-[10px] bg-sky-200/70 text-sky-900 px-2 py-0.5 rounded-md">
                              Đã đặt
                            </span>
                          </div>
                        ) : status === "BLOCKED" ? (
                          <button
                            type="button"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (slot) onSlotRightClick(slot);
                            }}
                            className="w-full h-11 px-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-center justify-between text-xs font-bold hover:bg-amber-100/80 transition-colors"
                            title="Chuột phải để mở lại ca khám"
                          >
                            <span className="flex items-center gap-1.5 text-amber-800">
                              <LockKeyhole size={13} className="text-amber-600" />
                              {formatTime(slot?.startTime)}
                            </span>
                            <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
                              Bị chặn
                            </span>
                          </button>
                        ) : (
                          <div className="w-full h-11 px-3 rounded-xl bg-slate-100/60 border border-slate-200/50 text-slate-400 flex items-center justify-between text-xs font-medium cursor-not-allowed">
                            <span>{formatTime(slot?.startTime || time)}</span>
                            <span className="text-[10px]">Hết giờ</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
