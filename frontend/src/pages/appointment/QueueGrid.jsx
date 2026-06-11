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
    startX.current = e.pageX - boardRef.current.offsetLeft;
    scrollLeft.current = boardRef.current.scrollLeft;
    boardRef.current.style.cursor = 'grabbing';
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
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    boardRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div 
      className="appointment-resource-board" 
      ref={boardRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ 
        height: "calc(100vh - 230px)", 
        overflow: "auto",
        background: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)",
        padding: "16px",
        cursor: "grab"
      }}
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
              <div className="appointment-resource-head" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                borderRadius: "14px",
                color: "#0f766e",
                backdropFilter: "blur(8px)"
              }}>
                <strong style={{ fontSize: "14px", fontWeight: 800 }}>{doctor.fullName}</strong>
                <small style={{ color: "#64748b", fontWeight: 600 }}>{doctor.doctorCode}</small>
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
                    onClick={() => {
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
          <div className="appointment-resource-empty" style={{ 
            color: "#0f766e", 
            fontWeight: 700, 
            background: "rgba(255,255,255,0.8)", 
            padding: "20px 40px", 
            borderRadius: "16px", 
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.6)",
            margin: "40px auto",
            maxWidth: "max-content",
            textAlign: "center",
            fontSize: "15px"
          }}>
            Vui lòng chọn ngày có bác sĩ làm việc để hiển thị sơ đồ.
          </div>
        )}
      </div>
    </div>
  );
}
