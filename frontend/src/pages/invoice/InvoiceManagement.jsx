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
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  cancelInvoice,
  createInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
} from "../../services/invoiceService";
import { createPayment, confirmCashPayment, createOnlinePaymentUrl, verifySePayTransaction } from "../../services/paymentService";
import { getMedicines } from "../../services/medicineService";
import PageHeader from "../../components/PageHeader";

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

  // qr payment modal
  const [qrPaymentData, setQrPaymentData] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

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
      if (payMethod === "ONLINE") {
        const res = await createOnlinePaymentUrl({
          invoiceId: payTarget.invoiceId,
          appointmentId: null,
          amount: payTarget.finalAmount,
        });
        if (res.data && res.data.paymentUrl) {
          setQrPaymentData({
            paymentId: res.data.paymentId,
            paymentUrl: res.data.paymentUrl,
            invoiceCode: payTarget.invoiceCode,
            finalAmount: payTarget.finalAmount,
            patientName: payTarget.patientName
          });
          setPayTarget(null); // Đóng modal chọn phương thức
        }
        return;
      }

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

  const handleVerifyPayment = async () => {
    if (!qrPaymentData) return;
    try {
      setVerifyingPayment(true);
      await verifySePayTransaction(qrPaymentData.paymentId);
      setQrPaymentData(null);
      await fetchInvoices();
      alert("Xác nhận thanh toán thành công!");
    } catch (err) {
      alert(err.message || "Giao dịch chưa hoàn tất. Vui lòng thử lại sau ít phút.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  /* ── Helpers ───────────────────────────────────────────── */
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const statusBadge = (status) => {
    if (status === "UNPAID") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 border border-rose-200 text-rose-700">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
        Chưa thanh toán
      </span>
    );
    if (status === "PAID") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
        <CheckCircle2 size={12} />
        Đã thanh toán
      </span>
    );
    if (status === "CANCELLED") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 border border-slate-200 text-slate-500">
        <XCircle size={12} />
        Đã hủy
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 border border-sky-200 text-sky-600">
        {status}
      </span>
    );
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <>
      {/* ── Page Header ────────────────────────────────── */}
      <PageHeader
        title="Quản lý Hóa đơn"
        icon={Receipt}
        iconColor="text-white"
        subtitle="Quản lý hóa đơn khám chữa bệnh."
        rightContent={
          <button className="primary-button" onClick={openCreate}>
            <Plus size={16} />
            Tạo hóa đơn
          </button>
        }
      />

      {/* ── Search & Filter ──────────────────────────────── */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ hoặc tên bệnh nhân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[44px] border border-slate-200 bg-white/60 backdrop-blur rounded-2xl px-4 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <div className="error-box">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-4 w-10">#</th>
                <th className="py-3.5 px-4">Mã HĐ</th>
                <th className="py-3.5 px-4">Bệnh nhân</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                <th className="py-3.5 px-4 text-right">Giảm giá</th>
                <th className="py-3.5 px-4 text-right">Thành tiền</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-teal-500"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 font-semibold text-sm">
                    {searchTerm ? "Không tìm thấy hóa đơn nào." : "Chưa có hóa đơn nào. Hãy tạo mới!"}
                  </td>
                </tr>
              ) : (
                filtered.map((inv, idx) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg">{inv.invoiceCode}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 text-sm">{inv.patientName}</td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-slate-600">{formatPrice(inv.totalAmount)}</td>
                    <td className="py-4 px-4 text-right text-sm font-medium text-emerald-600">-{formatPrice(inv.discountAmount)}</td>
                    <td className="py-4 px-4 text-right text-sm font-extrabold text-slate-800">{formatPrice(inv.finalAmount)}</td>
                    <td className="py-4 px-4">{statusBadge(inv.status)}</td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-500">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Nút Xem - luôn hiển thị */}
                        <button
                          onClick={() => openDetail(inv)}
                          title="Xem chi tiết"
                          className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 hover:scale-110 transition-all duration-200 shrink-0"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Các nút chỉ hiển thị với UNPAID */}
                        {inv.status === "UNPAID" && (
                          <>
                            <button
                              onClick={() => openPayment(inv)}
                              title="Thu tiền"
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:scale-110 transition-all duration-200 shrink-0"
                            >
                              <Banknote size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(inv)}
                              title="Chỉnh sửa hóa đơn"
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 hover:scale-110 transition-all duration-200 shrink-0"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setCancelTarget(inv)}
                              title="Hủy hóa đơn"
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:scale-110 transition-all duration-200 shrink-0"
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
              <table className="data-table fixed-table">
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCancelTarget(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon cảnh báo */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle size={30} className="text-rose-600" />
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-800 text-center mb-2">Xác nhận hủy hóa đơn</h2>
            <p className="text-center text-slate-500 font-medium text-sm mb-1">
              Bạn có chắc chắn muốn hủy hóa đơn
            </p>
            <p className="text-center font-extrabold text-rose-600 text-base mb-2">
              {cancelTarget.invoiceCode}
            </p>
            <p className="text-center text-slate-400 text-xs font-medium mb-7">
              Hành động này <strong className="text-rose-500">không thể hoàn tác</strong>.
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
                onClick={() => setCancelTarget(null)}
              >
                Quay lại
              </button>
              <button
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-all shadow-md shadow-rose-500/25 flex items-center justify-center gap-2"
                onClick={confirmCancel}
              >
                <XCircle size={16} />
                Hủy hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ──────────────────────────────────── */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPayTarget(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Thu tiền hóa đơn</h2>
                <p className="text-sm font-mono text-teal-600 mt-0.5">{payTarget.invoiceCode}</p>
              </div>
              <button
                onClick={() => setPayTarget(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {payError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-semibold">
                {payError}
              </div>
            )}

            {/* Invoice Summary */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Bệnh nhân</span>
                <span className="font-bold text-slate-800">{payTarget.patientName}</span>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600">Cần thanh toán</span>
                <span className="text-xl font-extrabold text-teal-700">{formatPrice(payTarget.finalAmount)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod("CASH")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    payMethod === "CASH"
                      ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md shadow-teal-500/10"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <Banknote size={22} />
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("ONLINE")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    payMethod === "ONLINE"
                      ? "border-sky-500 bg-sky-50 text-sky-700 shadow-md shadow-sky-500/10"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <CreditCard size={22} />
                  Chuyển khoản
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
                onClick={() => setPayTarget(null)}
              >
                Hủy
              </button>
              <button
                className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm transition-all shadow-md shadow-teal-500/25 flex items-center justify-center gap-2"
                onClick={handlePayment}
                disabled={paySubmitting}
              >
                {paySubmitting ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Đang xử lý...</>
                ) : (
                  <><CheckCircle2 size={16} /> {payMethod === "CASH" ? "Xác nhận thu tiền" : "Tạo mã QR"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Payment Modal ──────────────────────────────────── */}
      {qrPaymentData && (
        <div className="modal-overlay" onClick={() => setQrPaymentData(null)}>
          <div className="modal-card" style={{ maxWidth: 450, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thanh toán chuyển khoản</h2>
              <button className="icon-button" onClick={() => setQrPaymentData(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p>Mã hóa đơn: <strong>{qrPaymentData.invoiceCode}</strong></p>
              <p>Bệnh nhân: <strong>{qrPaymentData.patientName}</strong></p>
              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f766e", marginTop: 8 }}>
                {formatPrice(qrPaymentData.finalAmount)}
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, display: "inline-block", marginBottom: 20 }}>
              <img
                src={qrPaymentData.paymentUrl}
                alt="QR Code Thanh Toán"
                style={{ width: "100%", maxWidth: 280, height: "auto", borderRadius: 8 }}
              />
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 12 }}>
                Sử dụng App Ngân hàng để quét mã QR.<br />
                Vui lòng <strong>không thay đổi nội dung chuyển khoản</strong>.
              </p>
            </div>

            <div className="form-actions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="primary-button"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleVerifyPayment}
                disabled={verifyingPayment}
              >
                {verifyingPayment ? "Đang đối soát..." : "Tôi đã chuyển khoản"}
              </button>
              <button
                className="secondary-button"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setQrPaymentData(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
