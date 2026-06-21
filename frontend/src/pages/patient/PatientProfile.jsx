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
  ethnicity: "",
  occupation: "",
  heightCm: "",
  weightKg: "",
  familyHistory: "",
  surgicalHistory: "",
  currentMedications: "",
  lifestyleHabits: "",
  avatarUrl: "",
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
          ethnicity: data.ethnicity || "",
          occupation: data.occupation || "",
          heightCm: data.heightCm || "",
          weightKg: data.weightKg || "",
          familyHistory: data.familyHistory || "",
          surgicalHistory: data.surgicalHistory || "",
          currentMedications: data.currentMedications || "",
          lifestyleHabits: data.lifestyleHabits || "",
          avatarUrl: data.avatarUrl || "",
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
    
    // Validation
    if (formData.phone && !/^(0|\+84)[0-9]{8,10}$/.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 9-11 chữ số).");
      return;
    }
    if (formData.identityNumber && !/^[0-9]{12}$/.test(formData.identityNumber)) {
      setError("CCCD/CMND phải bao gồm chính xác 12 chữ số.");
      return;
    }
    if (formData.insuranceNumber && formData.insuranceNumber.length !== 15) {
      setError("Mã BHYT phải bao gồm chính xác 15 ký tự.");
      return;
    }
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        setError("Ngày sinh không được ở trong tương lai.");
        return;
      }
    }

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
    return <div className="text-white/70 font-medium p-4">Đang tải hồ sơ...</div>;
  }

  if (notFound) {
    return (
      <div className="w-full min-h-full p-6 flex flex-col gap-6 patient-clean-page">
      <div className="mb-10 mt-6 flex flex-col items-center text-center px-4">
        <h2 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
          <UserSquare size={32} className="text-teal-400 drop-shadow-md" />
          <span className="drop-shadow-md">Hồ sơ cá nhân</span>
        </h2>
        <p className="text-red-400 font-bold drop-shadow-sm text-[16px] max-w-[600px] mt-2">
          Tài khoản của bạn chưa được liên kết với bất kỳ hồ sơ bệnh nhân nào. Vui lòng liên hệ với lễ tân để được hỗ trợ.
        </p>
      </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10 mt-6 flex flex-col items-center text-center px-4">
        <h2 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
          <UserSquare size={32} className="text-teal-400 drop-shadow-md" />
          <span className="drop-shadow-md">Hồ sơ cá nhân</span>
        </h2>
        <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
          Quản lý và cập nhật thông tin sức khỏe của bạn.
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div style={{ padding: "12px 16px", background: "#e6f4ea", color: "#1e8e3e", borderRadius: 8, marginBottom: 16, border: "1px solid #ceead6" }}>{successMsg}</div>}

      <div className="patient-clean-card p-6 md:p-8">
        {formData.avatarUrl && (
          <div className="flex justify-center mb-8">
            <img src={formData.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-xl" />
          </div>
        )}
        <form className="form-stack" onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: 20 }}>
            <h3 className="patient-section-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16 }}>Thông tin cơ bản</h3>
            
            <div className="field mb-4">
              <label>Ảnh đại diện (URL)</label>
              <input name="avatarUrl" className="patient-glass-input" value={formData.avatarUrl} onChange={handleChange} placeholder="Nhập đường dẫn hình ảnh..." />
            </div>

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
                <label>Dân tộc</label>
                <input name="ethnicity" className="patient-glass-input" value={formData.ethnicity} onChange={handleChange} />
              </div>

              <div className="field">
                <label>Nghề nghiệp</label>
                <input name="occupation" className="patient-glass-input" value={formData.occupation} onChange={handleChange} />
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
            <h3 className="patient-section-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16 }}>Liên hệ khẩn cấp</h3>
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
            <h3 className="patient-section-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16 }}>Thông tin y tế</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label style={{ marginBottom: 8 }}>Nhóm máu</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                    <label key={type} style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: formData.bloodType === type ? "rgba(20, 184, 166, 0.2)" : "rgba(255, 255, 255, 0.05)",
                      border: formData.bloodType === type ? "1px solid #14b8a6" : "1px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: formData.bloodType === type ? "#14b8a6" : "#fff",
                      fontWeight: formData.bloodType === type ? "bold" : "normal",
                      transition: "all 0.2s"
                    }}>
                      <input 
                        type="radio" 
                        name="bloodType" 
                        value={type} 
                        checked={formData.bloodType === type}
                        onChange={handleChange}
                        style={{ display: "none" }}
                      />
                      {type === "" ? "Chưa xác định" : type}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Chỉ số cơ thể</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/70">Chiều cao (cm)</label>
                    <input type="number" name="heightCm" className="patient-glass-input" value={formData.heightCm} onChange={handleChange} placeholder="Ví dụ: 170" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/70">Cân nặng (kg)</label>
                    <input type="number" name="weightKg" className="patient-glass-input" value={formData.weightKg} onChange={handleChange} step="0.1" placeholder="Ví dụ: 65" />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="text-xs text-white/70">Chỉ số BMI</label>
                    <div className="font-bold text-teal-400 text-lg">
                      {formData.heightCm && formData.weightKg 
                        ? (formData.weightKg / Math.pow(formData.heightCm / 100, 2)).toFixed(1) 
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử dị ứng</label>
                <textarea name="allergies" className="patient-glass-input" value={formData.allergies} onChange={handleChange} rows={2} placeholder="Nhập các loại thuốc, thức ăn mà bạn bị dị ứng..." />
              </div>
              
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử bệnh (Bản thân)</label>
                <textarea name="medicalHistory" className="patient-glass-input" value={formData.medicalHistory} onChange={handleChange} rows={2} placeholder="Nhập các bệnh mãn tính từng mắc phải..." />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử gia đình</label>
                <textarea name="familyHistory" className="patient-glass-input" value={formData.familyHistory} onChange={handleChange} rows={2} placeholder="Các bệnh di truyền trong gia đình..." />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Tiền sử phẫu thuật</label>
                <textarea name="surgicalHistory" className="patient-glass-input" value={formData.surgicalHistory} onChange={handleChange} rows={2} placeholder="Các phẫu thuật từng thực hiện..." />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Thuốc đang sử dụng</label>
                <textarea name="currentMedications" className="patient-glass-input" value={formData.currentMedications} onChange={handleChange} rows={2} placeholder="Các loại thuốc đang uống (để phòng tránh tương tác thuốc)..." />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Thói quen sinh hoạt (Rượu, bia, thuốc lá...)</label>
                <textarea name="lifestyleHabits" className="patient-glass-input" value={formData.lifestyleHabits} onChange={handleChange} rows={2} placeholder="Tần suất sử dụng rượu bia, thuốc lá..." />
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
