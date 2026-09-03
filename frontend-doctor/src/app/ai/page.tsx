"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Sparkles, Send, ShieldCheck, FileText, User, ArrowRight } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { FormattedChatContent } from "@/components/common/FormattedChatContent";
import { api } from "@/lib/api";

export default function DoctorAIAssistantPage() {
  const [patientId] = useState("44444444-4444-4444-4444-444444444410");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Good morning, Dr. Ananya Sharma. I am your CareNav Doctor Clinical Assistant. I can summarize consented patient records, compare past laboratory panels, and inspect medication timelines. How can I assist with Arjun Mehta today?",
      disclaimer: "AI-generated summary. Verify against the original patient records before making clinical decisions.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await api<any>("/api/doctor/ai/assistant", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, message: userMsg.content }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          sources: res.sources,
          disclaimer: res.disclaimer,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to retrieve records. Ensure consent is active and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickPrompt(text: string) {
    setPrompt(text);
  }

  return (
    <DoctorAppShell>
      <div className="space-y-6 max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-teal-400" />
              <span>Doctor Clinical AI Assistant</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Active Context: <strong className="text-white">Arjun Mehta (Age 34)</strong> • 3 Authorized Records
            </p>
          </div>
        </div>

        {/* Chat Box */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-700 text-teal-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-xl space-y-2 ${
                  m.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200"
                }`}
              >
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <FormattedChatContent content={m.content} className="text-slate-200" />
                )}
                {m.sources && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-teal-400 space-y-1">
                    <p className="font-semibold uppercase tracking-wider">Consented Sources:</p>
                    {m.sources.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{s.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.disclaimer && (
                  <p className="text-[10px] text-slate-500 italic pt-1">{m.disclaimer}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-teal-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Analyzing authorized clinical records...</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {[
            "Summarize patient's recent healthcare activity",
            "Compare blood tests from August and September",
            "What medications are currently active?",
            "What was discussed in previous cardiology visit?",
          ].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleQuickPrompt(action)}
              className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="flex gap-2 shrink-0">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about authorized records, compare tests, summarize..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </DoctorAppShell>
  );
}
