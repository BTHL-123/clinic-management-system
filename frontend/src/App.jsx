import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import SecurityPage from "./pages/dashboard/SecurityPage.jsx";
import UsersPage from "./pages/dashboard/UsersPage.jsx";
import DepartmentManagement from "./pages/department/DepartmentManagement.jsx";

import AppointmentManagement from "./pages/appointment/Appointments.tsx";

import DoctorManagement from "./pages/doctor/DoctorManagement.jsx";
import PatientManagement from "./pages/patient/PatientManagement.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";

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
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="departments" element={<DepartmentManagement />} />

        <Route path="appointments" element={<AppointmentManagement />} />

        <Route path="doctors" element={<DoctorManagement />} />
        <Route path="patients" element={<PatientManagement />} />

      </Route>
    </Routes>
  );
}
