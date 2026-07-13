import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, History, Phone, Mail, MapPin, Heart, Shield, AlertTriangle, DollarSign, CheckCircle2, ShieldAlert } from "lucide-react";
import { getPatientById } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/useAuth";

const TABS = [
  { id: "info", label: "Thông tin hành chính", icon: User },
  { id: "history", label: "Lịch sử bệnh án", icon: History },
];

export default function PatientDetailPage() {
  const { user } = useAuth();
  const roles = (user?.roles || []).map(r => typeof r === "string" ? r : r.roleName);
  const isReceptionistOnly = roles.some(r => r.includes("RECEPTIONIST")) && !roles.some(r => r.includes("ADMIN"));
  const visibleTabs = isReceptionistOnly ? TABS.filter(t => t.id !== "history") : TABS;

  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isReceptionist = user?.roles?.some(r => r === "RECEPTIONIST" || r.roleName === "RECEPTIONIST");
  const isAdmin = user?.roles?.some(r => r === "ADMIN" || r.roleName === "ADMIN");

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  
  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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

  useEffect(() => {
    if ((isReceptionist || isAdmin) && activeTab === "invoices") {
      const fetchInvoices = async () => {
        try {
          setLoadingInvoices(true);
          const res = await getInvoices({ patientId });
          setInvoices(res.data?.content || res.data || []);
        } catch (err) {
          console.error("Lỗi tải hóa đơn:", err);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }
  }, [patientId, activeTab, isReceptionist, isAdmin]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center">
        <PageHeader
          title="Chi tiết bệnh nhân"
          icon={User}
          iconColor="text-white"
          onBack={() => navigate("/dashboard/patients")}
        />
        <div className="patient-glass-card p-6 md:p-8 w-full mt-4 text-center text-slate-500 font-semibold">
          Đang tải thông tin bệnh nhân...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full flex flex-col items-center">
        <PageHeader
          title="Chi tiết bệnh nhân"
          icon={User}
          iconColor="text-white"
          onBack={() => navigate("/dashboard/patients")}
        />
        <div className="patient-glass-card p-6 md:p-8 w-full mt-4 text-center text-red-600 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} tuổi`;
  };

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const num = parseFloat(bmi);
    if (num < 18.5) return { label: "Gầy (Dưới chuẩn)", color: "text-sky-600 bg-sky-50 border-sky-200" };
    if (num < 25.0) return { label: "Bình thường", color: "text-emerald-750 bg-emerald-50 border-emerald-255" };
    if (num < 30.0) return { label: "Thừa cân (Tiền béo phì)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Béo phì", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const genderLabel = (g) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    return "Khác";
  };

  const tabs = [
    { id: "info", label: "Thông tin hành chính", icon: User },
    { id: "history", label: isReceptionist ? "Lịch sử khám bệnh" : "Lịch sử bệnh án", icon: History },
  ];
  if (isReceptionist || isAdmin) {
    tabs.push({ id: "invoices", label: "Thông tin hóa đơn", icon: DollarSign });
  }

  const renderInfoTab = () => {
    const bmi = calculateBMI(patient.heightCm, patient.weightKg);
    const bmiCat = getBMICategory(bmi);

    return (
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
            <InfoRow label="Ngày sinh" value={patient.dateOfBirth ? `${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)})` : "—"} />
            <InfoRow label="CCCD / CMND" value={patient.identityNumber} />
            <InfoRow label="Mã BHYT" value={patient.insuranceNumber} highlight />
            <InfoRow label="Nghề nghiệp" value={patient.occupation} />
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

        {/* Thông tin y tế & Chỉ số cơ thể - full width */}
        <div className="md:col-span-2 bg-white/60 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Heart size={20} className="text-rose-500" /> Chỉ số cơ thể & Cảnh báo y khoa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
              <p className="text-sm font-semibold text-slate-500 mb-2">Nhóm máu</p>
              <p className="font-bold text-2xl text-rose-600">{patient.bloodType || "—"}</p>
            </div>
            <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
              <p className="text-sm font-semibold text-slate-500 mb-2">Chiều cao & Cân nặng</p>
              <p className="font-bold text-slate-800 text-sm">
                Chiều cao: <span className="text-teal-700 text-base">{patient.heightCm ? `${patient.heightCm} cm` : "—"}</span>
              </p>
              <p className="font-bold text-slate-800 text-sm mt-1">
                Cân nặng: <span className="text-teal-700 text-base">{patient.weightKg ? `${patient.weightKg} kg` : "—"}</span>
              </p>
            </div>
            <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
              <p className="text-sm font-semibold text-slate-500 mb-2">Chỉ số BMI</p>
              {bmi ? (
                <div>
                  <span className="font-bold text-2xl text-slate-800">{bmi}</span>
                  <div className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold border ml-2 ${bmiCat?.color || ""}`}>
                    {bmiCat?.label || ""}
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 font-medium text-sm">Chưa có chỉ số</span>
              )}
            </div>

            {/* Dị ứng cảnh báo nổi bật */}
            {patient.allergies ? (
              <div className="md:col-span-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 shadow-sm animate-pulse-slow">
                <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-extrabold text-rose-800 block mb-1">CẢNH BÁO TIỀN SỬ DỊ ỨNG THUỐC / THỰC PHẨM:</span>
                  <p className="text-sm font-bold text-rose-700 whitespace-pre-wrap">{patient.allergies}</p>
                </div>
              </div>
            ) : (
              <div className="md:col-span-3 p-4 bg-emerald-50/50 border border-emerald-250/50 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span className="text-sm font-bold text-emerald-800">Không ghi nhận tiền sử dị ứng thuốc.</span>
              </div>
            )}

            {/* Tiền sử bệnh nền - Ẩn đối với Lễ tân */}
            {!isReceptionist && (
              <div className="md:col-span-3 bg-white/40 p-4 rounded-2xl border border-white/50">
                <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
                  <Shield size={16} className="text-teal-600" /> Tiền sử bệnh lý nền
                </p>
                <p className="text-slate-700 whitespace-pre-wrap">{patient.medicalHistory || "Không có thông tin"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tài khoản liên kết (Mối quan hệ gia đình) */}
        <div className="md:col-span-2 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white/60 backdrop-blur-xl p-5 rounded-3xl border border-sky-100 shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            Tài khoản liên kết quản lý: {patient.userName ? <strong className="text-sky-700 ml-1 bg-sky-100 px-2 py-0.5 rounded-full">{patient.userName}</strong> : <em className="text-slate-400 ml-1">Không có</em>}
          </span>
          <span className="text-sm font-medium text-slate-500">
            Ngày tạo hồ sơ: {formatDate(patient.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
      <MedicalHistory patientId={Number(patientId)} inline />
    </div>
  );

  const renderInvoicesTab = () => {
    if (loadingInvoices) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      );
    }

    if (invoices.length === 0) {
      return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-12 rounded-3xl text-center text-slate-500 font-semibold shadow-sm">
          Không có thông tin hóa đơn nào cho bệnh nhân này.
        </div>
      );
    }

    const unpaidCount = invoices.filter(inv => inv.status === "UNPAID").length;
    const unpaidAmount = invoices.filter(inv => inv.status === "UNPAID").reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);

    return (
      <div className="space-y-6">
        {/* Invoice Summary Banner */}
        <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${unpaidCount > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50/50 border-emerald-250/50 text-emerald-800"}`}>
          <div>
            <h4 className="font-extrabold text-base flex items-center gap-2">
              {unpaidCount > 0 ? <AlertTriangle size={18} className="text-rose-600 animate-bounce" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
              {unpaidCount > 0 ? `Bệnh nhân hiện đang nợ ${unpaidCount} hóa đơn chưa thanh toán!` : "Bệnh nhân đã thanh toán đầy đủ các khoản chi phí."}
            </h4>
            <p className="text-xs font-semibold mt-1 opacity-80">
              Tổng số hóa đơn: {invoices.length} | Trạng thái: {unpaidCount > 0 ? "Còn nợ phí" : "Hoàn thành"}
            </p>
          </div>
          {unpaidCount > 0 && (
            <div className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-center shadow-md shadow-rose-500/25">
              <div className="text-[10px] font-extrabold tracking-wider uppercase opacity-85">TỔNG TIỀN NỢ</div>
              <div className="text-lg font-black">{unpaidAmount.toLocaleString("vi-VN")} VNĐ</div>
            </div>
          )}
        </div>

        {/* Invoice List Table */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Mã Hóa đơn</th>
                  <th className="pb-3 px-4">Ngày tạo</th>
                  <th className="pb-3 px-4 text-right">Tổng tiền</th>
                  <th className="pb-3 px-4 text-right">Miễn giảm</th>
                  <th className="pb-3 px-4 text-right">Thành tiền</th>
                  <th className="pb-3 px-4 text-center">Trạng thái</th>
                  <th className="pb-3 pl-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4 font-mono text-teal-700 font-bold">{inv.invoiceCode}</td>
                    <td className="py-4 px-4 font-medium text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="py-4 px-4 text-right">{(inv.totalAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="py-4 px-4 text-right text-emerald-600">-{(inv.discountAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-800">{(inv.finalAmount || 0).toLocaleString("vi-VN")} đ</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        inv.status === "PAID" 
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700" 
                          : inv.status === "UNPAID"
                          ? "bg-rose-50 border-rose-250 text-rose-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        {inv.status === "PAID" ? "Đã thanh toán" : inv.status === "UNPAID" ? "Chưa thanh toán" : "Đã hủy"}
                      </span>
                    </td>
                    <td className="py-4 pl-4 text-center">
                      <button
                        onClick={() => navigate("/dashboard/invoices")}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold transition-colors shadow-sm"
                      >
                        Quản lý hóa đơn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-6">
      {/* Page Header */}
      <PageHeader
        title={patient.fullName || "Bệnh nhân"}
        icon={User}
        iconColor="text-white"
        subtitle={
          <span className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md font-bold border border-teal-200">
              {patient.patientCode}
            </span>
            • {genderLabel(patient.gender)}
            {patient.dateOfBirth && ` • ${formatDate(patient.dateOfBirth)}`}
            {patient.phone && ` • ${patient.phone}`}
          </span>
        }
        onBack={() => navigate("/dashboard/patients")}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/50 pb-px">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold text-sm transition-all border-b-2 ${isActive
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
        {activeTab === "invoices" && renderInvoicesTab()}
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
        className={`text-sm ${bold ? "font-bold text-slate-800" : "font-medium text-slate-700"
          } ${highlight ? "text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
