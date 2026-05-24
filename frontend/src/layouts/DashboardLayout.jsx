import { Bell, LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/useAuth.js";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="topbar">
          <div>
            <strong>{user?.fullName || "Clinic Admin"}</strong>
            <div className="muted">{user?.roles?.join(", ")}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button className="icon-button" aria-label="Logout" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
