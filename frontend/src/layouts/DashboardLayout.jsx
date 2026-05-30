import { LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/useAuth.js";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = (user?.fullName || "AI")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-user">
            <div className="user-avatar small">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{initials}</span>}
            </div>
            <div>
              <strong>{user?.fullName || "Clinic Admin"}</strong>
              <div className="muted">{user?.roles?.join(", ")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <NotificationBell />
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
