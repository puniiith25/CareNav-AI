"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Bot,
  Send,
  UploadCloud,
  FileText,
  Sparkles,
  ShieldAlert,
  MapPin,
  ChevronRight,
  BookmarkPlus,
  Trash2,
  Edit2,
  Check,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: { name: string; ok: boolean; error?: string }[];
  sources?: { label: string; href: string }[];
  navigate?: { category: string; explanation: string; href: string };
  emergency?: boolean;
  prompt_save_memory?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

function AIAssistantContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedToMemory, setSavedToMemory] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const initialPrompt = searchParams.get("prompt");
    if (initialPrompt && !messages.length) {
      sendMessage(initialPrompt);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversations() {
    try {
      const convos = await api<Conversation[]>("/api/ai/conversations");
      setConversations(convos);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }

  async function loadConversationMessages(cid: string) {
    setActiveConversationId(cid);
    try {
      const data = await api<{ conversation: Conversation; messages: any[] }>(`/api/ai/conversations/${cid}`);
      const formatted: Message[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
      setMessages(formatted);
    } catch (err) {
      console.error(err);
    }
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  async function sendMessage(textToSend?: string) {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await api<{
        conversation_id: string;
        message: string;
        tools: { name: string; ok: boolean; error?: string }[];
        sources: { label: string; href: string }[];
        navigate?: { category: string; explanation: string; href: string };
        emergency?: boolean;
        prompt_save_memory?: boolean;
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: activeConversationId,
          message: text,
        }),
      });

      if (!activeConversationId && res.conversation_id) {
        setActiveConversationId(res.conversation_id);
        loadConversations();
      }

      const assistantMsg: Message = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: res.message,
        tools: res.tools,
        sources: res.sources,
        navigate: res.navigate,
        emergency: res.emergency,
        prompt_save_memory: res.prompt_save_memory,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `I encountered an issue: ${err.message || "Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToMemory(msgId: string, summaryText: string) {
    try {
      await api("/api/health-memory", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          title: "AI Health Consultation Note",
          summary: summaryText,
          conversation_id: activeConversationId,
        }),
      });
      setSavedToMemory((prev) => ({ ...prev, [msgId]: true }));
    } catch (err) {
      console.error(err);
    }
  }

  const promptSuggestions = [
    "Explain my latest blood report",
    "I want to consult a cardiologist",
    "I have been having persistent knee pain",
    "What medications did my doctor prescribe?",
    "Compare my last two reports",
    "When is my next appointment?",
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
      {/* Left Sidebar: Conversations History */}
      <div className="hidden lg:flex flex-col w-72 card p-4 shrink-0 justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]">
            <div className="font-bold text-sm text-[#15232b] flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#0f6e6e]" />
              <span>Conversations</span>
            </div>
            <button
              onClick={startNewChat}
              className="p-1.5 rounded-lg bg-[#e4f2f1] text-[#0f6e6e] hover:bg-[#d0ecea] text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="mt-3 space-y-1 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5c6b73]">No past conversations yet.</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadConversationMessages(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium truncate flex items-center justify-between transition-colors ${
                    activeConversationId === c.id
                      ? "bg-[#0f6e6e] text-white font-semibold"
                      : "text-[#15232b] hover:bg-[#f3efe6]"
                  }`}
                >
                  <span className="truncate">{c.title || "Health Consultation"}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-[#d9d1c3] text-[0.7rem] text-[#5c6b73]">
          <p className="font-semibold text-[#15232b]">Clinical Disclaimer</p>
          <p className="mt-0.5">CareNav AI provides navigation & records retrieval. Not a diagnostic tool.</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 card flex flex-col justify-between overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#d9d1c3] bg-[#fbf9f4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#15232b]">CareNav AI Health Assistant</div>
              <div className="text-[0.7rem] text-[#5c6b73]">
                Connected to Arjun Mehta&apos;s Records & Healthcare Services
              </div>
            </div>
          </div>

          <div className="text-[0.7rem] px-2.5 py-1 rounded-full bg-[#e4f2f1] text-[#0b4f4f] font-semibold">
            Authorized Patient Scope
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="py-12 max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#15232b]">What health question do you have?</h3>
                <p className="text-xs text-[#5c6b73] mt-1">
                  Ask me to explain medical reports, find doctors, compare previous blood tests, or navigate care.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                {promptSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 rounded-xl bg-white border border-[#d9d1c3] hover:border-[#0f6e6e] hover:bg-[#e4f2f1]/30 text-xs text-[#15232b] font-medium transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[#0f6e6e] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  CN
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-sm ${
                  m.role === "user"
                    ? "bg-[#0f6e6e] text-white font-medium"
                    : "bg-white border border-[#d9d1c3] text-[#15232b] shadow-xs"
                }`}
              >
                {/* Tool telemetry if present */}
                {m.tools && m.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 pb-2 border-b border-[#d9d1c3]/50">
                    {m.tools.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded-md bg-[#f3efe6] text-[#5c6b73] font-mono font-medium"
                      >
                        <Check className="w-3 h-3 text-[#0f6e6e]" />
                        <span>{t.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Main Message Content */}
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {/* Healthcare Navigator Card if AI detected specialty need */}
                {m.navigate && m.navigate.category !== "all" && (
                  <div className="mt-3 p-3 rounded-xl bg-[#e4f2f1] border border-[#bce2df] text-[#0b4f4f] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <MapPin className="w-4 h-4 text-[#0f6e6e]" />
                      <span>Healthcare Navigator Suggestion</span>
                    </div>
                    <p className="text-xs text-[#15232b]">{m.navigate.explanation}</p>
                    <button
                      onClick={() => router.push(m.navigate!.href)}
                      className="btn btn-primary text-xs w-full justify-between"
                    >
                      <span>Open Healthcare Map ({m.navigate.category})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Source Links */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#d9d1c3]/60 flex flex-wrap gap-2">
                    {m.sources.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => router.push(s.href)}
                        className="px-2.5 py-1 rounded-lg bg-[#f3efe6] hover:bg-[#e4f2f1] text-[0.75rem] font-semibold text-[#0f6e6e] transition-colors"
                      >
                        {s.label} →
                      </button>
                    ))}
                  </div>
                )}

                {/* Save to Health Memory Prompt */}
                {m.role === "assistant" && (
                  <div className="mt-3 pt-2.5 border-t border-[#d9d1c3]/40 flex items-center justify-between text-xs">
                    <span className="text-[0.7rem] text-[#5c6b73] italic">
                      AI-generated explanation · Not a diagnosis
                    </span>
                    <button
                      onClick={() => handleSaveToMemory(m.id, m.content)}
                      disabled={savedToMemory[m.id]}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        savedToMemory[m.id]
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[#f3efe6] hover:bg-[#e4f2f1] text-[#0f6e6e]"
                      }`}
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedToMemory[m.id] ? "Saved to Memory ✓" : "Save to Health Memory"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-[#5c6b73]">
              <div className="w-8 h-8 rounded-xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold">
                CN
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#d9d1c3] flex items-center gap-2 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#0f6e6e] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#0f6e6e] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#0f6e6e] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-medium">CareNav AI is querying your records & services...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 md:p-4 border-t border-[#d9d1c3] bg-[#fbf9f4]">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask CareNav about symptoms, reports, doctors, appointments, medications..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] placeholder-[#5c6b73] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#0f6e6e] hover:bg-[#0b4f4f] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-sm text-[#5c6b73]">Loading AI Assistant...</div>}>
        <AIAssistantContent />
      </Suspense>
    </AppShell>
  );
}
