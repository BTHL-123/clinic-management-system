import { useEffect, useState } from "react";
import { History, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { getTransactions } from "../../services/inventoryService";

export default function StockTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactions();
      setTransactions(res.data?.content ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
    </>
  );
}
