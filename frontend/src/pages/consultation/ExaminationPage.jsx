import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Stethoscope, Save, ArrowLeft, CheckCircle, Activity, FlaskConical, Pill, ExternalLink, User, Clock, AlertCircle, RefreshCw } from "lucide-react";
import consultationService from "../../services/consultationService";
import {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from "../../services/medicalRecordService";
import vitalSignService from "../../services/vitalSignService";
import { createLabRequest, getLabRequestsByConsultationId } from "../../services/labRequestService";
import { getLabTests } from "../../services/labTestService";
import { standardizeClinicalNote } from "../../services/aiChatService";
import { Bot } from "lucide-react";
import PatientRecordModal from "../../components/PatientRecordModal";
import {
  createPrescription,
  getPrescriptionByConsultationId,
  checkDrugInteractions,
  checkInteractionsDraft,
} from "../../services/prescriptionService";
import { getMedicines } from "../../services/medicineService";
import { getPatientById } from "../../services/patientService";
import { getDoctorById } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

const EMPTY_FORM = {
  symptoms: "",
  clinicalFindings: "",
  diagnosis: "",
  treatmentPlan: "",
  doctorNote: "",
  followUpDate: "",
  followUpNote: "",
};

const EMPTY_VITALS = {
  heightCm: "",
  weightKg: "",
  temperatureC: "",
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  heartRate: "",
  respiratoryRate: "",
  spo2: "",
};

const EMPTY_RX_ITEM = {
  medicineId: "",
  quantity: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
  morningDose: "",
  noonDose: "",
  eveningDose: "",
  nightDose: "",
};

export default function ExaminationPage() {
  const toast = useToast();
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [existingRecordId, setExistingRecordId] = useState(null);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [savedVitals, setSavedVitals] = useState([]);
  const [savingVitals, setSavingVitals] = useState(false);
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [labNote, setLabNote] = useState("");
  const [savedLabRequests, setSavedLabRequests] = useState([]);
  const [savingLab, setSavingLab] = useState(false);
  // Prescription states
  const [medicines, setMedicines] = useState([]);
  const [rxItems, setRxItems] = useState([{ ...EMPTY_RX_ITEM }]);
  const [rxNote, setRxNote] = useState("");
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [savingRx, setSavingRx] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [rawNote, setRawNote] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load consultation + bệnh án hiện có (nếu có)
  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);

    Promise.all([
      consultationService.getById(consultationId),
      vitalSignService.getByConsultation(consultationId).catch(() => ({ data: [] })),
      getLabTests({ status: "ACTIVE", size: 100 }).catch(() => ({ data: { content: [] } })),
      getLabRequestsByConsultationId(consultationId).catch(() => ({ data: [] })),
      getMedicines({ status: "ACTIVE", size: 200 }).catch(() => ({ data: { content: [] } })),
      getPrescriptionByConsultationId(consultationId).catch(() => null),
    ])
      .then(async ([consultRes, vitalsRes, labTestsRes, labReqRes, medicinesRes, rxRes]) => {
        const c = consultRes.data;
        setConsultation(c);
        
        // Lấy thêm thông tin Bệnh nhân và Bác sĩ
        try {
          const [pRes, dRes] = await Promise.all([
            getPatientById(c.patientId),
            getDoctorById(c.doctorId)
          ]);
          setPatientInfo(pRes.data);
          setDoctorInfo(dRes.data);
        } catch (err) {
          console.error("Không thể tải thông tin bệnh nhân/bác sĩ", err);
        }

        setSavedVitals(vitalsRes.data || []);
        setLabTests(labTestsRes.data?.content || []);
        setSavedLabRequests(labReqRes.data || []);
        setMedicines(medicinesRes.data?.content || []);
        if (rxRes?.data) {
          setSavedPrescription(rxRes.data);
        }

        // Tìm bệnh án đã tồn tại cho consultation này
        try {
          const recRes = await getMedicalRecords({
            patientId: c.patientId,
            page: 0,
            size: 50,
          });
          const existing = (recRes.data?.content || []).find(
            (r) => r.consultationId === Number(consultationId)
          );
          if (existing) {
            setExistingRecordId(existing.medicalRecordId);
            setForm({
              symptoms: existing.symptoms || "",
              clinicalFindings: existing.clinicalFindings || "",
              diagnosis: existing.diagnosis || "",
              treatmentPlan: existing.treatmentPlan || "",
              doctorNote: existing.doctorNote || "",
              followUpDate: existing.followUpDate || "",
              followUpNote: existing.followUpNote || "",
            });
          }
        } catch {
          // Chưa có bệnh án — bình thường
        }
      })
      .catch((err) => setError(err.message || "Không thể tải thông tin phiên khám."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  const showToast = (message, type = "success") => {
    if (type === "error") {
      toast.error(message);
      return;
    }
    toast.success(message);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVitalsChange = (e) => {
    setVitals((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveVitals = async () => {
    const hasAnyValue = Object.values(vitals).some((v) => v !== "");
    if (!hasAnyValue) {
      showToast("Vui lòng nhập ít nhất một chỉ số.", "error");
      return;
    }

    // Validation
    if (vitals.temperatureC) {
      const temp = parseFloat(vitals.temperatureC);
      if (temp < 30 || temp > 45) {
        showToast("Nhiệt độ không hợp lệ (phải từ 30°C đến 45°C).", "error");
        return;
      }
    }
    if (vitals.heartRate) {
      const hr = parseInt(vitals.heartRate);
      if (hr < 20 || hr > 300) {
        showToast("Nhịp tim không hợp lệ (phải từ 20 đến 300 lần/phút).", "error");
        return;
      }
    }

    setSavingVitals(true);
    try {
      const payload = {
        consultationId: Number(consultationId),
        patientId: consultation.patientId,
        heightCm: vitals.heightCm ? parseFloat(vitals.heightCm) : null,
        weightKg: vitals.weightKg ? parseFloat(vitals.weightKg) : null,
        temperatureC: vitals.temperatureC ? parseFloat(vitals.temperatureC) : null,
        bloodPressureSystolic: vitals.bloodPressureSystolic ? parseInt(vitals.bloodPressureSystolic) : null,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic ? parseInt(vitals.bloodPressureDiastolic) : null,
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate) : null,
        respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
        spo2: vitals.spo2 ? parseInt(vitals.spo2) : null,
      };
      const res = await vitalSignService.create(payload);
      setSavedVitals((prev) => [res.data, ...prev]);
      setVitals(EMPTY_VITALS);
      showToast("Đã lưu chỉ số sinh tồn.");
    } catch (err) {
      showToast(err.message || "Không thể lưu chỉ số sinh tồn.", "error");
    } finally {
      setSavingVitals(false);
    }
  };

  const toggleLabTest = (id) => {
    setSelectedLabTests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateLabRequest = async () => {
    if (selectedLabTests.length === 0) {
      showToast("Vui lòng chọn ít nhất một loại xét nghiệm.", "error");
      return;
    }
    setSavingLab(true);
    try {
      const res = await createLabRequest({
        consultationId: Number(consultationId),
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        labTestIds: selectedLabTests,
        note: labNote || null,
      });
      setSavedLabRequests((prev) => [...prev, res.data]);
      setSelectedLabTests([]);
      setLabNote("");
      showToast("Đã tạo phiếu xét nghiệm thành công.");
    } catch (err) {
      showToast(err.message || "Không thể tạo phiếu xét nghiệm.", "error");
    } finally {
      setSavingLab(false);
    }
  };

  const handleRefreshLabRequests = async () => {
    try {
      const res = await getLabRequestsByConsultationId(consultationId);
      setSavedLabRequests(res.data || []);
      showToast("Đã cập nhật phiếu xét nghiệm và kết quả.");
    } catch (err) {
      showToast("Không thể tải lại phiếu xét nghiệm.", "error");
    }
  };

  // ── Prescription handlers ────────────────────────────────────────────────
  const handleRxItemChange = (index, field, value) => {
    setRxItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === "medicineId" && value) {
        const selectedMed = medicines.find(m => m.medicineId.toString() === value.toString());
        if (selectedMed && selectedMed.usageInstructions) {
          updated[index].instructions = selectedMed.usageInstructions;
        }
      }
      return updated;
    });
  };

  const addRxItem = () => setRxItems((prev) => [...prev, { ...EMPTY_RX_ITEM }]);

  const removeRxItem = (index) =>
    setRxItems((prev) => prev.filter((_, i) => i !== index));

  const handleCreatePrescription = async () => {
    const validItems = rxItems.filter((i) => i.medicineId && i.quantity);
    if (validItems.length === 0) {
      showToast("Vui lòng chọn ít nhất một thuốc và nhập số lượng.", "error");
      return;
    }
    setSavingRx(true);
    try {
      // 1. Gọi API kiểm tra tương tác nháp
      const draftIds = validItems.map(i => Number(i.medicineId));
      if (draftIds.length > 1) {
        const interactionRes = await checkInteractionsDraft(draftIds);
        const { warningLevel, warningMessage } = interactionRes.data;
        if (warningLevel !== "NONE") {
          const confirmMsg = `Phát hiện tương tác thuốc nguy hiểm (Mức độ: ${warningLevel}):\n\n${warningMessage}\n\nBạn có chắc chắn muốn tiếp tục kê đơn này không?`;
          if (!window.confirm(confirmMsg)) {
             setSavingRx(false);
             return;
          }
        }
      }

      // 2. Lưu đơn thuốc thật
      const res = await createPrescription({
        consultationId: Number(consultationId),
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        doctorNote: rxNote || null,
        items: validItems.map((i) => ({
          medicineId: Number(i.medicineId),
          quantity: Number(i.quantity),
          dosage: i.dosage || null,
          frequency: i.frequency || null,
          duration: i.duration || null,
          instructions: i.instructions || null,
          morningDose: i.morningDose || null,
          noonDose: i.noonDose || null,
          eveningDose: i.eveningDose || null,
          nightDose: i.nightDose || null,
        })),
      });
      setSavedPrescription(res.data);
      setRxItems([{ ...EMPTY_RX_ITEM }]);
      setRxNote("");
      showToast("Đã tạo đơn thuốc thành công.");
    } catch (err) {
      showToast(err.message || "Không thể tạo đơn thuốc.", "error");
    } finally {
      setSavingRx(false);
    }
  };

  const handleCheckInteractions = async () => {
    if (!savedPrescription?.prescriptionId) return;
    setCheckingInteractions(true);
    try {
      const res = await checkDrugInteractions(savedPrescription.prescriptionId);
      setSavedPrescription((prev) => ({
        ...prev,
        drugInteractionChecked: res.data.checked,
        interactionWarning: res.data.warningMessage,
      }));
      showToast("Kiểm tra tương tác thuốc hoàn tất.");
    } catch (err) {
      showToast(err.message || "Không thể kiểm tra tương tác thuốc.", "error");
    } finally {
      setCheckingInteractions(false);
    }
  };

  // ── Medical record save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.diagnosis.trim()) {
      setError("Chẩn đoán không được để trống.");
      return false;
    }
    
    // Validation
    if (form.followUpDate) {
      const followUpDate = new Date(form.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare dates only
      if (followUpDate < today) {
        setError("Ngày tái khám không được ở trong quá khứ.");
        return false;
      }
    }

    setSaving(true);
    setError("");
    try {
      if (existingRecordId) {
        await updateMedicalRecord(existingRecordId, {
          symptoms: form.symptoms || null,
          clinicalFindings: form.clinicalFindings || null,
          diagnosis: form.diagnosis,
          treatmentPlan: form.treatmentPlan || null,
          doctorNote: form.doctorNote || null,
          followUpDate: form.followUpDate || null,
          followUpNote: form.followUpNote || null,
        });
        showToast("Đã cập nhật bệnh án.");
      } else {
        const res = await createMedicalRecord({
          consultationId: Number(consultationId),
          patientId: consultation.patientId,
          doctorId: consultation.doctorId,
          symptoms: form.symptoms || null,
          clinicalFindings: form.clinicalFindings || null,
          diagnosis: form.diagnosis,
          treatmentPlan: form.treatmentPlan || null,
          doctorNote: form.doctorNote || null,
          followUpDate: form.followUpDate || null,
          followUpNote: form.followUpNote || null,
        });
        setExistingRecordId(res.data.medicalRecordId);
        showToast("Đã tạo bệnh án thành công.");
      }
      return true;
    } catch (err) {
      setError(err.message || "Không thể lưu bệnh án.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleStandardizeNote = async () => {
    if (!rawNote.trim()) {
      showToast("Vui lòng nhập ghi chú thô cần chuẩn hóa.", "error");
      return;
    }
    setAiProcessing(true);
    try {
      const res = await standardizeClinicalNote(rawNote);
      const data = res.data;
      setForm((prev) => ({
        ...prev,
        symptoms: data.symptoms || prev.symptoms,
        clinicalFindings: data.clinicalFindings || prev.clinicalFindings,
        diagnosis: data.diagnosis || prev.diagnosis,
        treatmentPlan: data.treatmentPlan || prev.treatmentPlan,
        doctorNote: data.doctorNote || prev.doctorNote,
      }));
      setRawNote("");
      showToast("Đã chuẩn hóa và điền tự động thành công!");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Không thể chuẩn hóa bệnh án.", "error");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Xác nhận hoàn tất phiên khám?\nThao tác này sẽ cập nhật trạng thái lịch hẹn thành COMPLETED.")) return;
    setCompleting(true);
    setError("");
    try {
      // Lưu bệnh án trước
      const saved = await handleSave();
      if (!saved) {
        setCompleting(false);
        return;
      }
      // Hoàn thành phiên khám
      await consultationService.complete(consultationId);
      showToast("Phiên khám đã hoàn thành! Đang chuyển về hàng đợi...");
      setTimeout(() => navigate("/dashboard/consultation"), 1800);
    } catch (err) {
      setError(err.message || "Không thể hoàn thành phiên khám.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32, color: "#6b7280" }}>Đang tải phiên khám...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col items-center pb-24">
      {/* Header */}
      <PageHeader
        title={`Khám bệnh — Phiên #${consultationId}`}
        icon={Stethoscope}
        iconColor="text-white"
        subtitle={
          consultation ? (
            <div className="mt-4 p-[1.5px] rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 shadow-[0_8px_32px_rgba(20,184,166,0.25)]">
              <div className="bg-slate-900/60 backdrop-blur-xl px-6 py-2.5 rounded-[15px] flex flex-wrap justify-center items-center gap-5 text-sm font-semibold text-white">
                  <span className="flex items-center gap-2">
                  <User size={16} className="text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.4)] stroke-[2.5]" />
                  <span className="text-slate-300 font-medium">Bệnh nhân:</span>
                  <strong className="text-white font-extrabold text-base">
                    {patientInfo ? `${patientInfo.fullName} (${patientInfo.gender === 'MALE' ? 'Nam' : patientInfo.gender === 'FEMALE' ? 'Nữ' : 'Khác'})` : `ID: ${consultation.patientId}`}
                  </strong>
                </span>
                <span className="text-slate-600 font-light">•</span>
                <span className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.4)] stroke-[2.5]" />
                  <span className="text-slate-300 font-medium">Bác sĩ:</span>
                  <strong className="text-white font-extrabold text-base">
                    {doctorInfo ? doctorInfo.fullName : `ID: ${consultation.doctorId}`}
                  </strong>
                </span>
                <span className="text-slate-600 font-light">•</span>
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.4)] stroke-[2.5]" />
                  <span className="text-slate-300 font-medium">Bắt đầu:</span>
                  <strong className="text-white font-extrabold text-base">{consultation.startedAt ? new Date(consultation.startedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}</strong>
                </span>
                <span className="text-slate-600 font-light">•</span>
                <span className={`px-3.5 py-1 rounded-full text-xs font-black shadow-md tracking-wider uppercase bg-gradient-to-r ${consultation.status === "IN_PROGRESS" ? "from-teal-400 to-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.5)]" : "from-emerald-400 to-green-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]"}`}>
                  {consultation.status === "IN_PROGRESS" ? "ĐANG KHÁM" : consultation.status}
                </span>
              </div>
            </div>
          ) : undefined
        }
        onBack={() => navigate("/dashboard/consultation")}
      />

      {error && (
        <div className="w-full bg-rose-500/20 border border-rose-500/30 text-rose-100 p-4 rounded-2xl mb-6 flex items-center gap-3 backdrop-blur-md">
          <AlertCircle size={20} className="text-rose-400" />
          {error}
        </div>
      )}

      {showHistoryModal && (
        <PatientRecordModal 
          patientId={consultation.patientId} 
          onClose={() => setShowHistoryModal(false)} 
        />
      )}

      <div className="w-full flex flex-col gap-6 max-w-[960px] mt-6">

        {/* Nút Mở Hồ sơ TO BẢN */}
        <button 
          onClick={() => setShowHistoryModal(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-2xl p-6 shadow-lg hover:shadow-[0_10px_40px_rgba(20,184,166,0.3)] hover:-translate-y-1 transition-all flex items-center justify-between group cursor-pointer border border-teal-400/30"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform shadow-inner">
              <Activity size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-1 drop-shadow-sm">Hồ sơ Bệnh án Tổng quan</h3>
              <p className="text-teal-50 font-medium text-sm">Tra cứu nhóm máu, dị ứng, bệnh nền và toàn bộ lịch sử khám trước đây</p>
            </div>
          </div>
          <div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-md group-hover:bg-white group-hover:text-teal-600 transition-colors shadow-sm hidden md:block">
            Mở xem ngay
          </div>
        </button>

      {/* Vital Signs Section */}
      <div className="patient-glass-panel rounded-[2rem] p-8 shadow-xl border-0 w-full mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
            <Activity size={20} />
          </div>
          <h3 className="text-xl font-extrabold text-teal-900">Chỉ số sinh tồn</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { name: "heightCm", label: "Chiều cao (cm)", placeholder: "170" },
            { name: "weightKg", label: "Cân nặng (kg)", placeholder: "65" },
            { name: "temperatureC", label: "Nhiệt độ (°C)", placeholder: "37.0" },
            { name: "heartRate", label: "Nhịp tim (lần/phút)", placeholder: "80" },
            { name: "bloodPressureSystolic", label: "HA tâm thu (mmHg)", placeholder: "120" },
            { name: "bloodPressureDiastolic", label: "HA tâm trương (mmHg)", placeholder: "80" },
            { name: "respiratoryRate", label: "Nhịp thở (lần/phút)", placeholder: "18" },
            { name: "spo2", label: "SpO2 (%)", placeholder: "98" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-teal-800 ml-1">{field.label}</label>
              <input
                type="number"
                name={field.name}
                value={vitals[field.name]}
                onChange={handleVitalsChange}
                placeholder={field.placeholder}
                className="w-full bg-white/60 border border-teal-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mb-4">
          <button
            type="button"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
            onClick={handleSaveVitals}
            disabled={savingVitals}
          >
            <Save size={16} />
            {savingVitals ? "Đang lưu..." : "Lưu chỉ số"}
          </button>
        </div>

        {/* Lịch sử đo */}
        {savedVitals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-teal-900/10">
            <p className="text-xs font-bold text-teal-800 mb-3">
              Lịch sử đo ({savedVitals.length} lần)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50 text-teal-900">
                    {["Thời gian", "Cao (cm)", "Nặng (kg)", "Nhiệt độ", "HA", "Nhịp tim", "SpO2"].map((h) => (
                      <th key={h} className="px-3 py-2 font-bold rounded-t-lg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-teal-800 font-medium">
                  {savedVitals.map((v) => (
                    <tr key={v.vitalSignId} className="border-b border-teal-100 last:border-0 hover:bg-emerald-50/50">
                      <td className="px-3 py-2">
                        {new Date(v.measuredAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2">{v.heightCm ?? "—"}</td>
                      <td className="px-3 py-2">{v.weightKg ?? "—"}</td>
                      <td className="px-3 py-2">{v.temperatureC ?? "—"}</td>
                      <td className="px-3 py-2">
                        {v.bloodPressureSystolic && v.bloodPressureDiastolic
                          ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">{v.heartRate ?? "—"}</td>
                      <td className="px-3 py-2">{v.spo2 != null ? `${v.spo2}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* AI Smart Notes Section */}
      <div className="patient-glass-panel rounded-[2rem] p-8 shadow-xl border-0 w-full mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <Bot size={20} />
          </div>
          <h3 className="text-xl font-extrabold text-purple-900">Ghi chú nhanh AI</h3>
        </div>
        <p className="text-sm font-semibold text-purple-700/80 mb-4 ml-1">
          Nhập ghi chú thô của bạn (tốc ký, không cần đúng cấu trúc). AI sẽ tự động phân tích và điền vào form Bệnh án.
        </p>
        <textarea
          rows={3}
          placeholder="Ví dụ: bn nam 45t sốt 39đ ho khan 3 ngày khám họng đỏ phổi bt chẩn đoán viêm họng cấp kê para 500mg"
          value={rawNote}
          onChange={(e) => setRawNote(e.target.value)}
          disabled={aiProcessing}
          style={{
            width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e879f9",
            background: "#fff", fontSize: 14, outline: "none", marginBottom: 12
          }}
        />
        <button
          type="button"
          className="btn"
          disabled={aiProcessing}
          onClick={handleStandardizeNote}
          style={{
            background: "#c026d3", color: "#fff", border: "none",
            display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, padding: "8px 16px"
          }}
        >
          {aiProcessing ? (
            <>Đang xử lý...</>
          ) : (
            <><Bot size={16} /> AI Chuẩn hóa & Điền tự động</>
          )}
        </button>
      </div>

      {/* Lab Request Section */}
      <div className="patient-glass-panel rounded-[2rem] p-8 shadow-xl border-0 w-full mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
            <FlaskConical size={20} />
          </div>
          <h3 className="text-xl font-extrabold text-blue-900">Yêu cầu xét nghiệm</h3>
        </div>

        {/* Danh sách loại xét nghiệm */}
        {labTests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {labTests.map((t) => (
              <label key={t.labTestId} className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${selectedLabTests.includes(t.labTestId) ? 'bg-blue-50 border-blue-300' : 'bg-white/60 hover:bg-white/90 border-sky-200/50'}`}>
                <input
                  type="checkbox"
                  checked={selectedLabTests.includes(t.labTestId)}
                  onChange={() => toggleLabTest(t.labTestId)}
                  className="mt-1 w-4 h-4 text-sky-600 rounded border-sky-300 focus:ring-sky-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 leading-tight">{t.testName}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{t.testCode}</span>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500 mb-5">Không có loại xét nghiệm nào.</p>
        )}

        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-xs font-bold text-sky-800 ml-1">Ghi chú</label>
          <input
            type="text"
            value={labNote}
            onChange={(e) => setLabNote(e.target.value)}
            placeholder="Ghi chú cho phiếu xét nghiệm..."
            className="w-full bg-white/60 border border-sky-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all outline-none"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-blue-600">
            Đã chọn: {selectedLabTests.length} xét nghiệm
          </span>
          <button
            type="button"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
            onClick={handleCreateLabRequest}
            disabled={savingLab || selectedLabTests.length === 0}
          >
            <FlaskConical size={16} />
            {savingLab ? "Đang tạo..." : "Tạo phiếu xét nghiệm"}
          </button>
        </div>

        {/* Phiếu đã tạo */}
        {savedLabRequests.length > 0 && (
          <div className="mt-6 pt-5 border-t border-sky-900/10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-blue-800">
                Phiếu đã tạo ({savedLabRequests.length})
              </p>
              <button 
                type="button" 
                onClick={handleRefreshLabRequests}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
              >
                <RefreshCw size={14} /> Cập nhật kết quả
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {savedLabRequests.map((req) => (
                <div key={req.labRequestId} className="bg-white/80 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-sky-100 pb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-extrabold text-blue-900">{req.requestCode}</strong>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.status === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' : req.status === 'IN_PROGRESS' ? 'ĐANG XỬ LÝ' : 'CHỜ TIẾP NHẬN'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(req.requestedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {req.items?.map((item) => (
                      <div key={item.labRequestItemId} className="bg-sky-50/50 rounded-lg p-3 border border-sky-100/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-800">• {item.testName} <span className="text-slate-500 font-medium text-[10px]">({item.testCode})</span></span>
                          {item.labResult ? (
                            <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-bold bg-emerald-100/50 px-2 py-0.5 rounded-full"><CheckCircle size={10}/> Đã có kết quả</span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1 text-[10px] font-bold bg-amber-100/50 px-2 py-0.5 rounded-full">Đang chờ</span>
                          )}
                        </div>
                        
                        {item.labResult && (
                          <div className="ml-2 mt-2 grid grid-cols-2 gap-2 bg-white rounded-md p-2 border border-sky-100">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Giá trị</span>
                              <span className="text-xs font-extrabold text-slate-800">{item.labResult.resultValue} <span className="text-slate-500 font-medium">{item.labResult.resultUnit}</span></span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">CSBT</span>
                              <span className="text-xs font-semibold text-slate-600">{item.labResult.normalRange || "—"}</span>
                            </div>
                            <div className="col-span-2 flex flex-col mt-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Kết luận</span>
                              <span className={`text-xs font-bold ${item.labResult.conclusion?.toLowerCase()?.includes('bất thường') ? 'text-rose-600' : 'text-emerald-700'}`}>{item.labResult.conclusion || "—"}</span>
                            </div>
                            {item.labResult.resultFileUrl && (
                              <div className="col-span-2 mt-2">
                                <a 
                                  href={item.labResult.resultFileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="group block overflow-hidden rounded-lg border border-slate-200 hover:border-teal-400 transition-all shadow-sm relative"
                                >
                                  <img 
                                    src={item.labResult.resultFileUrl} 
                                    alt="Ảnh kết quả xét nghiệm" 
                                    className="w-full h-auto max-h-40 object-cover group-hover:scale-105 transition-transform duration-500" 
                                    onError={(e) => { 
                                      e.target.style.display = 'none'; 
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'flex'; 
                                      }
                                    }} 
                                  />
                                  <div className="hidden items-center justify-center gap-2 p-3 bg-slate-50 text-teal-600 text-xs font-bold group-hover:bg-teal-50 transition-colors">
                                    <ExternalLink size={14} /> Mở file đính kèm
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prescription Section */}
      <div className="patient-glass-panel rounded-[2rem] p-8 shadow-xl border-0 w-full mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <Pill size={20} />
            </div>
            <h3 className="text-xl font-extrabold text-pink-900">Kê đơn thuốc</h3>
          </div>
          {savedPrescription && (
            <button
              onClick={() => navigate(`/dashboard/prescriptions/${savedPrescription.prescriptionId}`)}
              className="flex items-center gap-2 bg-pink-50 hover:bg-pink-100 text-pink-700 px-4 py-2 rounded-xl font-bold text-xs shadow-sm border border-pink-200 transition-all active:scale-95"
            >
              <ExternalLink size={14} /> Xem chi tiết
            </button>
          )}
        </div>

        {/* Đơn thuốc đã tạo */}
        {savedPrescription ? (
          <div className="flex flex-col gap-4">
            <div className="bg-white/80 border border-pink-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <strong className="text-lg font-extrabold text-pink-700">{savedPrescription.prescriptionCode}</strong>
                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${savedPrescription.status === "DISPENSED" ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30" : "bg-amber-500/20 text-amber-700 border border-amber-500/30"}`}>
                  {savedPrescription.status === "CREATED" ? "MỚI TẠO"
                    : savedPrescription.status === "CHECKED" ? "ĐÃ KIỂM TRA"
                    : savedPrescription.status === "DISPENSED" ? "ĐÃ CẤP PHÁT"
                    : savedPrescription.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                <span>{savedPrescription.items?.length || 0} loại thuốc</span>
                <span className="opacity-50">•</span>
                {savedPrescription.drugInteractionChecked
                  ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Đã kiểm tra tương tác</span>
                  : <span className="text-slate-400">Chưa kiểm tra tương tác</span>}
              </div>
              {savedPrescription.interactionWarning && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-medium border flex items-start gap-2 ${savedPrescription.interactionWarning.includes("No dangerous") ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                  {savedPrescription.interactionWarning.includes("No dangerous")
                    ? "✓ Không phát hiện tương tác nguy hiểm"
                    : "⚠ " + savedPrescription.interactionWarning}
                </div>
              )}
            </div>

            {!savedPrescription.drugInteractionChecked && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-pink-100 hover:bg-pink-200 text-pink-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm border border-pink-200 transition-all active:scale-95 disabled:opacity-70"
                  onClick={handleCheckInteractions}
                  disabled={checkingInteractions}
                >
                  <Pill size={16} />
                  {checkingInteractions ? "Đang kiểm tra..." : "Kiểm tra tương tác thuốc"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Form kê đơn mới */
          <div className="flex flex-col gap-4">
            {rxItems.map((item, index) => (
              <div key={index} className="bg-white/60 border border-pink-200/60 rounded-2xl p-5 shadow-sm relative group">
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Thuốc <span className="text-rose-500">*</span></label>
                    <select
                      value={item.medicineId}
                      onChange={(e) => handleRxItemChange(index, "medicineId", e.target.value)}
                      className="w-full bg-white border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none"
                    >
                      <option value="">-- Chọn thuốc --</option>
                      {medicines.map((m) => (
                        <option key={m.medicineId} value={m.medicineId}>
                          {m.medicineName} {m.strength ? `(${m.strength})` : ""}
                        </option>
                      ))}
                    </select>
                    {item.medicineId && (() => {
                      const selectedMed = medicines.find(m => m.medicineId.toString() === item.medicineId.toString());
                      if (selectedMed && (selectedMed.activeIngredient || selectedMed.description)) {
                        return (
                          <div className="text-[11px] text-pink-600 bg-pink-50 p-2 rounded-lg mt-1 border border-pink-100">
                            <strong>Thành phần/Chức năng:</strong> {selectedMed.activeIngredient ? selectedMed.activeIngredient + " - " : ""}{selectedMed.description || ""}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="col-span-4 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Số lượng <span className="text-rose-500">*</span></label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => handleRxItemChange(index, "quantity", e.target.value)}
                      placeholder="10" className="w-full bg-white border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-4 md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Liều dùng</label>
                    <input type="text" value={item.dosage} onChange={(e) => handleRxItemChange(index, "dosage", e.target.value)}
                      placeholder="1 viên/lần" className="w-full bg-white border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-4 md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Tần suất</label>
                    <input type="text" value={item.frequency} onChange={(e) => handleRxItemChange(index, "frequency", e.target.value)}
                      placeholder="2 lần/ngày" className="w-full bg-white border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-3">
                  <div className="col-span-5 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Thời gian dùng</label>
                    <input type="text" value={item.duration} onChange={(e) => handleRxItemChange(index, "duration", e.target.value)}
                      placeholder="7 ngày" className="w-full bg-white border border-pink-200/50 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-5 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Sáng</label>
                    <input type="text" value={item.morningDose} onChange={(e) => handleRxItemChange(index, "morningDose", e.target.value)}
                      placeholder="1" className="w-full bg-white border border-pink-200/50 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-5 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Trưa</label>
                    <input type="text" value={item.noonDose} onChange={(e) => handleRxItemChange(index, "noonDose", e.target.value)}
                      placeholder="0" className="w-full bg-white border border-pink-200/50 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-5 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Chiều</label>
                    <input type="text" value={item.eveningDose} onChange={(e) => handleRxItemChange(index, "eveningDose", e.target.value)}
                      placeholder="0" className="w-full bg-white border border-pink-200/50 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-5 md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-pink-800 ml-1">Tối</label>
                    <input type="text" value={item.nightDose} onChange={(e) => handleRxItemChange(index, "nightDose", e.target.value)}
                      placeholder="1" className="w-full bg-white border border-pink-200/50 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                  <div className="col-span-10 flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-bold text-pink-800 ml-1">Ghi chú riêng / Cách dùng</label>
                    <input type="text" value={item.instructions} onChange={(e) => handleRxItemChange(index, "instructions", e.target.value)}
                      placeholder="Uống sau ăn 30 phút..." className="w-full bg-white border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
                  </div>
                </div>
                {rxItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRxItem(index)}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {/* Ghi chú đơn thuốc */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-xs font-bold text-pink-800 ml-1">Lời dặn đơn thuốc</label>
              <input type="text" value={rxNote} onChange={(e) => setRxNote(e.target.value)}
                placeholder="Uống sau khi ăn, không dùng với rượu..."
                className="w-full bg-white/60 border border-pink-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:bg-white focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all outline-none" />
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={addRxItem}
                className="text-sm font-bold text-pink-600 hover:text-pink-800 transition-all"
              >
                + Thêm thuốc
              </button>
              <button
                type="button"
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
                onClick={handleCreatePrescription}
                disabled={savingRx}
              >
                <Pill size={16} />
                {savingRx ? "Đang tạo..." : "Tạo đơn thuốc"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form bệnh án */}
      <div className="patient-glass-panel rounded-[2rem] p-8 shadow-xl border-0 w-full mb-6 relative overflow-hidden">
        {/* Lớp nền gradient để nhấn mạnh phần quan trọng nhất */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Save size={20} />
            </div>
            <h3 className="text-xl font-extrabold text-indigo-900">Chi tiết Bệnh án</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-indigo-800 ml-1">Triệu chứng <span className="text-rose-500">*</span></label>
              <textarea name="symptoms" value={form.symptoms} onChange={handleChange} rows={2}
                placeholder="Mô tả triệu chứng bệnh nhân..."
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-indigo-800 ml-1">Khám lâm sàng</label>
              <textarea name="clinicalFindings" value={form.clinicalFindings} onChange={handleChange} rows={2}
                placeholder="Kết quả thăm khám thực thể..."
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-indigo-800 ml-1">Chẩn đoán sơ bộ <span className="text-rose-500">*</span></label>
              <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange} rows={2}
                placeholder="Chẩn đoán bệnh..."
                className={`w-full bg-white/70 border ${!form.diagnosis.trim() ? 'border-rose-300' : 'border-indigo-200/50'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none`} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-indigo-800 ml-1">Kế hoạch điều trị</label>
              <textarea name="treatmentPlan" value={form.treatmentPlan} onChange={handleChange} rows={2}
                placeholder="Phác đồ điều trị, thuốc, thủ thuật..."
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-indigo-800 ml-1">Lời dặn của bác sĩ</label>
              <textarea name="doctorNote" value={form.doctorNote} onChange={handleChange} rows={2}
                placeholder="Hướng dẫn chăm sóc, lưu ý..."
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-indigo-800 ml-1">Ngày tái khám</label>
              <input type="date" name="followUpDate" value={form.followUpDate} onChange={handleChange}
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-indigo-800 ml-1">Ghi chú tái khám</label>
              <input type="text" name="followUpNote" value={form.followUpNote} onChange={handleChange}
                placeholder="Ghi chú về lần tái khám..."
                className="w-full bg-white/70 border border-indigo-200/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="w-full flex justify-between items-center bg-white/40 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-xl fixed bottom-4 max-w-[960px] mx-auto z-40">
        <button
          type="button"
          onClick={() => navigate("/dashboard/consultation")}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          Trở về hàng đợi
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70"
            onClick={handleSave}
            disabled={saving || completing || consultation?.status === "COMPLETED"}
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : existingRecordId ? "Cập nhật bệnh án" : "Lưu Bệnh Án"}
          </button>
          
          {consultation?.status === "COMPLETED" ? (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-8 py-2.5 rounded-xl font-black text-sm shadow-sm border border-emerald-200">
              <CheckCircle size={18} /> PHIÊN KHÁM ĐÃ HOÀN THÀNH
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-2.5 rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-70 border border-emerald-400"
              onClick={handleComplete}
              disabled={completing || saving || !form.diagnosis.trim()}
            >
              <CheckCircle size={18} />
              {completing ? "Đang hoàn tất..." : "HOÀN TẤT CA KHÁM"}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const textareaStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6,
  border: "1px solid #d1d5db", fontSize: 14, resize: "vertical",
  fontFamily: "inherit", boxSizing: "border-box",
};

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6,
  border: "1px solid #d1d5db", fontSize: 14,
  fontFamily: "inherit", boxSizing: "border-box",
};
