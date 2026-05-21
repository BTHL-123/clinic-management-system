import axiosClient from "./axiosClient";

export const getDoctors = (params) => axiosClient.get("/doctors", { params });

export const getDoctorById = (id) => axiosClient.get(`/doctors/${id}`);

export const createDoctor = (payload) => axiosClient.post("/doctors", payload);

export const updateDoctor = (id, payload) => axiosClient.put(`/doctors/${id}`, payload);

export const deleteDoctor = (id) => axiosClient.delete(`/doctors/${id}`);

export const getMyDoctorProfile = () => axiosClient.get("/doctors/me");
