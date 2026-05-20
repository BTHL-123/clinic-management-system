import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { createSchedule } from "../../services/scheduleService";

export default function AppointmentManagement() {
  const [formData, setFormData] = useState({
    doctorId: "",
    workDate: "",
    startTime: "",
    endTime: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.doctorId || !formData.workDate || !formData.startTime || !formData.endTime) {
      setError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        doctorId: Number(formData.doctorId),
        workDate: formData.workDate,
        startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
        endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime,
      };

      await createSchedule(payload);
      setMessage("Tạo lịch làm việc thành công!");
      setFormData({
        doctorId: "",
        workDate: "",
        startTime: "",
        endTime: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarDays size={26} />
            Quản lý Lịch hẹn & Lịch khám
          </h1>
          <p className="muted">
            Tạo lịch làm việc của bác sĩ và tự động phân chia khung giờ khám 30 phút.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "480px", background: "#ffffff", padding: "28px", borderRadius: "12px", border: "1px solid #dfe5ec" }}>
        <form className="form-stack" style={{ marginTop: 0 }} onSubmit={handleSubmit}>
          {message && (
            <div className="status-badge badge-active" style={{ width: "100%", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
              {message}
            </div>
          )}

          {error && (
            <div className="error-box" style={{ marginBottom: "8px" }}>
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="doctorId">ID Bác sĩ *</label>
            <input
              type="number"
              id="doctorId"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              placeholder="Nhập ID bác sĩ"
              min="1"
            />
          </div>

          <div className="field">
            <label htmlFor="workDate">Ngày làm việc *</label>
            <input
              type="date"
              id="workDate"
              name="workDate"
              value={formData.workDate}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="startTime">Giờ bắt đầu *</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="endTime">Giờ kết thúc *</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions" style={{ marginTop: "20px" }}>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", minHeight: "44px" }}
            >
              {loading ? "Đang xử lý..." : "Tạo lịch làm việc"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
