import { useEffect, useState, useMemo } from "react";
import { History, ArrowDownCircle, ArrowUpCircle, Plus, X, ArrowLeft, RefreshCw, Info, Calendar, Clock, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTransactions, exportStock, getBatches } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";
import PageHeader from "../../components/PageHeader";

const EMPTY_FORM = { medicineId: "", batchId: "", quantity: "", note: "" };

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const normalized = dateStr.includes(" ") && !dateStr.includes("T") 
      ? dateStr.replace(" ", "T") 
      : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr || "—";
  }
};

export default function StockTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [batches, setBatches] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTx, resMeds] = await Promise.all([
        getTransactions(),
        getMedicines({ size: 1000, status: "ACTIVE" })
      ]);
      setTransactions(resTx.data?.content ?? []);
      setMedicines(resMeds.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase().trim();
    return transactions.filter(
      (tx) =>
        (tx.medicineName?.toLowerCase() || "").includes(term) ||
        (tx.batchNumber?.toLowerCase() || "").includes(term) ||
        (tx.referenceType?.toLowerCase() || "").includes(term)
    );
  }, [transactions, searchTerm]);

  // Set default selection
  useEffect(() => {
    if (filtered && filtered.length > 0) {
      const exists = filtered.some(t => t.stockTransactionId === selectedTxId);
      if (!exists) {
        setSelectedTxId(filtered[0].stockTransactionId);
      }
    } else {
      setSelectedTxId(null);
    }
  }, [filtered, selectedTxId]);

  const selectedTx = useMemo(() => {
    return transactions.find(t => t.stockTransactionId === selectedTxId) || null;
  }, [transactions, selectedTxId]);

  const openForm = () => {
    setFormData(EMPTY_FORM);
    setBatches([]);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(EMPTY_FORM);
    setBatches([]);
    setFormError("");
  };

  const handleMedicineChange = async (e) => {
    const medId = e.target.value;
    setFormData(prev => ({ ...prev, medicineId: medId, batchId: "", quantity: "" }));
    if (medId) {
      try {
        const res = await getBatches({ medicineId: medId, size: 1000 });
        const availableBatches = (res.data?.content ?? []).filter(b => b.currentQuantity > 0);
        setBatches(availableBatches);
      } catch (err) {
        console.error(err);
      }
    } else {
      setBatches([]);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicineId || !formData.batchId || !formData.quantity || !formData.note) {
      setFormError("Vui lòng điền đầy đủ thông tin bắt buộc (*).");
      return;
    }
    const qty = parseInt(formData.quantity, 10);
    if (qty <= 0) {
      setFormError("Số lượng xuất phải lớn hơn 0.");
      return;
    }
    const selectedBatch = batches.find(b => b.batchId.toString() === formData.batchId.toString());
    if (selectedBatch && qty > selectedBatch.currentQuantity) {
      setFormError(`Số lượng xuất vượt quá tồn kho hiện tại (Tồn: ${selectedBatch.currentQuantity}).`);
      return;
    }

    try {
      setSubmitting(true);
      await exportStock({
        medicineId: parseInt(formData.medicineId, 10),
        batchId: parseInt(formData.batchId, 10),
        quantity: qty,
        note: formData.note
      });
      closeForm();
      const res = await getTransactions();
      setTransactions(res.data?.content ?? []);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pr-1 relative text-slate-800 pb-8">
      
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
              <History size={22} className="text-[#1DB896]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lịch Sử Giao Dịch Kho</h1>
          </div>
          <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">
            Theo dõi chi tiết lịch sử các giao dịch nhập kho, xuất kho và hao hụt dược phẩm.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên thuốc, số lô, loại tham chiếu..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-655 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={openForm}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold rounded-xl px-5 py-2.5 shadow-md shadow-teal-500/15 text-xs flex items-center justify-center gap-1.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
        >
          <Plus size={16} /> Xuất kho thủ công
        </button>
      </div>

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl shadow-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Main Content Split Columns */}
      <div className="w-full flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: List (5/12 width) */}
          <div className="lg:col-span-5 flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
            {loading && transactions.length === 0 ? (
              <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-3xl">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#1DB896]"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6">
                <History size={40} className="text-slate-300 mx-auto opacity-40 mb-3" />
                <div className="text-xs text-[#4A5D59] font-bold">Chưa có giao dịch kho nào.</div>
              </div>
            ) : (
              filtered.map((tx) => {
                const isSelected = tx.stockTransactionId === selectedTxId;
                const isImport = tx.transactionType === "IMPORT";
                
                return (
                  <button
                    key={tx.stockTransactionId}
                    onClick={() => setSelectedTxId(tx.stockTransactionId)}
                    className={`w-full text-left bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "border-[#1DB896] shadow-md ring-1 ring-[#1DB896]/20 bg-teal-50/5" 
                        : "border-slate-200/80 hover:border-slate-350 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1DB896]"></div>
                    )}
                    
                    {/* Top Row: Date & Transaction Type */}
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <Clock size={13} className="text-slate-400" />
                        <span>
                          {formatDateTime(tx.createdAt)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                        isImport 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-rose-50 text-rose-700 border-rose-150'
                      }`}>
                        {isImport ? 'Nhập kho' : 'Xuất kho'}
                      </span>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Medicine name */}
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2">
                        {tx.medicineName}
                      </h4>
                      {tx.batchNumber && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Lô: <span className="font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1 rounded">{tx.batchNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="h-px bg-slate-50 w-full"></div>

                    {/* Quantity & Reference */}
                    <div className="flex justify-between items-center text-[10px] text-slate-505 font-bold">
                      <span>Loại: {tx.referenceType === "PRESCRIPTION_DISPENSE" ? "Cấp phát thuốc" : tx.referenceType === "MANUAL_EXPORT" ? "Hủy thủ công" : tx.referenceType}</span>
                      <strong className={`text-xs ${isImport ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isImport ? '+' : '-'}{tx.quantity}
                      </strong>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Sticky Detail Panel (7/12 width) */}
          <div className="lg:col-span-7 sticky top-6">
            {selectedTx ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-6 animate-[fadeIn_0.25s_ease]">
                
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chi tiết giao dịch kho</span>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1">
                      <History size={18} className="text-[#1DB896] shrink-0" />
                      <span>{selectedTx.medicineName}</span>
                    </h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    selectedTx.transactionType === 'IMPORT' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {selectedTx.transactionType === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'}
                  </span>
                </div>

                {/* Details Card */}
                <div className="flex flex-col gap-4 text-xs bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Số lượng biến động</span>
                      <strong className={`text-sm font-black block ${selectedTx.transactionType === 'IMPORT' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selectedTx.transactionType === 'IMPORT' ? '+' : '-'}{selectedTx.quantity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Số lô hàng (Batch #)</span>
                      <strong className="text-slate-800 font-mono text-xs block">{selectedTx.batchNumber || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Thời gian thực hiện</span>
                      <strong className="text-slate-800 font-bold text-xs block">
                        {formatDateTime(selectedTx.createdAt)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-450 font-bold block mb-0.5">Loại tham chiếu</span>
                      <strong className="text-slate-800 font-bold text-xs block">
                        {selectedTx.referenceType === "PRESCRIPTION_DISPENSE" ? "Cấp phát thuốc đơn" : selectedTx.referenceType === "MANUAL_EXPORT" ? "Hủy/Xuất thủ công" : selectedTx.referenceType}
                      </strong>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200/60 my-1"></div>

                  <div>
                    <span className="text-slate-450 font-bold block mb-1">Ghi chú giao dịch / Lý do</span>
                    <p className="text-slate-700 text-xs font-semibold leading-relaxed bg-white border border-slate-150/50 rounded-xl p-3.5 mt-1 min-h-[60px]">
                      {selectedTx.note || "Không có ghi chú nào đi kèm."}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-16 font-bold flex flex-col items-center gap-3">
                <Info size={40} className="text-slate-300" />
                Chọn một giao dịch trong danh sách bên trái để xem đầy đủ thông tin chi tiết và lý do xuất/nhập.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Xuất Kho Thủ Công */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]" onClick={closeForm}>
          <div className="bg-white p-7 rounded-[2rem] w-full max-w-lg shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0F9F7] text-[#1DB896] border border-[#1DB896]/20">
                  <ArrowUpCircle size={18} />
                </div>
                Xuất kho / Hủy thuốc thủ công
              </h3>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                onClick={closeForm}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formError && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">{formError}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Chọn dược phẩm cần xuất *</label>
                <select
                  name="medicineId"
                  required
                  value={formData.medicineId}
                  onChange={handleMedicineChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer"
                >
                  <option value="">-- Chọn thuốc trong kho --</option>
                  {medicines.map((m) => (
                    <option key={m.medicineId} value={m.medicineId}>
                      {m.medicineCode} - {m.medicineName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Chọn lô thuốc còn hàng *</label>
                <select
                  name="batchId"
                  required
                  disabled={!formData.medicineId}
                  value={formData.batchId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-[#4A5D59] cursor-pointer disabled:opacity-50"
                >
                  <option value="">-- Chọn lô xuất hàng --</option>
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      Lô: {b.batchNumber} (Còn: {b.currentQuantity} | HSD: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Số lượng xuất kho *</label>
                <input
                  type="number"
                  name="quantity"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Nhập số lượng..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold text-slate-800 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#4A5D59]">Lý do xuất kho (Ghi chú) *</label>
                <textarea
                  name="note"
                  required
                  rows={2.5}
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="VD: Hủy thuốc hết hạn, lỗi bao bì, hao hụt kho..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1DB896]/20 focus:border-[#1DB896] text-xs font-bold placeholder-slate-400 text-slate-800 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[#4A5D59] font-black hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                  onClick={closeForm}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0A604E] hover:bg-[#084f40] text-white font-black hover:shadow-md transition-colors disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận xuất kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
