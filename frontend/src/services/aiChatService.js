import axiosClient from "./axiosClient";

export const createSession = (data) => {
  return axiosClient.post("/ai/chat-sessions", data);
};

export const sendMessage = (sessionId, data) => {
  return axiosClient.post(`/ai/chat-sessions/${sessionId}/messages`, data);
};

export const getMessages = (sessionId) => {
  return axiosClient.get(`/ai/chat-sessions/${sessionId}/messages`);
};

export const generateSuggestion = (sessionId) => {
  return axiosClient.post(`/ai/chat-sessions/${sessionId}/specialty-suggestion`);
};

export const acceptSuggestion = (suggestionId) => {
  return axiosClient.put(`/ai/chat-sessions/suggestions/${suggestionId}/accept`);
};
