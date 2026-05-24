import { useAuth } from "../../context/useAuth";
import PatientProfile from "../patient/PatientProfile";
import DoctorProfile from "../doctor/DoctorProfile";
import { UserSquare } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  if (roles.includes("DOCTOR")) {
    return <DoctorProfile />;
  }

  if (roles.includes("PATIENT")) {
    return <PatientProfile />;
  }

  // Tương lai có thể thêm StaffProfile ở đây

  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">
          <UserSquare size={26} />
          Hồ sơ cá nhân
        </h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Vai trò của bạn chưa được hỗ trợ tính năng hồ sơ cá nhân.
        </p>
      </div>
    </div>
  );
}
