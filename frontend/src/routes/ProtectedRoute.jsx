import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { canUserAccessPath } from "./roleAccess.js";

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="content">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!canUserAccessPath(user, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
