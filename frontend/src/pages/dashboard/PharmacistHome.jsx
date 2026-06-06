import { useEffect, useState } from "react";
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Package, Pill, AlertTriangle, FileText, 
  TrendingUp, ArrowDownCircle, ArrowUpCircle, ClipboardPlus
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
    <div className="w-full flex flex-col gap-6 h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-2 pb-6">
      <div className="flex flex-col gap-1 mb-2 shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Tổng quan Kho & Cấp phát
        </h1>
        <p className="text-white/70 font-medium">Theo dõi lượng tồn kho, lô thuốc và các đơn thuốc chờ xử lý.</p>
      </div>

      {error && (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-transform group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 font-semibold text-sm uppercase tracking-wider mb-1">Tổng Giá Trị Tồn Kho</p>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">
                {stockSummary ? formatCurrency(stockSummary.totalStockValue) : "0 ₫"}
              </h3>
            </div>
            <div className="bg-teal-500/20 p-3 rounded-2xl text-teal-300 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-sm text-teal-300/80 flex items-center gap-1.5 font-medium">
            <Pill size={16} />
            Từ {stockSummary?.totalMedicines || 0} loại thuốc
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-transform group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 font-semibold text-sm uppercase tracking-wider mb-1">Tổng Lô Thuốc</p>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">
                {stockSummary?.totalBatches || 0} <span className="text-lg font-medium text-white/50">Lô</span>
              </h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-300 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
          </div>
          <div className="text-sm text-blue-300/80 font-medium">
            Đang lưu trữ trong kho
          </div>
        </div>

        <div 
          onClick={() => navigate("/dashboard/pharmacist/prescriptions")}
          className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-transform group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 font-semibold text-sm uppercase tracking-wider mb-1">Đơn Chờ Cấp Phát</p>
              <h3 className="text-2xl font-bold text-fuchsia-400 drop-shadow-sm">
                {pendingPrescriptionsCount} <span className="text-lg font-medium text-fuchsia-400/50">Đơn</span>
              </h3>
            </div>
            <div className="bg-fuchsia-500/20 p-3 rounded-2xl text-fuchsia-300 group-hover:scale-110 transition-transform">
              <ClipboardPlus size={24} />
            </div>
          </div>
          <div className="text-sm text-fuchsia-300/80 font-medium group-hover:text-fuchsia-300 flex items-center gap-1.5 transition-colors">
            Click để xử lý ngay &rarr;
          </div>
        </div>

        <div 
          onClick={() => navigate("/dashboard/inventory/alerts")}
          className={`backdrop-blur-xl border p-6 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-transform group cursor-pointer ${
            expiringBatches.length > 0 
              ? "bg-rose-500/10 border-rose-500/30" 
              : "bg-white/10 border-white/20"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/60 font-semibold text-sm uppercase tracking-wider mb-1">Sắp / Đã Hết Hạn</p>
              <h3 className={`text-2xl font-bold drop-shadow-sm ${expiringBatches.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {expiringBatches.length} <span className="text-lg font-medium opacity-50">Lô</span>
              </h3>
            </div>
            <div className={`${expiringBatches.length > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className={`text-sm font-medium ${expiringBatches.length > 0 ? "text-rose-300/80" : "text-emerald-300/80"}`}>
            {expiringBatches.length > 0 ? "Cần kiểm tra ngay!" : "Mọi thứ đang an toàn"}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 lg:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Giao dịch Xuất / Nhập gần đây</h2>
              <p className="text-white/50 text-sm">Số lượng thuốc biến động theo ngày</p>
            </div>
            <div className="bg-white/5 p-2 rounded-xl flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Nhập kho</div>
              <div className="flex items-center gap-1.5 text-rose-400"><span className="w-3 h-3 rounded-full bg-rose-400"></span> Xuất kho</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {transactionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="import" name="Nhập kho" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="export" name="Xuất kho" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40">Chưa có giao dịch nào gần đây</div>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-2xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-1">Tỷ lệ An toàn Tồn kho</h2>
          <p className="text-white/50 text-sm mb-6">Lô an toàn vs Lô sắp/đã hết hạn</p>
          
          <div className="flex-1 min-h-[250px]">
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
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expiring Alerts Table Preview */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl mt-2">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={24} /> 
              Cảnh Báo Hết Hạn
            </h2>
            <p className="text-white/50 text-sm mt-1">Danh sách các lô thuốc cần chú ý ngay</p>
          </div>
          <button 
            onClick={() => navigate("/dashboard/inventory/alerts")}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10"
          >
            Xem tất cả
          </button>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-white/5 text-white/50 border-b border-white/10">
                <th className="p-4 font-semibold pb-3 pl-6">Mã Lô</th>
                <th className="p-4 font-semibold pb-3">Tên Thuốc</th>
                <th className="p-4 font-semibold pb-3">Hạn Dùng</th>
                <th className="p-4 font-semibold pb-3 text-right">SL Còn</th>
                <th className="p-4 font-semibold pb-3 text-right pr-6">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {expiringBatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-emerald-400 font-medium">
                    Tuyệt vời! Không có lô thuốc nào cần cảnh báo hiện tại.
                  </td>
                </tr>
              ) : (
                expiringBatches.slice(0, 5).map((batch) => (
                  <tr key={batch.batchId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 pl-6 font-semibold">{batch.batchNumber}</td>
                    <td className="p-4 text-white">{batch.medicineName}</td>
                    <td className="p-4">
                      {new Date(batch.expiryDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">{batch.currentQuantity}</td>
                    <td className="p-4 text-right pr-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${batch.daysUntilExpiry < 0 ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                        {batch.daysUntilExpiry < 0 ? "Đã Hết Hạn" : `Còn ${batch.daysUntilExpiry} ngày`}
                      </span>
                    </td>
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
