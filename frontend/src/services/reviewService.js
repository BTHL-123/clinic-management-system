import axiosClient from "./axiosClient";

export const createReview = (payload) =>
  axiosClient.post("/reviews", payload);

export const getReviews = (params) =>
  axiosClient.get("/reviews", { params });

export const getReviewsByDoctor = (doctorId, params) =>
  axiosClient.get(`/reviews/doctor/${doctorId}`, { params });

export const toggleReviewVisibility = (reviewId) =>
  axiosClient.patch(`/reviews/${reviewId}/toggle-visibility`);

export const deleteReview = (reviewId) =>
  axiosClient.delete(`/reviews/${reviewId}`);
