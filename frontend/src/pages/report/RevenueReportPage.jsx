import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CalendarRange,
  CircleDollarSign,
  Download,
  FileChartColumn,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { getRevenueDashboard } from "../../services/reportService";

const PRESETS = [
  { key: "7d", label: "7 ngày", days: 7 },
  { key: "30d", label: "30 ngày", days: 30 },
  { key: "90d", label: "90 ngày", days: 90 },
  { key: "month", label: "Tháng này" },
];

const METHOD_LABELS = {
  CASH: "Tiền mặt",
  ONLINE: "Thanh toán online",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
};

const TYPE_LABELS = {
  DEPOSIT: "Đặt cọc",
  FINAL_PAYMENT: "Thanh toán cuối",
};

const INVOICE_STATUS = {
  UNPAID: { label: "Chưa thanh toán", tone: "pending" },
  PARTIALLY_PAID: { label: "Thanh toán một phần", tone: "partial" },
  PAID: { label: "Đã thanh toán", tone: "paid" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "refunded" },
  CANCELLED: { label: "Đã hủy", tone: "cancelled" },
  FAILED: { label: "Thất bại", tone: "failed" },
};

const CHART_COLORS = ["#0f766e", "#14b8a6", "#22c55e", "#f59e0b"];

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetRange(preset) {
  const to = new Date();
  const from = new Date(to);
  if (preset.key === "month") {
    from.setDate(1);
  } else {
    from.setDate(to.getDate() - preset.days + 1);
  }
  return { from: toDateInput(from), to: toDateInput(to) };
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDate(value, includeYear = false) {
  if (!value) return "—";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function MetricCard({ icon: Icon, label, value, detail, tone = "teal" }) {
  return (
    <article className={`revenue-metric revenue-metric-${tone}`}>
      <div className="revenue-metric-topline">
        <span>{label}</span>
        <span className="revenue-metric-icon"><Icon size={19} /></span>
      </div>
      <strong>{value}</strong>
      <div className="revenue-metric-detail">{detail}</div>
    </article>
  );
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="revenue-chart-tooltip">
      <strong>{formatDate(label, true)}</strong>
      {payload.map((item) => (
        <div key={item.dataKey}>
          <span style={{ background: item.color }} />
          <p>{item.name}</p>
          <b>{formatCurrency(item.value)}</b>
        </div>
      ))}
    </div>
  );
}

export default function RevenueReportPage() {
  const initialRange = useMemo(() => presetRange(PRESETS[1]), []);
  const [range, setRange] = useState(initialRange);
  const [draftRange, setDraftRange] = useState(initialRange);
  const [activePreset, setActivePreset] = useState("30d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getRevenueDashboard(range);
      setReport(response.data ?? response);
    } catch (requestError) {
      setError(requestError.message || "Không thể tải báo cáo doanh thu.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    // Revenue data is server state and must follow the applied reporting range.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const applyPreset = (preset) => {
    const nextRange = presetRange(preset);
    setActivePreset(preset.key);
    setDraftRange(nextRange);
    setRange(nextRange);
  };

  const applyCustomRange = () => {
    if (!draftRange.from || !draftRange.to || draftRange.from > draftRange.to) {
      setError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
      return;
    }
    setActivePreset("custom");
    setRange(draftRange);
  };

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["BÁO CÁO DOANH THU", `${report.from} - ${report.to}`],
      [],
      ["Chỉ số", "Giá trị"],
      ["Tổng thu", report.grossRevenue],
      ["Hoàn tiền hoàn tất", report.refundedAmount],
      ["Doanh thu thuần", report.netRevenue],
      ["Giao dịch thành công", report.successfulPayments],
      ["Hóa đơn đã thu", report.paidInvoices],
      ["Trung bình giao dịch", report.averagePayment],
      ["Công nợ trong kỳ", report.outstandingAmount],
      [],
      ["Ngày", "Tổng thu", "Hoàn tiền", "Doanh thu thuần", "Số giao dịch"],
      ...(report.trend || []).map((item) => [
        item.date,
        item.grossRevenue,
        item.refundedAmount,
        item.netRevenue,
        item.transactionCount,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-doanh-thu-${report.from}-${report.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const growthRate = report?.revenueGrowthRate == null ? null : Number(report.revenueGrowthRate);
  const grossRevenue = Number(report?.grossRevenue || 0);
  const paymentMethods = (report?.paymentMethods || []).map((item) => ({
    ...item,
    label: METHOD_LABELS[item.key] || item.key,
    value: Number(item.amount || 0),
    share: grossRevenue > 0 ? (Number(item.amount || 0) / grossRevenue) * 100 : 0,
  }));
  const paymentTypes = (report?.paymentTypes || []).map((item) => ({
    ...item,
    label: TYPE_LABELS[item.key] || item.key,
    value: Number(item.amount || 0),
  }));

  return (
    <div className="revenue-report-page">
      <PageHeader
        title="Báo cáo doanh thu"
        icon={FileChartColumn}
        subtitle="Tổng hợp dòng tiền thực nhận, hoàn tiền và công nợ của hệ thống."
        showBackButton={false}
        className="mb-0"
        rightContent={
          <button
            type="button"
            className="revenue-export-button"
            onClick={exportCsv}
            disabled={!report || loading}
            title="Xuất báo cáo CSV"
          >
            <Download size={17} />
            <span>Xuất CSV</span>
          </button>
        }
      />

      <section className="revenue-filter-bar" aria-label="Khoảng thời gian báo cáo">
        <div className="revenue-presets">
          {PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.key}
              className={activePreset === preset.key ? "active" : ""}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="revenue-custom-range">
          <CalendarRange size={17} />
          <input
            type="date"
            aria-label="Từ ngày"
            value={draftRange.from}
            max={draftRange.to}
            onChange={(event) => setDraftRange((current) => ({ ...current, from: event.target.value }))}
          />
          <span>đến</span>
          <input
            type="date"
            aria-label="Đến ngày"
            value={draftRange.to}
            min={draftRange.from}
            onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))}
          />
          <button type="button" onClick={applyCustomRange}>Áp dụng</button>
          <button type="button" className="revenue-refresh" onClick={loadReport} title="Làm mới dữ liệu" aria-label="Làm mới dữ liệu">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </section>

      {error && <div className="revenue-error">{error}</div>}

      {loading && !report ? (
        <div className="revenue-loading">Đang tổng hợp dữ liệu tài chính...</div>
      ) : (
        <>
          <section className="revenue-metric-grid" aria-label="Chỉ số doanh thu">
            <MetricCard
              icon={WalletCards}
              label="Doanh thu thuần"
              value={formatCurrency(report?.netRevenue)}
              detail={growthRate == null ? (
                <span>Chưa có kỳ trước để so sánh</span>
              ) : (
                <span className={growthRate >= 0 ? "positive" : "negative"}>
                  {growthRate >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(growthRate).toLocaleString("vi-VN")}% so với kỳ trước
                </span>
              )}
            />
            <MetricCard
              icon={Banknote}
              label="Tổng thu"
              value={formatCurrency(report?.grossRevenue)}
              detail={<span>{numberFormatter.format(report?.successfulPayments || 0)} giao dịch thành công</span>}
              tone="green"
            />
            <MetricCard
              icon={RotateCcw}
              label="Đã hoàn tiền"
              value={formatCurrency(report?.refundedAmount)}
              detail={<span>{numberFormatter.format(report?.pendingRefunds || 0)} yêu cầu đang chờ · {formatCurrency(report?.pendingRefundAmount)}</span>}
              tone="rose"
            />
            <MetricCard
              icon={ReceiptText}
              label="Hóa đơn đã thu"
              value={numberFormatter.format(report?.paidInvoices || 0)}
              detail={<span>Hóa đơn có thanh toán trong kỳ</span>}
              tone="blue"
            />
            <MetricCard
              icon={CircleDollarSign}
              label="Trung bình giao dịch"
              value={formatCurrency(report?.averagePayment)}
              detail={<span>Tính trên giao dịch thành công</span>}
              tone="amber"
            />
            <MetricCard
              icon={CalendarRange}
              label="Công nợ trong kỳ"
              value={formatCurrency(report?.outstandingAmount)}
              detail={<span>{numberFormatter.format(report?.outstandingInvoices || 0)} hóa đơn chưa thu đủ</span>}
              tone="slate"
            />
          </section>

          <section className="revenue-chart-layout">
            <div className="revenue-panel revenue-trend-panel">
              <div className="revenue-panel-heading">
                <div>
                  <h2>Xu hướng doanh thu</h2>
                  <p>{formatDate(report?.from, true)} - {formatDate(report?.to, true)}</p>
                </div>
                <div className="revenue-chart-legend">
                  <span><i className="gross" />Tổng thu</span>
                  <span><i className="net" />Doanh thu thuần</span>
                  <span><i className="refund" />Hoàn tiền</span>
                </div>
              </div>
              <div className="revenue-chart-canvas">
                {(report?.trend || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.trend} margin={{ top: 12, right: 14, left: 6, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grossRevenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} minTickGap={26} tickLine={false} axisLine={false} fontSize={11} stroke="#64748b" />
                      <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} width={64} fontSize={11} stroke="#64748b" />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area type="monotone" dataKey="grossRevenue" name="Tổng thu" stroke="#14b8a6" strokeWidth={2.5} fill="url(#grossRevenueFill)" />
                      <Area type="monotone" dataKey="netRevenue" name="Doanh thu thuần" stroke="#0f766e" strokeWidth={2.5} fill="transparent" />
                      <Area type="monotone" dataKey="refundedAmount" name="Hoàn tiền" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 4" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="revenue-empty">Chưa có dữ liệu trong khoảng thời gian này.</div>
                )}
              </div>
            </div>

            <div className="revenue-panel revenue-method-panel">
              <div className="revenue-panel-heading">
                <div>
                  <h2>Phương thức thanh toán</h2>
                  <p>Cơ cấu trên tổng thu</p>
                </div>
              </div>
              <div className="revenue-method-content">
                <div className="revenue-donut">
                  {paymentMethods.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethods} dataKey="value" nameKey="label" innerRadius={54} outerRadius={78} paddingAngle={3}>
                          {paymentMethods.map((item, index) => <Cell key={item.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="revenue-empty">Chưa có dữ liệu.</div>}
                </div>
                <div className="revenue-method-list">
                  {paymentMethods.map((item, index) => (
                    <div key={item.key}>
                      <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span><b>{item.label}</b><small>{numberFormatter.format(item.count)} giao dịch</small></span>
                      <strong>{item.share.toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="revenue-detail-layout">
            <div className="revenue-panel">
              <div className="revenue-panel-heading">
                <div><h2>Loại thanh toán</h2><p>Giá trị theo nghiệp vụ</p></div>
              </div>
              <div className="revenue-bar-canvas">
                {paymentTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentTypes} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis type="category" dataKey="label" width={108} tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" name="Giá trị" fill="#0f766e" radius={[0, 5, 5, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="revenue-empty">Chưa có dữ liệu.</div>}
              </div>
            </div>

            <div className="revenue-panel">
              <div className="revenue-panel-heading">
                <div><h2>Trạng thái hóa đơn</h2><p>Hóa đơn được tạo trong kỳ</p></div>
              </div>
              <div className="revenue-status-list">
                {(report?.invoiceStatuses || []).length > 0 ? report.invoiceStatuses.map((item) => {
                  const status = INVOICE_STATUS[item.status] || { label: item.status, tone: "default" };
                  return (
                    <div key={item.status}>
                      <span className={`revenue-status-dot ${status.tone}`} />
                      <span><b>{status.label}</b><small>{formatCurrency(item.amount)}</small></span>
                      <strong>{numberFormatter.format(item.count)}</strong>
                    </div>
                  );
                }) : <div className="revenue-empty">Chưa có hóa đơn trong kỳ.</div>}
              </div>
            </div>
          </section>

          <section className="revenue-panel revenue-transactions-panel">
            <div className="revenue-panel-heading">
              <div><h2>Giao dịch gần nhất</h2><p>10 khoản thanh toán mới nhất trong kỳ</p></div>
              <span className="revenue-period-chip">{numberFormatter.format(report?.successfulPayments || 0)} giao dịch</span>
            </div>
            <div className="revenue-table-scroll">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Người thanh toán</th>
                    <th>Hóa đơn</th>
                    <th>Loại</th>
                    <th>Phương thức</th>
                    <th>Thời gian</th>
                    <th className="number">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.recentPayments || []).length > 0 ? report.recentPayments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td><strong>{payment.paymentCode}</strong></td>
                      <td>{payment.payerName || "Không xác định"}</td>
                      <td>{payment.invoiceCode || "—"}</td>
                      <td>{TYPE_LABELS[payment.paymentType] || payment.paymentType}</td>
                      <td>{METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</td>
                      <td>{formatDateTime(payment.paidAt)}</td>
                      <td className="number"><strong>{formatCurrency(payment.amount)}</strong></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} className="revenue-empty-cell">Chưa có giao dịch thành công trong kỳ.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
