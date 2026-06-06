import { useEffect, useState } from "react";
import { History, ArrowDownCircle, ArrowUpCircle, Plus, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTransactions, exportStock, getBatches } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";

const EMPTY_FORM = { medicineId: "", batchId: "", quantity: "", note: "" };

export default function StockTransactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <>
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-md">
              <div className="bg-fuchsia-500/20 p-2.5 rounded-xl border border-fuchsia-500/30 text-fuchsia-300">
                <History size={28} />
              </div>
              Lịch Sử Giao Dịch Kho
            </h1>
            <p className="text-white/70 font-medium mt-1 drop-shadow-sm">Lịch sử xuất/nhập/hoàn trả thuốc.</p>
          </div>
        </div>
        <button className="bg-gradient-to-r from-fuchsia-400 to-pink-400 hover:from-fuchsia-300 hover:to-pink-300 text-slate-900 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-fuchsia-400/30 transition-all flex items-center gap-2" onClick={openForm}>
          <Plus size={18} strokeWidth={2.5} />
          Xuất kho thủ công
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-xl w-full">
      {error && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-6">{error}</div>}

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-white/60 text-sm">
              <th className="p-4 font-semibold pb-3">Loại GD</th>
              <th className="p-4 font-semibold pb-3">Thuốc</th>
              <th className="p-4 font-semibold pb-3">Số lô</th>
              <th className="p-4 font-semibold pb-3 text-right">Số lượng</th>
              <th className="p-4 font-semibold pb-3">Loại tham chiếu</th>
              <th className="p-4 font-semibold pb-3 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-white/50">Đang tải dữ liệu...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-white/50">Chưa có giao dịch nào.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.stockTransactionId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    {tx.transactionType === "IMPORT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ArrowDownCircle size={14} /> Nhập kho
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <ArrowUpCircle size={14} /> Xuất kho
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-white">{tx.medicineName}</td>
                  <td className="p-4">{tx.batchNumber || "—"}</td>
                  <td className="p-4 text-right">
                    <span className={`font-bold ${tx.transactionType === "IMPORT" ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.transactionType === "IMPORT" ? "+" : "-"}{tx.quantity}
                    </span>
                  </td>
                  <td className="p-4">{tx.referenceType}</td>
                  <td className="p-4 text-right text-white/60">{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Xuất kho / Hủy thuốc</h2>
              <button className="text-white/50 hover:text-white transition-colors" onClick={closeForm}><X size={24} /></button>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {formError && <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-3 rounded-xl text-sm">{formError}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Chọn thuốc *</label>
                <select name="medicineId" value={formData.medicineId} onChange={handleMedicineChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-fuchsia-400 focus:outline-none [&>option]:bg-slate-800">
                  <option value="">-- Chọn thuốc --</option>
                  {medicines.map(m => (
                    <option key={m.medicineId} value={m.medicineId}>
                      {m.medicineCode} - {m.medicineName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Chọn lô thuốc *</label>
                <select name="batchId" value={formData.batchId} onChange={handleChange} disabled={!formData.medicineId} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-fuchsia-400 focus:outline-none disabled:opacity-50 [&>option]:bg-slate-800">
                  <option value="">-- Chọn lô --</option>
                  {batches.map(b => (
                    <option key={b.batchId} value={b.batchId}>
                      Lô: {b.batchNumber} (Tồn: {b.currentQuantity} | HSD: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Số lượng xuất *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-fuchsia-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/80">Lý do / Ghi chú *</label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Vd: Thuốc hết hạn, Xuất hủy, Hao hụt..."
                  value={formData.note}
                  onChange={handleChange}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-fuchsia-400 focus:outline-none placeholder:text-white/30"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors font-medium" onClick={closeForm}>Hủy</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold transition-colors shadow-lg shadow-fuchsia-500/30" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Xác nhận xuất kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
