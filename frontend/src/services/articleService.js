import axiosClient from "./axiosClient";

export const createArticle = (payload) =>
  axiosClient.post("/articles", payload);

export const updateArticle = (articleId, payload) =>
  axiosClient.put(`/articles/${articleId}`, payload);

export const getArticles = (params) =>
  axiosClient.get("/articles", { params });

export const getArticleById = (articleId) =>
  axiosClient.get(`/articles/${articleId}`);

export const getArticleBySlug = (slug) =>
  axiosClient.get(`/articles/slug/${slug}`);

export const publishArticle = (articleId) =>
  axiosClient.patch(`/articles/${articleId}/publish`);

export const deleteArticle = (articleId) =>
  axiosClient.delete(`/articles/${articleId}`);
