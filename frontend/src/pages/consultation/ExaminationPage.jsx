import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Stethoscope, Save, ArrowLeft, CheckCircle, Activity, FlaskConical } from "lucide-react";
import consultationService from "../../services/consultationService";
import {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from "../../services/medicalRecordService";
import vitalSignService from "../../services/vitalSignService";
import { createLabRequest, getLabRequestsByConsultationId } from "../../services/labRequestService";
import { getLabTests } from "../../services/labTestService";

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

export default function ExaminationPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Load consultation + bệnh án hiện có (nếu có)
  useEffect(() => {
    if (!consultationId) return;
    setLoading(true);

    Promise.all([
      consultationService.getById(consultationId),
      vitalSignService.getByConsultation(consultationId).catch(() => ({ data: [] })),
      getLabTests({ status: "ACTIVE", size: 100 }).catch(() => ({ data: { content: [] } })),
      getLabRequestsByConsultationId(consultationId).catch(() => ({ data: [] })),
    ])
      .then(async ([consultRes, vitalsRes, labTestsRes, labReqRes]) => {
        const c = consultRes.data;
        setConsultation(c);
        setSavedVitals(vitalsRes.data || []);
        setLabTests(labTestsRes.data?.content || []);
        setSavedLabRequests(labReqRes.data || []);

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
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVitalsChange = (e) => {
    setVitals((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveVitals = async () => {    const hasAnyValue = Object.values(vitals).some((v) => v !== "");
    if (!hasAnyValue) {
      showToast("Vui lòng nhập ít nhất một chỉ số.", "error");
      return;
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

  const handleSave = async () => {
    if (!form.diagnosis.trim()) {
      setError("Chẩn đoán không được để trống.");
      return;
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
    } catch (err) {
      setError(err.message || "Không thể lưu bệnh án.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    // Lưu bệnh án trước rồi hoàn thành phiên khám
    await handleSave();
    try {
      await consultationService.complete(consultationId);
      showToast("Phiên khám đã hoàn thành!");
      setTimeout(() => navigate("/dashboard/consultation"), 1500);
    } catch (err) {
      setError(err.message || "Không thể hoàn thành phiên khám.");
    }
  };

  if (loading) {
    return <div style={{ padding: 32, color: "#6b7280" }}>Đang tải phiên khám...</div>;
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button
          className="icon-button"
          onClick={() => navigate("/dashboard/consultation")}
          title="Quay lại hàng đợi"
        >
          <ArrowLeft size={18} />
        </button>
        <Stethoscope size={20} />
        <h2 style={{ margin: 0, fontSize: 20 }}>
          Khám bệnh — Phiên #{consultationId}
        </h2>
        {consultation && (
          <span style={{
            marginLeft: "auto", fontSize: 13, fontWeight: 600,
            color: consultation.status === "IN_PROGRESS" ? "#7c3aed" : "#16a34a",
            background: consultation.status === "IN_PROGRESS" ? "#ede9fe" : "#dcfce7",
            padding: "2px 10px", borderRadius: 12,
          }}>
            {consultation.status === "IN_PROGRESS" ? "Đang khám" : consultation.status}
          </span>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
          color: toast.type === "error" ? "#991b1b" : "#166534",
          border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
          padding: "10px 14px", borderRadius: 8, fontSize: 14,
          fontWeight: 500, marginBottom: 16,
        }}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Thông tin phiên khám */}
      {consultation && (
        <div style={{
          background: "#f9fafb", borderRadius: 8, padding: "12px 16px",
          marginBottom: 20, fontSize: 13, display: "flex", gap: 24, flexWrap: "wrap",
        }}>
          <span><strong>Bệnh nhân ID:</strong> {consultation.patientId}</span>
          <span><strong>Bác sĩ ID:</strong> {consultation.doctorId}</span>
          <span><strong>Bắt đầu:</strong> {consultation.startedAt
            ? new Date(consultation.startedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            : "—"}</span>
        </div>
      )}

      {/* Vital Signs Section */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Activity size={16} color="#16a34a" />
          <strong style={{ fontSize: 14, color: "#15803d" }}>Chỉ số sinh tồn</strong>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
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
            <div key={field.name}>
              <label style={{ ...labelStyle, fontSize: 12 }}>{field.label}</label>
              <input
                type="number"
                name={field.name}
                value={vitals[field.name]}
                onChange={handleVitalsChange}
                placeholder={field.placeholder}
                style={{ ...inputStyle, fontSize: 13 }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="secondary-button"
            onClick={handleSaveVitals}
            disabled={savingVitals}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            <Save size={13} />
            {savingVitals ? "Đang lưu..." : "Lưu chỉ số"}
          </button>
        </div>

        {/* Lịch sử đo */}
        {savedVitals.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid #bbf7d0", paddingTop: 10 }}>
            <p style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
              Lịch sử đo ({savedVitals.length} lần)
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#dcfce7" }}>
                    {["Thời gian", "Cao (cm)", "Nặng (kg)", "Nhiệt độ", "HA", "Nhịp tim", "SpO2"].map((h) => (
                      <th key={h} style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savedVitals.map((v) => (
                    <tr key={v.vitalSignId} style={{ borderBottom: "1px solid #bbf7d0" }}>
                      <td style={{ padding: "4px 8px" }}>
                        {new Date(v.measuredAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "4px 8px" }}>{v.heightCm ?? "—"}</td>
                      <td style={{ padding: "4px 8px" }}>{v.weightKg ?? "—"}</td>
                      <td style={{ padding: "4px 8px" }}>{v.temperatureC ?? "—"}</td>
                      <td style={{ padding: "4px 8px" }}>
                        {v.bloodPressureSystolic && v.bloodPressureDiastolic
                          ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                          : "—"}
                      </td>
                      <td style={{ padding: "4px 8px" }}>{v.heartRate ?? "—"}</td>
                      <td style={{ padding: "4px 8px" }}>{v.spo2 != null ? `${v.spo2}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lab Request Section */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <FlaskConical size={16} color="#2563eb" />
          <strong style={{ fontSize: 14, color: "#1d4ed8" }}>Yêu cầu xét nghiệm</strong>
        </div>

        {/* Danh sách loại xét nghiệm */}
        {labTests.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
            {labTests.map((t) => (
              <label key={t.labTestId} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 6, cursor: "pointer",
                background: selectedLabTests.includes(t.labTestId) ? "#dbeafe" : "#fff",
                border: `1px solid ${selectedLabTests.includes(t.labTestId) ? "#93c5fd" : "#e5e7eb"}`,
                fontSize: 13,
              }}>
                <input
                  type="checkbox"
                  checked={selectedLabTests.includes(t.labTestId)}
                  onChange={() => toggleLabTest(t.labTestId)}
                  style={{ accentColor: "#2563eb" }}
                />
                <span>
                  <div style={{ fontWeight: 600 }}>{t.testName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{t.testCode}</div>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>Không có loại xét nghiệm nào.</p>
        )}

        <div style={{ marginBottom: 10 }}>
          <label style={{ ...labelStyle, fontSize: 12 }}>Ghi chú</label>
          <input
            type="text"
            value={labNote}
            onChange={(e) => setLabNote(e.target.value)}
            placeholder="Ghi chú cho phiếu xét nghiệm..."
            style={{ ...inputStyle, fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#2563eb" }}>
            Đã chọn: {selectedLabTests.length} xét nghiệm
          </span>
          <button
            className="secondary-button"
            onClick={handleCreateLabRequest}
            disabled={savingLab || selectedLabTests.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
          >
            <FlaskConical size={13} />
            {savingLab ? "Đang tạo..." : "Tạo phiếu xét nghiệm"}
          </button>
        </div>

        {/* Phiếu đã tạo */}
        {savedLabRequests.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid #bfdbfe", paddingTop: 10 }}>
            <p style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600, marginBottom: 6 }}>
              Phiếu đã tạo ({savedLabRequests.length})
            </p>
            {savedLabRequests.map((req) => (
              <div key={req.labRequestId} style={{
                background: "#fff", border: "1px solid #bfdbfe",
                borderRadius: 6, padding: "8px 12px", marginBottom: 6, fontSize: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{req.requestCode}</strong>
                  <span style={{ color: "#6b7280" }}>
                    {new Date(req.requestedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ marginTop: 4, color: "#374151" }}>
                  {req.items?.map((item) => item.testName).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form bệnh án */}
      <div style={{ display: "grid", gap: 16 }}>

        {/* Triệu chứng */}
        <div>
          <label style={labelStyle}>Triệu chứng</label>
          <textarea
            name="symptoms"
            value={form.symptoms}
            onChange={handleChange}
            rows={3}
            placeholder="Mô tả triệu chứng bệnh nhân..."
            style={textareaStyle}
          />
        </div>

        {/* Kết quả khám lâm sàng */}
        <div>
          <label style={labelStyle}>Kết quả khám lâm sàng</label>
          <textarea
            name="clinicalFindings"
            value={form.clinicalFindings}
            onChange={handleChange}
            rows={3}
            placeholder="Kết quả thăm khám thực thể..."
            style={textareaStyle}
          />
        </div>

        {/* Chẩn đoán — bắt buộc */}
        <div>
          <label style={{ ...labelStyle, color: "#dc2626" }}>
            Chẩn đoán <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            rows={2}
            placeholder="Chẩn đoán bệnh..."
            style={{ ...textareaStyle, borderColor: !form.diagnosis.trim() ? "#fca5a5" : "#d1d5db" }}
          />
        </div>

        {/* Kế hoạch điều trị */}
        <div>
          <label style={labelStyle}>Kế hoạch điều trị</label>
          <textarea
            name="treatmentPlan"
            value={form.treatmentPlan}
            onChange={handleChange}
            rows={3}
            placeholder="Phác đồ điều trị, thuốc, thủ thuật..."
            style={textareaStyle}
          />
        </div>

        {/* Lời dặn */}
        <div>
          <label style={labelStyle}>Lời dặn bệnh nhân</label>
          <textarea
            name="doctorNote"
            value={form.doctorNote}
            onChange={handleChange}
            rows={2}
            placeholder="Hướng dẫn chăm sóc, lưu ý..."
            style={textareaStyle}
          />
        </div>

        {/* Tái khám */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Ngày tái khám</label>
            <input
              type="date"
              name="followUpDate"
              value={form.followUpDate}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ghi chú tái khám</label>
            <input
              type="text"
              name="followUpNote"
              value={form.followUpNote}
              onChange={handleChange}
              placeholder="Ghi chú về lần tái khám..."
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
        <button
          className="secondary-button"
          onClick={handleSave}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Save size={15} />
          {saving ? "Đang lưu..." : existingRecordId ? "Cập nhật bệnh án" : "Lưu bệnh án"}
        </button>
        <button
          className="primary-button"
          onClick={handleComplete}
          disabled={saving || !form.diagnosis.trim()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <CheckCircle size={15} />
          Hoàn thành phiên khám
        </button>
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
