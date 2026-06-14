import { useEffect, useState } from "react";
import { Search, EyeOff, Eye, Trash2, AlertCircle, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getReviews, toggleReviewVisibility, deleteReview } from "../../services/reviewService.js";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

export default function ReviewManagement() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  // Search handling (local filtering just for demo, real search should be server-side if needed)
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = () => {
    setLoading(true);
    setError(null);
    getReviews({ page, size: pageSize, sortBy: "createdAt", direction: "desc" })
      .then((res) => setData(res.data ?? res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleToggleVisibility = async (id) => {
    try {
      await toggleReviewVisibility(id);
      toast.success("Đã cập nhật trạng thái đánh giá.");
      loadData();
    } catch (err) {
      toast.error(err, "Lỗi khi thay đổi trạng thái");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?")) return;
    try {
      await deleteReview(id);
      toast.success("Đã xóa đánh giá.");
      loadData();
    } catch (err) {
      toast.error(err, "Lỗi khi xóa");
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        fill={i < rating ? "#eab308" : "transparent"} 
        color={i < rating ? "#eab308" : "#cbd5e1"} 
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <div>
      <PageHeader
        title="Quản lý Đánh giá"
        icon={Star}
        iconColor="text-white"
        subtitle="Kiểm duyệt và quản lý các đánh giá từ bệnh nhân đối với bác sĩ."
      />

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Tìm kiếm đánh giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "10px 10px 10px 38px",
              borderRadius: "8px", border: "1px solid #cbd5e1",
              fontSize: "14px", boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", color: "#dc2626", marginBottom: "20px", fontSize: "14px" }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Bệnh nhân</th>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Bác sĩ</th>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Số sao</th>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Nội dung</th>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Ngày</th>
              <th style={{ padding: "14px 16px", fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: "14px 16px", fontWeight: 600, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Đang tải dữ liệu...</td></tr>
            ) : !data || data.content.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Không có đánh giá nào.</td></tr>
            ) : (
              data.content.filter(item => 
                (item.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.doctorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.comment || "").toLowerCase().includes(searchTerm.toLowerCase())
              ).map((review) => (
                <tr key={review.reviewId} style={{ borderBottom: "1px solid #e2e8f0", opacity: review.status === "HIDDEN" ? 0.6 : 1 }}>
                  <td style={{ padding: "14px 16px", fontWeight: 500, color: "#334155" }}>
                    {review.patientName}
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "normal" }}>{review.appointmentCode}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>{review.doctorName}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex" }}>{renderStars(review.rating)}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#475569", maxWidth: "300px", wordWrap: "break-word" }}>
                    {review.comment || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>Không có nhận xét</span>}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#64748b" }}>
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
                      background: review.status === "VISIBLE" ? "#f0fdf4" : "#f1f5f9",
                      color: review.status === "VISIBLE" ? "#16a34a" : "#64748b"
                    }}>
                      {review.status === "VISIBLE" ? "Hiện" : "Đã ẩn"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => handleToggleVisibility(review.reviewId)}
                        title={review.status === "VISIBLE" ? "Ẩn đánh giá này" : "Hiển thị lại đánh giá này"}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                      >
                        {review.status === "VISIBLE" ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(review.reviewId)}
                        title="Xóa vĩnh viễn"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: "4px" }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={data.page === 0}
            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "6px 10px", cursor: data.page === 0 ? "default" : "pointer", opacity: data.page === 0 ? 0.4 : 1, display: "flex", alignItems: "center" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Trang {data.page + 1} / {data.totalPages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={data.last}
            style={{ background: "none", border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "6px 10px", cursor: data.last ? "default" : "pointer", opacity: data.last ? 0.4 : 1, display: "flex", alignItems: "center" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
