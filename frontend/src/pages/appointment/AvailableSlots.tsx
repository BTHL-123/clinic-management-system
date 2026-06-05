import { useState, useEffect, useCallback } from "react";
import { Clock, Search, CalendarDays, ArrowLeft, ShieldAlert, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getAvailableSlots, getSchedules, lockSlot, releaseLock } from "../../services/scheduleService";
import { getDoctors } from "../../services/doctorService";
import appointmentService from "../../services/appointmentService";

interface TimeSlot {
  slotId: number;
  scheduleId: number;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorSchedule {
  scheduleId: number;
  doctorId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface DoctorOption {
  doctorId: number;
  fullName: string;
  departmentName?: string;
  doctorCode?: string;
  degree?: string;
  specialization?: string;
  status?: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

function formatTime(t: string): string {
  return String(t ?? "").slice(0, 5);
}

export default function AvailableSlots() {
  const [doctorId, setDoctorId] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<DoctorSchedule[]>([]);
  const [doctorFetchState, setDoctorFetchState] = useState<FetchState>("idle");
  const [doctorErrorMsg, setDoctorErrorMsg] = useState("");
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

  const location = useLocation();
  const prefillDepartmentName = (location.state as any)?.prefillDepartmentName;

  const today = new Date().toISOString().split("T")[0];

  const selectedDoctor = doctorOptions.find((doctor) => String(doctor.doctorId) === doctorId);

  const getDoctorScheduleText = (id: number) => {
    const schedules = scheduleOptions.filter((schedule) => schedule.doctorId === id);
    if (schedules.length === 0) return "";
    const first = schedules[0];
    const last = schedules[schedules.length - 1];
    const timeRange = `${formatTime(first.startTime)} - ${formatTime(last.endTime)}`;
    return schedules.length === 1 ? timeRange : `${timeRange}, ${schedules.length} lịch`;
  };

  const getDoctorLabel = (doctor?: DoctorOption) => {
    if (!doctor) return "";
    const code = doctor.doctorCode || `BS-${doctor.doctorId}`;
    return `${code} - ${doctor.fullName}`;
  };

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
    let isActive = true;

    const fetchDoctorsByDate = async () => {
      setDoctorId("");
      setSlots([]);
      setFetchState("idle");
      setSelectedSlot(null);
      setBookingStep(false);

      if (!workDate) {
        setDoctorOptions([]);
        setScheduleOptions([]);
        setDoctorFetchState("idle");
        setDoctorErrorMsg("");
        return;
      }

      setDoctorFetchState("loading");
      setDoctorErrorMsg("");
      try {
        const [scheduleJson, doctorJson]: any[] = await Promise.all([
          getSchedules({ fromDate: workDate, toDate: workDate, status: "AVAILABLE" }),
          getDoctors({ page: 0, size: 200, status: "ACTIVE", sortBy: "doctorId", direction: "asc" }),
        ]);

        if (!isActive) return;

        const schedules: DoctorSchedule[] = Array.isArray(scheduleJson.data) ? scheduleJson.data : [];
        const doctors: DoctorOption[] = Array.isArray(doctorJson.data?.content) ? doctorJson.data.content : [];
        const scheduledDoctorIds = new Set(schedules.map((schedule) => schedule.doctorId));
        let availableDoctors = doctors.filter((doctor) => scheduledDoctorIds.has(doctor.doctorId));

        if (prefillDepartmentName) {
          availableDoctors = availableDoctors.filter((doctor) => doctor.departmentName === prefillDepartmentName);
        }

        setScheduleOptions(schedules);
        setDoctorOptions(availableDoctors);
        setDoctorFetchState("done");
      } catch (err: any) {
        if (!isActive) return;
        setDoctorOptions([]);
        setScheduleOptions([]);
        setDoctorErrorMsg(err.message || "Không thể tải danh sách bác sĩ có lịch.");
        setDoctorFetchState("error");
      }
    };

    fetchDoctorsByDate();

    return () => {
      isActive = false;
    };
  }, [workDate]);

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

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert("Vui lòng điền đầy đủ họ tên và số điện thoại.");
      return;
    }
    if (!selectedSlot) return;

    try {
      await appointmentService.bookAppointment({
        slotId: selectedSlot.slotId,
        reasonForVisit: visitReason,
        paymentMethod: paymentMethod
      });
      setBookingSuccess(true);
      window.dispatchEvent(new CustomEvent("notification-updated"));
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
    } catch (err: any) {
      const apiMsg = err.response?.data?.message || err.message;
      alert(apiMsg || "Đặt lịch thất bại. Vui lòng thử lại.");
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
            Chọn ngày khám, sau đó chọn bác sĩ có lịch làm việc trong ngày để xem các khung giờ còn trống.
          </p>
        </div>
      </div>

      {prefillDepartmentName && (
        <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", marginBottom: "16px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
          Đang lọc bác sĩ theo chuyên khoa AI đề xuất: <strong>{prefillDepartmentName}</strong>
        </div>
      )}

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
                gridTemplateColumns: "1fr",
                gap: "16px",
              }}
            >
              <div className="field">
                <label htmlFor="as-workDate">Ngày khám</label>
                <input
                  type="date"
                  id="as-workDate"
                  min={today}
                  value={workDate}
                  onChange={(e) => {
                    setWorkDate(e.target.value);
                    setDoctorId("");
                    setSlots([]);
                    setFetchState("idle");
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="as-doctorId">Bác sĩ có lịch trong ngày</label>
                <select
                  id="as-doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={!workDate || doctorFetchState === "loading" || doctorOptions.length === 0}
                >
                  <option value="">
                    {!workDate
                      ? "Chọn ngày khám trước"
                      : doctorFetchState === "loading"
                        ? "Đang tải bác sĩ..."
                        : doctorOptions.length === 0
                          ? "Không có bác sĩ phù hợp"
                          : "Chọn bác sĩ"}
                  </option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.doctorId} value={doctor.doctorId}>
                      {getDoctorLabel(doctor)}
                      {doctor.departmentName ? ` - ${doctor.departmentName}` : ""}
                      {getDoctorScheduleText(doctor.doctorId) ? ` (${getDoctorScheduleText(doctor.doctorId)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {doctorFetchState === "loading" && (
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
                Đang tìm bác sĩ có lịch làm việc trong ngày {workDate}...
              </div>
            )}

            {doctorFetchState === "error" && (
              <div className="error-box" style={{ marginTop: "16px" }}>
                {doctorErrorMsg}
              </div>
            )}

            {workDate && doctorFetchState === "done" && doctorOptions.length === 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Không có bác sĩ nào có lịch làm việc trong ngày này. Hãy chọn ngày khác.
              </div>
            )}

            {workDate && doctorOptions.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                {doctorOptions.map((doctor) => {
                  const isSelected = String(doctor.doctorId) === doctorId;
                  return (
                    <button
                      key={doctor.doctorId}
                      type="button"
                      onClick={() => setDoctorId(String(doctor.doctorId))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: isSelected ? "1.5px solid #0f766e" : "1px solid #dfe5ec",
                        background: isSelected ? "#f0fdfa" : "#ffffff",
                        color: "#1e293b",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <UserRound size={18} color={isSelected ? "#0f766e" : "#64748b"} />
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: "14px" }}>{getDoctorLabel(doctor)}</strong>
                          <span style={{ display: "block", fontSize: "12px", color: "#64748b" }}>
                            {[doctor.departmentName, doctor.specialization].filter(Boolean).join(" - ") || "Chưa có chuyên khoa"}
                          </span>
                        </span>
                      </span>
                      <span style={{ fontSize: "12px", color: "#0f766e", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {getDoctorScheduleText(doctor.doctorId)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDoctor && workDate && (
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
                Đang hiển thị ca khám của {getDoctorLabel(selectedDoctor)} vào ngày {workDate}
              </div>
            )}
          </div>

          {fetchState === "idle" && (!workDate || (doctorOptions.length > 0 && !doctorId)) && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#94a3b8",
              }}
            >
              <Search size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p style={{ margin: 0, fontSize: "15px" }}>
                {!workDate
                  ? "Vui lòng chọn ngày khám để hệ thống đề xuất bác sĩ có lịch làm việc."
                  : "Vui lòng chọn một bác sĩ trong danh sách đề xuất để xem ca trống."}
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
                Bác sĩ đã hết ca trống trong ngày này hoặc lịch đang được giữ chỗ tạm thời.
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
                  <strong style={{ color: "#0f172a" }}>{getDoctorLabel(selectedDoctor)}</strong>
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
