import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSquare, ArrowLeft } from "lucide-react";
import { getMyDoctorProfile } from "../../services/doctorService";
import PageHeader from "../../components/PageHeader";

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
    return (
      <div className="w-full flex flex-col items-center">
        <PageHeader
          title="Hồ sơ Bác sĩ"
          icon={UserSquare}
          iconColor="text-white"
          onBack={() => navigate("/dashboard")}
        />
        <div className="patient-glass-card p-6 md:p-8 w-full mt-4 text-center text-slate-500 font-semibold">
          Đang tải hồ sơ...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="w-full flex flex-col items-center">
        <PageHeader
          title="Hồ sơ Bác sĩ"
          icon={UserSquare}
          iconColor="text-white"
          onBack={() => navigate("/dashboard")}
        />
        <div className="patient-glass-card p-6 md:p-8 w-full mt-4 text-center text-red-600 font-semibold">
          Tài khoản của bạn chưa được liên kết với hồ sơ Bác sĩ nào. Vui lòng liên hệ Admin để được cấp quyền chuyên môn.
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
      <PageHeader
        title="Hồ sơ Bác sĩ"
        icon={UserSquare}
        iconColor="text-white"
        subtitle="Xem thông tin cá nhân và thông tin chuyên khoa (Chỉ xem)."
        onBack={() => navigate("/dashboard")}
      />

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
