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
        <div className="text-slate-400 text-lg flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          Đang tải dữ liệu tổng quan...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col gap-6 pb-8 px-4 sm:px-6">
      <div className="flex flex-col gap-1 mb-2 shrink-0 mt-4">
        <div className="flex items-center gap-2 text-teal-600 mb-2 font-extrabold text-[11px] uppercase tracking-wider">
          <Pill size={16} className="animate-pulse" />
          <span>Hệ thống Quản lý Dược phẩm</span>
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-tight">
          Tổng quan Kho & Cấp phát
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          Theo dõi lượng tồn kho, lô thuốc và các đơn thuốc chờ xử lý.
        </p>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Đơn Chờ Cấp Phát (Highest Priority) */}
        <div
          onClick={() => navigate("/dashboard/pharmacist/prescriptions")}
          className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300 cursor-pointer ${pendingPrescriptionsCount > 0
              ? "!border-fuchsia-100 !bg-fuchsia-50/50"
              : ""
            }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">Đơn Chờ Cấp Phát</p>
              <h3 className={`text-3xl font-black ${pendingPrescriptionsCount > 0 ? "text-fuchsia-600" : "text-slate-800"}`}>
                {pendingPrescriptionsCount} <span className="text-sm font-bold text-slate-500">Đơn</span>
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${pendingPrescriptionsCount > 0 ? "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
              <ClipboardPlus size={22} />
            </div>
          </div>
          <div className={`text-xs font-bold ${pendingPrescriptionsCount > 0 ? "text-fuchsia-500" : "text-slate-400"}`}>
            {pendingPrescriptionsCount > 0 ? "Cần xử lý ngay!" : "Đã xử lý hết đơn"}
          </div>
        </div>

        {/* Card 2: Thuốc Sắp Hết Hàng (High Priority) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300 ${(stockSummary?.lowStockMedicines || 0) > 0
            ? "!border-amber-100 !bg-amber-50/50"
            : ""
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">Thuốc Sắp Hết Hàng</p>
              <h3 className={`text-3xl font-black ${((stockSummary?.lowStockMedicines || 0) > 0) ? "text-amber-600" : "text-slate-800"}`}>
                {stockSummary?.lowStockMedicines || 0} <span className="text-sm font-bold text-slate-500">Loại</span>
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${((stockSummary?.lowStockMedicines || 0) > 0) ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
              <ArrowDownCircle size={22} />
            </div>
          </div>
          <div className={`text-xs font-bold ${((stockSummary?.lowStockMedicines || 0) > 0) ? "text-amber-600" : "text-slate-400"}`}>
            {((stockSummary?.lowStockMedicines || 0) > 0) ? "Cần bổ sung kho" : "Đảm bảo tồn kho"}
          </div>
        </div>

        {/* Card 3: Lô Sắp Hết Hạn (High Priority) */}
        <div
          onClick={() => navigate("/dashboard/inventory/alerts")}
          className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300 cursor-pointer ${expiringBatches.length > 0
              ? "!border-rose-100 !bg-rose-50/50"
              : ""
            }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">Lô Sắp / Đã Hết Hạn</p>
              <h3 className={`text-3xl font-black ${expiringBatches.length > 0 ? "text-rose-600" : "text-slate-800"}`}>
                {expiringBatches.length} <span className="text-sm font-bold text-slate-500">Lô</span>
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${expiringBatches.length > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className={`text-xs font-bold ${expiringBatches.length > 0 ? "text-rose-500" : "text-slate-400"}`}>
            {expiringBatches.length > 0 ? "Cần kiểm tra ngay!" : "Mọi thứ đang an toàn"}
          </div>
        </div>

        {/* Card 4: Tổng Giá Trị Tồn Kho (Neutral KPI) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-md hover:border-teal-100 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-1">Giá Trị Tồn Kho</p>
              <h3 className="text-2xl font-black text-slate-800">
                {stockSummary ? formatCurrency(stockSummary.totalStockValue) : "0 ₫"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/50 flex items-center justify-center shadow-sm">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 font-bold">
            <Pill size={16} className="text-teal-500" />
            Từ {stockSummary?.totalMedicines || 0} loại thuốc
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:border-teal-100 group">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 mb-0.5">Giao dịch Xuất / Nhập gần đây</h2>
              <p className="text-slate-400 text-xs font-semibold">Số lượng thuốc biến động theo ngày</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl flex gap-4 text-[10px] font-extrabold uppercase border border-slate-100">
              <div className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Nhập kho</div>
              <div className="flex items-center gap-1.5 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Xuất kho</div>
            </div>
          </div>

          <div className={`w-full transition-all ${transactionChartData.length > 0 ? "h-[200px]" : "h-[100px]"}`}>
            {transactionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#1e293b' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Bar dataKey="import" name="Nhập kho" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="export" name="Xuất kho" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold gap-2">
                <Package className="opacity-50" size={32} />
                <p>Chưa có giao dịch nào hôm nay</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col transition-all duration-300 hover:shadow-md hover:border-teal-100 group">
          <h2 className="text-lg font-black text-slate-800 mb-0.5">Tỷ lệ An toàn Tồn kho</h2>
          <p className="text-slate-400 text-xs font-semibold mb-4">Lô an toàn vs Lô sắp/đã hết hạn</p>

          <div className="flex-1 min-h-[160px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#10b981" /> {/* Safe */}
                  <Cell fill="#ef4444" /> {/* Expiring */}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#1e293b' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expiring Alerts Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col transition-all duration-300 hover:shadow-md hover:border-teal-100 group">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className={`${expiringBatches.length > 0 ? "text-rose-500" : "text-emerald-500"}`} size={22} />
              Cảnh Báo Hết Hạn
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Danh sách các lô thuốc cần chú ý ngay</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/inventory/alerts")}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-4 py-2 transition-all text-xs shadow-sm cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>

        {expiringBatches.length === 0 ? (
          <div className="mt-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 text-emerald-600 font-bold shadow-sm text-sm">
            <CheckCircle2 size={18} />
            Tuyệt vời! Không có lô thuốc nào cần cảnh báo hiện tại.
          </div>
        ) : (
          <div className="overflow-auto custom-scrollbar max-h-[400px] relative rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/75 border-b border-slate-100">
                <tr className="text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                  <th className="p-4 pl-6 text-left w-36">Mã Lô</th>
                  <th className="p-4 text-center">Tên Thuốc</th>
                  <th className="p-4 text-center w-36">Hạn Dùng</th>
                  <th className="p-4 text-center w-28">SL Còn</th>
                  <th className="p-4 pr-6 text-right w-44">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 font-medium">
                {expiringBatches.slice(0, 5).map((batch) => (
                  <tr key={batch.batchId} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors group">
                    <td className="p-4 text-left font-bold pl-6 text-[#1DB896]">{batch.batchNumber}</td>
                    <td className="p-4 text-slate-800 font-bold text-center">{batch.medicineName}</td>
                    <td className="p-4 text-center">
                      {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">{batch.currentQuantity}</td>
                    <td className="p-4 text-right pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${batch.daysUntilExpiry < 0 ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
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
