import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";

import PatientHome from "./pages/dashboard/PatientHome.jsx";

import SecurityPage from "./pages/dashboard/SecurityPage.jsx";
import UsersPage from "./pages/dashboard/UsersPage.jsx";

import DepartmentManagement from "./pages/department/DepartmentManagement.jsx";
import MedicalServiceManagement from "./pages/medical-service/MedicalServiceManagement.jsx";
import InvoiceManagement from "./pages/invoice/InvoiceManagement.jsx";
import PaymentManagement from "./pages/payment/PaymentManagement.jsx";
import PaymentCallback from "./pages/payment/PaymentCallback.jsx";
import AppointmentManagement from "./pages/appointment/Appointments.tsx";
import AvailableSlots from "./pages/appointment/AvailableSlots.tsx";
import AiChatPatient from "./pages/ai-chat/AiChatPatient.jsx";
import WalkInAppointmentPage from "./pages/appointment/WalkInAppointmentPage.jsx";
import ReceptionistAppointmentsPage from "./pages/appointment/ReceptionistAppointmentsPage.jsx";
import QueueManagementPage from "./pages/appointment/QueueManagementPage.jsx";
import DoctorTodayAppointments from "./pages/doctor/DoctorTodayAppointments.jsx";
import NotificationsPage from "./pages/notification/NotificationsPage.jsx";
import DoctorManagement from "./pages/doctor/DoctorManagement.jsx";
import AlertsDashboard from "./pages/inventory/AlertsDashboard.jsx";
import InventoryBatches from "./pages/inventory/InventoryBatches.jsx";
import MedicineManagement from "./pages/inventory/MedicineManagement.jsx";
import StockTransactions from "./pages/inventory/StockTransactions.jsx";
import SupplierManagement from "./pages/inventory/SupplierManagement.jsx";
import PatientManagement from "./pages/patient/PatientManagement.jsx";
import PatientDetailPage from "./pages/patient/PatientDetailPage.jsx";
import ConsultationPage from "./pages/consultation/ConsultationPage.jsx";
import ExaminationPage from "./pages/consultation/ExaminationPage.jsx";
import LabRequestPage from "./pages/lab/LabRequestPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";
import MyAppointmentsPage from "./pages/patient/MyAppointmentsPage.jsx";
import AppointmentDetailPage from "./pages/appointment/AppointmentDetailPage.jsx";
import PatientMedicalHistoryPage from "./pages/patient/PatientMedicalHistoryPage.jsx";
import ReviewManagement from "./pages/review/ReviewManagement.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/useAuth.js";

import LandingPage from "./pages/LandingPage.jsx";

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >

        <Route index element={<DashboardIndex />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="security" element={<SecurityPage />} />

        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="medical-services" element={<MedicalServiceManagement />} />
        <Route path="invoices" element={<InvoiceManagement />} />
        <Route path="payments" element={<PaymentManagement />} />
        <Route path="payment/callback" element={<PaymentCallback />} />
        <Route path="medicines" element={<MedicineManagement />} />
        <Route path="suppliers" element={<SupplierManagement />} />
        <Route path="inventory/batches" element={<InventoryBatches />} />
        <Route path="inventory/transactions" element={<StockTransactions />} />
        <Route path="inventory/alerts" element={<AlertsDashboard />} />
        <Route path="appointments" element={<AppointmentManagement />} />
        <Route path="available-slots" element={<AvailableSlots />} />
        <Route path="ai-chat" element={<AiChatPatient />} />
        <Route path="walk-in" element={<WalkInAppointmentPage />} />
        <Route path="receptionist-appointments" element={<ReceptionistAppointmentsPage />} />
        <Route path="queue-management" element={<QueueManagementPage />} />
        <Route path="doctor-appointments" element={<DoctorTodayAppointments />} />
        <Route path="my-appointments" element={<MyAppointmentsPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="my-medical-history" element={<PatientMedicalHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="doctors" element={<DoctorManagement />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="patients/:patientId" element={<PatientDetailPage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="examination/:consultationId" element={<ExaminationPage />} />
        <Route path="lab-requests" element={<LabRequestPage />} />
        <Route path="reviews" element={<ReviewManagement />} />
      </Route>
    </Routes>
  );
}





