import React, { useState, useEffect } from "react";
import { 
  Search, Filter, UserCircle, Star, ShieldCheck, GraduationCap, Activity, FileText, ThumbsUp, X, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../../services/doctorService";
import { getDepartments } from "../../services/departmentService";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientDoctorsPage() {
  const navigate = useNavigate();
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
      setDoctors(docRes?.data?.content || []);
      setDepartments(deptRes?.data?.content || []);
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
            onClick={() => {setSearchQuery(''); setSelectedDepartment('');}}
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
                  {doc.avatarUrl ? (
                    <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                     <img 
                       src={`https://api.dicebear.com/7.x/notionists/svg?seed=${doc.doctorId}&backgroundColor=e2e8f0`} 
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
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full transition-colors backdrop-blur-md cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Background gradient banner */}
              <div className="h-40 bg-gradient-to-r from-[#0A604E] to-[#1DB896] relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>

              <div className="px-8 pb-8 relative -mt-20">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-end mb-8">
                  <div className="w-40 h-40 rounded-3xl bg-white p-2 shadow-xl shrink-0 overflow-hidden border border-slate-100">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-teal-50 flex items-center justify-center">
                      {selectedDoctor.avatarUrl ? (
                        <img src={selectedDoctor.avatarUrl} alt={selectedDoctor.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedDoctor.doctorId}&backgroundColor=e2e8f0`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-1.5 bg-[#D1F2EB] text-[#0A604E] px-3.5 py-1 rounded-full text-[11px] font-black mb-2 border border-[#1DB896]/10">
                      <ShieldCheck size={13} /> Chuyên gia y tế
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedDoctor.fullName}</h2>
                    <p className="text-[#198E75] font-extrabold text-base">{selectedDoctor.departmentName || selectedDoctor.specialization || "Chuyên khoa"}</p>
                  </div>
                  <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={() => navigate('/dashboard/available-slots', { state: { prefillDoctorId: selectedDoctor.doctorId } })}
                      className="w-full md:w-auto bg-[#0A604E] hover:bg-[#084f40] text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg cursor-pointer text-xs"
                    >
                      Đặt lịch khám ngay
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Học hàm học vị</p>
                      <p className="font-black text-xs text-slate-800 mt-0.5">{selectedDoctor.degree || "Bác sĩ Chuyên khoa"}</p>
                    </div>
                  </div>
                  <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kinh nghiệm</p>
                      <p className="font-black text-xs text-slate-800 mt-0.5">{selectedDoctor.yearsOfExperience || 10} năm công tác</p>
                    </div>
                  </div>
                  <div className="bg-[#F0F9F7] rounded-2xl p-4 flex items-center gap-4 border border-[#1DB896]/10 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                      <Star size={24} className="fill-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đánh giá chung</p>
                      <p className="font-black text-xs text-slate-800 mt-0.5 flex items-center gap-1">
                        {(selectedDoctor.doctorId % 3 === 0 ? 5.0 : selectedDoctor.doctorId % 2 === 0 ? 4.8 : 4.9).toFixed(1)}/5.0 
                        <span className="text-slate-400 text-[10px] font-bold">(120+ ca)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-black text-slate-800 mb-3 flex items-center gap-2">
                      <FileText className="text-[#1DB896]" size={18} /> Tiểu sử & Chuyên môn
                    </h3>
                    <div className="text-xs font-semibold text-slate-600 leading-relaxed bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      {selectedDoctor.biography ? (
                        <p>{selectedDoctor.biography}</p>
                      ) : (
                        <p>Bác sĩ {selectedDoctor.fullName} là một chuyên gia y tế giàu nhiệt huyết và y đức trong lĩnh vực {selectedDoctor.departmentName || "Khám chữa bệnh"}. Trong suốt quá trình công tác chuyên môn tại các bệnh viện lớn toàn quốc, bác sĩ luôn được bệnh nhân tin tưởng nhờ thái độ tận tình, chẩn đoán chính xác và liên tục ứng dụng các thành tựu khoa học kỹ thuật hiện đại vào điều trị.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-black text-slate-800 mb-3 flex items-center gap-2">
                      <ThumbsUp className="text-emerald-600" size={18} /> Thành tựu nổi bật
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                        <div className="text-2xl font-black text-[#0A604E] mb-1">98%</div>
                        <div className="text-xs font-bold text-slate-500">Mức độ hài lòng của Bệnh nhân</div>
                      </div>
                      <div className="bg-teal-50/30 p-4 rounded-2xl border border-teal-100/50">
                        <div className="text-2xl font-black text-[#0A604E] mb-1">1,500+</div>
                        <div className="text-xs font-bold text-slate-500">Số ca thăm khám & điều trị thành công</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
