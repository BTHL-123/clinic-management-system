import { useEffect, useState } from "react";
import { History, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyPatientProfile } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";
import PageHeader from "../../components/PageHeader";
export default function PatientMedicalHistoryPage() {
  const navigate = useNavigate();
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

  return (
    <div className="max-w-[1600px] w-[95%] mx-auto flex flex-col items-center">
      <PageHeader
        title="Lịch sử bệnh án"
        icon={History}
        iconColor="text-teal-400"
        subtitle={notFound ? <span className="text-rose-300">Tài khoản của bạn chưa được liên kết với bất kỳ hồ sơ bệnh nhân nào. Vui lòng liên hệ với lễ tân để được hỗ trợ.</span> : "Xem lại danh sách các lần khám chữa bệnh trước đây của bạn."}
        onBack={() => navigate("/dashboard", { state: { activeClusterId: "records" } })}
      />

      <div className="patient-glass-card p-6 md:p-8 w-full max-w-full mx-auto mb-10">
        {loading ? (
          <div className="text-center py-10 text-white/50 font-medium">Đang tải lịch sử bệnh án...</div>
        ) : notFound ? (
          <div className="text-center py-10 text-rose-400 font-medium">Không tìm thấy hồ sơ.</div>
        ) : (
          <>
            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
            <MedicalHistory patientId={patientId} inline={true} isPatientView={true} />
          </>
        )}
      </div>
    </div>
  );
}
