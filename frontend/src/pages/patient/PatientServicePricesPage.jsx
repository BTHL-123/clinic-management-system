import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Activity, Stethoscope, FileHeart, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getActiveMedicalServices } from "../../services/medicalServiceService";

export default function PatientServicePricesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, CONSULTATION, IMAGING, PROCEDURE, TESTING

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await getActiveMedicalServices();
      if (res.data && Array.isArray(res.data)) {
        setServices(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch medical services:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type) => {
    switch (type) {
      case "CONSULTATION": return <Stethoscope size={20} className="text-teal-600" />;
      case "IMAGING": return <Activity size={20} className="text-sky-600" />;
      case "TESTING": return <Syringe size={20} className="text-rose-600" />;
      case "PROCEDURE": return <FileHeart size={20} className="text-amber-600" />;
      default: return <Activity size={20} className="text-slate-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "CONSULTATION": return "Khám bệnh";
      case "IMAGING": return "Chẩn đoán hình ảnh";
      case "TESTING": return "Xét nghiệm";
      case "PROCEDURE": return "Thủ thuật";
      default: return "Khác";
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "ALL" || s.serviceType === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full flex flex-col h-[calc(100vh-104px)] overflow-y-auto custom-scrollbar pb-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
              <Activity size={22} className="text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bảng giá Dịch vụ Y tế</h1>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-5 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm dịch vụ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-slate-800 placeholder:text-slate-400 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="flex overflow-x-auto custom-scrollbar pb-1 gap-2">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "CONSULTATION", label: "Khám bệnh" },
            { id: "IMAGING", label: "CĐ Hình ảnh" },
            { id: "TESTING", label: "Xét nghiệm" },
            { id: "PROCEDURE", label: "Thủ thuật" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Activity className="w-16 h-16 mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Không tìm thấy dịch vụ nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div 
              key={service.serviceId} 
              className="bg-white p-5 rounded-xl border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                  {getServiceIcon(service.serviceType)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px] leading-tight mb-1 group-hover:text-teal-700 transition-colors">{service.serviceName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                      {getTypeLabel(service.serviceType)}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-slate-500 text-[13px] line-clamp-2">{service.description}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-100 mt-auto">
                <span className="text-[11px] font-semibold text-slate-400">Giá dịch vụ</span>
                <span className="text-lg font-bold text-teal-600">{service.price.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
