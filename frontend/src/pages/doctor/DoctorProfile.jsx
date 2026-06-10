import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSquare, ArrowLeft } from "lucide-react";
import { getMyDoctorProfile } from "../../services/doctorService";

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getMyDoctorProfile();
        setProfile(res.data);
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

  if (loading) {
    return <div className="page-header">Đang tải hồ sơ...</div>;
  }

  if (notFound) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserSquare size={26} />
            Hồ sơ Bác sĩ
          </h1>
          <p className="muted" style={{ color: "red", marginTop: 10 }}>
            Tài khoản của bạn chưa được liên kết với hồ sơ Bác sĩ nào. Vui lòng liên hệ Admin để được cấp quyền chuyên môn.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-box">{error}</div>;
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full relative flex flex-col items-center mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><UserSquare size={28} /></span>
            Hồ sơ Bác sĩ
          </h1>
          <p className="text-white/70 font-medium mt-3 text-center drop-shadow-sm">Xem thông tin cá nhân và thông tin chuyên khoa (Chỉ xem).</p>
        </div>
      </div>

      <div className="patient-glass-card p-6 md:p-8 w-full">
        <div className="form-stack">
          
          <div style={{ marginBottom: 20 }}>
            <h3 className="patient-section-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16 }}>Thông tin cơ bản</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              <div className="field">
                <label className="patient-label">Mã bác sĩ</label>
                <input value={profile?.doctorCode || ""} disabled className="patient-glass-input disabled:opacity-60" />
              </div>
              
              <div className="field">
                <label className="patient-label">Họ và tên</label>
                <input value={profile?.fullName || ""} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

              <div className="field">
                <label className="patient-label">Trạng thái</label>
                <input value={profile?.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"} disabled className="patient-glass-input disabled:opacity-60" style={{ color: profile?.status === "ACTIVE" ? "#16a34a" : "#dc2626", fontWeight: 700 }} />
              </div>
              
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <h3 className="patient-section-title" style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 8, marginBottom: 16 }}>Thông tin chuyên khoa</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              <div className="field">
                <label className="patient-label">Chuyên khoa (Department)</label>
                <input value={profile?.departmentName || ""} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

              <div className="field">
                <label className="patient-label">Bằng cấp (Degree)</label>
                <input value={profile?.degree || ""} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label className="patient-label">Chuyên môn (Specialization)</label>
                <input value={profile?.specialization || ""} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

              <div className="field">
                <label className="patient-label">Số năm kinh nghiệm</label>
                <input value={profile?.yearsOfExperience || 0} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

              <div className="field">
                <label className="patient-label">Phí khám (VNĐ)</label>
                <input value={profile?.consultationFee?.toLocaleString() || 0} disabled className="patient-glass-input disabled:opacity-60" />
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
