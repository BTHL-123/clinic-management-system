import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, CheckCircle2, ChevronRight, Activity, Calendar, FileText, PhoneCall, UserCircle, Download, Clock, ShieldCheck, HeartPulse, Stethoscope, Droplet, Eye, Brain } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="medpro-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-container">
          <div className="top-bar-left">
          </div>
          <div className="top-bar-right">
            <Link to="/login" className="btn-account">
              <UserCircle size={16} /> Tài khoản
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Navigation */}
      <header className="main-header">
        <div className="header-container">
          <div className="brand-logo" onClick={() => navigate('/')}>
            <Logo size={42} />
          </div>
          
          <nav className="header-nav">
            <div className="nav-item">Cơ sở y tế <ChevronRight size={14} className="nav-chevron"/></div>
            <div className="nav-item">Dịch vụ y tế <ChevronRight size={14} className="nav-chevron"/></div>
            <div className="nav-item">Khám sức khỏe doanh nghiệp</div>
            <div className="nav-item">Tin tức <ChevronRight size={14} className="nav-chevron"/></div>
            <div className="nav-item">Hướng dẫn <ChevronRight size={14} className="nav-chevron"/></div>
          </nav>
        </div>
      </header>



      {/* Combined Background Wrapper for Hero and Specialties */}
      <div className="combined-bg-wrapper" style={{
        position: 'relative',
        backgroundImage: "url('/hero_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 10%',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="hero-overlay" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(255, 255, 255, 0.8)', zIndex: 0
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero Section */}
          <section className="hero-section-medpro">
            <div className="hero-content-medpro">
              <h1 className="hero-title-medpro">Kết nối Người Dân với Cơ sở & Dịch vụ Y tế hàng đầu</h1>
              
              <div className="search-bar-medpro">
                <Search className="search-icon-medpro" size={20} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm chuyên khoa, bác sĩ, cơ sở y tế..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="hero-features">
                <div className="feature-item"><CheckCircle2 size={16} className="feature-icon" /> Đặt khám nhanh - Lấy số thứ tự trực tuyến - Tư vấn sức khỏe từ xa</div>
                <div className="feature-item"><CheckCircle2 size={16} className="feature-icon" /> Đặt khám theo giờ - Đặt càng sớm để có thể có số thứ tự thấp nhất</div>
                <div className="feature-item"><CheckCircle2 size={16} className="feature-icon" /> Được hoàn tiền khi hủy khám - Có cơ hội nhận ưu đãi hoàn tiền</div>
              </div>
            </div>

            {/* Quick Service Cards overlapping hero bottom */}
            <div className="quick-services-container">
              <div className="quick-service-card">
                <Calendar size={40} className="qs-icon text-blue" />
                <span>Đặt khám tại cơ sở</span>
              </div>
              <div className="quick-service-card">
                <Stethoscope size={40} className="qs-icon text-teal" />
                <span>Đặt khám chuyên khoa</span>
              </div>
              <div className="quick-service-card">
                <PhoneCall size={40} className="qs-icon text-blue" />
                <span>Gọi video với bác sĩ</span>
              </div>
              <div className="quick-service-card">
                <FileText size={40} className="qs-icon text-teal" />
                <span>Đặt lịch xét nghiệm</span>
              </div>
              <div className="quick-service-card">
                <Clock size={40} className="qs-icon text-orange" />
                <span>Đặt khám ngoài giờ</span>
              </div>
              <div className="quick-service-card">
                <ShieldCheck size={40} className="qs-icon text-red" />
                <span>Khám doanh nghiệp</span>
              </div>
            </div>
          </section>

          {/* Specialties Section */}
          <section className="section-container">
            <h2 className="section-title">CHUYÊN KHOA</h2>
            <div className="specialty-grid">
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <Stethoscope className="specialty-icon" size={40} />
                </div>
                <span>Bác sĩ Gia Đình</span>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <Droplet className="specialty-icon" size={40} />
                </div>
                <span>Tiêu Hóa Gan Mật</span>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <HeartPulse className="specialty-icon" size={40} />
                </div>
                <span>Nội Tim Mạch</span>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <Eye className="specialty-icon" size={40} />
                </div>
                <span>Mắt</span>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <Brain className="specialty-icon" size={40} />
                </div>
                <span>Nội Thần Kinh</span>
              </div>
              <div className="specialty-item">
                <div className="specialty-icon-wrapper">
                  <Activity className="specialty-icon" size={40} />
                </div>
                <span>Nội Tiết</span>
              </div>
            </div>
            <div className="view-all-link">Xem tất cả <ChevronRight size={14} /></div>
          </section>
        </div>
      </div>

      {/* Comprehensive Healthcare Section */}
      <section className="section-container bg-light">
        <h2 className="section-title">CHĂM SÓC SỨC KHỎE TOÀN DIỆN</h2>
        
        <div className="tabs-container">
          <div className="tab active">Sức khỏe</div>
          <div className="tab">Xét nghiệm</div>
          <div className="tab">Tiêm chủng</div>
        </div>

        <div className="packages-grid">
          {/* Package 1 */}
          <div className="package-card">
            <img src="/gastro_check.png" alt="Tiêu hóa" className="package-img" />
            <div className="package-info">
              <h3 className="package-title">Đặt khám Bệnh Tiêu Hoá - Gan Mật</h3>
              <div className="package-location">
                <MapPin size={14} /> Trung Tâm Nội Soi Doctor Check
              </div>
              <div className="package-price">
                <span className="price-icon">💰</span> 200.000đ
              </div>
              <button className="btn-book-now">Đặt khám ngay</button>
            </div>
          </div>

          {/* Package 2 */}
          <div className="package-card">
            <img src="/eye_check.png" alt="Mắt" className="package-img" />
            <div className="package-info">
              <h3 className="package-title">Gói khám mắt tổng quát</h3>
              <div className="package-location">
                <MapPin size={14} /> Trung Tâm Mắt Quốc Tế
              </div>
              <div className="package-price">
                <span className="price-icon">💰</span> 500.000đ
              </div>
              <button className="btn-book-now">Đặt khám ngay</button>
            </div>
          </div>

          {/* Package 3 */}
          <div className="package-card">
            <img src="/gastro_check.png" alt="Tiểu đường" className="package-img" />
            <div className="package-info">
              <h3 className="package-title">Gói khám tiểu đường</h3>
              <div className="package-location">
                <MapPin size={14} /> Phòng Khám Đa khoa Quốc Tế
              </div>
              <div className="package-price">
                <span className="price-icon">💰</span> 720.000đ
              </div>
              <button className="btn-book-now">Đặt khám ngay</button>
            </div>
          </div>

          {/* Package 4 */}
          <div className="package-card">
            <img src="/eye_check.png" alt="Sức khỏe xin việc" className="package-img" />
            <div className="package-info">
              <h3 className="package-title">Khám sức khỏe xin việc</h3>
              <div className="package-location">
                <MapPin size={14} /> Phòng Khám Đa khoa
              </div>
              <div className="package-price">
                <span className="price-icon">💰</span> 380.000đ
              </div>
              <button className="btn-book-now">Đặt khám ngay</button>
            </div>
          </div>
        </div>
        <div className="view-all-link">Xem tất cả <ChevronRight size={14} /></div>
      </section>
    </div>
  );
}
