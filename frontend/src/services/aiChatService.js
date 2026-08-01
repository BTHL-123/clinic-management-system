import axiosClient from "./axiosClient";

export const getAllSessions = () => {
  return axiosClient.get("/ai/chat-sessions");
};

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

export const standardizeClinicalNote = async (rawNote) => {
  const response = await axiosClient.post(
    `/ai/chat-sessions/clinical-notes/standardize`,
    { rawNote },
  );

  // axiosClient already unwraps the HTTP response. Keep this method's contract
  // stable if an API gateway adds another ApiResponse envelope.
  return response?.data?.data ?? response?.data ?? response;
};
