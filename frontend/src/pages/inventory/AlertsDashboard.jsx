import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getActiveAlerts, resolveAlert } from "../../services/inventoryService";

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getActiveAlerts();
      setAlerts(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      await fetchAlerts();
    } catch (err) {
      alert("Không thể đánh dấu xử lý: " + err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <AlertTriangle size={26} color="orange" />
            Cảnh Báo Tồn Kho
          </h1>
          <p className="muted">Danh sách thuốc sắp hết hạn hoặc hết số lượng.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loại Cảnh Báo</th>
              <th>Thuốc</th>
              <th>Lô thuốc</th>
              <th>Nội dung cảnh báo</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">Mọi thứ đều ổn! Không có cảnh báo nào.</td>
              </tr>
            ) : (
              alerts.map((al) => (
                <tr key={al.alertId}>
                  <td>
                    <span className={`status-badge ${al.alertType === "EXPIRED" ? "badge-inactive" : "badge-active"}`} style={{ backgroundColor: al.alertType === 'NEAR_EXPIRY' ? '#f59e0b' : undefined }}>
                      {al.alertType}
                    </span>
                  </td>
                  <td><strong>{al.medicineName}</strong></td>
                  <td>{al.batchNumber || "—"}</td>
                  <td>{al.message}</td>
                  <td>{new Date(al.createdAt).toLocaleString("vi-VN")}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className="primary-button" onClick={() => handleResolve(al.alertId)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                      <CheckCircle size={14} style={{ marginRight: '4px' }} />
                      Đã xử lý
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
