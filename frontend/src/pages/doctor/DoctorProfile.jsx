import { useEffect, useState } from "react";
import { UserSquare } from "lucide-react";
import { getMyDoctorProfile } from "../../services/doctorService";

export default function DoctorProfile() {
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
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserSquare size={26} />
            Hồ sơ Bác sĩ
          </h1>
          <p className="muted">Xem thông tin cá nhân và thông tin chuyên khoa (Chỉ xem).</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="form-stack">
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 16 }}>Thông tin cơ bản</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              <div className="field">
                <label>Mã bác sĩ</label>
                <input value={profile?.doctorCode || ""} disabled style={{ background: "#f5f7fa" }} />
              </div>
              
              <div className="field">
                <label>Họ và tên</label>
                <input value={profile?.fullName || ""} disabled style={{ background: "#f5f7fa" }} />
              </div>

              <div className="field">
                <label>Trạng thái</label>
                <input value={profile?.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"} disabled style={{ background: "#f5f7fa", color: profile?.status === "ACTIVE" ? "green" : "red" }} />
              </div>
              
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 16 }}>Thông tin chuyên khoa</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              <div className="field">
                <label>Chuyên khoa (Department)</label>
                <input value={profile?.departmentName || ""} disabled style={{ background: "#f5f7fa" }} />
              </div>

              <div className="field">
                <label>Bằng cấp (Degree)</label>
                <input value={profile?.degree || ""} disabled style={{ background: "#f5f7fa" }} />
              </div>

              <div className="field" style={{ gridColumn: "span 2" }}>
                <label>Chuyên môn (Specialization)</label>
                <input value={profile?.specialization || ""} disabled style={{ background: "#f5f7fa" }} />
              </div>

              <div className="field">
                <label>Số năm kinh nghiệm</label>
                <input value={profile?.yearsOfExperience || 0} disabled style={{ background: "#f5f7fa" }} />
              </div>

              <div className="field">
                <label>Phí khám (VNĐ)</label>
                <input value={profile?.consultationFee?.toLocaleString() || 0} disabled style={{ background: "#f5f7fa" }} />
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
