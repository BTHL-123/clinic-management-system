import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clipboard,
  CreditCard,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { approveRefund, completeRefund, getRefunds, rejectRefund } from "../../services/refundService";
import PageHeader from "../../components/PageHeader";

const STATUS_CONFIG = {
  PENDING: { label: "Cho duyet", bg: "#fef3c7", color: "#92400e" },
  APPROVED: { label: "Cho chuyen tien", bg: "#dbeafe", color: "#1d4ed8" },
  COMPLETED: { label: "Da chuyen tien", bg: "#bbf7d0", color: "#166534" },
  REJECTED: { label: "Da tu choi", bg: "#fecaca", color: "#991b1b" },
  FAILED: { label: "That bai", bg: "#fee2e2", color: "#991b1b" },
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const formatDateTime = (value) => value ? new Date(value).toLocaleString("vi-VN") : "-";

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status || "-", bg: "#e2e8f0", color: "#334155" };
  return (
    <span style={{
      background: config.bg,
      color: config.color,
      padding: "5px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      whiteSpace: "nowrap",
    }}>
      {config.label}
    </span>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        color: "#2563eb",
        borderRadius: 8,
        padding: "3px 7px",
        fontSize: 11,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      <Clipboard size={12} />
      {copied ? "Da copy" : "Copy"}
    </button>
  );
}

function RejectModal({ isOpen, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-[450px] rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-lg font-black text-slate-900">Tu choi hoan tien</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm font-semibold text-slate-500">
          Nhap ly do tu choi. Benh nhan se nhin thay noi dung nay.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ly do tu choi..."
          rows={4}
          className="mb-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-rose-300"
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
            Dong
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={busy || !reason.trim()}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Dang xu ly..." : "Tu choi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteModal({ refund, isOpen, onClose, onConfirm, busy }) {
  const [transactionRef, setTransactionRef] = useState("");
  const [refundMethod, setRefundMethod] = useState("BANK_TRANSFER");

  useEffect(() => {
    if (isOpen) {
      setTransactionRef("");
      setRefundMethod(refund?.refundMethod || "BANK_TRANSFER");
    }
  }, [isOpen, refund]);

  if (!isOpen || !refund) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-[92%] max-w-[560px] rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-lg font-black text-slate-900">Xac nhan da chuyen tien</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-800">
            <CreditCard size={16} />
            Thong tin chuyen khoan can thuc hien
          </div>
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">So tien</p>
              <p className="text-lg font-black text-rose-600">{formatMoney(refund.refundAmount)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Ngan hang</p>
              <div className="flex items-center gap-2">
                <p className="font-black">{refund.bankName || "-"}</p>
                <CopyButton value={refund.bankName} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">So tai khoan</p>
              <div className="flex items-center gap-2">
                <p className="font-mono font-black">{refund.bankAccountNumber || "-"}</p>
                <CopyButton value={refund.bankAccountNumber} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Chu tai khoan</p>
              <div className="flex items-center gap-2">
                <p className="font-black">{refund.accountHolderName || "-"}</p>
                <CopyButton value={refund.accountHolderName} />
              </div>
            </div>
          </div>
        </div>

        <label className="mb-1 block text-xs font-black uppercase text-slate-500">Phuong thuc hoan tien</label>
        <select
          value={refundMethod}
          onChange={(e) => setRefundMethod(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-300"
        >
          <option value="BANK_TRANSFER">BANK_TRANSFER</option>
          <option value="CASH">CASH</option>
        </select>

        <label className="mb-1 block text-xs font-black uppercase text-slate-500">Ma GD / Link anh bien lai *</label>
        <input
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="VD: MBVCB... hoac link anh chung tu"
          className="mb-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-300"
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
            Dong
          </button>
          <button
            type="button"
            onClick={() => onConfirm(refund.refundId, { refundMethod, refundTransactionRef: transactionRef.trim() })}
            disabled={busy || !transactionRef.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {busy ? "Dang luu..." : "Xac nhan hoan tat"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RefundManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [busyAction, setBusyAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: 10, sortBy: "requestedAt", direction: "desc" };
      if (statusFilter) params.status = statusFilter;
      const res = await getRefunds(params);
      setData(res.data || res);
    } catch (err) {
      setError(err.message || "Loi tai du lieu hoan tien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleApprove = async (id) => {
    setBusyAction(true);
    setError(null);
    setSuccessMsg("");
    try {
      await approveRefund(id);
      setSuccessMsg("Da duyet yeu cau. Hay chuyen tien theo thong tin ngan hang va bam 'Da chuyen tien' de luu chung tu.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Loi khi duyet");
    } finally {
      setBusyAction(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTargetId) return;
    setBusyAction(true);
    setError(null);
    setSuccessMsg("");
    try {
      await rejectRefund(rejectTargetId, { rejectReason: reason });
      setSuccessMsg("Da tu choi yeu cau hoan tien.");
      setRejectModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Loi khi tu choi");
    } finally {
      setBusyAction(false);
    }
  };

  const handleComplete = async (id, payload) => {
    setBusyAction(true);
    setError(null);
    setSuccessMsg("");
    try {
      await completeRefund(id, payload);
      setSuccessMsg("Da ghi nhan hoan tien thanh cong.");
      setCompleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Loi khi hoan tat hoan tien");
    } finally {
      setBusyAction(false);
    }
  };

  return (
    <div className="p-5">
      <PageHeader
        title="Quan ly hoan tien"
        icon={RotateCcw}
        iconColor="text-white"
        subtitle="Duyet, xem thong tin ngan hang va ghi nhan chung tu chuyen tien."
        rightContent={
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm outline-none"
          >
            <option value="">Tat ca trang thai</option>
            <option value="PENDING">Cho duyet</option>
            <option value="APPROVED">Cho chuyen tien</option>
            <option value="COMPLETED">Da chuyen tien</option>
            <option value="REJECTED">Da tu choi</option>
          </select>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 font-black text-slate-500">Ma hoan tien</th>
                <th className="px-5 py-4 font-black text-slate-500">Benh nhan</th>
                <th className="px-5 py-4 font-black text-slate-500">So tien</th>
                <th className="px-5 py-4 font-black text-slate-500 min-w-[280px]">Thong tin nhan tien</th>
                <th className="px-5 py-4 font-black text-slate-500">Trang thai</th>
                <th className="px-5 py-4 font-black text-slate-500">Chung tu / ghi chu</th>
                <th className="px-5 py-4 font-black text-slate-500 min-w-[160px]">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-400">Dang tai du lieu...</td>
                </tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center font-bold text-slate-400">Khong co yeu cau hoan tien.</td>
                </tr>
              ) : (
                data?.content?.map((refund) => (
                  <tr key={refund.refundId} className="border-b border-slate-100 align-top last:border-b-0">
                    <td className="px-5 py-5">
                      <div className="font-black text-slate-800">{refund.refundCode}</div>
                      <div className="mt-1 text-xs font-bold text-slate-400">TT: {refund.paymentCode}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">{formatDateTime(refund.requestedAt)}</div>
                    </td>
                    <td className="px-5 py-5 font-bold text-slate-700">{refund.requestedByName || "-"}</td>
                    <td className="px-5 py-5 text-base font-black text-rose-600">{formatMoney(refund.refundAmount)}</td>
                    <td className="px-5 py-5">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-blue-700">
                          <CreditCard size={14} /> {refund.refundMethod || "BANK_TRANSFER"}
                        </div>
                        <div className="space-y-1 text-xs text-slate-700">
                          <div className="flex items-center gap-2"><span className="font-bold text-slate-400">NH:</span> <b>{refund.bankName || "-"}</b> <CopyButton value={refund.bankName} /></div>
                          <div className="flex items-center gap-2">
                            <span><span className="font-bold text-slate-400">STK:</span> <b className="font-mono">{refund.bankAccountNumber || "-"}</b></span>
                            <CopyButton value={refund.bankAccountNumber} />
                          </div>
                          <div className="flex items-center gap-2"><span className="font-bold text-slate-400">Chu TK:</span> <b>{refund.accountHolderName || "-"}</b> <CopyButton value={refund.accountHolderName} /></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5"><StatusBadge status={refund.status} /></td>
                    <td className="px-5 py-5">
                      <div className="max-w-[240px] text-xs font-semibold leading-5 text-slate-500">
                        {refund.reason && <div><b>Ly do:</b> {refund.reason}</div>}
                        {refund.rejectReason && <div className="text-rose-600"><b>Tu choi:</b> {refund.rejectReason}</div>}
                        {refund.refundTransactionRef && (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
                            <b>Ma GD:</b> {refund.refundTransactionRef}
                          </div>
                        )}
                        {refund.processedByName && <div><b>Nguoi chuyen:</b> {refund.processedByName}</div>}
                        {refund.processedAt && <div><b>Luc:</b> {formatDateTime(refund.processedAt)}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      {refund.status === "PENDING" && (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(refund.refundId)}
                            disabled={busyAction}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> Duyet
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectTargetId(refund.refundId); setRejectModalOpen(true); }}
                            disabled={busyAction}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Tu choi
                          </button>
                        </div>
                      )}
                      {refund.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => setCompleteTarget(refund)}
                          disabled={busyAction}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <Send size={14} /> Da chuyen tien
                        </button>
                      )}
                      {refund.status === "COMPLETED" && (
                        <div className="text-xs font-bold text-emerald-700">Da hoan tat</div>
                      )}
                      {refund.status === "REJECTED" && (
                        <div className="text-xs font-bold text-rose-700">Da tu choi</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Trang truoc
            </button>
            <span className="text-sm font-bold text-slate-500">Trang {page + 1} / {data.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.last}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        busy={busyAction}
      />

      <CompleteModal
        isOpen={Boolean(completeTarget)}
        refund={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        busy={busyAction}
      />
    </div>
  );
}
