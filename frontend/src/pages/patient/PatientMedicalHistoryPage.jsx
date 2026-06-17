import { useEffect, useState } from "react";
import { History, ArrowLeft, User, Heart, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyPatientProfile } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";
import PageHeader from "../../components/PageHeader";

const TABS = [
  { id: "overview", label: "Tổng quan", icon: User },
  { id: "history", label: "Lịch sử khám", icon: History },
];

export default function PatientMedicalHistoryPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getMyPatientProfile();
        if (res.data?.patientId) {
          setPatient(res.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (err.response?.status === 404 || err.message.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message || "Không thể tải thông tin bệnh nhân.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const genderLabel = (g) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    return "Khác";
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
      {/* Thông tin cơ bản */}
      <div className="patient-glass-card p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <User size={20} className="text-teal-600" /> Thông tin Hành chính
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

      {/* Thông tin y tế */}
      <div className="patient-glass-card p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Heart size={20} className="text-rose-500" /> Hồ sơ Sức khỏe
        </h3>
        <div className="flex flex-col gap-6">
          <div className="bg-white/40 p-4 rounded-2xl border border-white/50 shadow-sm flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Nhóm máu</span>
            <span className="font-bold text-2xl text-rose-600">{patient.bloodType || "—"}</span>
          </div>
          <div className="bg-white/40 p-4 rounded-2xl border border-white/50 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Tiền sử dị ứng
            </p>
            <p className="text-slate-700 font-medium whitespace-pre-wrap">{patient.allergies || "Chưa ghi nhận"}</p>
          </div>
          <div className="bg-white/40 p-4 rounded-2xl border border-white/50 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-teal-600" /> Tiền sử bệnh lý (bệnh nền)
            </p>
            <p className="text-slate-700 font-medium whitespace-pre-wrap">{patient.medicalHistory || "Chưa ghi nhận"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] w-[95%] mx-auto flex flex-col items-center">
      <PageHeader
        title="Hồ sơ Bệnh án"
        icon={History}
        iconColor="text-teal-400"
        subtitle={notFound ? <span className="text-rose-300">Tài khoản của bạn chưa được liên kết với hồ sơ.</span> : "Xem tổng quan sức khỏe và lịch sử các lần khám bệnh."}
        onBack={() => navigate("/dashboard", { state: { activeClusterId: "records" } })}
      />

      <div className="w-full max-w-[1100px] mx-auto mb-10">
        {loading ? (
          <div className="text-center py-10 text-white/50 font-medium">Đang tải hồ sơ...</div>
        ) : notFound ? (
          <div className="text-center py-10 text-rose-400 font-medium">Không tìm thấy hồ sơ bệnh án.</div>
        ) : (
          <>
            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Tabs Navigation */}
            <div className="flex gap-2 mb-6">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-all border shadow-sm ${
                      isActive 
                        ? "border-teal-400 text-teal-800 bg-teal-50" 
                        : "border-white/20 text-white/80 bg-white/10 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "history" && (
              <div className="patient-glass-card p-6 md:p-8">
                <MedicalHistory patientId={patient.patientId} inline={true} isPatientView={true} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold, highlight }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-black/5 last:border-0">
      <span className="text-[14px] font-semibold text-slate-500">{label}</span>
      <span
        className={`text-[15px] ${
          bold ? "font-bold text-slate-800" : "font-medium text-slate-700"
        } ${highlight ? "text-teal-800 bg-teal-100 px-3 py-1 rounded-full text-xs font-black" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
