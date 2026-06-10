import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Stethoscope, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import {
  createSession,
  sendMessage,
  generateSuggestion,
  acceptSuggestion,
  getAllSessions,
  getMessages
} from "../../services/aiChatService";
import { useNavigate, useLocation } from "react-router-dom";

export default function AiChatPatient() {
  const location = useLocation();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(location.state?.initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Flag to know if we need to auto send initial query
  const [hasSentInitial, setHasSentInitial] = useState(false);

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

  // Handle auto-send if initial query exists and session is ready
  useEffect(() => {
    if (sessionId && location.state?.initialQuery && !hasSentInitial && messages.length <= 1) {
      setHasSentInitial(true);
      handleSendQuery(location.state.initialQuery);
    }
  }, [sessionId, location.state, messages.length, hasSentInitial]);

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
      setInputText("");
      setHasSentInitial(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestion, loading]);

  const handleSendQuery = async (queryText) => {
    if (!queryText.trim() || !sessionId) return;
    
    setInputText("");
    setMessages((prev) => [...prev, { sender: "USER", text: queryText }]);

    try {
      setLoading(true);
      const res = await sendMessage(sessionId, { messageText: queryText });
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

  const handleSend = (e) => {
    e.preventDefault();
    handleSendQuery(inputText);
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

  const handleAcceptSuggestion = async (rec) => {
    if (!suggestion) return;
    try {
      setLoading(true);
      await acceptSuggestion(suggestion.suggestionId);
      navigate("/dashboard/available-slots", {
        state: {
          prefillDepartmentId: rec ? rec.departmentId : suggestion.departmentId,
          prefillDepartmentName: rec ? rec.departmentName : suggestion.departmentName
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto w-full flex flex-col items-center pb-10 h-[calc(100vh-104px)] overflow-hidden">
      
      {/* Header */}
      <div className="w-full mb-8 relative flex flex-col sm:flex-row justify-center items-center min-h-[80px] mt-4 shrink-0">
        <div className="w-full sm:absolute sm:left-0 sm:top-4 flex justify-start mb-4 sm:mb-0 px-4 sm:px-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-sm"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
          <h1 className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-2xl md:text-3xl font-extrabold text-[#0f766e] tracking-tight mb-4">
            <MessageSquare size={32} className="text-teal-400 drop-shadow-md" />
            <span className="drop-shadow-md text-white">Trợ lý y tế AI</span>
          </h1>
          <p className="text-white/80 font-bold drop-shadow-sm text-[16px] max-w-[600px]">
            Hệ thống phân tích triệu chứng thông minh giúp bạn tìm kiếm chuyên khoa nhanh chóng.
          </p>
        </div>
      </div>

      {error && (
        <div className="w-full bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl mb-4 font-bold flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="w-full patient-glass-panel rounded-[2rem] flex flex-col flex-1 overflow-hidden shadow-2xl border-0">
        
        {/* Chat Controls */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex justify-between items-center shrink-0">
          <button
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm text-sm"
            onClick={handleNewChat}
            disabled={loading}
          >
            + Bắt đầu mới
          </button>
          <button
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-bold px-5 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm disabled:opacity-50"
            onClick={handleGetSuggestion}
            disabled={loading || !sessionId || messages.length < 2}
          >
            <Stethoscope size={16} /> Chẩn đoán & Gợi ý
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/5">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex w-full ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === "USER" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border-2 ${
                    msg.sender === "USER" 
                      ? "bg-teal-500 text-white border-teal-300" 
                      : "bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white border-violet-300"
                  }`}>
                    {msg.sender === "USER" ? <User size={20} /> : <Bot size={20} />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl shadow-sm text-[15px] font-medium leading-relaxed ${
                    msg.sender === "USER" 
                      ? "bg-teal-600 text-white rounded-tr-sm" 
                      : "bg-white/80 backdrop-blur-md text-slate-800 rounded-tl-sm border border-white/40"
                  }`}>
                    {msg.text}
                  </div>

                </div>
              </div>
            ))}

            {loading && !suggestion && (
              <div className="flex justify-start w-full">
                <div className="flex gap-3 max-w-[75%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border-2 bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white border-violet-300">
                    <Bot size={20} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md text-slate-800 rounded-tl-sm border border-white/40 shadow-sm flex items-center gap-3">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span className="text-sm font-bold text-violet-600">Đang phân tích...</span>
                  </div>
                </div>
              </div>
            )}

            {suggestion && (
              <div className="flex justify-start w-full mt-4">
                <div className="flex gap-3 w-full max-w-3xl">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border-2 bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white border-violet-300">
                    <Stethoscope size={20} />
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/95 backdrop-blur-xl text-slate-800 rounded-tl-sm border border-fuchsia-200 shadow-xl w-full">
                    <h4 className="text-lg font-black text-fuchsia-700 flex items-center gap-2 mb-4 border-b border-fuchsia-100 pb-2">
                      <Sparkles size={20} className="text-fuchsia-500" /> Kết quả phân tích AI
                    </h4>
                    
                    {suggestion.recommendations && suggestion.recommendations.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {suggestion.message && (
                          <div className="p-3 bg-fuchsia-50 rounded-xl text-fuchsia-800 font-medium italic border border-fuchsia-100">
                            "{suggestion.message}"
                          </div>
                        )}
                        {suggestion.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-5 bg-gradient-to-r from-white to-violet-50/50 border border-violet-100 rounded-xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                              <strong className="text-xl font-extrabold text-violet-900">{rec.departmentName}</strong>
                              <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-black border border-violet-200">
                                {rec.confidenceScore}% Phù hợp
                              </span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">{rec.explanation}</p>
                            <button
                              onClick={() => handleAcceptSuggestion(rec)}
                              disabled={loading}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl mt-2 transition-all flex items-center gap-2 w-fit shadow-lg shadow-violet-500/30"
                            >
                              <Stethoscope size={18} /> Đặt khám khoa {rec.departmentName}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {suggestion.message && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                            {suggestion.message}
                          </div>
                        )}
                        {suggestion.departmentName && (
                          <div className="p-5 bg-gradient-to-r from-white to-violet-50/50 border border-violet-100 rounded-xl flex flex-col gap-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Chuyên khoa đề xuất</span>
                              <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-black border border-violet-200">
                                {suggestion.confidenceScore}% Phù hợp
                              </span>
                            </div>
                            <strong className="text-2xl font-black text-violet-900">{suggestion.departmentName}</strong>
                            <p className="text-slate-600 font-medium">{suggestion.explanation}</p>
                            <button
                              onClick={() => handleAcceptSuggestion(null)}
                              disabled={loading}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl mt-2 transition-all flex items-center gap-2 w-fit shadow-lg shadow-violet-500/30"
                            >
                              <Stethoscope size={18} /> Đặt khám chuyên khoa này
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white/10 backdrop-blur-xl p-4 border-t border-white/20 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto w-full relative flex items-center bg-white/90 rounded-full p-1.5 shadow-lg border border-teal-100">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mô tả chi tiết triệu chứng của bạn..."
              disabled={loading || !sessionId}
              className="flex-1 bg-transparent border-none outline-none px-6 py-3 font-semibold text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading || !sessionId}
              className="w-12 h-12 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center shrink-0 transition-all shadow-md group disabled:shadow-none"
            >
              <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-3 text-white/70 text-xs font-semibold">
            AI có thể mắc lỗi. Luôn tham khảo ý kiến bác sĩ để có chẩn đoán chính xác nhất.
          </div>
        </div>
      </div>
    </div>
  );
}
