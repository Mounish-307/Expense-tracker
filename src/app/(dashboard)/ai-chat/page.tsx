"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { AI_SUGGESTED_PROMPTS } from "@/lib/constants";
import { generateId, cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI financial assistant powered by Gemini. I have full access to your expense data and can answer questions about your spending, budgets, and trends. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.response ?? "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Connection error. Please check your API key and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Assistant</h1>
          <p className="text-slate-500 text-xs">
            Gemini 2.0 Flash · Knows your expense history
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-brand-500 to-violet-600"
                  : "bg-white/10 border border-white/10"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-slate-300" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "glass border border-white/6 text-slate-200 rounded-tl-sm"
                  : "bg-gradient-to-br from-brand-500 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-brand-500/20"
              )}
            >
              {msg.content.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  {j < msg.content.split("\n").length - 1 && <br />}
                </span>
              ))}
              <div
                className={cn(
                  "text-[10px] mt-1.5 opacity-50",
                  msg.role === "user" ? "text-right" : "text-left"
                )}
              >
                {msg.timestamp.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 mb-3">
          <p className="text-xs text-slate-600 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {AI_SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-full glass border border-white/8 text-slate-400 hover:text-white hover:border-brand-500/30 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 glass rounded-2xl border border-white/8 p-2 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-600 ml-2 flex-shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your spending..."
          id="ai-chat-input"
          className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm outline-none py-2"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          id="ai-chat-send-btn"
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-xl transition-all",
            input.trim() && !loading
              ? "bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30"
              : "bg-white/5 text-slate-600"
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
