import { useEffect, useState } from "react";
import { UserSquare, Save, ArrowLeft } from "lucide-react";
import { getMyPatientProfile, updateMyPatientProfile } from "../../services/patientService";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="w-full flex flex-col items-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
          <UserSquare size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Hồ sơ cá nhân</h2>
        <p className="text-red-500 font-medium max-w-md text-sm">
          Tài khoản của bạn chưa được liên kết với bất kỳ hồ sơ bệnh nhân nào. Vui lòng liên hệ với lễ tân để được hỗ trợ.
        </p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400";
  const labelClass = "text-sm font-semibold text-slate-600 mb-1.5 block";
  const sectionTitleClass = "text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5";

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
              <UserSquare size={22} className="text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-[52px]">
            Quản lý và cập nhật thông tin sức khỏe của bạn.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 text-red-600 text-sm font-medium mb-4">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 text-emerald-700 text-sm font-medium mb-4">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8">
        {formData.avatarUrl && (
          <div className="flex justify-center mb-8">
            <img 
              src={formData.avatarUrl} 
              alt="Avatar" 
              className="w-28 h-28 rounded-2xl object-cover border-2 border-slate-200 shadow-md" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=User&background=e2e8f0&color=0f172a`;
              }}
            />
          </div>
        )}
        <form onSubmit={handleSubmit}>
          
          <div className="mb-8">
            <h3 className={sectionTitleClass}>Thông tin cơ bản</h3>
            
            <div className="mb-4">
              <label className={labelClass}>Ảnh đại diện (URL)</label>
              <input name="avatarUrl" className={inputClass} value={formData.avatarUrl} onChange={handleChange} placeholder="Nhập đường dẫn hình ảnh..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className={labelClass}>Mã bệnh nhân</label>
                <input value={patientCode} disabled className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`} />
                <span className="text-[11px] text-slate-400 mt-1 block">Không thể thay đổi mã bệnh nhân.</span>
              </div>
              
              <div>
                <label className={labelClass}>Họ và tên *</label>
                <input name="fullName" className={inputClass} value={formData.fullName} onChange={handleChange} required />
              </div>
              
              <div>
                <label className={labelClass}>Giới tính *</label>
                <select name="gender" className={inputClass} value={formData.gender} onChange={handleChange} required>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              
              <div>
                <label className={labelClass}>Ngày sinh</label>
                <input type="date" name="dateOfBirth" className={inputClass} value={formData.dateOfBirth} onChange={handleChange} />
              </div>
              
              <div>
                <label className={labelClass}>Dân tộc</label>
                <input name="ethnicity" className={inputClass} value={formData.ethnicity} onChange={handleChange} />
              </div>

              <div>
                <label className={labelClass}>Nghề nghiệp</label>
                <input name="occupation" className={inputClass} value={formData.occupation} onChange={handleChange} />
              </div>
              
              <div>
                <label className={labelClass}>Số điện thoại</label>
                <input name="phone" className={inputClass} value={formData.phone} onChange={handleChange} />
              </div>
              
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" name="email" className={inputClass} value={formData.email} onChange={handleChange} />
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Địa chỉ</label>
                <textarea name="address" className={inputClass} value={formData.address} onChange={handleChange} rows={2} />
              </div>
              
              <div>
                <label className={labelClass}>CCCD / CMND</label>
                <input name="identityNumber" className={inputClass} value={formData.identityNumber} onChange={handleChange} />
              </div>
              
              <div>
                <label className={labelClass}>Mã BHYT</label>
                <input name="insuranceNumber" className={inputClass} value={formData.insuranceNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className={sectionTitleClass}>Liên hệ khẩn cấp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tên người liên hệ</label>
                <input name="emergencyContactName" className={inputClass} value={formData.emergencyContactName} onChange={handleChange} />
              </div>
              <div>
                <label className={labelClass}>Số điện thoại người liên hệ</label>
                <input name="emergencyContactPhone" className={inputClass} value={formData.emergencyContactPhone} onChange={handleChange} />
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className={sectionTitleClass}>Thông tin y tế</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nhóm máu</label>
                <div className="flex gap-2.5 flex-wrap">
                  {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                    <label key={type} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all border ${
                      formData.bloodType === type 
                        ? "bg-teal-50 border-teal-300 text-teal-700 font-bold" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                      <input 
                        type="radio" 
                        name="bloodType" 
                        value={type} 
                        checked={formData.bloodType === type}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {type === "" ? "Chưa xác định" : type}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Chỉ số cơ thể</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Chiều cao (cm)</label>
                    <input type="number" name="heightCm" className={inputClass} value={formData.heightCm} onChange={handleChange} placeholder="Ví dụ: 170" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cân nặng (kg)</label>
                    <input type="number" name="weightKg" className={inputClass} value={formData.weightKg} onChange={handleChange} step="0.1" placeholder="Ví dụ: 65" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Chỉ số BMI</label>
                    <div className="font-bold text-teal-600 text-lg mt-2">
                      {formData.heightCm && formData.weightKg 
                        ? (formData.weightKg / Math.pow(formData.heightCm / 100, 2)).toFixed(1) 
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Tiền sử dị ứng</label>
                <textarea name="allergies" className={inputClass} value={formData.allergies} onChange={handleChange} rows={2} placeholder="Nhập các loại thuốc, thức ăn mà bạn bị dị ứng..." />
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Tiền sử bệnh (Bản thân)</label>
                <textarea name="medicalHistory" className={inputClass} value={formData.medicalHistory} onChange={handleChange} rows={2} placeholder="Nhập các bệnh mãn tính từng mắc phải..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Tiền sử gia đình</label>
                <textarea name="familyHistory" className={inputClass} value={formData.familyHistory} onChange={handleChange} rows={2} placeholder="Các bệnh di truyền trong gia đình..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Tiền sử phẫu thuật</label>
                <textarea name="surgicalHistory" className={inputClass} value={formData.surgicalHistory} onChange={handleChange} rows={2} placeholder="Các phẫu thuật từng thực hiện..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Thuốc đang sử dụng</label>
                <textarea name="currentMedications" className={inputClass} value={formData.currentMedications} onChange={handleChange} rows={2} placeholder="Các loại thuốc đang uống (để phòng tránh tương tác thuốc)..." />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Thói quen sinh hoạt (Rượu, bia, thuốc lá...)</label>
                <textarea name="lifestyleHabits" className={inputClass} value={formData.lifestyleHabits} onChange={handleChange} rows={2} placeholder="Tần suất sử dụng rượu bia, thuốc lá..." />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-50" disabled={submitting}>
              <Save size={16} />
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
