import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Stethoscope, AlertCircle } from "lucide-react";
import {
  createSession,
  sendMessage,
  generateSuggestion,
  acceptSuggestion,
  getAllSessions,
  getMessages
} from "../../services/aiChatService";
import { useNavigate } from "react-router-dom";

export default function AiChatPatient() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await getAllSessions();
        if (res.data && res.data.length > 0) {
          const latestSession = res.data[0];
          setSessionId(latestSession.aiChatSessionId);
          // Load messages for this session
          const msgRes = await getMessages(latestSession.aiChatSessionId);
          if (msgRes.data && msgRes.data.length > 0) {
            setMessages([
              {
                sender: "AI",
                text: "Xin chào! Tôi là trợ lý AI y tế. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
              },
              ...msgRes.data.map(m => ({
                sender: m.senderType === "PATIENT" ? "USER" : "AI",
                text: m.messageText
              }))
            ]);
          } else {
            setMessages([
              {
                sender: "AI",
                text: "Xin chào! Tôi là trợ lý AI y tế. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
              },
            ]);
          }
        } else {
          // No previous sessions, create new
          const createRes = await createSession({ sessionType: "SYMPTOM_CHECK" });
          setSessionId(createRes.data.aiChatSessionId);
          setMessages([
            {
              sender: "AI",
              text: "Xin chào! Tôi là trợ lý AI y tế. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
            },
          ]);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    initSession();
  }, []);

  const handleNewChat = async () => {
    try {
      setLoading(true);
      const res = await createSession({ sessionType: "SYMPTOM_CHECK" });
      setSessionId(res.data.aiChatSessionId);
      setMessages([
        {
          sender: "AI",
          text: "Xin chào! Tôi là trợ lý AI y tế. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
        },
      ]);
      setSuggestion(null);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestion]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    const userMsg = inputText.trim();
    setInputText("");
    setMessages((prev) => [...prev, { sender: "USER", text: userMsg }]);

    try {
      setLoading(true);
      const res = await sendMessage(sessionId, { messageText: userMsg });
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: res.data.aiMessage.messageText },
      ]);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestion = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await generateSuggestion(sessionId);
      setSuggestion(res.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!suggestion) return;
    try {
      setLoading(true);
      await acceptSuggestion(suggestion.suggestionId);
      navigate("/dashboard/available-slots", {
        state: {
          prefillDepartmentId: suggestion.departmentId,
          prefillDepartmentName: suggestion.departmentName
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page-header" style={{ display: "block", height: "calc(100vh - 120px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">
            <MessageSquare size={26} style={{ color: "#0ea5e9" }} />
            Tư vấn AI
          </h1>
          <p className="muted">Chat với AI để được chẩn đoán sơ bộ và gợi ý chuyên khoa.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="secondary-button"
            onClick={handleNewChat}
            disabled={loading}
          >
            + Cuộc trò chuyện mới
          </button>
          <button
            className="primary-button"
            onClick={handleGetSuggestion}
            disabled={loading || !sessionId || messages.length < 2}
            style={{ background: "#8b5cf6" }}
          >
            <Stethoscope size={16} /> Nhận gợi ý chuyên khoa
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 100px)",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {/* Chat window */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc" }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: "flex",
              justifyContent: msg.sender === "USER" ? "flex-end" : "flex-start",
              marginBottom: 16
            }}>
              <div style={{
                display: "flex",
                flexDirection: msg.sender === "USER" ? "row-reverse" : "row",
                alignItems: "flex-start",
                maxWidth: "70%"
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: msg.sender === "USER" ? "#0ea5e9" : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: msg.sender === "USER" ? "#fff" : "#475569",
                  margin: msg.sender === "USER" ? "0 0 0 12px" : "0 12px 0 0",
                  flexShrink: 0
                }}>
                  {msg.sender === "USER" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div style={{
                  background: msg.sender === "USER" ? "#0ea5e9" : "#fff",
                  color: msg.sender === "USER" ? "#fff" : "#334155",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  borderTopRightRadius: msg.sender === "USER" ? "4px" : "16px",
                  borderTopLeftRadius: msg.sender === "AI" ? "4px" : "16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  lineHeight: 1.5
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", margin: "16px 0 0 48px" }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> AI đang gõ...
            </div>
          )}

          {suggestion && (
            <div style={{
              margin: "24px 0 0 48px",
              maxWidth: "80%"
            }}>
              <h4 style={{ color: "#a21caf", display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px 0" }}>
                <Stethoscope size={18} /> Kết quả gợi ý
              </h4>
              
              {suggestion.recommendations && suggestion.recommendations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {suggestion.message && (
                    <div style={{ padding: 12, background: "#fdf2f8", borderRadius: 8, color: "#831843", fontStyle: "italic", border: "1px solid #fce7f3" }}>
                      {suggestion.message}
                    </div>
                  )}
                  {suggestion.recommendations.map((rec, idx) => (
                    <div key={idx} style={{
                      padding: 16, background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "1.1rem", color: "#86198f" }}>{rec.departmentName}</strong>
                        <span style={{ background: "#fce7f3", color: "#be185d", padding: "4px 8px", borderRadius: 16, fontSize: "0.85rem", fontWeight: 600 }}>{rec.confidenceScore}% Phù hợp</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.95rem", color: "#701a75" }}>{rec.explanation}</p>
                      <button
                        onClick={handleAcceptSuggestion}
                        disabled={loading}
                        style={{
                          background: "#c026d3", color: "#fff", border: "none", padding: "8px 16px",
                          borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 4
                        }}
                      >
                        <Stethoscope size={16} /> Đặt lịch khám {rec.departmentName}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (suggestion.message ? (
                <div style={{ padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, color: "#334155" }}>
                  <p style={{ margin: 0 }}>{suggestion.message}</p>
                </div>
              ) : (
                <div style={{ padding: 20, background: "#fdf4ff", border: "1px solid #f5d0fe", borderRadius: 12 }}>
                  <p style={{ margin: "0 0 8px 0" }}>Chuyên khoa phù hợp: <strong>{suggestion.departmentName}</strong></p>
                  <p style={{ margin: "0 0 8px 0" }}>Độ tin cậy: <strong>{suggestion.confidenceScore}%</strong></p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#701a75" }}>{suggestion.explanation}</p>
                  <div style={{ marginTop: 16 }}>
                    <button
                      onClick={handleAcceptSuggestion}
                      disabled={loading}
                      style={{
                        background: "#c026d3", color: "#fff", border: "none", padding: "8px 16px",
                        borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6
                      }}
                    >
                      <Stethoscope size={16} /> Đặt lịch khám với chuyên khoa này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} style={{
          display: "flex",
          padding: 16,
          background: "#fff",
          borderTop: "1px solid #e2e8f0"
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mô tả triệu chứng của bạn (ví dụ: tôi bị đau đầu và sốt cao)..."
            disabled={loading || !sessionId}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "24px",
              outline: "none",
              fontSize: "1rem",
              background: "#f8fafc"
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading || !sessionId}
            style={{
              marginLeft: 12,
              background: inputText.trim() ? "#0ea5e9" : "#cbd5e1",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: inputText.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            <Send size={20} style={{ marginLeft: 2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
