import React, { useState, useEffect } from "react";
import {
  Search, Filter, UserCircle, Star, ShieldCheck, GraduationCap, Activity, FileText, ThumbsUp, X, Users
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getDoctors } from "../../services/doctorService";
import { getDepartments } from "../../services/departmentService";
import DoctorDetailModal from "../../components/DoctorDetailModal";

export default function PatientDoctorsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes] = await Promise.all([
        getDoctors({ page: 0, size: 200, status: "ACTIVE" }),
        getDepartments({ page: 0, size: 100 })
      ]);
      const fetchedDoctors = docRes?.data?.content || [];
      setDoctors(fetchedDoctors);
      setDepartments(deptRes?.data?.content || []);
      
      const params = new URLSearchParams(location.search);
      const doctorIdParam = params.get("doctorId");
      if (doctorIdParam) {
        const found = fetchedDoctors.find(d => String(d.doctorId) === doctorIdParam || String(d.id) === doctorIdParam);
        if (found) {
          setSelectedDoctor(found);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment ? doc.departmentId === Number(selectedDepartment) : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="w-full h-[calc(100vh-104px)] flex flex-col overflow-y-auto custom-scrollbar pr-1">
      {/* Header section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#F0F9F7] flex items-center justify-center border border-[#1DB896]/20 shadow-sm">
            <Users size={22} className="text-[#1DB896]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đội ngũ Bác sĩ & Chuyên khoa</h1>
        </div>
        <p className="text-[#4A5D59] text-sm font-semibold ml-[52px]">Tìm kiếm và lựa chọn bác sĩ phù hợp với nhu cầu sức khỏe của bạn.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bác sĩ hoặc chuyên môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none px-3 py-2.5 text-sm outline-none text-slate-800 placeholder-slate-400 font-bold"
          />
        </div>
        <div className="relative w-full md:w-64 shrink-0 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-200">
          <Filter size={16} className="text-slate-400" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full bg-transparent border-none py-2.5 text-sm outline-none text-slate-700 font-bold cursor-pointer"
          >
            <option value="">Tất cả chuyên khoa</option>
            {departments.map(dept => (
              <option key={dept.departmentId} value={dept.departmentId}>{dept.departmentName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1DB896]"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <UserCircle size={64} className="mx-auto text-slate-350 mb-4 opacity-50" />
          <h3 className="text-lg font-black text-slate-800 mb-1">Không tìm thấy bác sĩ nào</h3>
          <p className="text-sm text-[#4A5D59]">Vui lòng thử lại với từ khóa hoặc chuyên khoa khác.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedDepartment(''); }}
            className="mt-6 px-6 py-2.5 bg-[#D1F2EB] text-[#0A604E] font-black rounded-xl hover:bg-teal-150 transition-colors shadow-sm cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-10">
          {filteredDoctors.map((doc) => {
            const rating = doc.doctorId % 3 === 0 ? 5.0 : doc.doctorId % 2 === 0 ? 4.8 : 4.9;
            return (
              <div key={doc.doctorId} className="bg-white rounded-3xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all flex flex-col items-center relative overflow-hidden group border border-slate-200/80 hover:border-slate-300">
                <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-[#F0F9F7] to-transparent"></div>

                <div className="w-28 h-28 rounded-2xl bg-white shadow-md border-4 border-white z-10 flex items-center justify-center overflow-hidden mb-4 relative">
                  {doc.avatarUrl && doc.avatarUrl !== "null" && doc.avatarUrl.trim() !== "" ? (
                    <img 
                      src={doc.avatarUrl} 
                      alt={doc.fullName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName || "Bác sĩ")}&background=e2e8f0&color=0f172a`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName)}&background=e2e8f0&color=0f172a`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1 bg-[#F0F9F7] text-teal-700 font-black text-[10px] px-2 py-0.5 rounded-md border border-[#1DB896]/10 mb-2 z-10">
                  <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                  <span>{rating.toFixed(1)}</span>
                </div>

                <h3 className="text-[16px] font-black text-slate-800 z-10 text-center mb-1 line-clamp-1">{doc.fullName}</h3>
                <p className="text-[#198E75] font-extrabold text-xs mb-3 z-10 truncate w-full text-center">
                  {doc.departmentName || doc.specialization || "Bác sĩ Chuyên khoa"}
                </p>

                <div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold text-[#4A5D59] mb-6 z-10">
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">{doc.degree || "Bác sĩ"}</span>
                  <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">{doc.yearsOfExperience || 10} năm KN</span>
                </div>

                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="w-full mt-auto bg-white border border-[#1DB896] hover:bg-[#D1F2EB] text-[#0A604E] font-black py-2.5 rounded-xl transition-colors z-10 shadow-sm cursor-pointer text-center text-xs"
                >
                  Xem chi tiết
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCTOR DETAIL MODAL */}
      <DoctorDetailModal 
        selectedDoctor={selectedDoctor} 
        onClose={() => setSelectedDoctor(null)} 
      />
    </div>
  );
}
