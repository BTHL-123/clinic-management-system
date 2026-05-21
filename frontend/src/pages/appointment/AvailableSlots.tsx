import { useState, useEffect, useCallback } from "react";
import { Clock, Search, CalendarDays } from "lucide-react";
import { getAvailableSlots } from "../../services/scheduleService";

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

function formatTime(t: string): string {
  return String(t ?? "").slice(0, 5);
}

function SlotTag({ slot }: { slot: TimeSlot }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 18px",
        borderRadius: "10px",
        border: "1.5px solid #86efac",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        color: "#166534",
        fontWeight: 700,
        fontSize: "14px",
        fontFamily: "monospace",
        boxShadow: "0 1px 4px rgba(22, 101, 52, 0.08)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
        animation: "fadeIn 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 14px rgba(22, 101, 52, 0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(22, 101, 52, 0.08)";
      }}
    >
      <Clock size={13} />
      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
    </div>
  );
}

export default function AvailableSlots() {
  const [doctorId, setDoctorId] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const fetchSlots = useCallback(async (did: string, date: string) => {
    setFetchState("loading");
    setErrorMsg("");
    setSlots([]);
    try {
      const json: any = await getAvailableSlots(Number(did), date);
      const data: TimeSlot[] = Array.isArray(json.data) ? json.data : [];
      setSlots(data);
      setFetchState("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối đến máy chủ.");
      setFetchState("error");
    }
  }, []);

  useEffect(() => {
    if (doctorId && workDate) {
      fetchSlots(doctorId, workDate);
    } else {
      setFetchState("idle");
      setSlots([]);
    }
  }, [doctorId, workDate, fetchSlots]);

  const hasResult = fetchState === "done";
  const isLoading = fetchState === "loading";
  const isError = fetchState === "error";

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Search size={24} />
            Tìm kiếm ca khám trống
          </h1>
          <p className="muted">
            Chọn bác sĩ và ngày khám để xem danh sách các khung giờ còn trống.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #dfe5ec",
          borderRadius: "12px",
          padding: "24px 28px",
          maxWidth: "600px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div className="field">
            <label htmlFor="as-doctorId">ID Bác sĩ</label>
            <input
              type="number"
              id="as-doctorId"
              min="1"
              placeholder="Nhập ID bác sĩ"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="as-workDate">Ngày khám</label>
            <input
              type="date"
              id="as-workDate"
              min={today}
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </div>
        </div>

        {doctorId && workDate && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#65758b",
            }}
          >
            <CalendarDays size={14} />
            Đang hiển thị ca khám của BS-{doctorId} vào ngày {workDate}
          </div>
        )}
      </div>

      {fetchState === "idle" && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#94a3b8",
          }}
        >
          <Search size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ margin: 0, fontSize: "15px" }}>
            Vui lòng nhập ID bác sĩ và chọn ngày khám để tìm ca trống.
          </p>
        </div>
      )}

      {isLoading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "24px 0",
            color: "#65758b",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2.5px solid #dfe5ec",
              borderTopColor: "#0f766e",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Đang tải danh sách ca khám...
        </div>
      )}

      {isError && (
        <div className="error-box" style={{ maxWidth: "600px" }}>
          {errorMsg}
        </div>
      )}

      {hasResult && slots.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            padding: "56px 20px",
            background: "#ffffff",
            border: "1px solid #dfe5ec",
            borderRadius: "12px",
            maxWidth: "600px",
          }}
        >
          <CalendarDays size={36} style={{ color: "#cbd5e1" }} />
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "15px",
              color: "#475569",
            }}
          >
            Hiện không có ca khám nào trống trong ngày này.
          </p>
          <p
            style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}
          >
            Bác sĩ này có thể chưa có lịch làm việc hoặc tất cả các ca đã được đặt.
          </p>
        </div>
      )}

      {hasResult && slots.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Các ca khám còn trống
            </h2>
            <span className="status-badge badge-active">
              {slots.length} ca trống
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {slots.map((slot) => (
              <SlotTag key={slot.slotId} slot={slot} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
