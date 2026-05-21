import { useState, useEffect, useCallback } from "react";
import { Clock, Search, CalendarDays, ArrowLeft, ShieldAlert } from "lucide-react";
import { getAvailableSlots, lockSlot, releaseLock } from "../../services/scheduleService";

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

export default function AvailableSlots() {
  const [doctorId, setDoctorId] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStep, setBookingStep] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  useEffect(() => {
    if (!bookingStep || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingStep, timer]);

  useEffect(() => {
    if (isExpired) {
      const timeout = setTimeout(() => {
        setBookingStep(false);
        setSelectedSlot(null);
        setIsExpired(false);
        if (doctorId && workDate) {
          fetchSlots(doctorId, workDate);
        }
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [isExpired, doctorId, workDate, fetchSlots]);

  const handleSelectSlot = async (slot: TimeSlot) => {
    if (slot.status === "LOCKED" || slot.status === "BOOKED") return;
    try {
      await lockSlot(slot.slotId);
      setSelectedSlot(slot);
      setBookingStep(true);
      setTimer(600);
      setIsExpired(false);
      setBookingSuccess(false);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      alert(apiMsg || "Ca khám này đã được người khác giữ chỗ. Vui lòng chọn ca khác.");
      if (doctorId && workDate) {
        fetchSlots(doctorId, workDate);
      }
    }
  };

  const handleCancelBooking = async () => {
    if (selectedSlot) {
      try {
        await releaseLock(selectedSlot.slotId);
      } catch (e) {
      }
    }
    setBookingStep(false);
    setSelectedSlot(null);
    setIsExpired(false);
    if (doctorId && workDate) {
      fetchSlots(doctorId, workDate);
    }
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert("Vui lòng điền đầy đủ họ tên và số điện thoại.");
      return;
    }
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingStep(false);
      setSelectedSlot(null);
      setPatientName("");
      setPatientPhone("");
      setVisitReason("");
      if (doctorId && workDate) {
        fetchSlots(doctorId, workDate);
      }
    }, 2000);
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const timeString = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarningTime = timer < 60;

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
            Chọn bác sĩ và ngày khám để xem danh sách các khung giờ còn trống và thực hiện đặt lịch.
          </p>
        </div>
      </div>

      {!bookingStep ? (
        <>
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
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
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
                  {slots.length} ca
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                {slots.map((slot) => {
                  const isLocked = slot.status === "LOCKED" || slot.status === "BOOKED";
                  return (
                    <button
                      key={slot.slotId}
                      disabled={isLocked}
                      onClick={() => handleSelectSlot(slot)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        border: isLocked ? "1.5px dashed #cbd5e1" : "1.5px solid #86efac",
                        background: isLocked ? "#f1f5f9" : "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                        color: isLocked ? "#94a3b8" : "#166534",
                        fontWeight: 700,
                        fontSize: "14px",
                        fontFamily: "monospace",
                        boxShadow: isLocked ? "none" : "0 1px 4px rgba(22, 101, 52, 0.08)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        cursor: isLocked ? "not-allowed" : "pointer",
                        animation: "fadeIn 0.2s ease",
                        opacity: isLocked ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isLocked) {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(22, 101, 52, 0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLocked) {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(22, 101, 52, 0.08)";
                        }
                      }}
                    >
                      <Clock size={13} />
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      {slot.status === "LOCKED" && " (Đang giữ)"}
                      {slot.status === "BOOKED" && " (Đã đặt)"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #dfe5ec",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "600px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            position: "relative",
            animation: "fadeIn 0.25s ease",
          }}
        >
          {isExpired && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255, 255, 255, 0.95)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                animation: "fadeIn 0.15s ease",
              }}
            >
              <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
                Phiên giữ chỗ đã hết hạn
              </h3>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "14px" }}>
                Đang tự động quay trở lại màn hình chọn ca khám...
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "16px",
            }}
          >
            <button
              onClick={handleCancelBooking}
              className="btn btn-secondary"
              style={{
                padding: "6px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
              }}
            >
              <ArrowLeft size={14} /> Quay lại
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: isWarningTime ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${isWarningTime ? "#fee2e2" : "#bbf7d0"}`,
                padding: "8px 14px",
                borderRadius: "8px",
                fontWeight: 700,
                color: isWarningTime ? "#ef4444" : "#15803d",
                fontSize: "15px",
                fontFamily: "monospace",
              }}
            >
              <Clock size={16} />
              <span>Thời gian giữ chỗ: {timeString}</span>
            </div>
          </div>

          {bookingSuccess ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "#15803d",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>
                Đặt lịch thành công!
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
                Hệ thống đang cập nhật trạng thái của ca khám...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitBooking}>
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Thông tin đặt lịch khám
              </h2>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Bác sĩ:</span>
                  <strong style={{ color: "#0f172a" }}>BS-{doctorId}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Ngày khám:</span>
                  <strong style={{ color: "#0f172a" }}>{workDate}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Khung giờ:</span>
                  <strong style={{ color: "#1e40af" }}>
                    {selectedSlot ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}` : ""}
                  </strong>
                </div>
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label htmlFor="bk-name">Họ tên Bệnh nhân</label>
                <input
                  type="text"
                  id="bk-name"
                  required
                  placeholder="Nhập đầy đủ họ tên bệnh nhân"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  disabled={isExpired}
                />
              </div>

              <div className="field" style={{ marginBottom: "16px" }}>
                <label htmlFor="bk-phone">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  id="bk-phone"
                  required
                  placeholder="Nhập số điện thoại liên hệ"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  disabled={isExpired}
                />
              </div>

              <div className="field" style={{ marginBottom: "18px" }}>
                <label htmlFor="bk-reason">Lý do khám bệnh</label>
                <textarea
                  id="bk-reason"
                  rows={3}
                  placeholder="Mô tả ngắn gọn lý do khám bệnh"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  disabled={isExpired}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #dfe5ec",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div className="field" style={{ marginBottom: "24px" }}>
                <label>Phương thức thanh toán</label>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 500, fontSize: "14px" }}>
                    <input
                      type="radio"
                      name="payment"
                      value="CASH"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                      disabled={isExpired}
                    />
                    Tiền mặt tại quầy
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 500, fontSize: "14px" }}>
                    <input
                      type="radio"
                      name="payment"
                      value="BANK"
                      checked={paymentMethod === "BANK"}
                      onChange={() => setPaymentMethod("BANK")}
                      disabled={isExpired}
                    />
                    Chuyển khoản qua ngân hàng
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isExpired}
                  style={{ flex: 1, padding: "12px" }}
                >
                  Xác nhận đặt lịch
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  className="btn btn-secondary"
                  disabled={isExpired}
                  style={{ padding: "12px" }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
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
