import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import appointmentService from "../../services/appointmentService.js";

const STATUS_CONFIG = {
  CONFIRMED:       { label: "Đã xác nhận",  color: "#0f766e", bg: "#f0fdf9" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#b45309", bg: "#fffbeb" },
  CHECKED_IN:      { label: "Đã check-in",  color: "#1d4ed8", bg: "#eff6ff" },
  COMPLETED:       { label: "Hoàn thành",   color: "#16a34a", bg: "#f0fdf4" },
  CANCELLED:       { label: "Đã hủy",       color: "#dc2626", bg: "#fef2f2" },
  NO_SHOW:         { label: "Vắng mặt",     color: "#7c3aed", bg: "#f5f3ff" },
  RESCHEDULED:     { label: "Đổi lịch",     color: "#0369a1", bg: "#f0f9ff" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#64748b", bg: "#f8fafc" };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "3px 10px",
      borderRadius: "20px", background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}22`,
    }}>
      {cfg.label}
    </span>
  );
}

function AppointmentCard({ appt }) {
  const date = appt.appointmentDate
    ? new Date(appt.appointmentDate).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";
  const time = appt.startTime ? appt.startTime.substring(0, 5) : "—";
  const endTime = appt.endTime ? appt.endTime.substring(0, 5) : "—";

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)", transition: "box-shadow 0.18s",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.05)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
            {appt.appointmentCode}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            Mã lịch hẹn
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div style={{ height: "1px", background: "#f1f5f9" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>NGÀY KHÁM</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{date}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>GIỜ KHÁM</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{time} – {endTime}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>LÝ DO KHÁM</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{appt.reasonForVisit || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: "2px" }}>HÌNH THỨC</div>
          <div style={{ fontSize: "13px", color: "#475569" }}>{appt.bookingType === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const icon = tab === "upcoming"
    ? <CalendarDays size={44} style={{ color: "#cbd5e1" }} />
    : <Clock size={44} style={{ color: "#cbd5e1" }} />;
  const msg = tab === "upcoming"
    ? "Bạn chưa có lịch hẹn sắp tới."
    : "Bạn chưa có lịch sử khám bệnh.";

  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: "#94a3b8" }}>
      {icon}
      <div style={{ marginTop: "14px", fontSize: "14px" }}>{msg}</div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "history" ? "history" : "upcoming";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const setTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    setPage(0);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const upcoming = tab === "upcoming" ? true : false;
    appointmentService
      .getMyAppointments(upcoming, page, pageSize)
      .then((res) => setData(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab, page]);

  const tabs = [
    { key: "upcoming", label: "Lịch hẹn sắp tới", icon: <CalendarDays size={16} /> },
    { key: "history",  label: "Lịch sử khám bệnh", icon: <Clock size={16} /> },
  ];

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
          Lịch hẹn của tôi
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
          Xem lịch hẹn sắp tới và tra cứu lịch sử khám bệnh của bạn.
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", border: "1.5px solid",
              transition: "all 0.15s",
              background: tab === t.key ? "#0f766e" : "#ffffff",
              color: tab === t.key ? "#ffffff" : "#475569",
              borderColor: tab === t.key ? "#0f766e" : "#e2e8f0",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
          padding: "14px 18px", color: "#dc2626", fontSize: "14px",
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.content?.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.content.map((appt) => (
                <AppointmentCard key={appt.appointmentId} appt={appt} />
              ))}
            </div>
          )}

          {data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.page === 0}
                style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px",
                  padding: "6px 10px", cursor: data.page === 0 ? "default" : "pointer",
                  opacity: data.page === 0 ? 0.4 : 1, display: "flex", alignItems: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Trang {data.page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                style={{
                  background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px",
                  padding: "6px 10px", cursor: data.last ? "default" : "pointer",
                  opacity: data.last ? 0.4 : 1, display: "flex", alignItems: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
