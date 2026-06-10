import { useEffect, useState } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, CalendarDays, Pill, AlertTriangle, 
  TrendingUp, Users, Activity, ChevronRight, LayoutDashboard
} from "lucide-react";
import { 
  getRevenueSummary, getRevenueReport, getAppointmentReport, 
  getDoctorPerformance, getMedicineStockSummary, getExpiringBatches 
} from "../../services/reportService.js";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#64748b"];

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // days

  const [revenueSummary, setRevenueSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [expiringBatches, setExpiringBatches] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const fromDate = new Date();
      fromDate.setDate(today.getDate() - timeRange);
      
      const fromStr = fromDate.toISOString().split("T")[0];
      const toStr = today.toISOString().split("T")[0];

      const [
        revSummary, revReport, apptReport, docPerf, stockSum, expiring
      ] = await Promise.all([
        getRevenueSummary({ from: fromStr, to: toStr }),
        getRevenueReport({ from: fromStr, to: toStr }),
        getAppointmentReport({ from: fromStr, to: toStr }),
        getDoctorPerformance({ from: fromStr, to: toStr }),
        getMedicineStockSummary(),
        getExpiringBatches({ days: 30 }) // always check 30 days ahead for expiry
      ]);

      setRevenueSummary(revSummary.data ?? revSummary);
      setRevenueData(revReport.data ?? revReport);
      
      // Format appointment data for PieChart
      const apptData = (apptReport.data ?? apptReport).map(item => ({
        name: formatStatus(item.status),
        value: item.count
      }));
      setAppointmentData(apptData);
      
      setDoctorPerformance(docPerf.data ?? docPerf);
      setStockSummary(stockSum.data ?? stockSum);
      setExpiringBatches(expiring.data ?? expiring);

    } catch (err) {
      console.error("Dashboard load error", err);
      setError("Không thể tải dữ liệu báo cáo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    const map = {
      "COMPLETED": "Hoàn thành",
      "CONFIRMED": "Đã xác nhận",
      "CANCELLED": "Đã hủy",
      "NO_SHOW": "Vắng mặt",
      "PENDING_PAYMENT": "Chờ thanh toán",
      "CHECKED_IN": "Đã check-in",
      "RESCHEDULED": "Đổi lịch"
    };
    return map[status] || status;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDateStr = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  if (loading && !revenueSummary) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Đang tải bảng điều khiển...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="relative flex flex-col items-center mb-6" style={{ fontFamily: "inherit" }}>
        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg" style={{ background: "rgba(255,255,255,0.25)", fontSize: "unset", fontWeight: "unset", color: "unset", letterSpacing: "unset" }}>
            <span style={{ color: "#ffffff", display: "flex", flexShrink: 0 }}><LayoutDashboard size={26} color="#ffffff" /></span>
            <span style={{ color: "#0f766e", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.025em", whiteSpace: "nowrap" }}>Tổng quan Hệ thống</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, marginTop: "12px", textShadow: "0 1px 2px rgba(0,0,0,0.1)", textAlign: "center" }}>
            Thống kê hoạt động và hiệu suất của phòng khám.
          </p>
        </div>
        <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", gap: "8px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.3)" }}>
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              style={{
                border: "none", padding: "6px 16px", borderRadius: "6px", cursor: "pointer",
                background: timeRange === days ? "rgba(255,255,255,0.9)" : "transparent",
                color: timeRange === days ? "#0f766e" : "rgba(255,255,255,0.7)",
                fontWeight: timeRange === days ? 700 : 500,
                boxShadow: timeRange === days ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                fontSize: "13px"
              }}
            >
              {days} ngày
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: "16px", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>TỔNG DOANH THU</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: "#0f172a" }}>
                {revenueSummary ? formatCurrency(revenueSummary.totalRevenue) : "0 ₫"}
              </h3>
            </div>
            <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "10px", color: "#16a34a" }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
            <TrendingUp size={14} color="#10b981" />
            <span>Từ {revenueSummary?.totalInvoices || 0} hóa đơn</span>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>TỔNG LỊCH KHÁM</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: "#0f172a" }}>
                {appointmentData.reduce((acc, curr) => acc + curr.value, 0)}
              </h3>
            </div>
            <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "10px", color: "#2563eb" }}>
              <CalendarDays size={20} />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={14} color="#3b82f6" />
            <span>Trong {timeRange} ngày qua</span>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>GIÁ TRỊ TỒN KHO</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: "#0f172a" }}>
                {stockSummary ? formatCurrency(stockSummary.totalStockValue) : "0 ₫"}
              </h3>
            </div>
            <div style={{ background: "#f5f3ff", padding: "10px", borderRadius: "10px", color: "#7c3aed" }}>
              <Pill size={20} />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <span>Từ {stockSummary?.totalBatches || 0} lô thuộc {stockSummary?.totalMedicines || 0} loại thuốc</span>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: 600 }}>CẢNH BÁO HẠN DÙNG</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: expiringBatches.length > 0 ? "#dc2626" : "#16a34a" }}>
                {expiringBatches.length} lô thuốc
              </h3>
            </div>
            <div style={{ background: expiringBatches.length > 0 ? "#fef2f2" : "#f0fdf4", padding: "10px", borderRadius: "10px", color: expiringBatches.length > 0 ? "#dc2626" : "#16a34a" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            <span>Sẽ hết hạn trong 30 ngày tới</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", color: "#1e293b" }}>Biểu đồ Doanh thu</h3>
          <div style={{ height: "300px" }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={formatDateStr} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)} 
                    labelFormatter={formatDateStr}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", color: "#1e293b" }}>Phân bổ Lịch khám</h3>
          <div style={{ height: "300px" }}>
            {appointmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Chưa có lịch khám</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b" }}>Hiệu suất Bác sĩ</h3>
            <span style={{ fontSize: "13px", color: "#64748b" }}>{timeRange} ngày qua</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#475569" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Bác sĩ</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Ca khám</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Doanh thu</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Chưa có dữ liệu</td></tr>
              ) : (
                doctorPerformance.sort((a,b) => b.totalRevenue - a.totalRevenue).map((doc) => (
                  <tr key={doc.doctorId} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 500, color: "#334155" }}>{doc.doctorName}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "#64748b" }}>{doc.totalAppointments}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "#0ea5e9", fontWeight: 500 }}>{formatCurrency(doc.totalRevenue)}</td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "#eab308", fontWeight: 500 }}>{doc.averageRating.toFixed(1)} ★</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={18} color="#dc2626" /> Lô thuốc sắp/đã hết hạn
            </h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", color: "#475569" }}>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Tên thuốc</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Số lô</th>
                <th style={{ padding: "12px 20px", fontWeight: 600 }}>Hạn dùng</th>
                <th style={{ padding: "12px 20px", fontWeight: 600, textAlign: "right" }}>SL còn</th>
              </tr>
            </thead>
            <tbody>
              {expiringBatches.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#16a34a" }}>Tuyệt vời! Không có lô thuốc nào sắp hết hạn.</td></tr>
              ) : (
                expiringBatches.map((batch) => (
                  <tr key={batch.batchId} style={{ borderTop: "1px solid #f1f5f9", background: batch.daysUntilExpiry < 0 ? "#fef2f2" : "transparent" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 500, color: "#334155" }}>
                      {batch.medicineName}
                      {batch.daysUntilExpiry < 0 && <span style={{ marginLeft: "6px", fontSize: "10px", background: "#dc2626", color: "#fff", padding: "2px 6px", borderRadius: "10px" }}>Đã HẾT HẠN</span>}
                    </td>
                    <td style={{ padding: "12px 20px", color: "#64748b" }}>{batch.batchNumber}</td>
                    <td style={{ padding: "12px 20px", color: batch.daysUntilExpiry <= 15 ? "#dc2626" : "#f59e0b", fontWeight: 600 }}>
                      {new Date(batch.expiryDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "#64748b", fontWeight: 500 }}>{batch.currentQuantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
