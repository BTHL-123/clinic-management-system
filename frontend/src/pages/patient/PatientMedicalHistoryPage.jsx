import { useEffect, useState } from "react";
import { History, ArrowLeft, User, Heart, Shield, AlertTriangle, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMyPatientProfile } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";

const TABS = [
  { id: "overview", label: "Tổng quan", icon: User },
  { id: "history", label: "Lịch sử khám", icon: History },
];

export default function PatientMedicalHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read initial tab from URL query params
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab");

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(tabParam || "overview");

  // Keep activeTab in sync with URL queries
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "overview" || tabParam === "history")) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const genderLabel = (g) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    return "Khác";
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
      {/* Thông tin Hành chính */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
        <h3 className="text-lg font-bold text-[#0A604E] mb-6 flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-[#F0F9F7] text-[#1DB896]">
            <User size={20} />
          </div>
          Thông tin Hành chính
        </h3>
        <div className="grid gap-1">
          <InfoRow label="Mã bệnh nhân" value={patient.patientCode} bold />
          <InfoRow label="Họ và tên" value={patient.fullName} bold textPrimary />
          <InfoRow label="Giới tính" value={genderLabel(patient.gender)} />
          <InfoRow label="Ngày sinh" value={formatDate(patient.dateOfBirth)} />
          <InfoRow label="CCCD / CMND" value={patient.identityNumber} />
          <InfoRow label="Mã BHYT" value={patient.insuranceNumber} highlight />
        </div>
      </div>

      {/* Thông tin y tế */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
        <h3 className="text-lg font-bold text-[#0A604E] mb-6 flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-500">
            <Heart size={20} />
          </div>
          Hồ sơ Sức khỏe Tổng quan
        </h3>
        <div className="flex flex-col gap-4">
          {/* Nhóm máu */}
          <div className="bg-[#F0F9F7]/65 hover:bg-[#F0F9F7] p-5 rounded-2xl border border-[#D1F2EB]/50 flex justify-between items-center transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-[#4A5D59]">Nhóm máu của bạn</span>
            </div>
            <span className="font-extrabold text-2xl text-rose-600 bg-rose-50 border border-rose-100 px-4 py-1.5 rounded-2xl shadow-sm">
              {patient.bloodType || "—"}
            </span>
          </div>

          {/* Dị ứng */}
          <div className="bg-[#F0F9F7]/65 hover:bg-[#F0F9F7] p-5 rounded-2xl border border-[#D1F2EB]/50 transition-all duration-300 shadow-sm">
            <p className="text-sm font-bold text-[#4A5D59] mb-2.5 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Tiền sử dị ứng
            </p>
            <div className={`p-3 rounded-xl text-sm font-medium ${
              patient.allergies 
                ? "bg-amber-50/50 border border-amber-100 text-amber-800" 
                : "bg-slate-50 text-slate-500 border border-slate-100"
            }`}>
              {patient.allergies || "Không có tiền sử dị ứng được ghi nhận"}
            </div>
          </div>

          {/* Tiền sử bệnh lý */}
          <div className="bg-[#F0F9F7]/65 hover:bg-[#F0F9F7] p-5 rounded-2xl border border-[#D1F2EB]/50 transition-all duration-300 shadow-sm">
            <p className="text-sm font-bold text-[#4A5D59] mb-2.5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#1DB896]" />
              Tiền sử bệnh lý (Bệnh nền)
            </p>
            <div className={`p-3 rounded-xl text-sm font-medium ${
              patient.medicalHistory 
                ? "bg-teal-50/30 border border-[#D1F2EB]/55 text-[#0A604E]" 
                : "bg-slate-50 text-slate-500 border border-slate-100"
            }`}>
              {patient.medicalHistory || "Chưa có ghi nhận bệnh lý nền"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8 pr-2">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#D1F2EB]">
              <History size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hồ sơ Bệnh án</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-medium ml-[52px]">
            {notFound 
              ? <span className="text-red-500">Tài khoản của bạn chưa được liên kết với hồ sơ bệnh án.</span>
              : "Xem tổng quan sức khỏe và lịch sử các lần khám bệnh."
            }
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB896]"></div>
          </div>
        ) : notFound ? (
          <div className="text-center py-12 text-red-500 font-bold bg-red-50/50 rounded-2xl border border-red-100">
            Không tìm thấy thông tin hồ sơ bệnh án liên kết.
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 text-red-600 text-sm font-semibold mb-4">
                {error}
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex gap-2.5 mb-6">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      navigate(`/dashboard/my-medical-history?tab=${tab.id}`, { replace: true });
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-[#0A604E] text-white shadow-[0_4px_12px_rgba(10,96,78,0.15)]" 
                        : "bg-white border border-slate-200 text-[#4A5D59] hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "history" && (
              <div className="w-full">
                <MedicalHistory patientId={patient.patientId} inline={true} isPatientView={true} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, bold, highlight, textPrimary }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-[#F0F9F7]/25 px-2 rounded-xl transition-all">
      <span className="text-[13px] font-semibold text-[#4A5D59]">{label}</span>
      <span
        className={`text-sm ${
          textPrimary 
            ? "text-[#0A604E] font-extrabold" 
            : bold 
              ? "font-bold text-slate-800" 
              : "font-semibold text-slate-700"
        } ${
          highlight 
            ? "text-teal-800 bg-teal-50 px-3.5 py-1 rounded-full text-xs font-bold border border-teal-200" 
            : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
