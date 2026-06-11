import { useEffect, useState } from "react";
import {
  CheckCircle,
  Wallet,
  Eye,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  confirmCashPayment,
  createPayment,
  getPaymentById,
  getPayments,
} from "../../services/paymentService";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "ONLINE", label: "Chuyển khoản" },
];

const PAYMENT_TYPES = [
  { value: "DEPOSIT", label: "Đặt cọc" },
  { value: "FINAL_PAYMENT", label: "Thanh toán cuối" },
];

const EMPTY_FORM = {
  invoiceId: "",
  appointmentId: "",
  paymentType: "FINAL_PAYMENT",
  paymentMethod: "CASH",
  amount: "",
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // detail
  const [detailPayment, setDetailPayment] = useState(null);

  // confirm cash
  const [confirmTarget, setConfirmTarget] = useState(null);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = { page: 0, size: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await getPayments(params);
      setPayments(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  /* ── Filter ────────────────────────────────────────────── */
  const filtered = payments.filter(
    (p) =>
      p.paymentCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── Detail ────────────────────────────────────────────── */
  const openDetail = async (pay) => {
    try {
      const res = await getPaymentById(pay.paymentId);
      setDetailPayment(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ── Form handlers ─────────────────────────────────────── */
  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        invoiceId: formData.invoiceId ? Number(formData.invoiceId) : null,
        appointmentId: formData.appointmentId ? Number(formData.appointmentId) : null,
        paymentType: formData.paymentType,
        paymentMethod: formData.paymentMethod,
        amount: Number(formData.amount),
      };
      await createPayment(payload);
      closeForm();
      await fetchPayments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirm cash ──────────────────────────────────────── */
  const handleConfirmCash = async () => {
    if (!confirmTarget) return;
    try {
      await confirmCashPayment(confirmTarget.paymentId);
      setConfirmTarget(null);
      await fetchPayments();
    } catch (err) {
      setError(err.message);
      setConfirmTarget(null);
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
      PENDING: { cls: "badge-warning", label: "Chờ xử lý" },
      PAID: { cls: "badge-active", label: "Đã thanh toán" },
      FAILED: { cls: "badge-inactive", label: "Thất bại" },
      CANCELLED: { cls: "badge-inactive", label: "Đã hủy" },
    };
    const s = map[status] ?? { cls: "", label: status };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  const methodLabel = (method) => {
    const map = { CASH: "Tiền mặt", ONLINE: "Chuyển khoản" };
    return map[method] ?? method;
  };

  const typeLabel = (type) => {
    const map = { DEPOSIT: "Đặt cọc", FINAL_PAYMENT: "Thanh toán cuối" };
    return map[type] ?? type;
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="receptionist-data-page">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="page-header">
        <div className="flex flex-col items-center w-full">
          <h1 className="flex items-center gap-3 bg-white/25 backdrop-blur-md px-7 py-3.5 rounded-full border border-white/40 shadow-lg">
            <span className="text-white"><Wallet size={26} /></span>
            <span style={{ color: "#0f766e" }} className="text-2xl font-bold tracking-wide">Quản lý Thanh toán</span>
          </h1>
          <p className="text-white/70 font-medium mt-3 drop-shadow-sm">Quản lý các giao dịch thanh toán.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Plus size={16} />
          Tạo thanh toán
        </button>
      </div>

      {/* ── Search & Filter ──────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm theo mã thanh toán..."
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
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && <div className="error-box">{error}</div>}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="table-wrapper receptionist-fit-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mã TT</th>
              <th>Hóa đơn</th>
              <th>Loại</th>
              <th>Phương thức</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-row">Đang tải dữ liệu...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  {searchTerm ? "Không tìm thấy giao dịch nào." : "Chưa có giao dịch nào."}
                </td>
              </tr>
            ) : (
              filtered.map((pay, idx) => (
                <tr key={pay.paymentId}>
                  <td>{idx + 1}</td>
                  <td><code>{pay.paymentCode}</code></td>
                  <td>{pay.invoiceCode ?? "—"}</td>
                  <td><span className="status-badge badge-info">{typeLabel(pay.paymentType)}</span></td>
                  <td>{methodLabel(pay.paymentMethod)}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(pay.amount)}</td>
                  <td>{statusBadge(pay.status)}</td>
                  <td>
                    {pay.createdAt
                      ? new Date(pay.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className="action-group">
                      <button
                        className="icon-button"
                        title="Xem chi tiết"
                        onClick={() => openDetail(pay)}
                      >
                        <Eye size={15} />
                      </button>
                      {pay.status === "PENDING" && pay.paymentMethod === "CASH" && (
                        <button
                          className="icon-button"
                          title="Xác nhận thanh toán"
                          style={{ color: "#16a34a", borderColor: "#bbf7d0" }}
                          onClick={() => setConfirmTarget(pay)}
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ───────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo thanh toán mới</h2>
              <button className="icon-button" onClick={closeForm}>
                <X size={18} />
              </button>
            </div>

            <form className="form-stack" onSubmit={handleSubmit}>
              {formError && <div className="error-box">{formError}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label htmlFor="invoiceId">Invoice ID</label>
                  <input
                    id="invoiceId"
                    name="invoiceId"
                    type="number"
                    value={formData.invoiceId}
                    onChange={handleChange}
                    placeholder="ID hóa đơn"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label htmlFor="paymentType">Loại thanh toán</label>
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleChange}
                  >
                    {PAYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="paymentMethod">Phương thức</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="amount">Số tiền (VNĐ) *</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="VD: 350000"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm}>
                  Hủy
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Tạo thanh toán"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────── */}
      {detailPayment && (
        <div className="modal-overlay" onClick={() => setDetailPayment(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết thanh toán {detailPayment.paymentCode}</h2>
              <button className="icon-button" onClick={() => setDetailPayment(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, fontSize: "0.95rem" }}>
              <div><strong>Mã thanh toán:</strong> <code>{detailPayment.paymentCode}</code></div>
              <div><strong>Hóa đơn:</strong> {detailPayment.invoiceCode ?? "—"}</div>
              <div><strong>Loại:</strong> {typeLabel(detailPayment.paymentType)}</div>
              <div><strong>Phương thức:</strong> {methodLabel(detailPayment.paymentMethod)}</div>
              <div><strong>Số tiền:</strong> <span style={{ fontWeight: 700, color: "#0f766e" }}>{formatPrice(detailPayment.amount)}</span></div>
              <div><strong>Trạng thái:</strong> {statusBadge(detailPayment.status)}</div>
              <div><strong>Người thanh toán:</strong> {detailPayment.paidByName ?? "—"}</div>
              <div><strong>Người xác nhận:</strong> {detailPayment.confirmedByName ?? "—"}</div>
              <div><strong>Ngày tạo:</strong> {detailPayment.createdAt ? new Date(detailPayment.createdAt).toLocaleString("vi-VN") : "—"}</div>
              <div><strong>Ngày thanh toán:</strong> {detailPayment.paidAt ? new Date(detailPayment.paidAt).toLocaleString("vi-VN") : "—"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Cash Modal ───────────────────────────── */}
      {confirmTarget && (
        <div className="modal-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận thanh toán tiền mặt</h2>
              <button className="icon-button" onClick={() => setConfirmTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <p>
              Xác nhận đã nhận tiền mặt cho giao dịch{" "}
              <strong>{confirmTarget.paymentCode}</strong> — số tiền{" "}
              <strong>{formatPrice(confirmTarget.amount)}</strong>?
            </p>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setConfirmTarget(null)}>
                Hủy
              </button>
              <button
                className="primary-button"
                onClick={handleConfirmCash}
              >
                Xác nhận đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
