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
      <div className="w-full mb-10 flex flex-col items-center">
        <button 
          onClick={() => navigate("/dashboard", { state: { activeClusterId: "records" } })}
          className="self-start inline-flex items-center gap-3 px-5 py-2.5 bg-white/90 hover:bg-white text-teal-900 font-extrabold border border-white shadow-md rounded-full hover:shadow-lg hover:-translate-x-0.5 transition-all duration-300 group"
        >
          <div className="bg-teal-100/80 p-1.5 rounded-full text-teal-700 group-hover:bg-teal-200 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Quay lại Màn hình chính
        </button>
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-lg text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
            <History size={32} className="text-teal-300 drop-shadow-md" />
            <span className="drop-shadow-md">Lịch sử bệnh án</span>
          </h1>
          <p className="text-teal-50/90 font-medium drop-shadow-sm text-[16px] max-w-[600px]">
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
          <div className="text-center py-10 text-slate-500 font-medium">Đang tải lịch sử bệnh án...</div>
        ) : notFound ? (
          <div className="text-center py-10 text-rose-500 font-medium">Không tìm thấy hồ sơ.</div>
        ) : (
          <>
            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
            <MedicalHistory patientId={patientId} inline={true} />
          </>
        )}
      </div>
    </div>
  );
}
