import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, History, Phone, Mail, MapPin, Heart, Shield, AlertTriangle } from "lucide-react";
import { getPatientById } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";

const TABS = [
  { id: "info", label: "Thông tin hành chính", icon: User },
  { id: "history", label: "Lịch sử bệnh án", icon: History },
];

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await getPatientById(patientId);
        setPatient(res.data);
        setError("");
      } catch (err) {
        setError(err.message || "Không thể tải thông tin bệnh nhân.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return <div className="page-header">Đang tải thông tin bệnh nhân...</div>;
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Chi tiết bệnh nhân</h1>
          </div>
          <button className="secondary-button" onClick={() => navigate("/dashboard/patients")}>
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
        <div className="error-box">{error}</div>
      </>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const genderLabel = (g) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    return "Khác";
  };

  const renderInfoTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Thông tin cơ bản */}
      <div style={{ background: "#f9fafb", padding: 20, borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <User size={18} /> Thông tin cơ bản
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          <InfoRow label="Mã bệnh nhân" value={patient.patientCode} />
          <InfoRow label="Họ và tên" value={patient.fullName} bold />
          <InfoRow label="Giới tính" value={genderLabel(patient.gender)} />
          <InfoRow label="Ngày sinh" value={formatDate(patient.dateOfBirth)} />
          <InfoRow label="CCCD / CMND" value={patient.identityNumber} />
          <InfoRow label="Mã BHYT" value={patient.insuranceNumber} highlight />
        </div>
      </div>

      {/* Liên hệ */}
      <div style={{ background: "#f9fafb", padding: 20, borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Phone size={18} /> Thông tin liên hệ
        </h3>
        <div style={{ display: "grid", gap: 12 }}>
          <InfoRow label="Số điện thoại" value={patient.phone} icon={<Phone size={14} />} />
          <InfoRow label="Email" value={patient.email} icon={<Mail size={14} />} />
          <InfoRow label="Địa chỉ" value={patient.address} icon={<MapPin size={14} />} />
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, marginTop: 4 }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Liên hệ khẩn cấp</p>
            <InfoRow label="Người liên hệ" value={patient.emergencyContactName} />
            <div style={{ marginTop: 8 }}>
              <InfoRow label="SĐT khẩn cấp" value={patient.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin y tế - full width */}
      <div style={{ gridColumn: "span 2", background: "#f9fafb", padding: 20, borderRadius: 10, border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={18} /> Thông tin y tế
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Nhóm máu</p>
            <p style={{ fontWeight: 600, fontSize: 16, color: "#dc2626" }}>{patient.bloodType || "—"}</p>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={13} /> Tiền sử dị ứng
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{patient.allergies || "Không có thông tin"}</p>
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <Shield size={13} /> Tiền sử bệnh
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{patient.medicalHistory || "Không có thông tin"}</p>
          </div>
        </div>
      </div>

      {/* Tài khoản liên kết */}
      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f9ff", padding: "12px 20px", borderRadius: 10, border: "1px solid #bae6fd" }}>
        <span style={{ fontSize: 14, color: "#0369a1" }}>
          Tài khoản liên kết: {patient.userName ? <strong>{patient.userName}</strong> : <em style={{ color: "#9ca3af" }}>Không có</em>}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Ngày tạo hồ sơ: {formatDate(patient.createdAt)}
        </span>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <MedicalHistory patientId={Number(patientId)} inline />
    </div>
  );

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            className="icon-button"
            onClick={() => navigate("/dashboard/patients")}
            title="Quay lại danh sách"
            style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              {patient.fullName || "Bệnh nhân"}
            </h1>
            <p className="muted">
              {patient.patientCode} · {genderLabel(patient.gender)}
              {patient.dateOfBirth && ` · ${formatDate(patient.dateOfBirth)}`}
              {patient.phone && ` · ${patient.phone}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                border: "none",
                borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                background: "none",
                color: isActive ? "#2563eb" : "#6b7280",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && renderInfoTab()}
      {activeTab === "history" && renderHistoryTab()}
    </>
  );
}

function InfoRow({ label, value, bold, highlight, icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
        {icon} {label}
      </span>
      <span
        style={{
          fontWeight: bold ? 600 : 400,
          color: highlight ? "#0f766e" : "#111827",
          fontSize: 14,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}
