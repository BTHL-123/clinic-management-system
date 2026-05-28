import { useEffect, useState } from "react";
import {
  Banknote,
  Edit,
  Eye,
  Plus,
  Receipt,
  Search,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelInvoice,
  createInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
} from "../../services/invoiceService";
import { createPayment, confirmCashPayment } from "../../services/paymentService";
import { getMedicines } from "../../services/medicineService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const ITEM_TYPES = [
  { value: "CONSULTATION", label: "Khám bệnh" },
  { value: "LAB_TEST", label: "Xét nghiệm" },
  { value: "MEDICINE", label: "Thuốc" },
  { value: "SERVICE", label: "Dịch vụ" },
];

const EMPTY_ITEM = {
  itemType: "CONSULTATION",
  referenceId: null,
  itemName: "",
  quantity: 1,
  unitPrice: "",
};

const EMPTY_FORM = {
  patientId: "",
  appointmentId: "",
  discountAmount: 0,
  items: [{ ...EMPTY_ITEM }],
};

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // detail modal
  const [detailInvoice, setDetailInvoice] = useState(null);

  // cancel confirm
  const [cancelTarget, setCancelTarget] = useState(null);

  // payment modal
  const [payTarget, setPayTarget] = useState(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState("");

  // medicines list
  const [medicinesList, setMedicinesList] = useState([]);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = { page: 0, size: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await getInvoices(params);
      setInvoices(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await getMedicines({ page: 0, size: 1000, status: "ACTIVE" });
        setMedicinesList(res.data?.content ?? []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách thuốc", err);
      }
    };
    fetchMeds();
  }, []);

  /* ── Filter ────────────────────────────────────────────── */
  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── Detail ────────────────────────────────────────────── */
  const openDetail = async (inv) => {
    try {
      const res = await getInvoiceById(inv.invoiceId);
      setDetailInvoice(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = async (inv) => {
    try {
      const res = await getInvoiceById(inv.invoiceId);
      const detail = res.data;
      setFormData({
        patientId: detail.patientId,
        appointmentId: detail.appointmentId ?? "",
        discountAmount: detail.discountAmount ?? 0,
        items: detail.items?.map((it) => ({
          itemType: it.itemType,
          referenceId: it.referenceId,
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })) ?? [{ ...EMPTY_ITEM }],
      });
      setEditingId(inv.invoiceId);
      setFormError("");
      setShowForm(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      const item = { ...items[index], [field]: value };
      
      if (field === "itemType") {
        if (value === "MEDICINE") {
          item.referenceId = "";
          item.itemName = "";
          item.unitPrice = "";
        } else {
          item.referenceId = null;
        }
      } else if (field === "referenceId" && items[index].itemType === "MEDICINE") {
        const medId = Number(value);
        const selectedMed = medicinesList.find((m) => m.medicineId === medId);
        if (selectedMed) {
          item.referenceId = medId;
          item.itemName = selectedMed.medicineName;
          item.unitPrice = selectedMed.sellingPrice || 0;
        } else {
          item.referenceId = "";
          item.itemName = "";
          item.unitPrice = "";
        }
      }
      
      items[index] = item;
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calcTotal = () => {
    return formData.items.reduce((sum, item) => {
      const price = Number(item.unitPrice) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !formData.patientId) {
      setFormError("Vui lòng nhập Patient ID.");
      return;
    }
    if (formData.items.some((it) => !it.itemName.trim() || !it.unitPrice)) {
      setFormError("Vui lòng điền đầy đủ tên và đơn giá cho mỗi dịch vụ.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        patientId: Number(formData.patientId) || undefined,
        appointmentId: formData.appointmentId
          ? Number(formData.appointmentId)
          : null,
        discountAmount: Number(formData.discountAmount) || 0,
        items: formData.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      };
      if (editingId) {
        await updateInvoice(editingId, {
          discountAmount: payload.discountAmount,
          items: payload.items,
        });
      } else {
        await createInvoice(payload);
      }
      closeForm();
      await fetchInvoices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Cancel handlers ───────────────────────────────────── */
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelInvoice(cancelTarget.invoiceId);
      setCancelTarget(null);
      await fetchInvoices();
    } catch (err) {
      setError(err.message);
      setCancelTarget(null);
    }
  };

  /* ── Payment handlers ────────────────────────────────────── */
  const openPayment = (inv) => {
    setPayTarget(inv);
    setPayMethod("CASH");
    setPayError("");
  };

  const handlePayment = async () => {
    if (!payTarget) return;
    try {
      setPaySubmitting(true);
      const res = await createPayment({
        invoiceId: payTarget.invoiceId,
        appointmentId: null,
        paymentType: "FINAL_PAYMENT",
        paymentMethod: payMethod,
        amount: payTarget.finalAmount,
      });
      if (payMethod === "CASH") {
        await confirmCashPayment(res.data.paymentId);
      }
      setPayTarget(null);
      await fetchInvoices();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaySubmitting(false);
    }
  };

  /* ── Helpers ───────────────────────────────────────────── */
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const statusBadge = (status) => {
    const map = {
      UNPAID: { cls: "badge-warning", label: "Chưa thanh toán" },
      PAID: { cls: "badge-active", label: "Đã thanh toán" },
      CANCELLED: { cls: "badge-inactive", label: "Đã hủy" },
    };
    const s = map[status] ?? { cls: "", label: status };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt size={26} />
            Quản lý Hóa đơn
          </h1>
          <p className="muted">
            Quản lý hóa đơn khám chữa bệnh.
          </p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Tạo hóa đơn
        </button>
      </div>

      {/* ── Search & Filter ──────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ hoặc tên bệnh nhân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            minHeight: 44,
            border: "1px solid #d7dee8",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#fff",
            font: "inherit",
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <div className="error-box">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã HĐ</th>
              <th>Bệnh nhân</th>
              <th>Tổng tiền</th>
              <th>Giảm giá</th>
              <th>Thành tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  {searchTerm
                    ? "Không tìm thấy hóa đơn nào."
                    : "Chưa có hóa đơn nào. Hãy tạo mới!"}
                </td>
              </tr>
            ) : (
              filtered.map((inv, idx) => (
                <tr key={inv.invoiceId}>
                  <td>{idx + 1}</td>
                  <td><code>{inv.invoiceCode}</code></td>
                  <td className="cell-name">{inv.patientName}</td>
                  <td>{formatPrice(inv.totalAmount)}</td>
                  <td>{formatPrice(inv.discountAmount)}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(inv.finalAmount)}</td>
                  <td>{statusBadge(inv.status)}</td>
                  <td>
                    {inv.createdAt
                      ? new Date(inv.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-button"
                        title="Xem chi tiết"
                        onClick={() => openDetail(inv)}
                      >
                        <Eye size={15} />
                      </button>
                      {inv.status === "UNPAID" && (
                        <>
                          <button
                            className="icon-button"
                            title="Thanh toán"
                            style={{ color: "#16a34a", borderColor: "#bbf7d0" }}
                            onClick={() => openPayment(inv)}
                          >
                            <Banknote size={15} />
                          </button>
                          <button
                            className="icon-button"
                            title="Chỉnh sửa"
                            onClick={() => openEdit(inv)}
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="icon-button btn-danger"
                            title="Hủy hóa đơn"
                            onClick={() => setCancelTarget(inv)}
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div
            className="modal-card"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? "Cập nhật hóa đơn" : "Tạo hóa đơn mới"}</h2>
              <button className="icon-button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              {!editingId && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="field">
                    <label htmlFor="patientId">Patient ID *</label>
                    <input
                      id="patientId"
                      name="patientId"
                      type="number"
                      value={formData.patientId}
                      onChange={handleChange}
                      placeholder="VD: 1"
                      autoFocus
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="appointmentId">Appointment ID</label>
                    <input
                      id="appointmentId"
                      name="appointmentId"
                      type="number"
                      value={formData.appointmentId}
                      onChange={handleChange}
                      placeholder="Tùy chọn"
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <label>Danh sách dịch vụ / thuốc</label>
                {formData.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 70px 120px 36px",
                      gap: 8,
                      alignItems: "end",
                      marginBottom: 6,
                    }}
                  >
                    <select
                      value={item.itemType}
                      onChange={(e) => handleItemChange(i, "itemType", e.target.value)}
                      style={{ minHeight: 38, border: "1px solid #d7dee8", borderRadius: 6, padding: "6px 8px" }}
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {item.itemType === "MEDICINE" ? (
                      <select
                        value={item.referenceId || ""}
                        onChange={(e) => handleItemChange(i, "referenceId", e.target.value)}
                        style={{ minHeight: 38, border: "1px solid #d7dee8", borderRadius: 6, padding: "6px 8px" }}
                      >
                        <option value="">-- Chọn thuốc --</option>
                        {medicinesList.map((m) => (
                          <option key={m.medicineId} value={m.medicineId}>
                            {m.medicineName} ({m.medicineCode})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        placeholder="Tên dịch vụ"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(i, "itemName", e.target.value)}
                        style={{ minHeight: 38, border: "1px solid #d7dee8", borderRadius: 6, padding: "6px 8px" }}
                      />
                    )}
                    <input
                      type="number"
                      min="1"
                      placeholder="SL"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                      style={{ minHeight: 38, border: "1px solid #d7dee8", borderRadius: 6, padding: "6px 8px" }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Đơn giá"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(i, "unitPrice", e.target.value)}
                      style={{ minHeight: 38, border: "1px solid #d7dee8", borderRadius: 6, padding: "6px 8px" }}
                    />
                    <button
                      type="button"
                      className="icon-button btn-danger"
                      style={{ width: 36, height: 36 }}
                      onClick={() => removeItem(i)}
                      disabled={formData.items.length <= 1}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  style={{ width: "fit-content", marginTop: 4 }}
                  onClick={addItem}
                >
                  <Plus size={14} /> Thêm dòng
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label htmlFor="discountAmount">Giảm giá (VNĐ)</label>
                  <input
                    id="discountAmount"
                    name="discountAmount"
                    type="number"
                    min="0"
                    value={formData.discountAmount}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label>Tổng tiền (tạm tính)</label>
                  <div style={{
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    fontWeight: 700,
                    color: "#0f766e",
                  }}>
                    {formatPrice(Math.max(0, calcTotal() - (Number(formData.discountAmount) || 0)))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>
                  Hủy
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Tạo hóa đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────── */}
      {detailInvoice && (
        <div className="modal-overlay" onClick={() => setDetailInvoice(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chi tiết hóa đơn {detailInvoice.invoiceCode}</h2>
              <button className="icon-button" onClick={() => setDetailInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              <div><strong>Bệnh nhân:</strong> {detailInvoice.patientName} (ID: {detailInvoice.patientId})</div>
              <div><strong>Trạng thái:</strong> {statusBadge(detailInvoice.status)}</div>
              {detailInvoice.paidAt && (
                <div><strong>Thanh toán lúc:</strong> {new Date(detailInvoice.paidAt).toLocaleString("vi-VN")}</div>
              )}
            </div>

            <div className="table-wrapper" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dịch vụ</th>
                    <th>Loại</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInvoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="cell-name">{item.itemName}</td>
                      <td><span className="status-badge badge-info">{item.itemType}</span></td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.unitPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gap: 4, textAlign: "right", fontSize: "0.95rem" }}>
              <div>Tổng tiền: {formatPrice(detailInvoice.totalAmount)}</div>
              <div>Giảm giá: -{formatPrice(detailInvoice.discountAmount)}</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f766e" }}>
                Thành tiền: {formatPrice(detailInvoice.finalAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm Modal ─────────────────────────── */}
      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận hủy hóa đơn</h2>
              <button className="icon-button" onClick={() => setCancelTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <p>
              Bạn có chắc chắn muốn hủy hóa đơn{" "}
              <strong>{cancelTarget.invoiceCode}</strong> không?
            </p>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setCancelTarget(null)}>
                Quay lại
              </button>
              <button className="danger-button" onClick={confirmCancel}>
                Hủy hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ──────────────────────────────────── */}
      {payTarget && (
        <div className="modal-overlay" onClick={() => setPayTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thanh toán hóa đơn {payTarget.invoiceCode}</h2>
              <button className="icon-button" onClick={() => setPayTarget(null)}>
                <X size={18} />
              </button>
            </div>

            {payError && <div className="error-box">{payError}</div>}

            <div style={{ display: "grid", gap: 10, marginBottom: 16, fontSize: "0.95rem" }}>
              <div><strong>Bệnh nhân:</strong> {payTarget.patientName}</div>
              <div><strong>Thành tiền:</strong>{" "}
                <span style={{ fontWeight: 700, color: "#0f766e", fontSize: "1.1rem" }}>
                  {formatPrice(payTarget.finalAmount)}
                </span>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>Phương thức thanh toán</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="ONLINE">Chuyển khoản</option>
              </select>
            </div>

            <div className="form-actions">
              <button className="secondary-button" onClick={() => setPayTarget(null)}>
                Hủy
              </button>
              <button
                className="primary-button"
                onClick={handlePayment}
                disabled={paySubmitting}
              >
                {paySubmitting ? "Đang xử lý..." : payMethod === "CASH" ? "Xác nhận đã thu tiền" : "Tạo giao dịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
