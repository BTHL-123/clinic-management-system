import React, { useEffect, useState } from "react";
import { User, History, Phone, Mail, MapPin, Heart, Shield, AlertTriangle, X } from "lucide-react";
import { getPatientById } from "../services/patientService";
import MedicalHistory from "./MedicalHistory";

const TABS = [
  { id: "info", label: "Tổng quan", icon: User },
  { id: "history", label: "Lịch sử khám", icon: History },
];

export default function PatientRecordModal({ patientId, onClose }) {
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
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

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
    <div className="grid grid-cols-1 gap-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
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
        <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Phone size={20} className="text-sky-600" /> Thông tin liên hệ
          </h3>
          <div className="grid gap-4">
            <InfoRow label="Số điện thoại" value={patient.phone} icon={<Phone size={16} />} />
            <InfoRow label="Email" value={patient.email} icon={<Mail size={16} />} />
            <InfoRow label="Địa chỉ" value={patient.address} icon={<MapPin size={16} />} />
            <div className="border-t border-slate-200 pt-4 mt-2">
              <p className="text-sm font-semibold text-slate-500 mb-3">Liên hệ khẩn cấp</p>
              <div className="grid gap-4">
                <InfoRow label="Người liên hệ" value={patient.emergencyContactName} />
                <InfoRow label="SĐT khẩn cấp" value={patient.emergencyContactPhone} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin y tế - full width */}
      <div className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Heart size={20} className="text-rose-500" /> Thông tin y tế
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-2">Nhóm máu</p>
            <p className="font-bold text-2xl text-rose-600">{patient.bloodType || "—"}</p>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Tiền sử dị ứng
            </p>
            <p className="text-slate-700 whitespace-pre-wrap font-medium">{patient.allergies || "Không có thông tin"}</p>
          </div>
          <div className="md:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <Shield size={16} className="text-teal-600" /> Tiền sử bệnh lý (Bệnh nền)
            </p>
            <p className="text-slate-700 whitespace-pre-wrap font-medium">{patient.medicalHistory || "Không có thông tin"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden pb-6">
      <MedicalHistory patientId={Number(patientId)} inline={true} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <User size={24} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">
                {patient ? patient.fullName : "Hồ sơ Bệnh án"}
              </h2>
              {patient && (
                <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                  <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                    {patient.patientCode}
                  </span>
                  <span>• {genderLabel(patient.gender)}</span>
                  {patient.dateOfBirth && <span>• {formatDate(patient.dateOfBirth)}</span>}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20 text-slate-500 font-medium">
              Đang tải thông tin bệnh nhân...
            </div>
          ) : error ? (
            <div className="flex justify-center py-20 text-red-500 font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-3 border-b border-slate-200 mb-6">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2 ${
                        isActive 
                          ? "border-teal-500 text-teal-700 bg-teal-50/50" 
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab View */}
              {activeTab === "info" && renderInfoTab()}
              {activeTab === "history" && renderHistoryTab()}
            </>
          )}
        </div>
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
