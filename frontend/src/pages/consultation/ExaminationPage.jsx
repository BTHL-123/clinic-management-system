import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Stethoscope, Save, ArrowLeft, CheckCircle } from "lucide-react";
import consultationService from "../../services/consultationService";
import {
  createMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from "../../services/medicalRecordService";

const EMPTY_FORM = {
  symptoms: "",
  clinicalFindings: "",
  diagnosis: "",
  treatmentPlan: "",
  doctorNote: "",
  followUpDate: "",
  followUpNote: "",
};

export default function ExaminationPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [existingRecordId, setExistingRecordId] = useState(null); // nếu đã có bệnh án thì update
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
      getMedicalRecords({ patientId: undefined, page: 0, size: 1 }), // sẽ query theo consultationId bên dưới
    ])
      .then(async ([consultRes]) => {
        const c = consultRes.data;
        setConsultation(c);

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
