import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Save,
  ArrowLeft,
  CheckCircle,
  Activity,
  FlaskConical,
  Pill,
  ExternalLink,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Eye,
  Bot,
  Search,
  ChevronRight,
  ClipboardList,
  Users,
  X,
  Pencil,
  PlayCircle
} from "lucide-react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import consultationService from "../../services/consultationService";
import queueTicketService from "../../services/queueTicketService";
import {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
  getPatientMedicalHistory,
} from "../../services/medicalRecordService";
import vitalSignService from "../../services/vitalSignService";
import { createLabRequest, getLabRequestsByConsultationId } from "../../services/labRequestService";
import { getLabTests } from "../../services/labTestService";
import { standardizeClinicalNote } from "../../services/aiChatService";
import PatientRecordModal from "../../components/PatientRecordModal";
import {
  createPrescription,
  getPrescriptionByConsultationId,
  checkDrugInteractions,
  checkInteractionsDraft,
} from "../../services/prescriptionService";
import { getMedicines } from "../../services/medicineService";
import { getPatientById, getPatients } from "../../services/patientService";
import { getDoctorById, getMyDoctorProfile } from "../../services/doctorService";
import { useToast } from "../../context/useToast.js";
import { toLocalDateString } from "../../lib/utils";


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
  doseValue: "",
  doseUnit: "",
  frequency: "",
  frequencyMode: "times",
  frequencyPerDay: "",
  duration: "",
  instructions: "",
  morningDose: "",
  noonDose: "",
  eveningDose: "",
  nightDose: "",
  administrationRoute: "Uống",
  administrationTiming: "",
  administrationSite: "",
  packageInfo: "",
  asNeeded: false,
};

export default function ExaminationPage() {
  const toast = useToast();
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [icd10, setIcd10] = useState("");
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
  const [rxItems, setRxItems] = useState([]);
  const [rxNote, setRxNote] = useState("");
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [savingRx, setSavingRx] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [medSearchTerm, setMedSearchTerm] = useState("");
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const medicineSearchRef = useRef(null);
  const [editingRxIndex, setEditingRxIndex] = useState(null);

  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [rawNote, setRawNote] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New UI states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [showAdvancedDiagnosis, setShowAdvancedDiagnosis] = useState(false);
  const [expandedRxRow, setExpandedRxRow] = useState(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [labSearchTerm, setLabSearchTerm] = useState("");
  const [showLabDropdown, setShowLabDropdown] = useState(false);

  // Patient lookup/search states (when no consultationId is active)
  const [recentPatients, setRecentPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Queue modal states
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueList, setQueueList] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState("Tất cả"); // Tất cả, Cấp cứu, Ưu tiên, Tái khám, Khám mới
  const [queueDoctor, setQueueDoctor] = useState(null);
  const [queuePage, setQueuePage] = useState(1);

  // Load consultation + existing medical record + histories
  useEffect(() => {
    // Always fetch logged-in doctor profile
    getMyDoctorProfile()
      .then((res) => setQueueDoctor(res.data))
      .catch((err) => console.error("Không thể tải thông tin bác sĩ:", err));

    if (!consultationId) {
      setLoading(true);
      getPatients({ size: 100 })
        .then((res) => {
          setRecentPatients(res.data?.content || []);
        })
        .catch((err) => console.error("Không thể tải gợi ý bệnh nhân:", err))
        .finally(() => setLoading(false));
      return;
    }
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

        // Fetch Patient, Doctor and Historical records
        try {
          const [pRes, dRes, historyRes] = await Promise.all([
            getPatientById(c.patientId),
            getDoctorById(c.doctorId),
            getPatientMedicalHistory(c.patientId).catch(() => ({ data: [] }))
          ]);
          setPatientInfo(pRes.data);
          setDoctorInfo(dRes.data);
          setHistoryRecords(historyRes.data || []);
        } catch (err) {
          console.error("Không thể tải thông tin bệnh nhân/bác sĩ/lịch sử", err);
        }

        setSavedVitals(vitalsRes.data || []);
        setLabTests(labTestsRes.data?.content || []);
        setSavedLabRequests(labReqRes.data || []);
        setMedicines(medicinesRes.data?.content || []);
        if (rxRes?.data) {
          setSavedPrescription(rxRes.data);
        }

        // Search for existing medical record of this consultation session
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
            const diag = existing.diagnosis || "";
            const match = diag.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              setIcd10(match[1]);
              setForm({
                symptoms: existing.symptoms || "",
                clinicalFindings: existing.clinicalFindings || "",
                diagnosis: match[2],
                treatmentPlan: existing.treatmentPlan || "",
                doctorNote: existing.doctorNote || "",
                followUpDate: existing.followUpDate || "",
                followUpNote: existing.followUpNote || "",
              });
            } else {
              setIcd10("");
              setForm({
                symptoms: existing.symptoms || "",
                clinicalFindings: existing.clinicalFindings || "",
                diagnosis: diag,
                treatmentPlan: existing.treatmentPlan || "",
                doctorNote: existing.doctorNote || "",
                followUpDate: existing.followUpDate || "",
                followUpNote: existing.followUpNote || "",
              });
            }
          }
        } catch {
          // No record yet
        }
      })
      .catch((err) => setError(err.message || "Không thể tải thông tin phiên khám."))
      .finally(() => setLoading(false));
  }, [consultationId]);

  // Debounced search for suggestion screen when no consultation is active
  useEffect(() => {
    if (!consultationId && searchTerm.trim() !== "") {
      const delayDebounceFn = setTimeout(() => {
        setSearching(true);
        getPatients({ size: 100 })
          .then((res) => {
            const list = res.data?.content || [];
            const query = searchTerm.toLowerCase().trim();
            const filtered = list.filter(p => 
              (p.fullName || "").toLowerCase().includes(query) ||
              (p.patientCode || "").toLowerCase().includes(query) ||
              (p.phone || "").toLowerCase().includes(query)
            );
            setSearchResults(filtered);
          })
          .catch((err) => console.error(err))
          .finally(() => setSearching(false));
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, consultationId]);

  const fetchQueueTickets = useCallback(async () => {
    if (!queueDoctor?.doctorId) return;
    setQueueLoading(true);
    try {
      const todayStr = toLocalDateString(new Date());
      const res = await queueTicketService.getQueue(
        queueDoctor.doctorId,
        todayStr
      );
      const rawList = Array.isArray(res.data) ? res.data : [];
      const activeList = rawList.filter(
        (t) => t.queueStatus === "WAITING" || t.queueStatus === "CALLED"
      );
      setQueueList(activeList);
    } catch (err) {
      console.error("Không thể tải hàng đợi bệnh nhân:", err);
      showToast("Không thể tải hàng đợi bệnh nhân.", "error");
    } finally {
      setQueueLoading(false);
    }
  }, [queueDoctor?.doctorId]);

  useEffect(() => {
    if ((showQueueModal || !consultationId) && queueDoctor?.doctorId) {
      fetchQueueTickets();
    }
  }, [showQueueModal, consultationId, queueDoctor?.doctorId, fetchQueueTickets]);

  useEffect(() => {
    if (!queueDoctor?.doctorId) return;
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace("/api", "") + "/ws-queue" 
      : "http://localhost:8080/ws-queue";

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/queue`, () => {
        if (showQueueModal || !consultationId) {
          fetchQueueTickets();
        }
      });
    };
    stompClient.activate();

    return () => stompClient.deactivate();
  }, [showQueueModal, consultationId, queueDoctor?.doctorId, fetchQueueTickets]);

  const handleStartExamFromQueue = async (ticketId) => {
    try {
      const res = await queueTicketService.startExamination(ticketId);
      showToast("Bắt đầu khám thành công!");
      setShowQueueModal(false);
      if (res.data?.consultationId) {
        navigate(`/dashboard/examination/${res.data.consultationId}`);
      }
    } catch (err) {
      console.error(err);
      showToast("Không thể bắt đầu ca khám: " + (err.response?.data?.message || err.message), "error");
    }
  };

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
      setShowVitalsForm(false);
    } catch (err) {
      showToast(err.message || "Không thể lưu chỉ số sinh tồn.", "error");
    } finally {
      setSavingVitals(false);
    }
  };

  const toggleLabTest = (id) => {
    setSelectedLabTests((prev) => {
      const exists = prev.find(x => x.labTestId === id);
      if (exists) return prev.filter(x => x.labTestId !== id);
      return [...prev, { labTestId: id, note: "" }];
    });
  };

  const handleLabTestNoteChange = (id, note) => {
    setSelectedLabTests((prev) => prev.map(x => x.labTestId === id ? { ...x, note } : x));
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
        items: selectedLabTests.map(x => ({ labTestId: Number(x.labTestId), note: x.note || null })),
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

  // Prescription Handlers
  const handleRxItemChange = (index, field, value) => {
    setRxItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (["morningDose", "noonDose", "eveningDose", "nightDose"].includes(field)) {
        updated[index].frequencyMode = "periods";
        updated[index].frequencyPerDay = "";
      }

      if (field === "medicineId" && value) {
        const selectedMed = medicines.find(m => m.medicineId.toString() === value.toString());
        if (selectedMed && selectedMed.usageInstructions) {
          updated[index].instructions = selectedMed.usageInstructions;
        }
      }
      return updated;
    });
  };

  const focusMedicineSearch = () => {
    setShowMedDropdown(true);
    requestAnimationFrame(() => medicineSearchRef.current?.focus());
  };

  const handleAddMedication = (med) => {
    if (rxItems.some(item => item.medicineId?.toString() === med.medicineId?.toString())) {
      showToast(`Thuốc ${med.medicineName} đã có trong đơn.`, "error");
      return;
    }

    const newItem = {
      ...EMPTY_RX_ITEM,
      medicineId: med.medicineId,
      instructions: med.usageInstructions || "",
      quantity: 1,
      doseUnit: getSuggestedDoseUnit(med),
    };

    setRxItems((prev) => {
      return [...prev, newItem];
    });
    setMedSearchTerm("");
    setShowMedDropdown(false);
  };

  const removeRxItem = (index) =>
    setRxItems((prev) => prev.filter((_, i) => i !== index));

  const formatSchedule = (item) => {
    if (item.asNeeded) return "Dùng khi cần";

    if (item.frequencyMode === "times" && item.frequencyPerDay) {
      return `${item.frequencyPerDay} lần/ngày`;
    }

    const periods = [
      ["Sáng", item.morningDose],
      ["Trưa", item.noonDose],
      ["Chiều", item.eveningDose],
      ["Tối", item.nightDose],
    ].filter(([, dose]) => dose && String(dose).trim());

    return periods.length
      ? periods.map(([label, dose]) => `${label} ${dose}`).join(", ")
      : item.frequency || null;
  };

  const formatDuration = (duration) => {
    const value = String(duration || "").trim();
    return value && /^\d+$/.test(value) ? `${value} ngày` : value || null;
  };

  const getMedicationKind = (medicine) => {
    const source = `${medicine?.dosageForm || ""} ${medicine?.medicineName || ""} ${medicine?.unit || ""}`.toLowerCase();
    if (source.includes("tiêm") || source.includes("ống")) return "injection";
    if (source.includes("nhỏ") || source.includes("eye") || source.includes("mắt")) return "drops";
    if (source.includes("xịt") || source.includes("spray")) return "spray";
    if (source.includes("bôi") || source.includes("kem") || source.includes("gel") || source.includes("mỡ") || source.includes("tuýp")) return "topical";
    if (source.includes("siro") || source.includes("syrup") || source.includes("chai") || source.includes("dung dịch") || source.includes("solution") || source.includes("suspension")) return "liquid";
    return "oral";
  };

  const getSuggestedDoseUnit = (medicine) => {
    const kind = getMedicationKind(medicine);
    if (kind === "liquid") return "ml";
    if (kind === "injection") return "ống";
    if (kind === "drops") return "giọt";
    if (kind === "spray") return "nhát xịt";
    if (kind === "topical" && `${medicine?.dosageForm || ""} ${medicine?.unit || ""}`.toLowerCase().includes("tuýp")) return "tuýp";
    return medicine?.unit || "viên";
  };

  const formatDose = (item) => {
    if (item.doseValue) return `${item.doseValue} ${item.doseUnit || ""}`.trim();
    return item.dosage || "Chưa nhập liều";
  };

  const formatUsageSummary = (item) => {
    const parts = [item.administrationRoute, `${formatDose(item)}/lần`, formatSchedule(item), item.administrationTiming]
      .filter(Boolean);
    if (item.administrationSite) parts.push(item.administrationSite);
    return parts.join(", ");
  };

  const handleCreatePrescription = async () => {
    const validItems = rxItems.filter((i) => i.medicineId && i.quantity);
    if (validItems.length === 0) {
      showToast("Vui lòng chọn ít nhất một thuốc và nhập số lượng.", "error");
      return;
    }
    setSavingRx(true);
    try {
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

      const res = await createPrescription({
        consultationId: Number(consultationId),
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        doctorNote: rxNote || null,
        items: validItems.map((i) => ({
          medicineId: Number(i.medicineId),
          quantity: Number(i.quantity),
          dosage: formatDose(i) || null,
          frequency: formatSchedule(i),
          duration: formatDuration(i.duration),
          instructions: i.instructions || null,
          morningDose: i.morningDose || null,
          noonDose: i.noonDose || null,
          eveningDose: i.eveningDose || null,
          nightDose: i.nightDose || null,
          administrationRoute: i.administrationRoute || null,
          administrationTiming: i.administrationTiming || null,
          administrationSite: i.administrationSite || null,
          packageInfo: i.packageInfo || null,
          asNeeded: Boolean(i.asNeeded),
        })),
      });
      setSavedPrescription(res.data);
      setRxItems([]);
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

  // Medical Record Handlers
  const handleSave = async () => {
    if (!form.diagnosis.trim()) {
      setError("Chẩn đoán không được để trống.");
      return false;
    }

    if (form.followUpDate) {
      const followUpDate = new Date(form.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (followUpDate < today) {
        setError("Ngày tái khám không được ở trong quá khứ.");
        return false;
      }
    }

    setSaving(true);
    setError("");
    const finalDiagnosis = icd10.trim() ? `[${icd10.trim()}] ${form.diagnosis.trim()}` : form.diagnosis.trim();

    try {
      if (existingRecordId) {
        await updateMedicalRecord(existingRecordId, {
          symptoms: form.symptoms || null,
          clinicalFindings: form.clinicalFindings || null,
          diagnosis: finalDiagnosis,
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
          diagnosis: finalDiagnosis,
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
      const data = await standardizeClinicalNote(rawNote);
      if (!data || typeof data !== "object") {
        throw new Error("AI không trả về dữ liệu bệnh án hợp lệ.");
      }

      const standardized = {
        symptoms: typeof data.symptoms === "string" ? data.symptoms.trim() : "",
        clinicalFindings: typeof data.clinicalFindings === "string" ? data.clinicalFindings.trim() : "",
        diagnosis: typeof data.diagnosis === "string" ? data.diagnosis.trim() : "",
        treatmentPlan: typeof data.treatmentPlan === "string" ? data.treatmentPlan.trim() : "",
        doctorNote: typeof data.doctorNote === "string" ? data.doctorNote.trim() : "",
      };

      if (!Object.values(standardized).some(Boolean)) {
        throw new Error("AI chưa trích xuất được thông tin nào. Vui lòng bổ sung ghi chú rõ hơn.");
      }

      const diag = standardized.diagnosis;
      const match = diag.match(/^\[(.*?)\]\s*(.*)$/);
      if (match?.[1]) {
        setIcd10(match[1].trim());
      }
      setForm((prev) => ({
        ...prev,
        symptoms: standardized.symptoms || prev.symptoms,
        clinicalFindings: standardized.clinicalFindings || prev.clinicalFindings,
        diagnosis: (match?.[2] || diag) || prev.diagnosis,
        treatmentPlan: standardized.treatmentPlan || prev.treatmentPlan,
        doctorNote: standardized.doctorNote || prev.doctorNote,
      }));

      if (standardized.clinicalFindings || standardized.treatmentPlan || standardized.doctorNote) {
        setShowAdvancedDiagnosis(true);
      }
      setRawNote("");
      showToast("Đã chuẩn hóa và điền tự động thành công!");
    } catch (err) {
      if (!err.toastShown) {
        showToast(err.response?.data?.message || err.message || "Không thể chuẩn hóa bệnh án.", "error");
      }
    } finally {
      setAiProcessing(false);
    }
  };

  const handleComplete = async () => {
    // Kiểm tra xem có đơn thuốc chưa lưu không
    const validRxItems = rxItems.filter((i) => i.medicineId && i.quantity);
    if (validRxItems.length > 0) {
      showToast("Bạn có đơn thuốc đang soạn dở. Vui lòng bấm 'Lưu đơn thuốc' trước khi hoàn tất phiên khám!", "error");
      return;
    }

    // Kiểm tra xem có xét nghiệm chưa lưu không
    if (selectedLabTests.length > 0) {
      showToast("Bạn có chỉ định xét nghiệm chưa được lưu. Vui lòng bấm 'Lưu chỉ định' trước khi hoàn tất!", "error");
      return;
    }

    if (!window.confirm("Xác nhận hoàn tất phiên khám?\nThao tác này sẽ cập nhật trạng thái lịch hẹn thành COMPLETED.")) return;
    setCompleting(true);
    setError("");
    try {
      const saved = await handleSave();
      if (!saved) {
        setCompleting(false);
        return;
      }
      await consultationService.complete(consultationId);
      showToast("Phiên khám đã hoàn thành! Đang chuyển về hàng đợi...");
      setTimeout(() => navigate("/dashboard/examination"), 1800);
    } catch (err) {
      setError(err.message || "Không thể hoàn tất phiên khám.");
    } finally {
      setCompleting(false);
    }
  };

  const getAge = (dobString) => {
    if (!dobString) return "—";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Tuổi`;
  };

  const renderQueueModal = () => {
    if (!showQueueModal) return null;

    const filteredList = queueList.filter((ticket) => {
      const query = queueSearch.toLowerCase().trim();
      const matchSearch =
        (ticket.patientName || "").toLowerCase().includes(query) ||
        (ticket.patientPhone || "").toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (queueFilter === "Tất cả") return true;
      if (queueFilter === "Cấp cứu") return ticket.priorityLevel === "EMERGENCY";
      if (queueFilter === "Ưu tiên") return ticket.priorityLevel === "PRIORITY";
      if (queueFilter === "Tái khám") return ticket.priorityLevel === "REEXAMINATION";
      if (queueFilter === "Khám mới") {
        return ticket.priorityLevel !== "EMERGENCY" && ticket.priorityLevel !== "PRIORITY" && ticket.priorityLevel !== "REEXAMINATION";
      }
      return true;
    });

    const itemsPerPage = 4;
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (queuePage - 1) * itemsPerPage;
    const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Danh sách bệnh nhân chờ khám</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {queueList.filter(t => t.queueStatus === 'WAITING' || t.queueStatus === 'CALLED').length} bệnh nhân đang chờ
              </p>
            </div>
            <button
              onClick={() => setShowQueueModal(false)}
              className="w-10 h-10 rounded-full hover:bg-slate-50 text-slate-450 hover:text-slate-600 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Filters and Search */}
          <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 shrink-0 bg-slate-50/30">
            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã Bệnh nhân..."
                value={queueSearch}
                onChange={(e) => {
                  setQueueSearch(e.target.value);
                  setQueuePage(1);
                }}
                className="w-full bg-white border border-slate-200 focus:border-[#0A604E] rounded-xl pl-9 pr-3 py-2 text-[11px] text-slate-700 font-bold outline-none transition-all placeholder:text-slate-450"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {[
                { key: "Tất cả", label: `Tất cả (${queueList.length})` },
                { key: "Cấp cứu", label: `Cấp cứu (${queueList.filter(t => t.priorityLevel === "EMERGENCY").length})` },
                { key: "Ưu tiên", label: `Ưu tiên (${queueList.filter(t => t.priorityLevel === "PRIORITY").length})` },
                { key: "Tái khám", label: `Tái khám (${queueList.filter(t => t.priorityLevel === "REEXAMINATION").length})` },
                { key: "Khám mới", label: `Khám mới (${queueList.filter(t => t.priorityLevel !== "EMERGENCY" && t.priorityLevel !== "PRIORITY" && t.priorityLevel !== "REEXAMINATION").length})` }
              ].map((tab) => {
                const isActive = queueFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setQueueFilter(tab.key);
                      setQueuePage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all ${
                      isActive
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-750"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto p-6 min-h-[250px]">
            {queueLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-[#0A604E]" />
                <span className="text-[11px] text-slate-400 font-bold">Đang tải danh sách chờ...</span>
              </div>
            ) : paginatedList.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2 w-16">STT</th>
                    <th className="pb-3 w-64">Patient Info</th>
                    <th className="pb-3 w-32">Time</th>
                    <th className="pb-3 w-40">Status/Priority</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3 text-right pr-2 w-40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((ticket, index) => {
                    const initials = (ticket.patientName || "BN").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                    let priorityBadge = null;
                    if (ticket.priorityLevel === "EMERGENCY") {
                      priorityBadge = <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">▲ Cấp cứu</span>;
                    } else if (ticket.priorityLevel === "PRIORITY") {
                      priorityBadge = <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">★ Ưu tiên</span>;
                    } else if (ticket.priorityLevel === "REEXAMINATION") {
                      priorityBadge = <span className="bg-sky-50 border border-sky-100 text-sky-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">Tái khám</span>;
                    } else {
                      priorityBadge = <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">Khám mới</span>;
                    }

                    return (
                      <tr key={ticket.queueTicketId} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors group">
                        <td className="py-4 pl-2 font-extrabold text-slate-800 text-xs">#{ticket.queueNumber || (startIndex + index + 1)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 overflow-hidden shrink-0 flex items-center justify-center text-teal-655 font-bold text-xs">
                              <span>{initials}</span>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs tracking-tight group-hover:text-teal-705 transition-colors">{ticket.patientName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                SĐT: {ticket.patientPhone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-extrabold text-slate-700">
                          {ticket.startTime ? String(ticket.startTime).substring(0, 5) : "—"}
                        </td>
                        <td className="py-4">
                          {priorityBadge}
                        </td>
                        <td className="py-4 text-xs font-semibold text-slate-500 max-w-xs truncate">
                          {ticket.queueStatus === "WAITING" ? "Đang chờ" : ticket.queueStatus === "CALLED" ? "Đã được gọi" : ticket.queueStatus}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => handleStartExamFromQueue(ticket.queueTicketId)}
                            className="bg-[#1DB896] hover:bg-[#159a7c] text-white font-extrabold text-[10px] tracking-wide px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ml-auto uppercase"
                          >
                            Bắt đầu khám <ChevronRight size={10} className="stroke-[2.5]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center py-10">
                <Users size={48} className="text-slate-350 stroke-[1.2] mb-3" />
                <p className="text-xs text-slate-450 font-bold">Không có bệnh nhân nào trong danh sách chờ của bộ lọc này.</p>
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          <div className="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20 text-[10px] font-bold text-slate-400">
            <span>
              Hiển thị {totalItems > 0 ? startIndex + 1 : 0} đến {Math.min(startIndex + itemsPerPage, totalItems)} của {totalItems} bệnh nhân
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={queuePage === 1}
                onClick={() => setQueuePage(p => Math.max(p - 1, 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                &lt;
              </button>
              <span className="text-slate-800 font-extrabold px-1">Trang {queuePage} / {totalPages}</span>
              <button
                disabled={queuePage === totalPages}
                onClick={() => setQueuePage(p => Math.min(p + 1, totalPages))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-emerald-600" size={32} />
          <span className="text-slate-500 font-bold text-sm">Đang tải phiên khám...</span>
        </div>
      </div>
    );
  }

  if (!consultationId) {
    return (
      <div className="w-full max-w-[1000px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 animate-fadeIn">
        {/* Top Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-5">
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A604E] flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
            <Stethoscope size={18} className="stroke-[2.5]" />
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Khám bệnh</h1>
        </div>

        {/* Empty State Panel - Modified to show queue directly */}
        <div className="w-full bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-8 shadow-[0_10px_35px_rgba(0,0,0,0.02)] flex flex-col items-center">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm text-[#0A604E] mb-4">
              <Users size={28} className="stroke-[2]" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Chưa có bệnh nhân đang khám
            </h2>
            <p className="text-sm text-slate-400 font-bold max-w-sm mt-2 leading-relaxed text-center">
              Dưới đây là danh sách hàng đợi của bạn. Nhấn "Bắt đầu khám" để gọi bệnh nhân vào phòng.
            </p>
          </div>

          <div className="w-full bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold text-slate-800">Danh sách chờ khám</h3>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">
                  {queueList.length} bệnh nhân
                </span>
              </div>
              <button 
                onClick={fetchQueueTickets}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0A604E] transition-colors"
              >
                <RefreshCw size={14} className={queueLoading ? "animate-spin" : ""} />
                Làm mới
              </button>
            </div>

            <div className="w-full overflow-x-auto min-h-[150px] flex flex-col relative">
              {queueLoading && queueList.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <RefreshCw className="animate-spin text-[#0A604E]" size={24} />
                </div>
              ) : queueList.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 w-16">STT</th>
                      <th className="py-3 px-4 w-64">Bệnh nhân</th>
                      <th className="py-3 px-4 w-40">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {queueList.map((ticket, idx) => (
                      <tr key={ticket.queueTicketId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-4 font-extrabold text-slate-800 text-xs">#{ticket.queueNumber}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                              {(ticket.patientName || "BN").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-[#0A604E] transition-colors">{ticket.patientName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">SĐT: {ticket.patientPhone || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {ticket.priorityLevel === "EMERGENCY" ? (
                            <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">▲ Cấp cứu</span>
                          ) : ticket.priorityLevel === "PRIORITY" ? (
                            <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">★ Ưu tiên</span>
                          ) : ticket.priorityLevel === "REEXAMINATION" ? (
                            <span className="bg-sky-50 border border-sky-100 text-sky-700 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">Tái khám</span>
                          ) : (
                            <span className="bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase">Khám mới</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleStartExamFromQueue(ticket.queueTicketId)}
                            className="inline-flex items-center gap-1.5 bg-[#0A604E] hover:bg-[#07473a] text-white px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all shadow-sm active:scale-95"
                          >
                            <PlayCircle size={14} /> Bắt đầu khám
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
                    <ClipboardList size={20} />
                  </div>
                  <p className="text-xs text-slate-500 font-bold">Không có bệnh nhân nào đang đợi khám.</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {renderQueueModal()}
      </div>
    );
  }

  const avatarUrl = typeof patientInfo?.avatarUrl === "string" && patientInfo.avatarUrl.trim() && patientInfo.avatarUrl !== "null"
    ? patientInfo.avatarUrl
    : null;

  const allergyList = patientInfo?.allergies ? patientInfo.allergies.split('\n').filter(Boolean) : [];
  const historyList = patientInfo?.medicalHistory ? patientInfo.medicalHistory.split('\n').filter(Boolean) : [];

  const filteredLabTests = labTests.filter(t => 
    !selectedLabTests.some(x => x.labTestId === t.labTestId) &&
    (t.testName.toLowerCase().includes(labSearchTerm.toLowerCase()) || 
     t.testCode.toLowerCase().includes(labSearchTerm.toLowerCase()))
  );
  
  const selectedTestsData = selectedLabTests.map(item => {
    const t = labTests.find(x => x.labTestId === item.labTestId);
    return t ? { ...t, note: item.note } : null;
  }).filter(Boolean);

  const editingRxItem = editingRxIndex === null ? null : rxItems[editingRxIndex];
  const editingMedicine = editingRxItem
    ? medicines.find((medicine) => medicine.medicineId.toString() === editingRxItem.medicineId.toString())
    : null;
  const editingMedicationKind = getMedicationKind(editingMedicine);
  const doseUnits = [...new Set([getSuggestedDoseUnit(editingMedicine), editingMedicine?.unit, "viên", "ml", "giọt", "ống", "tuýp", "nhát xịt", "gói", "lần"].filter(Boolean))];

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative pb-8">

      {/* Top Breadcrumb/Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/consultation")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm group active:scale-95"
            title="Trở lại hàng đợi"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Stethoscope size={14} className="stroke-[2.5]" />
              </span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Khám bệnh</h1>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Phiên khám #{consultationId}</p>
          </div>
        </div>

        {consultation && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Trạng thái:</span>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase shadow-sm ${consultation.status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-655"}`}>
              {consultation.status === "IN_PROGRESS" ? "Đang khám" : consultation.status}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fadeIn">
          <AlertCircle size={20} className="text-rose-500 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {showHistoryModal && (
        <PatientRecordModal
          patientId={consultation.patientId}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Main Two-Column Workflow Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">

        {/* LEFT COLUMN: Patient Info, History, Vitals, Prev Records */}
        <div className="lg:col-span-5 lg:row-span-3 flex flex-col gap-6 w-full">

          {/* CARD 1: Patient Profile Card */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-sm bg-emerald-50 flex items-center justify-center text-[#0A604E]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Ảnh bệnh nhân" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} aria-label="Chưa có ảnh bệnh nhân" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    {patientInfo?.fullName || "Bệnh nhân"}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black tracking-wide uppercase border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đang khám
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold mt-1.5">
                  Mã BN: {patientInfo?.patientCode || "#BN-88291"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-50 pt-5">
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">TUỔI</span>
                <span className="text-base font-extrabold text-slate-800 mt-1">
                  {getAge(patientInfo?.dateOfBirth)}
                </span>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">GIỚI TÍNH</span>
                <span className="text-base font-extrabold text-slate-800 mt-1">
                  {patientInfo?.gender === 'MALE' ? 'Nam' : patientInfo?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: Medical History (Tiền sử bệnh) */}
          <div className="bg-rose-50/30 border border-rose-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)] transition-all">
            <div className="flex justify-between items-center pb-3 border-b border-rose-100/50">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={14} className="stroke-[2.5]" />
                </span>
                <h4 className="text-sm font-extrabold text-rose-800">Tiền sử bệnh</h4>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 text-rose-700 text-xs font-semibold leading-relaxed">
              {allergyList.map((item, idx) => (
                <div key={`alg-${idx}`} className="flex items-start gap-2 bg-white/50 border border-rose-100/50 rounded-xl p-2.5">
                  <span className="mt-0.5 text-xs text-rose-500 font-extrabold">•</span>
                  <span><strong>Dị ứng:</strong> {item}</span>
                </div>
              ))}
              {historyList.map((item, idx) => (
                <div key={`hist-${idx}`} className="flex items-start gap-2 bg-white/50 border border-rose-100/50 rounded-xl p-2.5">
                  <span className="mt-0.5 text-xs text-rose-500 font-extrabold">•</span>
                  <span><strong>Bệnh lý:</strong> {item}</span>
                </div>
              ))}
              {allergyList.length === 0 && historyList.length === 0 && (
                <span className="text-slate-400 font-medium italic">Không ghi nhận dị ứng hoặc bệnh nền.</span>
              )}
            </div>
          </div>

          {/* CARD 3: Vital Signs (Chỉ số sinh tồn) */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Activity size={14} className="stroke-[2.5]" />
                </span>
                <h4 className="text-sm font-extrabold text-slate-800">Chỉ số sinh tồn</h4>
              </div>

              <button
                type="button"
                onClick={() => setShowVitalsForm(!showVitalsForm)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider flex items-center gap-1"
              >
                {showVitalsForm ? "Hủy" : "+ Đo chỉ số"}
              </button>
            </div>

            {showVitalsForm && (
              <div className="flex flex-col gap-4 mt-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "heightCm", label: "Chiều cao (cm)", placeholder: "170" },
                    { name: "weightKg", label: "Cân nặng (kg)", placeholder: "65" },
                    { name: "temperatureC", label: "Nhiệt độ (°C)", placeholder: "37" },
                    { name: "heartRate", label: "Nhịp tim (l/p)", placeholder: "80" },
                    { name: "bloodPressureSystolic", label: "HA tâm thu (mmHg)", placeholder: "120" },
                    { name: "bloodPressureDiastolic", label: "HA tâm trương (mmHg)", placeholder: "80" },
                    { name: "respiratoryRate", label: "Nhịp thở (l/p)", placeholder: "18" },
                    { name: "spo2", label: "SpO2 (%)", placeholder: "98" },
                  ].map((field) => (
                    <div key={field.name} className="flex flex-col gap-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">{field.label}</label>
                      <input
                        type="number"
                        name={field.name}
                        value={vitals[field.name]}
                        onChange={handleVitalsChange}
                        placeholder={field.placeholder}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSaveVitals}
                  disabled={savingVitals}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-75"
                >
                  <Save size={12} />
                  {savingVitals ? "Đang lưu..." : "Lưu chỉ số sinh tồn"}
                </button>
              </div>
            )}

            {/* Latest Vitals Table */}
            {savedVitals.length > 0 ? (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-2 pr-2">Thời gian</th>
                        <th className="py-2 px-2">H.áp</th>
                        <th className="py-2 px-2">Mạch</th>
                        <th className="py-2 px-2">Nhiệt độ</th>
                        <th className="py-2 pl-2">SpO2</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {savedVitals.slice(0, 3).map((v, idx) => (
                        <tr key={v.vitalSignId} className={`hover:bg-slate-50/50 ${idx === 0 ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}>
                          <td className="py-2 pr-2">
                            {new Date(v.measuredAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-2 px-2">
                            {v.bloodPressureSystolic && v.bloodPressureDiastolic
                              ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                              : "—"}
                          </td>
                          <td className="py-2 px-2">{v.heartRate ? `${v.heartRate} l/p` : "—"}</td>
                          <td className="py-2 px-2">{v.temperatureC ? `${v.temperatureC}°C` : "—"}</td>
                          <td className="py-2 pl-2">{v.spo2 != null ? `${v.spo2}%` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {savedVitals.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-[10px] rounded-xl text-center transition-all border border-slate-100"
                  >
                    Xem lịch sử đo đầy đủ ({savedVitals.length} lần)
                  </button>
                )}
              </div>
            ) : (
              <p className="text-slate-400 font-medium italic text-xs mt-4">Chưa có chỉ số sinh tồn đo hôm nay.</p>
            )}
          </div>

          {/* CARD 4: Previous Examinations Timeline */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-655 flex items-center justify-center shrink-0">
                  <Clock size={14} className="stroke-[2.5]" />
                </span>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">CÁC LẦN KHÁM TRƯỚC</h4>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Xem tất cả
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {historyRecords.length === 0 ? (
                <p className="text-slate-400 font-medium italic text-xs">Chưa ghi nhận lịch sử khám bệnh án trước đây.</p>
              ) : (
                historyRecords.slice(0, 3).map((rec, i) => {
                  const dateStr = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString("vi-VN") : "—";
                  return (
                    <div key={rec.medicalRecordId} className="flex gap-4 relative">
                      {i < Math.min(historyRecords.length, 3) - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-0 w-[2px] bg-slate-100"></div>
                      )}
                      <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm shrink-0 mt-1 z-10 ${i === 0 ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300'}`}></div>
                      <div className="flex flex-col gap-0.5 pb-4 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{dateStr}</span>
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{rec.departmentName || "Khám bệnh"}</span>
                        </div>
                        <strong className="text-xs font-extrabold text-slate-800 leading-tight mt-1">{rec.diagnosis}</strong>
                        {rec.doctorName && (
                          <span className="text-[10px] font-bold text-slate-400 italic">Bác sĩ: {rec.doctorName}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI helper, Symptoms/Diagnosis, Lab requests; prescription spans a separate full row. */}
        <div className="flex flex-col gap-6 w-full lg:contents">

          {/* CARD 0: AI Smart Notes Helper */}
          <div className="bg-gradient-to-br from-fuchsia-50/50 via-purple-50/30 to-white border border-purple-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(232,121,249,0.02)] transition-all lg:col-span-7 lg:col-start-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100/50">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-extrabold text-purple-950">Trợ lý chuẩn hóa bệnh án AI</h4>
                  <p className="text-[10px] text-purple-600 font-bold">Ghi nhận thông tin lâm sàng nhanh bằng trí tuệ nhân tạo</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <textarea
                rows={3}
                placeholder="Ví dụ: bn nam 65t ho, sốt 39 độ, đau ngực trái kéo dài, tiền sử đái tháo đường. Chẩn đoán viêm phổi cấp."
                value={rawNote}
                onChange={(e) => setRawNote(e.target.value)}
                disabled={aiProcessing}
                className="w-full bg-white border border-purple-100 rounded-2xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-purple-400 outline-none transition-all placeholder-purple-300"
              />
              <button
                type="button"
                onClick={handleStandardizeNote}
                disabled={aiProcessing || !rawNote.trim()}
                className="self-start flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {aiProcessing ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Đang xử lý chuẩn hóa...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    AI Chuẩn hóa & Điền tự động
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD 1: Symptoms & Diagnosis Form */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all lg:col-span-7 lg:col-start-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50 mb-5">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText size={14} className="stroke-[2.5]" />
              </span>
              <h4 className="text-sm font-extrabold text-slate-800">Triệu chứng & Chẩn đoán</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

              {/* Symptoms */}
              <div className="sm:col-span-12 flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Triệu chứng lâm sàng <span className="text-rose-500">*</span></label>
                <textarea
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Mô tả các triệu chứng lâm sàng ghi nhận từ bệnh nhân..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Diagnosis Confirmation Box */}
              <div className="sm:col-span-3 flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Mã ICD-10</label>
                <input
                  type="text"
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="VD: I10.x"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-bold focus:border-emerald-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="sm:col-span-9 flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Chẩn đoán xác định <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Chẩn đoán bệnh lý cụ thể..."
                  className={`w-full bg-white border ${!form.diagnosis.trim() ? 'border-rose-200 focus:border-rose-400' : 'border-slate-200 focus:border-emerald-500'} rounded-xl px-4 py-2.5 text-sm text-slate-700 font-bold outline-none transition-all`}
                />
              </div>

              {/* Collapsible Action for Clinical Findings and Treatments */}
              <div className="sm:col-span-12 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedDiagnosis(!showAdvancedDiagnosis)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                >
                  <span>Thông tin mở rộng (Khám thực thể, phác đồ, tái khám)</span>
                  {showAdvancedDiagnosis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showAdvancedDiagnosis && (
                <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 animate-fadeIn">

                  {/* Clinical Findings */}
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Khám lâm sàng / Thực thể</label>
                    <textarea
                      name="clinicalFindings"
                      value={form.clinicalFindings}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Kết quả thăm khám thực thể..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Treatment Plan */}
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Kế hoạch & Phác đồ điều trị</label>
                    <textarea
                      name="treatmentPlan"
                      value={form.treatmentPlan}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Chi tiết phác đồ điều trị..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Doctor note instructions */}
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Lời dặn của bác sĩ</label>
                    <textarea
                      name="doctorNote"
                      value={form.doctorNote}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Hướng dẫn chăm sóc đặc biệt..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  {/* Follow-up date & note */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Ngày tái khám</label>
                    <input
                      type="date"
                      name="followUpDate"
                      value={form.followUpDate}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-bold focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Ghi chú tái khám</label>
                    <input
                      type="text"
                      name="followUpNote"
                      value={form.followUpNote}
                      onChange={handleChange}
                      placeholder="VD: Mang theo kết quả máu cũ..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-medium focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* CARD 2: Prescription Table (Kê đơn thuốc) */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all lg:order-3 lg:col-span-12 lg:col-start-1">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Pill size={14} className="stroke-[2.5]" />
                </span>
                <h4 className="text-sm font-extrabold text-slate-800">Đơn thuốc</h4>
              </div>

              {!savedPrescription && (
                <button
                  type="button"
                  onClick={focusMedicineSearch}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-wider"
                >
                  <Plus size={14} /> Thêm thuốc
                </button>
              )}

              {savedPrescription && (
                <button
                  onClick={() => navigate(`/dashboard/prescriptions/${savedPrescription.prescriptionId}`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0A604E] transition-colors"
                >
                  <ExternalLink size={14} /> Xem chi tiết đơn
                </button>
              )}
            </div>

            {savedPrescription ? (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <strong className="text-sm font-extrabold text-[#0A604E]">{savedPrescription.prescriptionCode}</strong>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-[#0A604E] border border-emerald-200">
                      {savedPrescription.status === "CREATED" ? "MỚI TẠO"
                        : savedPrescription.status === "CHECKED" ? "ĐÃ KIỂM TRA"
                          : savedPrescription.status === "DISPENSED" ? "ĐÃ CẤP PHÁT"
                            : savedPrescription.status}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 pr-2">Tên thuốc</th>
                          <th className="py-2.5 px-2">Cách dùng</th>
                          <th className="py-2.5 px-2">Số ngày</th>
                          <th className="py-2.5 pl-2 w-24">Tổng cấp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {savedPrescription.items?.map((it, idx) => {
                          return (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="py-2.5 pr-2 font-extrabold text-slate-800">{it.medicineName} {it.strength ? `(${it.strength})` : ""}</td>
                              <td className="py-2.5 px-2 text-slate-600">{formatUsageSummary(it)}</td>
                              <td className="py-2.5 px-2">{it.duration || "—"}</td>
                              <td className="py-2.5 pl-2">{it.quantity} {it.unit || ""}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {savedPrescription.interactionWarning && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-semibold border flex items-start gap-2 ${savedPrescription.interactionWarning.includes("No dangerous") ? "bg-emerald-50 border-emerald-200 text-[#0A604E]" : "bg-amber-50 border-amber-200 text-amber-850"}`}>
                      {savedPrescription.interactionWarning.includes("No dangerous")
                        ? "✓ Không phát hiện tương tác nguy hiểm"
                        : "⚠ " + savedPrescription.interactionWarning}
                    </div>
                  )}
                </div>

                {!savedPrescription.drugInteractionChecked && (
                  <button
                    type="button"
                    className="self-start flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#0A604E] border border-emerald-200 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-70"
                    onClick={handleCheckInteractions}
                    disabled={checkingInteractions}
                  >
                    <Pill size={14} />
                    {checkingInteractions ? "Đang kiểm tra..." : "Kiểm tra tương tác thuốc"}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <div className="flex items-center bg-white border border-slate-200 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-2xl px-4 py-2.5 transition-all shadow-sm">
                    <Search size={18} className="text-slate-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      ref={medicineSearchRef}
                      placeholder="Tìm kiếm & thêm thuốc (VD: Paracetamol, Augmentin...)"
                      value={medSearchTerm}
                      onChange={(e) => {
                        setMedSearchTerm(e.target.value);
                        setShowMedDropdown(true);
                      }}
                      onFocus={() => setShowMedDropdown(true)}
                      className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                    />
                    {medSearchTerm && (
                      <button onClick={() => setMedSearchTerm("")} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown Results */}
                  {showMedDropdown && (medSearchTerm || medicines.length > 0) && (
                    <div className="absolute z-10 top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto overflow-x-hidden animate-fadeIn">
                      {medicines
                        .filter(m => m.medicineName.toLowerCase().includes(medSearchTerm.toLowerCase()) || (m.activeIngredient && m.activeIngredient.toLowerCase().includes(medSearchTerm.toLowerCase())))
                        .map(med => (
                          <div 
                            key={med.medicineId} 
                            onClick={() => handleAddMedication(med)}
                            className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group"
                          >
                            <div>
                              <div className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-800 transition-colors">{med.medicineName} {med.strength && <span className="text-emerald-600 font-bold ml-1">({med.strength})</span>}</div>
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{med.activeIngredient || "Không rõ hoạt chất"} - Đ.Vị: {med.unit}</div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={14} />
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-1 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[1060px] table-fixed text-left text-xs">
                    <colgroup>
                      <col className="w-10" />
                      <col className="w-[130px]" />
                      <col className="w-[58px]" />
                      <col className="w-[76px]" />
                      <col className="w-[108px]" />
                      <col className="w-[62px]" />
                      <col className="w-[62px]" />
                      <col className="w-[62px]" />
                      <col className="w-[62px]" />
                      <col className="w-[118px]" />
                      <col className="w-[62px]" />
                      <col className="w-[140px]" />
                      <col className="w-[46px]" />
                    </colgroup>
                    <thead className="bg-emerald-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="border-b border-emerald-100 px-2 py-3 text-center">STT</th>
                        <th className="border-b border-emerald-100 px-2 py-3">Thuốc</th>
                        <th className="border-b border-emerald-100 px-2 py-3 text-center">Đơn vị</th>
                        <th className="border-b border-emerald-100 px-2 py-3 text-center">SL cấp</th>
                        <th className="border-b border-emerald-100 px-2 py-3">Đường dùng</th>
                        {["Sáng", "Trưa", "Chiều", "Tối"].map((label) => <th key={label} className="border-b border-emerald-100 px-1 py-3 text-center">{label}</th>)}
                        <th className="border-b border-emerald-100 px-2 py-3">Dùng lúc</th>
                        <th className="border-b border-emerald-100 px-2 py-3 text-center">Số ngày</th>
                        <th className="border-b border-emerald-100 px-2 py-3">Dặn dò</th>
                        <th className="border-b border-emerald-100 px-2 py-3 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rxItems.length > 0 ? rxItems.map((item, index) => {
                        const med = medicines.find((medicine) => medicine.medicineId.toString() === item.medicineId.toString());
                        if (!med) return null;
                        const displayUnit = item.doseUnit || getSuggestedDoseUnit(med);
                        return (
                          <tr key={item.medicineId} className="hover:bg-emerald-50/30">
                            <td className="px-3 py-3 text-center font-black text-slate-400">{index + 1}</td>
                            <td className="px-2 py-3"><div className="line-clamp-2 font-extrabold leading-tight text-slate-800">{med.medicineName} {med.strength ? `(${med.strength})` : ""}</div><div className="mt-1 truncate text-[10px] font-medium text-slate-400">{med.activeIngredient || "Chưa có hoạt chất"}</div></td>
                            <td className="px-2 py-3 text-center font-bold text-emerald-700">{med.unit || "—"}</td>
                            <td className="p-2"><div className="relative"><input aria-label={`Số lượng cấp ${med.medicineName}`} type="number" min="1" value={item.quantity || ""} onChange={(event) => handleRxItemChange(index, "quantity", event.target.value)} className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 pr-10 text-center font-bold outline-none focus:border-emerald-400 focus:bg-white" /><span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[9px] font-bold text-slate-400">{med.unit || ""}</span></div></td>
                            <td className="p-2"><select aria-label={`Đường dùng ${med.medicineName}`} value={item.administrationRoute || "Uống"} onChange={(event) => handleRxItemChange(index, "administrationRoute", event.target.value)} className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 font-bold outline-none focus:border-emerald-400 focus:bg-white">{["Uống", "Tiêm bắp", "Tiêm TM", "Truyền", "Bôi", "Nhỏ", "Xịt", "Đặt", "Khác"].map((route) => <option key={route} value={route}>{route}</option>)}</select></td>
                            {[["morningDose", "Sáng"], ["noonDose", "Trưa"], ["eveningDose", "Chiều"], ["nightDose", "Tối"]].map(([field, label]) => <td key={field} className="p-2"><div className="relative"><input aria-label={`${label} ${med.medicineName}`} value={item[field] || ""} onChange={(event) => handleRxItemChange(index, field, event.target.value)} placeholder="—" className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 pr-8 text-center font-bold outline-none focus:border-emerald-400 focus:bg-white" /><span className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-[9px] font-bold text-slate-400">{displayUnit}</span></div></td>)}
                            <td className="p-2"><select aria-label={`Thời điểm dùng ${med.medicineName}`} value={item.administrationTiming || ""} onChange={(event) => handleRxItemChange(index, "administrationTiming", event.target.value)} className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 font-bold outline-none focus:border-emerald-400 focus:bg-white"><option value="">Không theo bữa</option><option value="Trước ăn">Trước ăn</option><option value="Sau ăn">Sau ăn</option><option value="Trước ngủ">Trước ngủ</option></select></td>
                            <td className="p-2"><input aria-label={`Số ngày ${med.medicineName}`} type="number" min="1" value={item.duration || ""} onChange={(event) => handleRxItemChange(index, "duration", event.target.value)} placeholder="—" className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 text-center font-bold outline-none focus:border-emerald-400 focus:bg-white" /></td>
                            <td className="p-2"><input aria-label={`Dặn dò ${med.medicineName}`} value={item.instructions || ""} onChange={(event) => handleRxItemChange(index, "instructions", event.target.value)} placeholder="VD: Lắc kỹ" className="w-full rounded-lg border border-transparent bg-slate-50 px-2 py-2 font-medium outline-none focus:border-emerald-400 focus:bg-white" /></td>
                            <td className="px-2 py-3 text-center"><button type="button" onClick={() => removeRxItem(index)} title={`Xóa ${med.medicineName}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="13" className="px-5 py-10 text-center text-slate-400"><Pill size={24} className="mx-auto mb-2 text-slate-300" /><p className="font-bold">Chưa có thuốc trong đơn</p><button type="button" onClick={focusMedicineSearch} className="mt-2 text-xs font-extrabold text-emerald-700 hover:text-emerald-800">Tìm và thêm thuốc</button></td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="border-t border-slate-100 bg-slate-50/70 p-2">
                    <button type="button" onClick={focusMedicineSearch} className="w-full rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50"><Plus size={13} className="mr-1 inline" />Thêm thuốc vào đơn</button>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lời dặn chung cho đơn thuốc</label>
                    <span className="text-[10px] font-bold text-slate-400">Đã chọn: {rxItems.length} thuốc</span>
                  </div>
                  <textarea
                    rows={2}
                    value={rxNote}
                    onChange={(e) => setRxNote(e.target.value)}
                    placeholder="VD: Tránh uống cùng sữa, nước bưởi chùm; tái khám nếu triệu chứng tăng..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[10px] font-medium text-slate-400">Liều Sáng/Trưa/Chiều/Tối được lưu cùng từng thuốc để cấp phát chính xác.</span>
                    <button
                      type="button"
                      onClick={handleCreatePrescription}
                      disabled={savingRx || rxItems.length === 0}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-98 disabled:opacity-60"
                    >
                      <Pill size={14} />
                      {savingRx ? "Đang tạo..." : "Tạo đơn thuốc"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {editingRxItem && editingMedicine && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="medicine-editor-title">
              <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Pill size={18} /></span>
                    <div>
                      <h3 id="medicine-editor-title" className="font-extrabold text-slate-800">Thiết lập cách dùng thuốc</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">{editingMedicine.medicineName} {editingMedicine.strength ? `(${editingMedicine.strength})` : ""}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditingRxIndex(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Đóng"><X size={18} /></button>
                </div>

                <div className="overflow-y-auto px-6 py-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      Liều mỗi lần
                      <div className="grid grid-cols-[1fr_9rem] gap-2">
                        <input type="number" min="0" step="0.1" value={editingRxItem.doseValue || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "doseValue", event.target.value)} placeholder="VD: 1" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" />
                        <select value={editingRxItem.doseUnit || editingMedicine.unit || "viên"} onChange={(event) => handleRxItemChange(editingRxIndex, "doseUnit", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500">
                          {doseUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      Đường dùng
                      <select value={editingRxItem.administrationRoute || "Uống"} onChange={(event) => handleRxItemChange(editingRxIndex, "administrationRoute", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500">
                        {["Uống", "Tiêm bắp", "Tiêm tĩnh mạch", "Truyền tĩnh mạch", "Bôi ngoài da", "Nhỏ mắt", "Nhỏ mũi", "Xịt", "Đặt", "Khác"].map((route) => <option key={route} value={route}>{route}</option>)}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      Thời điểm dùng
                      <select value={editingRxItem.administrationTiming || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "administrationTiming", event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500">
                        <option value="">Không quy định</option>
                        <option value="Trước ăn">Trước ăn</option>
                        <option value="Sau ăn">Sau ăn</option>
                        <option value="Trong bữa ăn">Trong bữa ăn</option>
                        <option value="Trước khi ngủ">Trước khi ngủ</option>
                        <option value="Theo giờ chỉ định">Theo giờ chỉ định</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      Tổng số lượng cấp
                      <div className="relative">
                        <input type="number" min="1" value={editingRxItem.quantity || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "quantity", event.target.value)} placeholder="VD: 20" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-16 outline-none focus:border-emerald-500" />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">{editingMedicine.unit || "đơn vị"}</span>
                      </div>
                    </label>
                  </div>

                  {(editingMedicationKind === "liquid" || editingMedicationKind === "injection") && (
                    <label className="mt-4 flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      {editingMedicationKind === "liquid" ? "Dung tích chai / quy cách" : "Quy cách ống tiêm / nồng độ"}
                      <input value={editingRxItem.packageInfo || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "packageInfo", event.target.value)} placeholder={editingMedicationKind === "liquid" ? "VD: Chai 60 ml" : "VD: 1 ống 2 ml"} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" />
                    </label>
                  )}

                  {(editingMedicationKind === "drops" || editingMedicationKind === "topical" || editingMedicationKind === "spray") && (
                    <label className="mt-4 flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                      {editingMedicationKind === "drops" ? "Vị trí nhỏ" : editingMedicationKind === "topical" ? "Vị trí bôi" : "Vị trí xịt"}
                      <input value={editingRxItem.administrationSite || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "administrationSite", event.target.value)} placeholder={editingMedicationKind === "drops" ? "VD: Mắt phải, hai mắt" : "VD: Vùng da tổn thương"} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" />
                    </label>
                  )}

                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-extrabold text-emerald-900">Lịch dùng thuốc</p>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
                        <input type="checkbox" checked={Boolean(editingRxItem.asNeeded)} onChange={(event) => handleRxItemChange(editingRxIndex, "asNeeded", event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                        Dùng khi cần
                      </label>
                    </div>
                    {!editingRxItem.asNeeded && (
                      <>
                        <div className="mt-3 flex rounded-lg bg-white p-1 ring-1 ring-emerald-100">
                          {[['times', 'Số lần/ngày'], ['periods', 'Theo buổi']].map(([value, label]) => (
                            <button key={value} type="button" onClick={() => handleRxItemChange(editingRxIndex, "frequencyMode", value)} className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${editingRxItem.frequencyMode === value ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-emerald-50'}`}>{label}</button>
                          ))}
                        </div>
                        {editingRxItem.frequencyMode === "periods" ? (
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[["morningDose", "Sáng"], ["noonDose", "Trưa"], ["eveningDose", "Chiều"], ["nightDose", "Tối"]].map(([field, label]) => (
                              <label key={field} className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">{label}<input value={editingRxItem[field] || ""} onChange={(event) => handleRxItemChange(editingRxIndex, field, event.target.value)} placeholder={editingRxItem.doseUnit || "liều"} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center outline-none focus:border-emerald-500" /></label>
                            ))}
                          </div>
                        ) : (
                          <label className="mt-3 flex max-w-xs flex-col gap-1 text-[11px] font-bold text-slate-600">Số lần mỗi ngày<input type="number" min="1" value={editingRxItem.frequencyPerDay || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "frequencyPerDay", event.target.value)} placeholder="VD: 2" className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-emerald-500" /></label>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">Số ngày dùng<input type="number" min="1" value={editingRxItem.duration || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "duration", event.target.value)} placeholder="VD: 5" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" /></label>
                    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">Lời dặn riêng<input value={editingRxItem.instructions || ""} onChange={(event) => handleRxItemChange(editingRxIndex, "instructions", event.target.value)} placeholder="VD: Uống nhiều nước" className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" /></label>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <p className="max-w-md text-xs text-slate-500">Bảng đơn thuốc chỉ hiển thị tóm tắt; thông tin đầy đủ sẽ được lưu cùng từng thuốc.</p>
                  <button type="button" onClick={() => setEditingRxIndex(null)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700">Lưu cách dùng</button>
                </div>
              </div>
            </div>
          )}

          {/* CARD 3: Subclinical Tests Request (Yêu cầu cận lâm sàng) */}
          <div className="bg-white border border-slate-100 rounded-[1.5rem] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.015)] transition-all lg:order-2 lg:col-span-7 lg:col-start-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-650 flex items-center justify-center shrink-0">
                  <FlaskConical size={14} className="stroke-[2.5]" />
                </span>
                <h4 className="text-sm font-extrabold text-slate-800">Cận lâm sàng</h4>
              </div>

              {savedLabRequests.length > 0 && (
                <button
                  type="button"
                  onClick={handleRefreshLabRequests}
                  className="flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors uppercase tracking-wider"
                >
                  <RefreshCw size={12} /> Cập nhật kết quả
                </button>
              )}
            </div>

            {labTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                {/* Cột trái: Tìm kiếm & Chọn */}
                <div className="flex flex-col gap-3 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Tìm kiếm & Thêm xét nghiệm</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={labSearchTerm}
                      onChange={(e) => setLabSearchTerm(e.target.value)}
                      onFocus={() => setShowLabDropdown(true)}
                      onBlur={() => setTimeout(() => setShowLabDropdown(false), 200)}
                      placeholder="Gõ tên hoặc mã (VD: Máu...)"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 font-medium focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Dropdown List */}
                  {showLabDropdown && filteredLabTests.length > 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 max-h-[250px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl bg-white shadow-xl z-20 flex flex-col divide-y divide-slate-50">
                      {filteredLabTests.map(t => (
                        <button
                          key={t.labTestId}
                          type="button"
                          onClick={() => {
                            toggleLabTest(t.labTestId);
                            setLabSearchTerm("");
                          }}
                          className="flex items-center justify-between p-3 hover:bg-cyan-50/60 transition-colors text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-extrabold text-slate-700">{t.testName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{t.testCode}</span>
                          </div>
                          <Plus size={16} className="text-cyan-500" />
                        </button>
                      ))}
                    </div>
                  )}
                  {showLabDropdown && filteredLabTests.length === 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 text-center p-4 text-slate-500 text-xs font-medium border border-slate-100 rounded-xl bg-white shadow-xl z-20">
                      Không tìm thấy xét nghiệm phù hợp.
                    </div>
                  )}
                </div>

                {/* Cột phải: Danh sách đã chọn & Ghi chú */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
                    Đã chọn ({selectedTestsData.length})
                  </label>
                  <div className="flex flex-col gap-2 min-h-[120px] max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedTestsData.length === 0 ? (
                      <div className="h-full min-h-[120px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-medium italic">
                        Chưa chọn xét nghiệm nào
                      </div>
                    ) : (
                      selectedTestsData.map(t => (
                        <div key={t.labTestId} className="flex flex-col gap-2 p-3 bg-cyan-50/30 border border-cyan-100/50 rounded-xl transition-all hover:border-cyan-300 shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-extrabold text-cyan-900 leading-tight flex-1">{t.testName}</span>
                            <button
                              type="button"
                              onClick={() => toggleLabTest(t.labTestId)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 bg-white rounded-md border border-slate-100"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={t.note || ""}
                            onChange={(e) => handleLabTestNoteChange(t.labTestId, e.target.value)}
                            placeholder="Ghi chú cho xét nghiệm này..."
                            className="w-full bg-white border border-cyan-100 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 font-medium italic text-xs mb-4">Không có xét nghiệm khả dụng.</p>
            )}

            {!savingLab && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">Ghi chú chỉ định</label>
                  <input
                    type="text"
                    value={labNote}
                    onChange={(e) => setLabNote(e.target.value)}
                    placeholder="VD: Siêu âm lúc đói, nhịn ăn sáng..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-medium focus:border-cyan-500 outline-none transition-all"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Đã chọn: {selectedLabTests.length} xét nghiệm
                  </span>
                  <button
                    type="button"
                    onClick={handleCreateLabRequest}
                    disabled={savingLab || selectedLabTests.length === 0}
                    className="py-2 px-5 bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-98 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FlaskConical size={14} />
                    {savingLab ? "Đang tạo..." : "Tạo phiếu xét nghiệm"}
                  </button>
                </div>
              </div>
            )}

            {/* Requested Subclinical Items Details & Results */}
            {savedLabRequests.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-50 flex flex-col gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lịch sử chỉ định xét nghiệm</p>

                {savedLabRequests.map((req) => (
                  <div key={req.labRequestId} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-extrabold text-cyan-800">{req.requestCode}</strong>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : req.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {req.status === 'COMPLETED' ? 'ĐÃ HOÀN THÀNH' : req.status === 'IN_PROGRESS' ? 'ĐANG XỬ LÝ' : 'CHỜ XỬ LÝ'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(req.requestedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {req.items?.map((item) => (
                        <div key={item.labRequestItemId} className="bg-white rounded-xl p-3 border border-slate-100">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-800">• {item.testName} <span className="text-[9px] font-bold text-slate-400">({item.testCode})</span></span>
                            {item.labResult ? (
                              <span className="text-emerald-600 text-[9px] font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle size={10} /> Có KQ</span>
                            ) : (
                              <span className="text-slate-400 text-[9px] font-extrabold bg-slate-100 px-2 py-0.5 rounded-md">Chờ KQ</span>
                            )}
                          </div>
                          
                          {item.note && (
                            <div className="mt-1.5 px-3 py-1.5 bg-slate-50 border-l-2 border-slate-300 rounded-r-lg text-[11px] text-slate-600 font-medium italic">
                              <span className="font-bold">Ghi chú:</span> {item.note}
                            </div>
                          )}

                          {item.labResult && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-50 grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Giá trị</span>
                                <span className="text-xs font-black text-slate-800">{item.labResult.resultValue} <span className="text-slate-500 font-medium">{item.labResult.resultUnit}</span></span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Tham chiếu</span>
                                <span className="text-xs font-semibold text-slate-600">{item.labResult.normalRange || "—"}</span>
                              </div>
                              <div className="col-span-2 flex flex-col">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Kết luận</span>
                                <span className={`text-xs font-extrabold ${item.labResult.conclusion?.toLowerCase()?.includes('bất thường') ? 'text-rose-600' : 'text-emerald-700'}`}>{item.labResult.conclusion || "—"}</span>
                              </div>
                              {item.labResult.resultFileUrl && (
                                <div className="col-span-2 mt-1">
                                  <a
                                    href={item.labResult.resultFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block overflow-hidden rounded-xl border border-slate-200 hover:border-cyan-500 transition-all shadow-sm max-w-xs"
                                  >
                                    <img
                                      src={item.labResult.resultFileUrl}
                                      alt="Kết quả"
                                      className="w-full h-auto max-h-32 object-cover group-hover:scale-105 transition-transform duration-350"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'flex';
                                        }
                                      }}
                                    />
                                    <div className="hidden items-center justify-center gap-1.5 p-2 bg-slate-50 text-cyan-600 text-xs font-bold group-hover:bg-cyan-50 transition-colors">
                                      <ExternalLink size={12} /> Xem file
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
            )}
          </div>

        </div>

      </div>

      {/* FOOTER ACTIONS BAR: Cancel, Save Draft, Save & Complete */}
      <div className="w-full bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-[0_4px_25px_rgba(0,0,0,0.015)] mt-4 flex items-center justify-between">

        <button
          type="button"
          onClick={() => navigate("/dashboard/examination")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 font-bold text-xs tracking-wider transition-all active:scale-95 shadow-sm"
        >
          Hủy bỏ
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || completing || consultation?.status === "COMPLETED"}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-60"
          >
            <Save size={14} className="text-slate-500" />
            {saving ? "Đang lưu..." : "Lưu nháp"}
          </button>

          {consultation?.status === "COMPLETED" ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm">
              <CheckCircle size={14} /> Phiên khám hoàn thành
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing || saving || !form.diagnosis.trim()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs tracking-wider px-6 py-3 rounded-xl shadow-md shadow-emerald-100 hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <CheckCircle size={14} />
              {completing ? "Đang lưu..." : "Lưu & Hoàn thành ca khám"}
            </button>
          )}
        </div>

      </div>
      {renderQueueModal()}
    </div>
  );
}

function PatientCard({ patient, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-white border border-slate-100 hover:border-emerald-250 hover:bg-emerald-50/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-55 border border-emerald-100 overflow-hidden shrink-0 flex items-center justify-center text-[#0A604E] shadow-sm group-hover:scale-105 transition-transform">
        {patient.avatarUrl ? (
          <img src={patient.avatarUrl} alt={patient.fullName} className="w-full h-full object-cover" />
        ) : (
          <User size={20} className="stroke-[2]" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-extrabold text-slate-800 text-xs tracking-tight group-hover:text-[#0A604E] transition-colors">
          {patient.fullName}
        </h4>
        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
          {patient.patientCode ? `#${patient.patientCode}` : "Mã BN ẩn"}
        </p>
      </div>
      <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-[#0A604E] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
        <ChevronRight size={14} />
      </div>
    </div>
  );
}
