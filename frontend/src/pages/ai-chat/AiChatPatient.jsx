import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, User, Stethoscope, AlertCircle, Sparkles, Plus, Check } from "lucide-react";
import {
  createSession,
  sendMessage,
  generateSuggestion,
  acceptSuggestion,
  getAllSessions,
  getMessages
} from "../../services/aiChatService";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

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
                text: "Xin chào! Tôi là trợ lý AI y tế của phòng khám. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
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
                text: "Xin chào! Tôi là trợ lý AI y tế của phòng khám. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
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
              text: "Xin chào! Tôi là trợ lý AI y tế của phòng khám. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
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
          text: "Xin chào! Tôi là trợ lý AI y tế của phòng khám. Vui lòng mô tả triệu chứng của bạn để tôi có thể tư vấn chuyên khoa phù hợp nhé.",
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
    <div className="w-full flex flex-col pb-6 h-[calc(100vh-104px)] overflow-hidden">
      
      {/* Header */}
      <PageHeader
        title="Tư vấn Trợ lý AI"
        icon={MessageSquare}
        iconColor="text-[#1DB896]"
        subtitle="Hệ thống tư vấn triệu chứng thông minh hỗ trợ phân loại và đề xuất chuyên khoa đặt lịch phù hợp."
        onBack={() => navigate("/dashboard")}
      />

      {error && (
        <div className="w-full bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl mb-4 font-semibold flex items-center gap-2 text-sm shadow-sm">
          <AlertCircle size={18} className="text-rose-555 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col flex-1 overflow-hidden">
        
        {/* Chat Controls */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
          <button
            className="bg-white text-[#0A604E] hover:bg-[#D1F2EB]/50 border border-slate-200/80 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-xs flex items-center gap-1.5"
            onClick={handleNewChat}
            disabled={loading}
          >
            <Plus size={14} />
            Bắt đầu mới
          </button>
          
          <button
            className="bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleGetSuggestion}
            disabled={loading || !sessionId || messages.length < 2}
          >
            <Stethoscope size={15} />
            Đề xuất Chuyên khoa
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/20">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex w-full ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === "USER" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 ${
                    msg.sender === "USER" 
                      ? "bg-[#0A604E] text-white border-white" 
                      : "bg-[#1DB896] text-white border-white"
                  }`}>
                    {msg.sender === "USER" ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl text-[14px] font-semibold leading-relaxed shadow-sm ${
                    msg.sender === "USER" 
                      ? "bg-[#0A604E] text-white rounded-tr-sm" 
                      : "bg-white text-slate-750 rounded-tl-sm border border-slate-200/70"
                  }`}>
                    {msg.text}
                  </div>

                </div>
              </div>
            ))}

            {loading && !suggestion && (
              <div className="flex justify-start w-full">
                <div className="flex gap-3 max-w-[75%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 bg-[#1DB896] text-white border-white">
                    <Bot size={18} />
                  </div>
                  <div className="p-4 rounded-2xl bg-white text-slate-800 rounded-tl-sm border border-slate-200/70 shadow-sm flex items-center gap-3">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-[#1DB896] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-[#1DB896] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-[#1DB896] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span className="text-xs font-bold text-[#0A604E]">Đang phân tích triệu chứng...</span>
                  </div>
                </div>
              </div>
            )}

            {suggestion && (
              <div className="flex justify-start w-full mt-2">
                <div className="flex gap-3 w-full max-w-3xl">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 bg-[#0A604E] text-white border-white">
                    <Stethoscope size={18} />
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-[#F0F9F7]/70 backdrop-blur-md text-slate-800 rounded-tl-sm border border-[#D1F2EB] shadow-sm w-full">
                    <h4 className="text-base font-extrabold text-[#0A604E] flex items-center gap-2 mb-4 border-b border-[#D1F2EB] pb-2.5">
                      <Sparkles size={18} className="text-[#1DB896]" /> Kết quả Phân tích & Đề xuất của AI
                    </h4>
                    
                    {suggestion.recommendations && suggestion.recommendations.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {suggestion.message && (
                          <div className="p-3 bg-white/80 rounded-xl text-[#4A5D59] font-semibold italic border border-slate-100 text-xs">
                            "{suggestion.message}"
                          </div>
                        )}
                        {suggestion.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                              <strong className="text-lg font-black text-[#0A604E]">{rec.departmentName}</strong>
                              <span className="bg-[#D1F2EB] text-[#0A604E] px-3 py-1 rounded-full text-xs font-extrabold border border-teal-200/50">
                                {rec.confidenceScore}% Phù hợp
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">{rec.explanation}</p>
                            <button
                              onClick={() => handleAcceptSuggestion(rec)}
                              disabled={loading}
                              className="bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold py-2 px-4 rounded-xl mt-1.5 transition-all flex items-center gap-2 w-fit shadow-sm text-xs"
                            >
                              <Check size={14} /> Đặt lịch khoa {rec.departmentName}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {suggestion.message && (
                          <div className="p-3 bg-white/80 rounded-xl text-slate-700 font-semibold border border-slate-100 text-xs">
                            {suggestion.message}
                          </div>
                        )}
                        {suggestion.departmentName && (
                          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col gap-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Chuyên khoa phù hợp nhất</span>
                              <span className="bg-[#D1F2EB] text-[#0A604E] px-3 py-1 rounded-full text-xs font-extrabold border border-teal-200/50">
                                {suggestion.confidenceScore}% Phù hợp
                              </span>
                            </div>
                            <strong className="text-xl font-black text-[#0A604E]">{suggestion.departmentName}</strong>
                            <p className="text-xs font-semibold text-slate-650 leading-relaxed">{suggestion.explanation}</p>
                            <button
                              onClick={() => handleAcceptSuggestion(null)}
                              disabled={loading}
                              className="bg-[#0A604E] hover:bg-[#1DB896] text-white font-extrabold py-2 px-4 rounded-xl mt-1.5 transition-all flex items-center gap-2 w-fit shadow-sm text-xs"
                            >
                              <Check size={14} /> Đặt lịch chuyên khoa này
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
        <div className="bg-slate-50/50 p-4 border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto w-full relative flex items-center bg-white rounded-full p-1.5 shadow-sm border border-slate-200 focus-within:border-[#1DB896] transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mô tả chi tiết triệu chứng sức khỏe của bạn để AI tư vấn..."
              disabled={loading || !sessionId}
              className="flex-1 bg-transparent border-none outline-none px-6 py-2.5 font-semibold text-sm text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading || !sessionId}
              className="w-10 h-10 bg-[#0A604E] hover:bg-[#1DB896] disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm group disabled:shadow-none"
            >
              <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-3 text-slate-400 text-[10px] font-bold">
            ℹ️ Trợ lý AI chỉ đưa ra khuyến nghị phân loại chuyên khoa. Không thay thế chẩn đoán y tế chuyên sâu từ bác sĩ.
          </div>
        </div>
      </div>
    </div>
  );
}
