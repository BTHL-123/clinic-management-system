import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pill, ArrowLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { getPrescriptionById } from "../../services/prescriptionService";
import { useAuth } from "../../context/useAuth";
import PageHeader from "../../components/PageHeader";

const STATUS_MAP = {
  CREATED:   { label: "Mới tạo",       color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  CHECKED:   { label: "Đã kiểm tra",   color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  DISPENSED: { label: "Đã cấp phát",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  CANCELLED: { label: "Đã hủy",        color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" };
  return (
    <span className={`${s.bg} ${s.color} ${s.border} border px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm`}>
      {s.label}
    </span>
  );
}

export default function PrescriptionDetailPage() {
  const { user } = useAuth();
  const isPatientMode = user?.roles?.includes("PATIENT");
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!prescriptionId) return;
    setLoading(true);
    getPrescriptionById(prescriptionId)
      .then((res) => {
        setPrescription(res.data);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải đơn thuốc."))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  if (loading) return <div style={{ padding: 32, color: "#6b7280" }}>Đang tải đơn thuốc...</div>;
  if (error) return <div style={{ padding: 32, color: "#dc2626" }}>{error}</div>;
  if (!prescription) return null;

  const hasDoseSchedule = prescription.items?.some(
    (i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose
  );

  return (
    <div className="max-w-[1100px] mx-auto w-full pb-10 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 w-full mb-6">
        {/* Header */}
        <PageHeader
          title="Chi tiết đơn thuốc"
          icon={Pill}
          iconColor="text-teal-500"
          onBack={() => navigate(-1)}
          rightContent={<StatusBadge status={prescription.status} />}
        />

        {/* Thông tin đơn */}
        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Mã đơn thuốc</div>
            <div className="font-bold text-[#1DB896]">{prescription.prescriptionCode}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Ngày tạo</div>
            <div className="font-semibold text-slate-700">
              {new Date(prescription.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-1">Kiểm tra tương tác</div>
            <div className="font-semibold">
              {prescription.drugInteractionChecked ? (
                <span className="text-emerald-600 font-bold">✓ Đã kiểm tra</span>
              ) : (
                <span className="text-slate-400 font-medium italic">Chưa kiểm tra</span>
              )}
            </div>
          </div>
        </div>

        {/* Cảnh báo tương tác thuốc */}
        {prescription.interactionWarning && (
          <div className={`p-4 rounded-xl border mb-6 text-sm ${
            prescription.interactionWarning.includes("No dangerous")
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-amber-50 border-amber-100 text-amber-800"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {prescription.interactionWarning.includes("No dangerous") ? (
                <ShieldCheck size={16} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600" />
              )}
              <strong className="font-bold">
                {prescription.interactionWarning.includes("No dangerous")
                  ? "Không phát hiện tương tác nguy hiểm"
                  : "Cảnh báo tương tác thuốc"}
              </strong>
            </div>
            <pre className="margin-0 whitespace-pre-wrap font-sans font-medium text-xs text-slate-600 leading-relaxed">
              {prescription.interactionWarning}
            </pre>
          </div>
        )}

        {/* Danh sách thuốc */}
        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-xl mb-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Pill size={13} />
            </div>
            Danh sách thuốc ({prescription.items?.length || 0} loại)
          </h3>

          <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/75 border-b border-slate-100">
                <tr className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                  <th className="p-4 pl-6 text-left">Tên thuốc</th>
                  <th className="p-4">Dạng bào chế</th>
                  <th className="p-4">Hàm lượng</th>
                  <th className="p-4 text-center">SL</th>
                  <th className="p-4">Liều dùng</th>
                  <th className="p-4">Tần suất</th>
                  <th className="p-4 pr-6">Thời gian</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 font-medium">
                {prescription.items?.map((item) => (
                  <tr key={item.prescriptionItemId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-200">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-800">{item.medicineName}</div>
                      <div className="text-[11px] text-slate-400 font-bold mt-0.5">{item.medicineCode}</div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">{item.dosageForm || "—"}</td>
                    <td className="p-4 text-xs font-semibold text-slate-500">{item.strength || "—"}</td>
                    <td className="p-4 text-center font-bold text-slate-800">
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-500">{item.dosage || "—"}</td>
                    <td className="p-4 text-xs font-semibold text-slate-500">{item.frequency || "—"}</td>
                    <td className="p-4 pr-6 text-xs font-semibold text-slate-500">{item.duration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lịch uống thuốc */}
        {hasDoseSchedule && (
          <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-xl mb-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
              Lịch uống thuốc
            </h3>
            <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/75 border-b border-slate-100">
                  <tr className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                    <th className="p-4 pl-6 text-left">Thuốc</th>
                    <th className="p-4 text-center w-24">Sáng</th>
                    <th className="p-4 text-center w-24">Trưa</th>
                    <th className="p-4 text-center w-24">Chiều</th>
                    <th className="p-4 pr-6 text-center w-24">Tối</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 font-medium">
                  {prescription.items
                    ?.filter((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                    .map((item) => (
                      <tr key={item.prescriptionItemId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors duration-200">
                        <td className="p-4 pl-6 font-bold text-slate-800">{item.medicineName}</td>
                        <td className="p-4 text-center font-bold text-slate-700">{item.morningDose || "—"}</td>
                        <td className="p-4 text-center font-bold text-slate-700">{item.noonDose || "—"}</td>
                        <td className="p-4 text-center font-bold text-slate-700">{item.eveningDose || "—"}</td>
                        <td className="p-4 pr-6 text-center font-bold text-slate-700">{item.nightDose || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lời dặn */}
        {prescription.doctorNote && (
          <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-xl">
            <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              Lời dặn của bác sĩ:
            </strong>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed margin-0">
              {prescription.doctorNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
