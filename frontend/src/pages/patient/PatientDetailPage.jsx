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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Thông tin cơ bản */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <User size={20} className="text-teal-600" /> Thông tin cơ bản
        </h3>
        <div className="grid gap-4">
          <InfoRow label="Mã bệnh nhân" value={patient.patientCode} />
          <InfoRow label="Họ và tên" value={patient.fullName} bold />
          <InfoRow label="Giới tính" value={genderLabel(patient.gender)} />
          <InfoRow label="Ngày sinh" value={formatDate(patient.dateOfBirth)} />
          <InfoRow label="CCCD / CMND" value={patient.identityNumber} />
          <InfoRow label="Mã BHYT" value={patient.insuranceNumber} highlight />
        </div>
      </div>

      {/* Liên hệ */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Phone size={20} className="text-sky-600" /> Thông tin liên hệ
        </h3>
        <div className="grid gap-4">
          <InfoRow label="Số điện thoại" value={patient.phone} icon={<Phone size={16} />} />
          <InfoRow label="Email" value={patient.email} icon={<Mail size={16} />} />
          <InfoRow label="Địa chỉ" value={patient.address} icon={<MapPin size={16} />} />
          <div className="border-t border-slate-200/60 pt-4 mt-2">
            <p className="text-sm font-semibold text-slate-500 mb-3">Liên hệ khẩn cấp</p>
            <div className="grid gap-4">
              <InfoRow label="Người liên hệ" value={patient.emergencyContactName} />
              <InfoRow label="SĐT khẩn cấp" value={patient.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin y tế - full width */}
      <div className="md:col-span-2 bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Heart size={20} className="text-rose-500" /> Thông tin y tế
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
            <p className="text-sm font-semibold text-slate-500 mb-2">Nhóm máu</p>
            <p className="font-bold text-2xl text-rose-600">{patient.bloodType || "—"}</p>
          </div>
          <div className="md:col-span-2 bg-white/40 p-4 rounded-2xl border border-white/50">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Tiền sử dị ứng
            </p>
            <p className="text-slate-700 whitespace-pre-wrap">{patient.allergies || "Không có thông tin"}</p>
          </div>
          <div className="md:col-span-3 bg-white/40 p-4 rounded-2xl border border-white/50">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-teal-600" /> Tiền sử bệnh
            </p>
            <p className="text-slate-700 whitespace-pre-wrap">{patient.medicalHistory || "Không có thông tin"}</p>
          </div>
        </div>
      </div>

      {/* Tài khoản liên kết */}
      <div className="md:col-span-2 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white/60 backdrop-blur-xl p-5 rounded-3xl border border-sky-100 shadow-sm">
        <span className="text-sm font-medium text-slate-700">
          Tài khoản liên kết: {patient.userName ? <strong className="text-sky-700 ml-1 bg-sky-100 px-2 py-0.5 rounded-full">{patient.userName}</strong> : <em className="text-slate-400 ml-1">Không có</em>}
        </span>
        <span className="text-sm font-medium text-slate-500">
          Ngày tạo hồ sơ: {formatDate(patient.createdAt)}
        </span>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
      <MedicalHistory patientId={Number(patientId)} inline />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6 pb-6">
      {/* Page Header */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-white hover:bg-teal-50 hover:border-teal-100 text-slate-500 hover:text-teal-600 transition-all shadow-sm group"
          onClick={() => navigate("/dashboard/patients")}
          title="Quay lại danh sách"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            {patient.fullName || "Bệnh nhân"}
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
            <span className="bg-teal-100/50 text-teal-700 px-2 py-0.5 rounded-md font-bold">{patient.patientCode}</span>
            • {genderLabel(patient.gender)}
            {patient.dateOfBirth && ` • ${formatDate(patient.dateOfBirth)}`}
            {patient.phone && ` • ${patient.phone}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/50 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold text-sm transition-all border-b-2 ${
                isActive 
                  ? "border-teal-500 text-teal-700 bg-white/40" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/20"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "info" && renderInfoTab()}
        {activeTab === "history" && renderHistoryTab()}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold, highlight, icon }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm font-semibold text-slate-500 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </span>
      <span
        className={`text-sm ${
          bold ? "font-bold text-slate-800" : "font-medium text-slate-700"
        } ${highlight ? "text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
