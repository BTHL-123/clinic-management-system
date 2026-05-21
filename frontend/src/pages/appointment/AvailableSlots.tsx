import { useState, useEffect, useCallback } from "react";
import { Clock, Search, CalendarDays, ArrowLeft, ShieldAlert, CheckCircle2 } from "lucide-react";
import { getAvailableSlots, lockSlot, releaseLock, createAppointment } from "../../services/scheduleService";

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div style={{
      padding: "11px 15px",
      borderRadius: "8px",
      marginBottom: "14px",
      fontSize: "13.5px",
      fontWeight: 500,
      background: isError ? "#fff0f0" : "#f0fdf4",
      border: `1px solid ${isError ? "#fca5a5" : "#86efac"}`,
      color: isError ? "#b91c1c" : "#15803d",
    }}>
      {message}
    </div>
  );
}

function formatTime(t: string): string {
  return String(t ?? "").slice(0, 5);
}

function getStatusLabel(status: string): string {
  if (status === "PENDING") return "Đang chờ duyệt";
  if (status === "APPROVED") return "Đã phê duyệt";
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "CANCELLED") return "Đã hủy";
  return status || "Thành công";
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
  const [patientEmail, setPatientEmail] = useState("");
  const [patientGender, setPatientGender] = useState("OTHER");
  const [patientDob, setPatientDob] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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
    if (!bookingStep || timer <= 0 || bookingSuccess) return;
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
  }, [bookingStep, timer, bookingSuccess]);

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
    setErrorMsg("");
    try {
      await lockSlot(slot.slotId);
      setSelectedSlot(slot);
      setBookingStep(true);
      setTimer(600);
      setIsExpired(false);
      setBookingSuccess(false);
      setBookingDetails(null);
      setFormError("");
      setFormSuccess("");
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      setErrorMsg(apiMsg || "Ca khám này đã được người khác giữ chỗ. Vui lòng chọn ca khác.");
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

  const handleCloseReceipt = () => {
    setBookingStep(false);
    setSelectedSlot(null);
    setBookingSuccess(false);
    setBookingDetails(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setPatientGender("OTHER");
    setPatientDob("");
    setVisitReason("");
    if (doctorId && workDate) {
      fetchSlots(doctorId, workDate);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!patientName.trim()) {
      setFormError("Họ tên bệnh nhân không được để trống.");
      return;
    }
    if (!patientPhone.trim()) {
      setFormError("Số điện thoại liên hệ không được để trống.");
      return;
    }
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const payload = {
        slotId: selectedSlot.slotId,
        fullName: patientName,
        phone: patientPhone,
        email: patientEmail.trim() || null,
        gender: patientGender,
        dateOfBirth: patientDob || null,
        reasonForVisit: visitReason,
        bookingType: "ONLINE"
      };
      const res: any = await createAppointment(payload);
      setBookingDetails(res.data);
      setFormSuccess("Đặt lịch thành công!");
      setBookingSuccess(true);
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message || "Đặt lịch thất bại.";
      setErrorMsg(apiMsg);
      setBookingStep(false);
      setSelectedSlot(null);
      if (doctorId && workDate) {
        fetchSlots(doctorId, workDate);
      }
    } finally {
      setIsSubmitting(false);
    }
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

          {errorMsg && (
            <div className="error-box" style={{ maxWidth: "600px", marginBottom: "20px" }}>
              {errorMsg}
            </div>
          )}

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

          {isError && !errorMsg && (
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

          {bookingSuccess ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <CheckCircle2 size={56} color="#10b981" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>
                Đặt lịch thành công!
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#64748b" }}>
                Biên lai thông tin chi tiết cuộc hẹn của bạn
              </p>

              <div style={{
                background: "#f0fdf4",
                border: "1px dashed #bbf7d0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "24px",
                display: "inline-block"
              }}>
                <span style={{ fontSize: "12px", color: "#15803d", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                  Mã lịch hẹn
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#166534", letterSpacing: "1px", marginTop: "4px" }}>
                  {bookingDetails?.appointmentCode || "---"}
                </div>
              </div>

              <div style={{
                borderTop: "2px dashed #e2e8f0",
                borderBottom: "2px dashed #e2e8f0",
                padding: "20px 0",
                marginBottom: "24px",
                textAlign: "left"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Bệnh nhân:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>{bookingDetails?.patientName || patientName}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Số điện thoại:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>{patientPhone}</strong>
                </div>
                {patientEmail && (
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>Email:</span>
                    <strong style={{ color: "#0f172a", fontSize: "14px" }}>{patientEmail}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Bác sĩ khám:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>BS-{bookingDetails?.doctorId || doctorId}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Ngày khám:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>{bookingDetails?.appointmentDate || workDate}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Khung giờ:</span>
                  <strong style={{ color: "#2563eb", fontSize: "14px" }}>
                    {bookingDetails ? `${formatTime(bookingDetails.startTime)} – ${formatTime(bookingDetails.endTime)}` : ""}
                  </strong>
                </div>
                {visitReason && (
                  <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>Lý do khám:</span>
                    <strong style={{ color: "#0f172a", fontSize: "14px", maxWidth: "250px", textAlign: "right" }}>{visitReason}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Thanh toán:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                    {paymentMethod === "CASH" ? "Tiền mặt tại quầy" : "Chuyển khoản ngân hàng"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Tiền cọc:</span>
                  <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                    {bookingDetails?.depositAmount ? `${Number(bookingDetails.depositAmount).toLocaleString("vi-VN")} VND` : "0 VND"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>Trạng thái:</span>
                  <span className="status-badge badge-active" style={{ fontSize: "12px", padding: "2px 8px" }}>
                    {getStatusLabel(bookingDetails?.status)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCloseReceipt}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px", fontWeight: 700 }}
              >
                Xác nhận &amp; Quay lại
              </button>
            </div>
          ) : (
            <>
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

              <form onSubmit={handleSubmitBooking}>
                <Toast message={formSuccess} type="success" />
                <Toast message={formError} type="error" />
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
                    disabled={isExpired || isSubmitting}
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
                    disabled={isExpired || isSubmitting}
                  />
                </div>

                <div className="field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="bk-email">Email bệnh nhân</label>
                  <input
                    type="email"
                    id="bk-email"
                    placeholder="Nhập địa chỉ email bệnh nhân (nếu có)"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    disabled={isExpired || isSubmitting}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="field">
                    <label htmlFor="bk-gender">Giới tính</label>
                    <select
                      id="bk-gender"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      disabled={isExpired || isSubmitting}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #dfe5ec",
                        fontSize: "14px",
                      }}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="bk-dob">Ngày sinh</label>
                    <input
                      type="date"
                      id="bk-dob"
                      value={patientDob}
                      onChange={(e) => setPatientDob(e.target.value)}
                      disabled={isExpired || isSubmitting}
                      max={today}
                    />
                  </div>
                </div>

                <div className="field" style={{ marginBottom: "18px" }}>
                  <label htmlFor="bk-reason">Lý do khám bệnh</label>
                  <textarea
                    id="bk-reason"
                    rows={3}
                    placeholder="Mô tả ngắn gọn lý do khám bệnh"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    disabled={isExpired || isSubmitting}
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
                        disabled={isExpired || isSubmitting}
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
                        disabled={isExpired || isSubmitting}
                      />
                      Chuyển khoản qua ngân hàng
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isExpired || isSubmitting}
                    style={{ flex: 1, padding: "12px" }}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="btn btn-secondary"
                    disabled={isExpired || isSubmitting}
                    style={{ padding: "12px" }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </>
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
