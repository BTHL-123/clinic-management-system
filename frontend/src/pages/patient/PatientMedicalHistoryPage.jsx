import { useEffect, useState } from "react";
import { History, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyPatientProfile } from "../../services/patientService";
import MedicalHistory from "../../components/MedicalHistory";

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
      <div className="w-full mb-10 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px]">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button 
            onClick={() => navigate("/dashboard", { state: { activeClusterId: "records" } })}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <History size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md">Lịch sử bệnh án</span>
          </h1>
          <p className="text-white/70 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
            {notFound ? (
              <span className="text-rose-300">Tài khoản của bạn chưa được liên kết với bất kỳ hồ sơ bệnh nhân nào. Vui lòng liên hệ với lễ tân để được hỗ trợ.</span>
            ) : (
              "Xem lại danh sách các lần khám chữa bệnh trước đây của bạn."
            )}
          </p>
        </div>
      </div>

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
