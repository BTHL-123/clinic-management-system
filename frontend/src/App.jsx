import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import DepartmentManagement from "./pages/department/DepartmentManagement.jsx";
import MedicalServiceManagement from "./pages/medical-service/MedicalServiceManagement.jsx";
import InvoiceManagement from "./pages/invoice/InvoiceManagement.jsx";
import PaymentManagement from "./pages/payment/PaymentManagement.jsx";
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
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="medical-services" element={<MedicalServiceManagement />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="payments" element={<PaymentManagement />} />
      </Route>
    </Routes>
  );
}

