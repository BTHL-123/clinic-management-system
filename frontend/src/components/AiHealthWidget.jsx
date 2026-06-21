import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Clock, ChevronRight, AlertCircle, Bot } from "lucide-react";

const DEMO_CHAT = [
  { role: "ai",   text: "Xin chào! Tôi là trợ lý sức khỏe AI. Hãy mô tả triệu chứng của bạn để tôi hỗ trợ định hướng chuyên khoa phù hợp." },
  { role: "user", text: "Tôi bị đau đầu kéo dài từ sáng, kèm buồn nôn và nhạy cảm với ánh sáng." },
  { role: "ai",   text: "Triệu chứng của bạn phù hợp với nhóm đau đầu căng thẳng hoặc migraine. Tôi đề xuất khám tại khoa Thần kinh. Bạn có thể đặt lịch ngay bên dưới." },
];

const BODY_ZONES = [
  { id: "head",     label: "Đầu",   cx: 100, cy: 38,  r: 26, keywords: ["đau đầu","chóng mặt","migraine","đau nửa đầu","nhức đầu"] },
  { id: "chest",    label: "Ngực",  cx: 100, cy: 105, r: 30, keywords: ["đau ngực","khó thở","hồi hộp","tim đập"] },
  { id: "belly",    label: "Bụng",  cx: 100, cy: 160, r: 28, keywords: ["đau bụng","buồn nôn","tiêu chảy","đầy hơi"] },
  { id: "leftArm",  label: "Tay T", cx: 54,  cy: 118, r: 18, keywords: ["tê tay","đau khớp tay","yếu tay"] },
  { id: "rightArm", label: "Tay P", cx: 146, cy: 118, r: 18, keywords: ["tê tay","đau khớp tay","yếu tay"] },
  { id: "legs",     label: "Chân",  cx: 100, cy: 220, r: 26, keywords: ["đau chân","tê chân","sưng chân","chuột rút"] },
];

const SPECIALTY_KEYWORDS = {
  "Thần kinh":     ["đau đầu","migraine","chóng mặt","tê","yếu","co giật","nhức đầu"],
  "Tim mạch":      ["đau ngực","khó thở","hồi hộp","tim đập","tím tái"],
  "Tiêu hóa":      ["đau bụng","buồn nôn","tiêu chảy","đầy hơi","nôn"],
  "Cơ xương khớp": ["đau khớp","sưng khớp","cứng khớp","đau lưng","đau chân","chuột rút"],
  "Hô hấp":        ["ho","khó thở","đau họng","sổ mũi","nghẹt mũi"],
};

function computeSpecialty(text) {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  const scores = Object.entries(SPECIALTY_KEYWORDS)
    .map(([name, kws]) => ({ name, score: kws.filter((k) => lower.includes(k)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scores.length) return [];
  const max = scores[0].score;
  return scores.slice(0, 3).map((s) => ({ name: s.name, pct: Math.round((s.score / max) * 100) }));
}

function highlightZones(text) {
  const lower = text.toLowerCase();
  return BODY_ZONES.filter((z) => z.keywords.some((k) => lower.includes(k))).map((z) => z.id);
}

function ConfidenceBar({ name, pct }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-slate-500 w-28 shrink-0">{name}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #0d9488, #06b6d4)",
            boxShadow: "0 0 6px rgba(13,148,136,0.4)",
          }}
        />
      </div>
      <span className="text-xs font-semibold text-teal-600 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

function BodyMap({ activeZones, hoveredZone, onHover }) {
  return (
    <svg viewBox="0 0 200 260" className="w-full max-w-[150px] mx-auto select-none" aria-label="Body map">
      {/* Body outline */}
      <ellipse cx="100" cy="38" rx="22" ry="24" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M78 60 Q70 75 68 90 L68 150 Q68 158 76 158 L90 158 L90 200 Q90 215 100 215 Q110 215 110 200 L110 158 L124 158 Q132 158 132 150 L132 90 Q130 75 122 60 Z"
        fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M68 90 Q52 95 48 118 Q46 130 54 134 Q60 136 64 124 L68 110" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M132 90 Q148 95 152 118 Q154 130 146 134 Q140 136 136 124 L132 110" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M90 158 L84 215 Q82 228 90 230 Q97 232 98 218 L100 180 L102 218 Q103 232 110 230 Q118 228 116 215 L110 158 Z"
        fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />

      {BODY_ZONES.map((z) => {
        const isActive = activeZones.includes(z.id);
        const isHovered = hoveredZone === z.id;
        const glow = isActive || isHovered;
        return (
          <g key={z.id} onMouseEnter={() => onHover(z.id)} onMouseLeave={() => onHover(null)} style={{ cursor: "pointer" }}>
            <circle
              cx={z.cx} cy={z.cy} r={z.r}
              fill={glow ? "rgba(13,148,136,0.12)" : "transparent"}
              stroke={glow ? "#0d9488" : "transparent"}
              strokeWidth={glow ? 1.5 : 0}
              style={{
                transition: "all 0.3s ease",
                filter: glow ? "drop-shadow(0 0 8px rgba(13,148,136,0.5))" : "none",
                transform: glow ? "scale(1.1)" : "scale(1)",
                transformOrigin: `${z.cx}px ${z.cy}px`,
              }}
            />
            {glow && (
              <text x={z.cx} y={z.cy + 4} textAnchor="middle" fill="#0f766e" fontSize={8} fontWeight="700">
                {z.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AiHealthWidget({ onNavigateToChat }) {
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState(DEMO_CHAT);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);

  const activeZones = highlightZones(query);
  const confidences = computeSpecialty(query);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userMsg = query.trim();
    setQuery("");
    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);
    setTimeout(() => {
      const specs = computeSpecialty(userMsg);
      const reply = specs.length
        ? `Dựa trên triệu chứng, tôi đề xuất khoa **${specs[0].name}** (độ phù hợp ${specs[0].pct}%). Bạn có muốn đặt lịch không?`
        : "Tôi chưa đủ thông tin để gợi ý. Bạn có thể mô tả thêm triệu chứng không?";
      setChat((prev) => [...prev, { role: "ai", text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div
      className="border border-slate-200/70 rounded-xl overflow-hidden flex flex-col bg-white"
      style={{ boxShadow: "0 4px 20px rgba(13,148,136,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #0d9488, #06b6d4)", boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }}
            >
              <Bot size={15} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <span className="text-slate-800 font-semibold text-sm">AI Health Assistant</span>
            <span className="block text-xs text-emerald-600 font-medium leading-tight">Đang hoạt động</span>
          </div>
        </div>
        <button
          onClick={onNavigateToChat}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors"
        >
          <Clock size={12} /> Lịch sử <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

        {/* LEFT: Chat + Input */}
        <div className="flex-1 flex flex-col p-4 gap-3">
          {/* Chat */}
          <div ref={chatRef} className="max-h-[200px] overflow-y-auto flex flex-col gap-2.5 pr-1">
            {chat.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "ai"
                    ? "bg-slate-50 border border-slate-100 text-slate-700"
                    : "text-white"
                }`}
                style={msg.role === "user" ? {
                  background: "linear-gradient(135deg, #0d9488, #0891b2)",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.25)",
                } : {}}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <Bot size={12} />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mô tả triệu chứng (VD: đau đầu, buồn nôn từ sáng...)"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #0d9488, #0891b2)",
                boxShadow: query.trim() ? "0 2px 10px rgba(13,148,136,0.30)" : "none",
              }}
              onMouseEnter={(e) => { if (query.trim()) e.currentTarget.style.boxShadow = "0 0 18px rgba(13,148,136,0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = query.trim() ? "0 2px 10px rgba(13,148,136,0.30)" : "none"; }}
            >
              <Send size={13} /> Hỏi AI
            </button>
          </form>

          {/* Confidence bars */}
          {confidences.length > 0 && (
            <div
              className="rounded-lg p-3 border border-teal-100/60"
              style={{ background: "linear-gradient(135deg, rgba(240,253,250,0.8), rgba(236,254,255,0.6))" }}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Độ phù hợp chuyên khoa
              </p>
              <div className="flex flex-col gap-1.5">
                {confidences.map((c) => <ConfidenceBar key={c.name} name={c.name} pct={c.pct} />)}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Lưu ý:</strong> AI chỉ tham khảo, KHÔNG thay thế chẩn đoán bác sĩ.
            </p>
          </div>
        </div>

        {/* RIGHT: Body Map */}
        <div className="lg:w-48 p-4 flex flex-col gap-3 bg-slate-50/40">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
            Bản đồ triệu chứng
          </p>
          <BodyMap activeZones={activeZones} hoveredZone={hoveredZone} onHover={setHoveredZone} />
          {(activeZones.length > 0 || hoveredZone) && (
            <div className="text-center">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border"
                style={{ background: "rgba(13,148,136,0.06)", borderColor: "rgba(13,148,136,0.2)", color: "#0f766e" }}
              >
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                {hoveredZone
                  ? BODY_ZONES.find((z) => z.id === hoveredZone)?.label
                  : `${activeZones.length} vùng phát hiện`}
              </span>
            </div>
          )}
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Nhập triệu chứng để làm nổi bật vùng tương ứng
          </p>
        </div>
      </div>
    </div>
  );
}
