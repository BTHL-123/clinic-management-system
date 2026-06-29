import React from "react";
import { Clock, LockKeyhole, UnlockKeyhole } from "lucide-react";

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
  // Ensure we don't go beyond 24:00 (1440 minutes)
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

function slotStatusLabel(status) {
  if (status === "AVAILABLE") return "Trống";
  if (status === "BOOKED") return "Đã đặt";
  if (status === "LOCKED") return "Đang giữ";
  if (status === "BLOCKED") return "Bị chặn";
  if (status === "EXPIRED") return "Đã qua";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

export default function QueueGrid({ doctors, schedules, slotsBySchedule, onSlotClick, onSlotRightClick }) {
  const columns = doctors;
  const TIME_ROWS = React.useMemo(() => getDynamicTimeRows(schedules), [schedules]);

  const boardRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    scrollLeft.current = boardRef.current.scrollLeft;
    boardRef.current.style.cursor = 'grabbing';
    boardRef.current.dataset.dragged = "false";
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
    if (!isDragging.current) return;
    const x = e.clientX;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      boardRef.current.dataset.dragged = "true";
    }
    boardRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div 
      className="appointment-resource-board h-[calc(100vh-230px)] overflow-auto bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-4 cursor-grab" 
      ref={boardRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="appointment-resource-time-axis">
        <span />
        {TIME_ROWS.map((time) => <span key={time}>{time}</span>)}
      </div>
      <div className="appointment-resource-grid" style={{ "--doctor-columns": columns.length || 1 }}>
        {columns.map((doctor) => {
          const doctorSchedules = schedules.filter((schedule) => schedule.doctorId === doctor.doctorId);
          return (
            <div className="appointment-resource-column" key={doctor.doctorId}>
              <div className="appointment-resource-head flex flex-col items-center justify-center p-3 mb-2 bg-gradient-to-br from-white/90 to-white/60 border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-xl text-teal-700 backdrop-blur-sm">
                <strong className="text-sm font-extrabold">{doctor.fullName}</strong>
                <small className="text-slate-500 font-bold">{doctor.doctorCode}</small>
              </div>
              {TIME_ROWS.map((time) => {
                const schedule = doctorSchedules.find(
                  (item) => formatTime(item.startTime) <= time && formatTime(item.endTime) > time
                );
                
                if (!schedule) {
                  return <div className="appointment-resource-slot none" key={time}></div>;
                }

                const slots = slotsBySchedule[schedule.scheduleId] || [];
                const slot = slots.find((item) => formatTime(item.startTime) === time);
                const status = slot?.status || "UNKNOWN";
                
                // Color coding
                let statusClass = "";
                if (status === "AVAILABLE") statusClass = "available";
                else if (status === "BOOKED" || status === "LOCKED") statusClass = "booked";
                else if (status === "EXPIRED" || status === "BLOCKED" || status === "CANCELLED") statusClass = "blocked";

                return (
                  <button
                    type="button"
                    className={`appointment-resource-slot ${statusClass}`}
                    key={time}
                    onClick={(e) => {
                      if (boardRef.current?.dataset.dragged === "true") {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      if (status === "AVAILABLE") {
                        onSlotClick(doctor, schedule, slot);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (slot) {
                        onSlotRightClick(slot);
                      }
                    }}
                    title={`${formatTime(slot?.startTime || schedule.startTime)} - ${formatTime(slot?.endTime || schedule.endTime)}`}
                    style={{
                      cursor: status === "AVAILABLE" ? "pointer" : "default",
                      opacity: status === "EXPIRED" ? 0.6 : 1,
                    }}
                  >
                    <span>{slotStatusLabel(status)}</span>
                    {slot && (status === "AVAILABLE" || status === "BLOCKED") && (
                      <span
                        className="appointment-slot-toggle"
                        title={status === "BLOCKED" ? "Nhấp chuột phải để Mở lại" : "Nhấp chuột phải để Chặn"}
                      >
                        {status === "BLOCKED" ? <LockKeyhole size={12} color="#9a3412" /> : <Clock size={12} />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        {columns.length === 0 && (
          <div className="appointment-resource-empty text-teal-700 font-bold bg-white/80 px-10 py-5 rounded-2xl backdrop-blur-md shadow-lg border border-white/60 mx-auto my-10 max-w-max text-center text-[15px]">
            Vui lòng chọn ngày có bác sĩ làm việc để hiển thị sơ đồ.
          </div>
        )}
      </div>
    </div>
  );
}
