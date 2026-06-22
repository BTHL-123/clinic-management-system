import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PatientLabResultPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/my-medical-history?tab=history", { replace: true });
  }, [navigate]);

  return (
    <div className="w-full flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );
}
