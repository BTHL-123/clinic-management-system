import { useEffect, useState } from "react";
import { getPrescriptionByConsultationId } from "../services/prescriptionService";
import { AlertTriangle, Info, Calendar } from "lucide-react";

export default function PrescriptionDetailView({ consultationId }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);
    getPrescriptionByConsultationId(consultationId)
      .then((res) => {
        setPrescription(res.data);
        setError("");
      })
      .catch((err) => setError(err.message || "Không thể tải đơn thuốc."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-505 text-xs py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1DB896]"></div>
        <span>Đang tải đơn thuốc...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-650 px-4 py-2.5 rounded-xl text-xs font-semibold">
        {error}
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="w-full flex flex-col gap-5 mt-2">
      {/* Sub-header meta info bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-200/60 text-xs font-semibold text-[#4A5D59]">
        <div className="flex items-center gap-1.5">
          <span>Mã đơn thuốc:</span>
          <strong className="text-[#0A604E] font-extrabold">{prescription.prescriptionCode}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span>Ngày kê đơn:</span>
          <strong className="text-[#0A604E] font-extrabold">{new Date(prescription.createdAt).toLocaleDateString("vi-VN")}</strong>
        </div>
      </div>

      {prescription.interactionWarning && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start text-xs text-amber-900 shadow-sm">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-extrabold text-amber-950">Cảnh báo tương tác thuốc:</strong> {prescription.interactionWarning}
          </div>
        </div>
      )}

      {/* Main Table wrapper */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[#4A5D59] font-bold">
                <th className="p-3.5 font-bold w-[30%]">Tên thuốc</th>
                <th className="p-3.5 font-bold w-[15%]">Dạng bào chế</th>
                <th className="p-3.5 font-bold w-[12%]">Hàm lượng</th>
                <th className="p-3.5 font-bold w-[10%] text-center">Số lượng</th>
                <th className="p-3.5 font-bold w-[15%]">Liều dùng</th>
                <th className="p-3.5 font-bold w-[10%]">Tần suất</th>
                <th className="p-3.5 font-bold w-[8%]">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item) => (
                <tr key={item.prescriptionItemId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800 text-[13px]">{item.medicineName}</div>
                    <div className="text-[10px] text-slate-450 font-semibold mt-0.5">{item.medicineCode}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-600">{item.dosageForm || "—"}</td>
                  <td className="p-3.5 font-semibold text-slate-700">{item.strength || "—"}</td>
                  <td className="p-3.5 font-extrabold text-[#0A604E] text-center bg-[#F0F9F7]/30">
                    {item.quantity} {item.unit || "viên"}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700">{item.dosage || "—"}</td>
                  <td className="p-3.5 font-semibold text-slate-600">{item.frequency || "—"}</td>
                  <td className="p-3.5 font-semibold text-slate-600">{item.duration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medication Schedule */}
      {prescription.items.some((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose) && (
        <div className="flex flex-col gap-3">
          <strong className="text-xs font-bold text-[#0A604E] flex items-center gap-1.5 pl-1">
            🗓️ Lịch trình uống thuốc hàng ngày
          </strong>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar w-full">
              <table className="w-full text-center border-collapse min-w-[500px] text-xs">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[#4A5D59] font-bold">
                    <th className="p-3.5 font-bold text-left w-[40%]">Tên thuốc</th>
                    <th className="p-3.5 font-bold w-[15%]">Sáng</th>
                    <th className="p-3.5 font-bold w-[15%]">Trưa</th>
                    <th className="p-3.5 font-bold w-[15%]">Chiều</th>
                    <th className="p-3.5 font-bold w-[15%]">Tối</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items
                    .filter((i) => i.morningDose || i.noonDose || i.eveningDose || i.nightDose)
                    .map((item) => (
                      <tr key={item.prescriptionItemId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 text-left font-bold text-slate-800">{item.medicineName}</td>
                        <td className="p-3.5 font-extrabold text-[#0A604E] bg-teal-50/10">{item.morningDose || "—"}</td>
                        <td className="p-3.5 font-extrabold text-[#0A604E]">{item.noonDose || "—"}</td>
                        <td className="p-3.5 font-extrabold text-[#0A604E] bg-teal-50/10">{item.eveningDose || "—"}</td>
                        <td className="p-3.5 font-extrabold text-[#0A604E]">{item.nightDose || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Doctor advice note */}
      {prescription.doctorNote && (
        <div className="bg-[#F0F9F7]/50 border-l-4 border-[#1DB896] p-4 rounded-r-2xl text-xs font-semibold text-slate-700 flex items-start gap-2 shadow-sm">
          <Info size={14} className="text-[#1DB896] shrink-0 mt-0.5" />
          <p className="m-0 leading-normal">
            <span className="text-[#0A604E] font-bold mr-1">Hướng dẫn dặn dò từ bác sĩ:</span>
            {prescription.doctorNote}
          </p>
        </div>
      )}
    </div>
  );
}
