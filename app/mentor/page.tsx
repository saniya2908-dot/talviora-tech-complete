"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_STORAGE_KEY = "talviora-mentor-chat-v1";
const MAX_SAVED_MESSAGES = 200;

export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseStarted, setResponseStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validMessages = parsed.filter((item): item is Message => {
            if (!item || typeof item !== "object") return false;
            const message = item as Record<string, unknown>;
            return (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string" && message.content.length <= 4000;
          });
          setMessages(validMessages.slice(-MAX_SAVED_MESSAGES));
        }
      }
    } catch {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)));
    } catch {
      setErrorMessage("This browser could not save the chat. Check its available storage.");
    }
  }, [messages, historyLoaded]);

  const clearChat = () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      setErrorMessage("This browser could not clear the saved chat.");
    }
    setMessages([]);
    setErrorMessage(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setErrorMessage(null);
    setResponseStarted(false);
    const updatedMessages = [...messages, { role: "user" as const, content: userText }];
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages.slice(-MAX_SAVED_MESSAGES)));
    } catch {
      setErrorMessage("This browser could not save the chat. Check its available storage.");
    }
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: messages.slice(-40) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "The AI could not answer right now. Please try again.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming is not supported by this connection.");

      const decoder = new TextDecoder();
      let buffer = "";
      let streamedReply = "";
      let streamError: string | null = null;

      const handleFrame = (frame: string) => {
        const line = frame.split(/\r?\n/).find((item) => item.startsWith("data:"));
        if (!line) return;
        try {
          const event = JSON.parse(line.slice(5).trim()) as { text?: string; error?: string };
          if (event.text) {
            streamedReply += event.text;
            setResponseStarted(true);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", content: streamedReply }];
              }
              return [...prev, { role: "assistant", content: streamedReply }];
            });
          }
          if (event.error) streamError = event.error;
        } catch {
          streamError = "The AI response could not be read. Please try again.";
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });
        if (done) buffer += decoder.decode();

        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || "";
        frames.forEach(handleFrame);

        if (done) {
          if (buffer.trim()) handleFrame(buffer);
          break;
        }
      }

      if (streamError) setErrorMessage(streamError);
      if (!streamedReply && !streamError) {
        setErrorMessage("The AI returned an empty reply. Please try again.");
      }

      const completedMessages = streamedReply
        ? [...updatedMessages, { role: "assistant" as const, content: streamedReply }]
        : updatedMessages;
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(completedMessages.slice(-MAX_SAVED_MESSAGES)));
      } catch {
        setErrorMessage("This browser could not save the chat. Check its available storage.");
      }
      setMessages(completedMessages);
    } catch {
      setErrorMessage("The AI service could not be reached. Your message is saved; please try again.");
    } finally {
      setLoading(false);
      setResponseStarted(false);
    }
  };

  const samplePrompts = [
    "Explain a difficult idea in simple language.",
    "Help me solve a problem step by step.",
    "Ask me anything about tech, study, writing, or everyday life.",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(var(--color-burgundy-rgb),0.15)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)]">
              <Sparkles className="w-4 h-4 text-[var(--color-burgundy)]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-burgundy)]">
              Your AI Assistant & Learning Mentor
            </span>
          </div>
          <h1 className="font-display-serif text-3xl sm:text-4xl font-bold text-[var(--color-burgundy)]">
            AI Assistant & Learning Mentor
          </h1>
          <p className="text-xs text-[var(--color-burgundy)]/85 mt-0.5 font-medium">
            Ask about technology, study, work, writing, everyday questions, or anything else. The assistant will be clear when it is unsure.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <span className="text-[11px] text-[var(--color-burgundy)]/70">Saved in this browser</span>
          <button
            type="button"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(var(--color-burgundy-rgb),0.15)] px-3 py-1.5 text-xs font-semibold text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => setInput(p)}
            className="text-xs px-3.5 py-1.5 rounded-full border border-[rgba(var(--color-burgundy-rgb),0.15)] bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)] transition cursor-pointer shadow-xs font-medium"
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="card-coffee p-6 min-h-[420px] flex flex-col justify-between space-y-6 border border-[rgba(var(--color-burgundy-rgb),0.14)] bg-[var(--color-warm-ivory)]">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.length === 0 && !loading && (
            <p className="mx-auto max-w-lg py-16 text-center text-sm leading-relaxed text-[var(--text-secondary)]">
              Ask anything to begin. Your assistant follows the recent conversation and saves this chat in your browser. Questions are also shared with the Talviora admin; AI replies are not shown there.
            </p>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4 text-[var(--color-warm-ivory)]" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] rounded-tr-xs font-medium"
                    : "bg-[var(--color-creme-latte)] border border-[rgba(var(--color-burgundy-rgb),0.12)] text-[var(--color-burgundy)] rounded-tl-xs font-medium"
                }`}
              >
                {m.content}
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-[var(--color-dusty-rose)] text-[var(--color-burgundy)] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[rgba(var(--color-burgundy-rgb),0.2)]">
                  You
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-burgundy)] text-[var(--color-warm-ivory)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--color-warm-ivory)]" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--surface-rose)] border border-[rgba(var(--color-dusty-rose-rgb),0.6)] text-xs text-[var(--color-burgundy)] flex items-center gap-2 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-burgundy)]" />
                <span>{responseStarted ? "Writing your answer…" : "Connecting to AI…"}</span>
              </div>
            </div>
          )}
        </div>

        <p className="pt-3 text-[11px] leading-relaxed text-[var(--text-secondary)]" role="note">When the admin inbox is enabled, your question is saved for authorized Talviora admins to review. AI replies are not included in that inbox. Please avoid sensitive personal details.</p>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-4 border-t border-[rgba(var(--color-burgundy-rgb),0.12)] flex gap-2">
          <input
            type="text"
            maxLength={4000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything… technology, writing, study, work, or everyday questions"
            className="input-coffee flex-1 px-4 py-2.5 text-xs sm:text-sm bg-[var(--color-warm-ivory)] text-[var(--color-burgundy)]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-burgundy px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-[var(--color-warm-ivory)]" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {errorMessage && (
        <p className="flex items-start gap-2 rounded-xl border border-[var(--border-warm)] bg-[var(--surface-rose)] p-3 text-xs leading-relaxed text-[var(--text-primary)]" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-flowering-chestnut)]" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
