import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { getMyPatientProfile } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";

export default function PatientMedicalHistoryPage() {
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getMyPatientProfile();
        if (res.data?.patientId) {
          setPatientId(res.data.patientId);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (err.response?.status === 404 || err.message.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message || "Không thể tải thông tin bệnh nhân.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="page-header">Đang tải lịch sử bệnh án...</div>;
  }

  if (notFound) {
    return (
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={26} />
            Lịch sử bệnh án
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
            <History size={26} />
            Lịch sử bệnh án
          </h1>
          <p className="muted">Xem lại danh sách các lần khám chữa bệnh trước đây của bạn.</p>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ background: "#fff", borderRadius: 12, padding: "24px 0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <MedicalHistory patientId={patientId} inline={true} />
      </div>
    </>
  );
}
