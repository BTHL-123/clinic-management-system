import { useEffect, useState } from "react";
import { History, ArrowDownCircle, ArrowUpCircle, Plus, X } from "lucide-react";
import { getTransactions, exportStock, getBatches } from "../../services/inventoryService";
import { getMedicines } from "../../services/medicineService";

const EMPTY_FORM = { medicineId: "", batchId: "", quantity: "", note: "" };

export default function StockTransactions() {
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
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={26} />
            Lịch Sử Giao Dịch Kho
          </h1>
          <p className="muted">Lịch sử xuất/nhập/hoàn trả thuốc.</p>
        </div>
        <button className="primary-button" onClick={openForm}>
          <Plus size={16} />
          Xuất kho thủ công
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loại GD</th>
              <th>Thuốc</th>
              <th>Số lô</th>
              <th>Số lượng</th>
              <th>Loại tham chiếu</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">Chưa có giao dịch nào.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.stockTransactionId}>
                  <td>
                    {tx.transactionType === "IMPORT" ? (
                      <span className="status-badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownCircle size={14} /> Nhập kho
                      </span>
                    ) : (
                      <span className="status-badge badge-inactive" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpCircle size={14} /> Xuất kho
                      </span>
                    )}
                  </td>
                  <td><strong>{tx.medicineName}</strong></td>
                  <td>{tx.batchNumber || "—"}</td>
                  <td>
                    <span style={{ color: tx.transactionType === "IMPORT" ? "green" : "red", fontWeight: "bold" }}>
                      {tx.transactionType === "IMPORT" ? "+" : "-"}{tx.quantity}
                    </span>
                  </td>
                  <td>{tx.referenceType}</td>
                  <td>{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xuất kho thủ công</h2>
              <button className="icon-button" onClick={closeForm}><X size={18} /></button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div className="field">
                <label>Chọn thuốc *</label>
                <select name="medicineId" value={formData.medicineId} onChange={handleMedicineChange}>
                  <option value="">-- Chọn thuốc --</option>
                  {medicines.map(m => (
                    <option key={m.medicineId} value={m.medicineId}>
                      {m.medicineCode} - {m.medicineName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Chọn lô thuốc *</label>
                <select name="batchId" value={formData.batchId} onChange={handleChange} disabled={!formData.medicineId}>
                  <option value="">-- Chọn lô --</option>
                  {batches.map(b => (
                    <option key={b.batchId} value={b.batchId}>
                      Lô: {b.batchNumber} (Tồn: {b.currentQuantity} | HSD: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Số lượng xuất *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>Lý do / Ghi chú *</label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Vd: Thuốc hết hạn, Xuất hủy, Hao hụt..."
                  value={formData.note}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>Hủy</button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Xác nhận xuất kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
