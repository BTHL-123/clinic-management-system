import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  UserCheck,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import appointmentService from "../../services/appointmentService";
import { useToast } from "../../context/useToast.js";
import PageHeader from "../../components/PageHeader";

export default function ReceptionistAppointmentsPage() {
  const toast = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const [keyword, setKeyword] = useState("");
  const [date, setDate] = useState(todayStr);
  const [status, setStatus] = useState("CONFIRMED");

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // No Show Modal State
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [noShowNote, setNoShowNote] = useState("");

  const fetchAppointments = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const filters = {};
      if (keyword.trim()) filters.keyword = keyword.trim();
      if (date) filters.date = date;
      if (status) filters.status = status;

      const response = await appointmentService.getReceptionistAppointments(filters, page, 10);
      const data = response?.data;
      if (data) {
        setAppointments(data.content || []);
        setCurrentPage(data.pageNumber || 0);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      toast.error(err, "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [keyword, date, status]);

  useEffect(() => {
    fetchAppointments(0);
  }, [date, status]); // Auto-fetch when date or status changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments(0);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentService.checkInAppointment(appointmentId);
      toast.success("Check-in bệnh nhân thành công!");
      fetchAppointments(currentPage);
    } catch (err) {
      toast.error(err, "Check-in thất bại");
    }
  };

  const openNoShowModal = (appointmentId) => {
    setSelectedAppId(appointmentId);
    setNoShowNote("");
    setShowNoShowModal(true);
  };

  const confirmNoShow = async () => {
    if (!selectedAppId) return;
    try {
      await appointmentService.markNoShow(selectedAppId, noShowNote);
      toast.success("Đã đánh dấu bệnh nhân không đến khám (No Show)");
      fetchAppointments(currentPage);
    } catch (err) {
      toast.error(err, "Đánh dấu No Show thất bại");
    } finally {
      setShowNoShowModal(false);
      setSelectedAppId(null);
    }
  };

  const getStatusBadge = (appStatus) => {
    switch (appStatus) {
      case "CONFIRMED":
        return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Confirmed</span>;
      case "SCHEDULED":
        return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Scheduled</span>;
      case "CHECKED_IN":
        return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Checked In</span>;
      case "CANCELLED":
        return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Cancelled</span>;
      case "NO_SHOW":
        return <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Vắng mặt</span>;
      case "COMPLETED":
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Completed</span>;
      case "PENDING_PAYMENT":
        return <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">Pending Payment</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">{appStatus}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Check-in Bệnh nhân"
        icon={UserCheck}
        iconColor="text-white"
        rightContent={
          <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm" onClick={() => fetchAppointments(currentPage)}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        }
      />

      {/* Toolbar / Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          <label className="flex-1">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Tìm bệnh nhân</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm theo mã lịch hẹn, tên hoặc số điện thoại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </label>

          <label className="w-full md:w-48">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Ngày khám</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </label>

          <label className="w-full md:w-56">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái</span>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SlidersHorizontal size={18} />
              </div>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="CONFIRMED">Confirmed (Chờ khám)</option>
                <option value="CHECKED_IN">Checked In (Đã check-in)</option>
                <option value="COMPLETED">Completed (Hoàn thành)</option>
                <option value="CANCELLED">Cancelled (Đã hủy)</option>
                <option value="NO_SHOW">Không đến khám (No Show)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </label>

          <div className="flex items-end">
            <button type="submit" className="w-full md:w-auto bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold rounded-xl px-5 py-2.5 transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2">
              <Search size={18} />
              <span>Tìm kiếm</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Mã Lịch Hẹn</th>
                <th className="px-5 py-4">Bệnh Nhân</th>
                <th className="px-5 py-4">Số Điện Thoại</th>
                <th className="px-5 py-4">Bác Sĩ</th>
                <th className="px-5 py-4">Ngày Khám</th>
                <th className="px-5 py-4">Giờ Khám</th>
                <th className="px-5 py-4">Trạng Thái</th>
                <th className="px-5 py-4 text-center">Số Thứ Tự</th>
                <th className="px-5 py-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-teal-500 animate-spin"></div>
                      <p className="text-sm font-medium">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500 text-sm font-medium">
                    Không tìm thấy lịch hẹn nào phù hợp.
                  </td>
                </tr>
              ) : (
                appointments.map((app) => {
                  const isToday = app.appointmentDate === todayStr;
                  const canCheckIn = app.status === "CONFIRMED" && isToday;

                  return (
                    <tr key={app.appointmentId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-extrabold text-teal-600">{app.appointmentCode}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">{app.patientName}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">{app.patientPhone || "—"}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">{app.doctorName}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">{app.appointmentDate}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {app.startTime?.slice(0, 5)} - {app.endTime?.slice(0, 5)}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(app.status)}</td>
                      <td className="px-5 py-4 text-center">
                        {app.queueNumber ? (
                          <span className="inline-flex bg-gradient-to-r from-teal-500 to-emerald-400 text-white px-3 py-1 rounded-lg font-black text-xs shadow-sm">
                            #{app.queueNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {app.status === "CHECKED_IN" && (
                            <span className="text-emerald-600 font-bold text-xs flex items-center gap-1.5">
                              <CheckCircle size={14} /> Đã check-in
                            </span>
                          )}
                          {canCheckIn && (
                            <button
                              onClick={() => handleCheckIn(app.appointmentId)}
                              className="bg-[#1DB896] hover:bg-[#159a7c] text-white font-bold rounded-lg px-3 py-2 transition-all shadow-sm flex items-center gap-1.5 text-xs"
                              title="Check-in"
                            >
                              <CheckCircle size={14} /> Check-in
                            </button>
                          )}
                          {["SCHEDULED", "CONFIRMED"].includes(app.status) && (
                            <button
                              onClick={() => openNoShowModal(app.appointmentId)}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg px-3 py-2 transition-all shadow-sm flex items-center gap-1.5 text-xs"
                              title="Đánh dấu Không đến"
                            >
                              <XCircle size={14} /> Không đến
                            </button>
                          )}
                          {!["SCHEDULED", "CONFIRMED", "CHECKED_IN"].includes(app.status) && (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500">
              Hiển thị <strong className="text-slate-700 font-extrabold">{appointments.length}</strong> / <strong className="text-slate-700 font-extrabold">{totalElements}</strong> lịch hẹn
            </span>
            <div className="flex gap-2">
              <button
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg px-3 py-1.5 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 0 || loading}
                onClick={() => fetchAppointments(currentPage - 1)}
              >
                Trước
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg px-3 py-1.5 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages - 1 || loading}
                onClick={() => fetchAppointments(currentPage + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* No Show Modal */}
      {showNoShowModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-black text-rose-600 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                Xác nhận vắng mặt
              </h3>
              <p className="text-sm font-medium text-slate-600 mb-5 ml-13">
                Bạn có chắc chắn bệnh nhân không đến? Hành động này sẽ hủy lịch hẹn và đánh dấu bệnh nhân là "No Show".
              </p>
              
              <div className="mb-6">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Ghi chú của Lễ tân (Tùy chọn)
                </label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-y min-h-[100px]"
                  placeholder="Ví dụ: Đã gọi điện 3 cuộc nhưng bệnh nhân không nghe máy..."
                  value={noShowNote}
                  onChange={(e) => setNoShowNote(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowNoShowModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl px-4 py-2.5 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmNoShow}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl px-4 py-2.5 transition-all shadow-md shadow-rose-500/20"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
