import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import PatientHome from "./pages/dashboard/PatientHome.jsx";
import DepartmentManagement from "./pages/department/DepartmentManagement.jsx";
import AppointmentManagement from "./pages/appointment/Appointments.tsx";
import AvailableSlots from "./pages/appointment/AvailableSlots.tsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/useAuth.js";

function DashboardIndex() {
  const { user } = useAuth();
  if (user?.roles?.includes("PATIENT")) {
    return <PatientHome />;
  }
  return <DashboardHome />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardIndex />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="available-slots" element={<AvailableSlots />} />
      </Route>
    </Routes>
  );
}



