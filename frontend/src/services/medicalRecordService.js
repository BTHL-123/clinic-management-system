import api from "./axiosClient";

// Lấy lịch sử bệnh án của một bệnh nhân
export const getPatientMedicalHistory = async (patientId) => {
  return await api.get(`/patients/${patientId}/medical-history`);
};

// Lấy danh sách bệnh án (có phân trang/lọc)
export const getMedicalRecords = async (params) => {
  return await api.get("/medical-records", { params });
};

// Lấy chi tiết bệnh án theo ID
export const getMedicalRecordById = async (id) => {
  return await api.get(`/medical-records/${id}`);
};

// Tạo bệnh án mới (Dành cho bác sĩ)
export const createMedicalRecord = async (data) => {
  return await api.post("/medical-records", data);
};

// Cập nhật bệnh án
export const updateMedicalRecord = async (id, data) => {
  return await api.put(`/medical-records/${id}`, data);
};
