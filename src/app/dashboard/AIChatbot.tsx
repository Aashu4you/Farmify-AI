"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Best crop for black soil in May?",
  "How to treat early blight on tomatoes?",
  "When should I irrigate wheat at tillering stage?",
  "What NPK ratio for rice during vegetative stage?",
  "Signs of nitrogen deficiency in maize?",
  "How to improve soil health after harvest?",
];

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! 🌾 I'm your Farmify AI assistant powered by Llama 3. Ask me anything about your crops, soil, disease treatment, irrigation, or farming best practices. I can also see your current crops and give personalized advice!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    // Build history for context (last 10 messages to stay within token limits)
    const history = [...messages, userMsg].slice(-10);

    try {
      const res = await api().post("/chat", { messages: history });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Connection error. Please try again.";
      setError(msg);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ ${msg}`,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Chat cleared! How can I help you with your farm today? 🌱",
    }]);
    setError("");
  };

  return (
    <div className="view-root chatbot-root">
      <style>{`
        .chatbot-root {
          height: calc(100vh - 64px);
          overflow: hidden;
          padding-bottom: 0;
        }

        .chat-layout {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 8px 0 8px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        .chat-bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          animation: bubbleIn 0.2s ease;
        }
        @keyframes bubbleIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .chat-bubble-wrap.user { flex-direction: row-reverse; }

        .chat-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--glo); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0;
        }

        .chat-bubble {
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .chat-bubble.assistant {
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--cream);
          border-bottom-left-radius: 4px;
        }
        .chat-bubble.user {
          background: var(--green);
          color: #060e07;
          font-weight: 500;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.error {
          background: var(--rlo);
          border: 1px solid rgba(224,92,92,0.25);
          color: var(--red);
        }

        /* Typing indicator */
        .chat-bubble.typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 14px 18px;
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--muted);
          animation: typingBounce 1.2s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:0.4}
          30%{transform:translateY(-6px);opacity:1}
        }

        /* Suggestions */
        .chat-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px 0;
        }
        .suggestion-chip {
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 100px;
          padding: 7px 14px;
          font-size: 12px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Syne', sans-serif;
          white-space: nowrap;
        }
        .suggestion-chip:hover {
          border-color: var(--green);
          color: var(--cream);
          background: var(--glo);
        }

        /* Input row */
        .chat-input-row {
          display: flex;
          gap: 10px;
          padding: 16px 0 24px;
          border-top: 1px solid var(--border);
          margin-top: 8px;
          align-items: flex-end;
        }
        .chat-input {
          flex: 1;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 14px;
          padding: 13px 18px;
          font-size: 14px;
          color: var(--cream);
          font-family: 'Syne', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          resize: none;
          line-height: 1.5;
        }
        .chat-input:focus { border-color: var(--green); }
        .chat-input::placeholder { color: var(--muted); }
        .chat-input:disabled { opacity: 0.5; }

        .chat-send {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: var(--green);
          color: #060e07;
          font-size: 18px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-send:hover:not(:disabled) { background: #6dd98a; transform: translateY(-1px); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        .char-count {
          font-size: 11px;
          color: var(--muted);
          font-family: 'JetBrains Mono', monospace;
          text-align: right;
          margin-top: 3px;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">AI Chatbot</h1>
          <p className="view-sub">Ask anything about your farm — powered by Llama 3.3 via Groq.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: "var(--green)",
            background: "var(--glo)", border: "1px solid var(--border2)",
            borderRadius: 100, padding: "5px 14px", letterSpacing: "0.06em",
          }}>
            ⚡ Llama 3.3 · Groq
          </div>
          <button
            className="action-btn"
            onClick={clearChat}
            disabled={loading}
            style={{ padding: "7px 14px", fontSize: 12 }}
          >
            🗑️ Clear Chat
          </button>
        </div>
      </div>

      {/* ── Chat layout ── */}
      <div className="chat-layout">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble-wrap ${m.role}`}>
              {m.role === "assistant" && (
                <div className="chat-avatar">🌾</div>
              )}
              <div className={`chat-bubble ${m.role} ${m.content.startsWith("⚠️") ? "error" : ""}`}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-avatar">🌾</div>
              <div className="chat-bubble assistant typing">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips — show only at start */}
        {messages.length === 1 && !loading && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-row">
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about crops, disease, soil, irrigation, weather…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={1000}
            />
            {input.length > 800 && (
              <div className="char-count">{input.length}/1000</div>
            )}
          </div>
          <button
            className="chat-send"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            title="Send (Enter)"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}