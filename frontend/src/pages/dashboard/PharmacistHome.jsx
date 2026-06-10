import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Package, Pill, AlertTriangle, FileText,
  TrendingUp, ArrowDownCircle, ArrowUpCircle, ClipboardPlus, CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMedicineStockSummary, getExpiringBatches } from "../../services/reportService";
import { getPrescriptions } from "../../services/prescriptionService";
import { getTransactions } from "../../services/inventoryService";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"];

export default function PharmacistHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stockSummary, setStockSummary] = useState(null);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [pendingPrescriptionsCount, setPendingPrescriptionsCount] = useState(0);
  const [transactionChartData, setTransactionChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch 4 endpoints in parallel
      const [stockRes, expiringRes, prescriptionsRes, transactionsRes] = await Promise.all([
        getMedicineStockSummary(),
        getExpiringBatches({ days: 30 }),
        getPrescriptions({ status: "CREATED", page: 0, size: 1 }),
        getTransactions({ page: 0, size: 100 }) // fetch last 100 for chart
      ]);

      const stockSum = stockRes.data ?? stockRes;
      const expiring = expiringRes.data ?? expiringRes;
      const pendingCount = (prescriptionsRes.data?.totalElements ?? prescriptionsRes.totalElements) || 0;
      const txs = (transactionsRes.data?.content ?? transactionsRes.content) || [];

      setStockSummary(stockSum);
      setExpiringBatches(expiring);
      setPendingPrescriptionsCount(pendingCount);

      // Process Transactions for BarChart (Group by Date)
      const txMap = {};
      txs.forEach(tx => {
        // use transactionDate or createdAt
        const dateStr = (tx.transactionDate || tx.createdAt)?.split("T")[0] || "Unknown";
        if (!txMap[dateStr]) {
          txMap[dateStr] = { date: dateStr, import: 0, export: 0 };
        }
        if (tx.transactionType === "IMPORT") {
          txMap[dateStr].import += tx.quantity;
        } else {
          txMap[dateStr].export += tx.quantity;
        }
      });
      // Sort by date, take last 10 days
      const sortedDates = Object.keys(txMap).sort();
      const chartData = sortedDates.slice(-10).map(d => ({
        date: new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        import: txMap[d].import,
        export: txMap[d].export
      }));
      setTransactionChartData(chartData);

      // Prepare PieChart Data for Stock Status
      const safeBatches = (stockSum.totalBatches || 0) - expiring.length;
      setPieChartData([
        { name: 'Lô an toàn', value: safeBatches > 0 ? safeBatches : 0 },
        { name: 'Sắp/Đã hết hạn', value: expiring.length }
      ]);

    } catch (err) {
      console.error("Pharmacist Dashboard load error", err);
      setError("Không thể tải dữ liệu bảng điều khiển: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading && !stockSummary) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-white/50 text-lg flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          Đang tải dữ liệu tổng quan...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 pb-8">
      <div className="flex flex-col gap-1 mb-2 shrink-0 mt-4">
        <div className="flex items-center gap-2 text-teal-200 mb-2 font-medium">
          <Pill size={18} className="animate-pulse" />
          <span>Hệ thống Quản lý Dược phẩm</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Tổng quan Kho & Cấp phát
        </h1>
        <p className="text-white/80 font-bold drop-shadow-sm text-[16px]">
          Theo dõi lượng tồn kho, lô thuốc và các đơn thuốc chờ xử lý.
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Đơn Chờ Cấp Phát (Highest Priority) */}
        <div
          onClick={() => navigate("/dashboard/pharmacist/prescriptions")}
          className={`patient-glass-panel patient-glass-panel-clear p-6 rounded-[2.5rem] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group cursor-pointer ${pendingPrescriptionsCount > 0
              ? "!border-fuchsia-400/60 !bg-fuchsia-500/15"
              : ""
            }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white font-extrabold text-sm uppercase tracking-wider mb-1 drop-shadow-sm">Đơn Chờ Cấp Phát</p>
              <h3 className={`text-3xl font-black drop-shadow-md ${pendingPrescriptionsCount > 0 ? "text-fuchsia-200" : "text-white"}`}>
                {pendingPrescriptionsCount} <span className="text-xl font-bold text-white">Đơn</span>
              </h3>
            </div>
            <div className={`${pendingPrescriptionsCount > 0 ? "bg-fuchsia-500/40 text-fuchsia-100 border-fuchsia-300/40" : "bg-fuchsia-500/30 text-fuchsia-100 border-fuchsia-300/30"} p-3 rounded-2xl group-hover:scale-110 transition-transform border shadow-sm`}>
              <ClipboardPlus size={24} />
            </div>
          </div>
          <div className="text-base font-bold flex items-center gap-1.5 transition-colors drop-shadow-sm text-white">
            {pendingPrescriptionsCount > 0 ? "Cần xử lý ngay!" : "Đã xử lý hết đơn"}
          </div>
        </div>

        {/* Card 2: Thuốc Sắp Hết Hàng (High Priority) */}
        <div className={`patient-glass-panel patient-glass-panel-clear p-6 rounded-[2.5rem] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group ${(stockSummary?.lowStockMedicines || 0) > 0
            ? "!border-amber-400/60 !bg-amber-500/15"
            : ""
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white font-extrabold text-sm uppercase tracking-wider mb-1 drop-shadow-sm">Thuốc Sắp Hết Hàng</p>
              <h3 className={`text-3xl font-black drop-shadow-md ${((stockSummary?.lowStockMedicines || 0) > 0) ? "text-amber-300" : "text-white"}`}>
                {stockSummary?.lowStockMedicines || 0} <span className="text-xl font-bold text-white">Loại</span>
              </h3>
            </div>
            <div className={`${((stockSummary?.lowStockMedicines || 0) > 0) ? "bg-amber-500/40 text-amber-100 border-amber-300/40" : "bg-amber-500/30 text-amber-100 border-amber-300/30"} p-3 rounded-2xl group-hover:scale-110 transition-transform border shadow-sm`}>
              <ArrowDownCircle size={24} />
            </div>
          </div>
          <div className="text-base font-bold text-white drop-shadow-sm">
            {((stockSummary?.lowStockMedicines || 0) > 0) ? "Cần bổ sung kho" : "Đảm bảo tồn kho"}
          </div>
        </div>

        {/* Card 3: Lô Sắp Hết Hạn (High Priority) */}
        <div
          onClick={() => navigate("/dashboard/inventory/alerts")}
          className={`patient-glass-panel patient-glass-panel-clear p-6 rounded-[2.5rem] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group cursor-pointer ${expiringBatches.length > 0
              ? "!border-rose-400/60 !bg-rose-500/15"
              : ""
            }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white font-extrabold text-sm uppercase tracking-wider mb-1 drop-shadow-sm">Lô Sắp / Đã Hết Hạn</p>
              <h3 className={`text-3xl font-black drop-shadow-md ${expiringBatches.length > 0 ? "text-rose-300" : "text-white"}`}>
                {expiringBatches.length} <span className="text-xl font-bold text-white">Lô</span>
              </h3>
            </div>
            <div className={`${expiringBatches.length > 0 ? "bg-rose-500/40 text-rose-100 border-rose-300/40" : "bg-rose-500/30 text-rose-100 border-rose-300/30"} p-3 rounded-2xl group-hover:scale-110 transition-transform border shadow-sm`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="text-base font-bold text-white drop-shadow-sm">
            {expiringBatches.length > 0 ? "Cần kiểm tra ngay!" : "Mọi thứ đang an toàn"}
          </div>
        </div>

        {/* Card 4: Tổng Giá Trị Tồn Kho (Neutral KPI) */}
        <div className="patient-glass-panel patient-glass-panel-clear p-6 rounded-[2.5rem] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white font-extrabold text-sm uppercase tracking-wider mb-1 drop-shadow-sm">Giá Trị Tồn Kho</p>
              <h3 className="text-3xl font-black text-white drop-shadow-md">
                {stockSummary ? formatCurrency(stockSummary.totalStockValue) : "0 ₫"}
              </h3>
            </div>
            <div className="bg-teal-500/30 p-3 rounded-2xl text-teal-100 group-hover:scale-110 group-hover:rotate-3 transition-transform border border-teal-300/30 shadow-sm">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-base text-white flex items-center gap-1.5 font-bold drop-shadow-sm">
            <Pill size={18} />
            Từ {stockSummary?.totalMedicines || 0} loại thuốc
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 patient-glass-panel patient-glass-panel-clear rounded-[2.5rem] p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white mb-1 drop-shadow-md">Giao dịch Xuất / Nhập gần đây</h2>
              <p className="text-white text-sm font-bold drop-shadow-sm">Số lượng thuốc biến động theo ngày</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl flex gap-4 text-xs font-bold border border-white/20">
              <div className="flex items-center gap-1.5 text-emerald-300"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Nhập kho</div>
              <div className="flex items-center gap-1.5 text-rose-300"><span className="w-3 h-3 rounded-full bg-rose-400"></span> Xuất kho</div>
            </div>
          </div>

          <div className={`w-full transition-all ${transactionChartData.length > 0 ? "h-[180px]" : "h-[100px]"}`}>
            {transactionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.08)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="import" name="Nhập kho" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="export" name="Xuất kho" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white font-bold gap-2">
                <Package className="opacity-50" size={32} />
                <p>Chưa có giao dịch nào hôm nay</p>
              </div>
            )}
          </div>
        </div>

        <div className="patient-glass-panel patient-glass-panel-clear rounded-[2.5rem] p-6 flex flex-col hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group">
          <h2 className="text-xl font-extrabold text-white mb-1 drop-shadow-md">Tỷ lệ An toàn Tồn kho</h2>
          <p className="text-white text-sm mb-4 font-bold drop-shadow-sm">Lô an toàn vs Lô sắp/đã hết hạn</p>

          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#10b981" /> {/* Safe */}
                  <Cell fill="#ef4444" /> {/* Expiring */}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expiring Alerts Table Preview */}
      <div className="patient-glass-panel patient-glass-panel-clear rounded-[2.5rem] p-6 flex flex-col hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition-all group">
        <div className={`flex justify-between items-center shrink-0 ${expiringBatches.length > 0 ? "mb-6" : ""}`}>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 drop-shadow-md">
              <AlertTriangle className={`${expiringBatches.length > 0 ? "text-rose-300" : "text-emerald-300"}`} size={24} />
              Cảnh Báo Hết Hạn
            </h2>
            <p className="text-white text-sm mt-1 font-bold drop-shadow-sm">Danh sách các lô thuốc cần chú ý ngay</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/inventory/alerts")}
            className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-bold transition-colors border border-white/25"
          >
            Xem tất cả
          </button>
        </div>

        {expiringBatches.length === 0 ? (
          <div className="mt-4 p-4 bg-emerald-500/15 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 text-white font-bold shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-300" />
            Tuyệt vời! Không có lô thuốc nào cần cảnh báo hiện tại.
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar max-h-[400px] relative rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-teal-900/60 backdrop-blur-md">
                <tr className="text-white/90 border-b border-white/15">
                  <th className="p-4 font-bold pb-3 text-left pl-6">Mã Lô</th>
                  <th className="p-4 font-bold pb-3 text-center">Tên Thuốc</th>
                  <th className="p-4 font-bold pb-3 text-center">Hạn Dùng</th>
                  <th className="p-4 font-bold pb-3 text-center">SL Còn</th>
                  <th className="p-4 font-bold pb-3 text-right pr-6">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {expiringBatches.slice(0, 5).map((batch) => (
                  <tr key={batch.batchId} className="border-b border-white/10 hover:bg-white/10 transition-colors group">
                    <td className="p-4 text-left font-bold pl-6">{batch.batchNumber}</td>
                    <td className="p-4 text-white font-semibold text-center">{batch.medicineName}</td>
                    <td className="p-4 text-center text-white/90">
                      {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-center font-bold text-white">{batch.currentQuantity}</td>
                    <td className="p-4 text-right pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${batch.daysUntilExpiry < 0 ? "bg-rose-500/25 text-rose-200 border-rose-400/30" : "bg-amber-500/25 text-amber-200 border-amber-400/30"}`}>
                        {batch.daysUntilExpiry < 0 ? "Đã Hết Hạn" : `Còn ${batch.daysUntilExpiry} ngày`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
