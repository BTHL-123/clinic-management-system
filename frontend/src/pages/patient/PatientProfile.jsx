import { useEffect, useState } from "react";
import { UserSquare, Save } from "lucide-react";
import { getMyPatientProfile, updateMyPatientProfile } from "../../services/patientService";
import { useAuth } from "../../context/useAuth";

const INITIAL_FORM = {
  fullName: "",
  gender: "OTHER",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  identityNumber: "",
  insuranceNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodType: "",
  allergies: "",
  medicalHistory: "",
};

export default function PatientProfile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [patientCode, setPatientCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getMyPatientProfile();
        const data = res.data;
        setPatientCode(data.patientCode || "");
        setFormData({
          fullName: data.fullName || "",
          gender: data.gender || "OTHER",
          dateOfBirth: data.dateOfBirth || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          identityNumber: data.identityNumber || "",
          insuranceNumber: data.insuranceNumber || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
          bloodType: data.bloodType || "",
          allergies: data.allergies || "",
          medicalHistory: data.medicalHistory || "",
        });
        setError("");
        setNotFound(false);
      } catch (err) {
        if (err.response?.status === 404 || err.message.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message || "Không thể tải thông tin hồ sơ.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setSuccessMsg("");
      await updateMyPatientProfile(formData);
      setSuccessMsg("Cập nhật hồ sơ thành công!");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi cập nhật hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-header">Đang tải hồ sơ...</div>;
  }

  if (notFound) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserSquare size={26} />
            Hồ sơ cá nhân
          </h1>
          <p className="muted" style={{ color: "red", marginTop: 10 }}>
            Tài khoản của bạn chưa được liên kết với bất kỳ hồ sơ bệnh nhân nào. Vui lòng liên hệ với lễ tân để được hỗ trợ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserSquare size={26} />
            Hồ sơ cá nhân
          </h1>
          <p className="muted">Quản lý và cập nhật thông tin sức khỏe của bạn.</p>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div style={{ padding: "12px 16px", background: "#e6f4ea", color: "#1e8e3e", borderRadius: 8, marginBottom: 16, border: "1px solid #ceead6" }}>{successMsg}</div>}

      <div className="patient-glass-card p-6 md:p-8">
        <form className="form-stack" onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16, fontWeight: 700, color: "#1e293b" }}>Thông tin cơ bản</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              <div className="field">
                <label>Mã bệnh nhân</label>
                <input value={patientCode} disabled className="patient-glass-input disabled:opacity-60" />
                <span className="muted" style={{ fontSize: 12, marginBottom: 0 }}>Không thể thay đổi mã bệnh nhân.</span>
              </div>
              
              <div className="field">
                <label>Họ và tên *</label>
                <input name="fullName" className="patient-glass-input" value={formData.fullName} onChange={handleChange} required />
              </div>
              
              <div className="field">
                <label>Giới tính *</label>
                <select name="gender" className="patient-glass-input" value={formData.gender} onChange={handleChange} required>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              
              <div className="field">
                <label>Ngày sinh</label>
                <input type="date" name="dateOfBirth" className="patient-glass-input" value={formData.dateOfBirth} onChange={handleChange} />
              </div>
              
              <div className="field">
                <label>Số điện thoại</label>
                <input name="phone" className="patient-glass-input" value={formData.phone} onChange={handleChange} />
              </div>
              
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" className="patient-glass-input" value={formData.email} onChange={handleChange} />
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Địa chỉ</label>
                <textarea name="address" className="patient-glass-input" value={formData.address} onChange={handleChange} rows={2} />
              </div>
              
              <div className="field">
                <label>CCCD / CMND</label>
                <input name="identityNumber" className="patient-glass-input" value={formData.identityNumber} onChange={handleChange} />
              </div>
              
              <div className="field">
                <label>Mã BHYT</label>
                <input name="insuranceNumber" className="patient-glass-input" value={formData.insuranceNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16, fontWeight: 700, color: "#1e293b" }}>Liên hệ khẩn cấp</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label>Tên người liên hệ</label>
                <input name="emergencyContactName" className="patient-glass-input" value={formData.emergencyContactName} onChange={handleChange} />
              </div>
              <div className="field">
                <label>Số điện thoại người liên hệ</label>
                <input name="emergencyContactPhone" className="patient-glass-input" value={formData.emergencyContactPhone} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16, fontWeight: 700, color: "#1e293b" }}>Thông tin y tế</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field">
                <label>Nhóm máu</label>
                <select name="bloodType" className="patient-glass-input" value={formData.bloodType} onChange={handleChange}>
                  <option value="">-- Chưa xác định --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử dị ứng</label>
                <textarea name="allergies" className="patient-glass-input" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Nhập các loại thuốc, thức ăn mà bạn bị dị ứng..." />
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử bệnh</label>
                <textarea name="medicalHistory" className="patient-glass-input" value={formData.medicalHistory} onChange={handleChange} rows={3} placeholder="Nhập các bệnh mãn tính hoặc phẫu thuật từng thực hiện..." />
              </div>
            </div>
          </div>
          
          <div className="form-actions" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="primary-button" disabled={submitting}>
              <Save size={16} />
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
