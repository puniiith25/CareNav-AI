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
  X,
  Eye,
  BarChart2,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Camera,
  RefreshCw,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FormattedChatContent } from "@/components/common/FormattedChatContent";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  tools?: { name: string; ok: boolean; error?: string }[];
  sources?: { label: string; href: string; reportId?: string }[];
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
  
  // Reports panel & inline viewer state
  const [activeTab, setActiveTab] = useState<"chat" | "reports">("chat");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [loadingReportDetails, setLoadingReportDetails] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Analysis Consent / Review Preview Modal
  const [previewExtracted, setPreviewExtracted] = useState<any | null>(null);
  const [currentUploadedDocId, setCurrentUploadedDocId] = useState<string | null>(null);
  const [isSavingWithConsent, setIsSavingWithConsent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadReports();
    api<any[]>("/api/family-members").then(setFamilyMembers).catch(() => {});
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

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.log("Video play error:", err));
    }
  }, [isCameraOpen, cameraStream]);

  async function startLiveWebcam() {
    setCameraError(null);
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        }).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });

        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play().catch((e) => console.log("play err:", e));
        }
      } catch (err: any) {
        console.warn("Live webcam stream failed in Chrome:", err);
        setCameraError(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera permission blocked by Chrome. Please click the Camera icon in your Chrome URL bar (top left) and click 'Allow', then click 'Enable Webcam'."
            : "Could not open webcam: " + (err.message || "Please check system permissions.")
        );
      }
    } else {
      setCameraError("Your browser does not support webcam access.");
    }
  }

  async function openCamera() {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setIsCameraOpen(true);
    await startLiveWebcam();
  }

  function handleNativeCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedPhotoUrl(url);
    setCapturedBlob(file);
    setIsCameraOpen(true);
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCameraError(null);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedPhotoUrl(url);
        // Stop live stream
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
          setCameraStream(null);
        }
      }
    }, "image/jpeg", 0.92);
  }

  function retakePhoto() {
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    openCamera();
  }

  async function analyzeCapturedPhoto() {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `physical_report_${Date.now()}.jpg`, { type: "image/jpeg" });
    closeCamera();
    await processFile(file);
  }

  async function loadConversations() {
    try {
      const convos = await api<Conversation[]>("/api/ai/conversations");
      setConversations(convos);
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }

  async function loadReports() {
    try {
      const data = await api<MedicalReport[]>("/api/reports");
      setReports(data || []);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  }

  async function viewReportDetails(reportId: string) {
    setLoadingReportDetails(true);
    try {
      const rep = await api<MedicalReport>(`/api/reports/${reportId}`);
      setSelectedReport(rep);
    } catch (err) {
      console.error("Error loading report detail:", err);
    } finally {
      setLoadingReportDetails(false);
    }
  }

  async function processFile(file: File) {
    setUploadingReport(true);
    setUploadProgress("Analyzing document photo with Gemini Multimodal Vision...");

    const localPreviewUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload file to secure backend
      const uploadRes = await api<{ id: string; status: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      setCurrentUploadedDocId(uploadRes.id);
      setLastUploadedDocInfo({
        id: uploadRes.id,
        previewUrl: localPreviewUrl,
        filename: file.name,
      });

      // Analyze document with Gemini
      const analyzeRes = await api<{ report_id: string; status: string; extracted: any }>(`/api/reports/${uploadRes.id}/analyze`, {
        method: "POST",
      });

      // Show consent & review preview
      setPreviewExtracted({
        reportId: analyzeRes.report_id,
        filename: file.name,
        previewUrl: localPreviewUrl,
        ...analyzeRes.extracted,
      });

    } catch (err: any) {
      alert(`Processing error: ${err.message || "Failed to analyze photo"}`);
    } finally {
      setUploadingReport(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Upload Image URL state to attach with next message
  const [lastUploadedDocInfo, setLastUploadedDocInfo] = useState<{ id: string; previewUrl: string; filename: string } | null>(null);

  async function confirmSaveReportWithConsent() {
    if (!previewExtracted) return;
    setIsSavingWithConsent(true);

    try {
      await loadReports();
      const reportId = previewExtracted.reportId;
      const testName = previewExtracted.test_name || "Medical Report";
      const docPreview = lastUploadedDocInfo?.previewUrl || (currentUploadedDocId ? `/api/documents/${currentUploadedDocId}/file` : undefined);
      
      setPreviewExtracted(null);

      // Open details modal
      await viewReportDetails(reportId);

      // Send chat message asking Gemini to explain, including the uploaded image
      sendMessage(
        `I have scanned and uploaded my ${testName}. Please provide a full clinical explanation of these findings and list important questions I should ask my doctor.`,
        docPreview
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWithConsent(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  async function loadConversationMessages(cid: string) {
    setActiveConversationId(cid);
    try {
      const data = await api<{ conversation: Conversation; messages: any[] }>(`/api/ai/conversations/${cid}`);
      const formatted: Message[] = data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        imageUrl: m.image_url,
      }));
      setMessages(formatted);
    } catch (err) {
      console.error(err);
    }
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setLastUploadedDocInfo(null);
  }

  async function sendMessage(textToSend?: string, attachedImageUrl?: string) {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const img = attachedImageUrl || (lastUploadedDocInfo ? lastUploadedDocInfo.previewUrl : undefined);

    const userMsg: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      imageUrl: img,
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
          image_url: img,
        }),
      });

      // Clear the last uploaded doc info after successfully sending
      setLastUploadedDocInfo(null);

      if (!activeConversationId && res.conversation_id) {
        setActiveConversationId(res.conversation_id);
        loadConversations();
      }

      const sourcesWithReportId = res.sources?.map((s) => {
        const match = s.href.match(/\/reports\/([a-zA-Z0-9-]+)/);
        return {
          ...s,
          reportId: match ? match[1] : undefined,
        };
      });

      const assistantMsg: Message = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: res.message,
        tools: res.tools,
        sources: sourcesWithReportId,
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
      {/* Left Sidebar: Conversations History & Quick Reports */}
      <div className="hidden lg:flex flex-col w-80 card p-4 shrink-0 justify-between bg-white">
        <div className="space-y-4">
          {/* Top Switcher Tabs */}
          <div className="flex rounded-xl bg-[#f3efe6] p-1 text-xs font-semibold text-[#5c6b73]">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "chat" ? "bg-white text-[#0f6e6e] shadow-xs font-bold" : "hover:text-[#15232b]"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "reports" ? "bg-white text-[#0f6e6e] shadow-xs font-bold" : "hover:text-[#15232b]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports ({reports.length})</span>
            </button>
          </div>

          {activeTab === "chat" ? (
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]">
                <span className="font-bold text-xs text-[#15232b]">Past Conversations</span>
                <button
                  onClick={startNewChat}
                  className="px-2 py-1 rounded-lg bg-[#e4f2f1] text-[#0f6e6e] hover:bg-[#d0ecea] text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="mt-2 space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto">
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
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]">
                <span className="font-bold text-xs text-[#15232b]">Uploaded Lab Reports</span>
                <span className="text-[0.68rem] text-[#5c6b73] font-medium">{reports.length} records</span>
              </div>

              <div className="space-y-1.5 max-h-[calc(100vh-22rem)] overflow-y-auto">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => viewReportDetails(r.id)}
                    className="p-2.5 rounded-xl bg-[#fbf9f4] border border-[#d9d1c3] hover:border-[#0f6e6e] cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#15232b] truncate">{r.test_name}</span>
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                        Ready
                      </span>
                    </div>
                    <div className="text-[0.7rem] text-[#5c6b73] flex items-center justify-between">
                      <span>{r.report_date}</span>
                      <span className="text-[#0f6e6e] font-semibold hover:underline flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat & Report Interaction Area */}
      <div className="flex-1 card flex flex-col justify-between overflow-hidden relative">
        {/* Uploading Banner Overlay */}
        {uploadingReport && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-[#0f6e6e] text-white p-3 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span className="font-semibold">{uploadProgress}</span>
            </div>
            <span className="text-[0.7rem] opacity-90">Please wait...</span>
          </div>
        )}

        {/* Chat Header */}
        <div className="p-3.5 md:p-4 border-b border-[#d9d1c3] bg-[#fbf9f4] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#15232b]">CareNav AI Health Assistant</div>
                <div className="text-[0.7rem] text-[#5c6b73]">
                  Multimodal Vision & Multi-Family Health Record Intelligence
                </div>
              </div>
            </div>

            <div className="text-[0.7rem] px-2.5 py-1 rounded-full bg-[#e4f2f1] text-[#0b4f4f] font-semibold">
              Authorized Patient Scope
            </div>
          </div>

          {/* Family Member Context Filter */}
          {familyMembers.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none text-xs">
              <span className="text-[0.7rem] font-bold text-[#5c6b73] shrink-0">Asking for:</span>
              <button
                type="button"
                onClick={() => setSelectedFamilyMemberId("all")}
                className={`px-2.5 py-1 rounded-lg font-bold text-[0.7rem] whitespace-nowrap transition-all ${
                  selectedFamilyMemberId === "all"
                    ? "bg-[#0f6e6e] text-white"
                    : "bg-white border border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
                }`}
              >
                👤 Myself & All
              </button>
              {familyMembers.map((fm) => (
                <button
                  key={fm.id}
                  type="button"
                  onClick={() => {
                    setSelectedFamilyMemberId(fm.id);
                    sendMessage(`What medical records, notes, and conditions do you have on file for my ${fm.relationship} (${fm.full_name})?`);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[0.7rem] whitespace-nowrap transition-all ${
                    selectedFamilyMemberId === fm.id
                      ? "bg-[#0f6e6e] text-white"
                      : "bg-white border border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
                  }`}
                >
                  {fm.relationship === "Mother" ? "👵" : fm.relationship === "Father" ? "👴" : "👥"} {fm.full_name} ({fm.relationship})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="py-6 max-w-lg mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#15232b]">How can CareNav assist you today?</h3>
                <p className="text-xs text-[#5c6b73] mt-1">
                  Ask about your own health records, manage elderly family members, or scan physical lab reports.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                {[
                  "Explain my latest blood report",
                  "What health notes are recorded for my parents?",
                  "I want to consult a cardiologist",
                  "What medications did my doctor prescribe?",
                  "Compare my last two reports",
                  "When is my next appointment?",
                ].map((prompt, i) => (
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
                {/* Uploaded / Scanned Image Attachment in Chat */}
                {m.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20 bg-black/10 max-w-sm">
                    <img
                      src={m.imageUrl}
                      alt="Uploaded medical document"
                      className="w-full max-h-60 object-contain rounded-lg hover:scale-102 transition-transform cursor-pointer"
                      onClick={() => window.open(m.imageUrl, "_blank")}
                    />
                    <div className="px-2 py-1 bg-black/40 text-[0.68rem] text-white/90 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-sans">
                        <Camera className="w-3 h-3 text-[#41b3b3]" />
                        <span>Attached Medical Document / Scan</span>
                      </span>
                      <span className="text-[0.62rem] opacity-75">Click to expand</span>
                    </div>
                  </div>
                )}

                {/* Tool telemetry */}
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
                <FormattedChatContent content={m.content} isUser={m.role === "user"} />

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

                {/* Interactive Source & Report Links */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#d9d1c3]/60 flex flex-wrap gap-2">
                    {m.sources.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (s.reportId) {
                            viewReportDetails(s.reportId);
                          } else {
                            router.push(s.href);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#f3efe6] hover:bg-[#e4f2f1] text-[0.75rem] font-semibold text-[#0f6e6e] transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{s.label}</span>
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
          {/* Active Attached Image Chip */}
          {lastUploadedDocInfo && (
            <div className="mb-2 p-2 rounded-xl bg-white border border-[#0f6e6e]/40 flex items-center justify-between shadow-xs max-w-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={lastUploadedDocInfo.previewUrl}
                  alt="Attachment preview"
                  className="w-10 h-10 object-cover rounded-lg border border-[#d9d1c3]"
                />
                <div className="text-xs truncate">
                  <div className="font-bold text-[#15232b] truncate">{lastUploadedDocInfo.filename}</div>
                  <div className="text-[0.68rem] text-[#0f6e6e] font-semibold">Attached to next message</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastUploadedDocInfo(null)}
                className="p-1 rounded-lg text-[#5c6b73] hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <button
              type="button"
              onClick={openCamera}
              className="p-2.5 rounded-xl bg-white border border-[#d9d1c3] hover:border-[#0f6e6e] text-[#0f6e6e] flex items-center justify-center shrink-0 transition-colors"
              title="Scan Paper Report with Camera"
            >
              <Camera className="w-4 h-4" />
            </button>
            <label className="p-2.5 rounded-xl bg-white border border-[#d9d1c3] hover:border-[#0f6e6e] text-[#0f6e6e] cursor-pointer flex items-center justify-center shrink-0 transition-colors" title="Upload Document File">
              <UploadCloud className="w-4 h-4" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask CareNav or scan a report..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] placeholder-[#5c6b73] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
            />
            <button
              type="submit"
              disabled={loading || (!inputText.trim() && !lastUploadedDocInfo)}
              className="px-4 py-2.5 rounded-xl bg-[#0f6e6e] hover:bg-[#0b4f4f] disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Hidden File and Camera Pickers */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      {/* 1. Live Camera & Image Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15232b] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#41b3b3]" />
                <span className="font-bold text-sm">Scan Medical Report</span>
              </div>
              <button onClick={closeCamera} className="p-1 rounded-lg text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              {capturedPhotoUrl ? (
                <img src={capturedPhotoUrl} alt="Captured report preview" className="w-full h-full object-contain" />
              ) : cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="p-6 text-center space-y-4">
                  <Camera className="w-12 h-12 text-[#41b3b3] mx-auto opacity-80" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Choose How to Provide Your Report</h4>
                    <p className="text-xs text-white/70 mt-1 max-w-xs mx-auto">
                      {cameraError || "Take a live picture with your device camera, or select an existing photo/document."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      onClick={startLiveWebcam}
                      className="btn btn-primary text-xs bg-[#0f6e6e] flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Enable / Retry Live Camera</span>
                    </button>
                    <label className="btn btn-ghost text-xs bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 cursor-pointer">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Report Image / PDF</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          closeCamera();
                          handleFileUpload(e);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
              
              {!capturedPhotoUrl && cameraStream && (
                <div className="absolute inset-6 border-2 border-dashed border-[#41b3b3]/60 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[0.7rem] bg-black/60 px-3 py-1 rounded-full text-white/80">
                    Align printed lab report within frame
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#1b2b34] flex items-center justify-between gap-3">
              {capturedPhotoUrl ? (
                <>
                  <button
                    onClick={retakePhoto}
                    className="btn btn-ghost text-xs text-white bg-white/10 hover:bg-white/20 flex-1 justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    onClick={analyzeCapturedPhoto}
                    className="btn btn-primary text-xs flex-1 justify-center bg-[#0f6e6e]"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Analyze with Gemini</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={closeCamera}
                    className="btn btn-ghost text-xs text-white/70 hover:text-white justify-center"
                  >
                    Cancel
                  </button>
                  {cameraStream && (
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-2.5 rounded-2xl bg-white text-[#15232b] font-bold text-xs hover:bg-[#e4f2f1] flex items-center gap-2 shadow-lg mx-auto"
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse" />
                      <span>Take Picture</span>
                    </button>
                  )}
                  <label className="btn btn-ghost text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        closeCamera();
                        handleFileUpload(e);
                      }}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. User Permission & Review Consent Modal */}
      {previewExtracted && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#d9d1c3]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#d9d1c3] bg-[#fbf9f4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">Gemini Vision Extraction Preview</h3>
                  <p className="text-xs text-[#5c6b73]">
                    Review the extracted data from your photo before saving
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewExtracted(null)}
                className="p-2 rounded-xl text-[#5c6b73] hover:bg-[#f3efe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extracted Details */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#e4f2f1]/40 border border-[#bce2df] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0b4f4f] uppercase tracking-wider text-[0.7rem]">
                    {previewExtracted.document_type || "Lab Report"}
                  </span>
                  <span className="text-[#5c6b73]">{previewExtracted.report_date}</span>
                </div>
                <h4 className="font-bold text-sm text-[#15232b]">{previewExtracted.test_name}</h4>
                <p className="text-xs text-[#5c6b73]">{previewExtracted.hospital_or_lab}</p>
              </div>

              {previewExtracted.values && previewExtracted.values.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#15232b]">Extracted Test Parameters:</div>
                  <div className="border border-[#d9d1c3] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f3efe6] text-[#5c6b73] font-bold">
                        <tr>
                          <th className="p-2.5">Parameter</th>
                          <th className="p-2.5">Value</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Ref Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d9d1c3]">
                        {previewExtracted.values.map((v: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#fbf9f4]">
                            <td className="p-2.5 font-semibold text-[#15232b]">{v.test_name}</td>
                            <td className="p-2.5 font-bold text-[#0f6e6e]">{v.value}</td>
                            <td className="p-2.5 text-[#5c6b73]">{v.unit}</td>
                            <td className="p-2.5 text-[#5c6b73] font-mono">{v.reference_range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {previewExtracted.summary && (
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d1c3] text-xs text-[#15232b] space-y-1">
                  <span className="font-bold text-[#0f6e6e]">Plain-Language AI Summary:</span>
                  <p className="leading-relaxed">{previewExtracted.summary}</p>
                </div>
              )}

              {/* Patient Permission & Storage Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Patient Data & Privacy Permission</div>
                  <p className="text-[0.7rem] text-amber-800 mt-0.5 leading-relaxed">
                    By clicking <strong>&quot;Allow &amp; Save Report to Database&quot;</strong>, you give permission to store this structured report in your private health records. Only you and doctors you explicitly grant consent to will be able to access it.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#d9d1c3] bg-[#fbf9f4] flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewExtracted(null)}
                className="btn btn-ghost text-xs text-[#5c6b73] hover:text-[#15232b]"
              >
                Discard
              </button>
              <button
                onClick={confirmSaveReportWithConsent}
                disabled={isSavingWithConsent}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingWithConsent ? "Saving to Database..." : "Allow & Save Report to Database"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal / Slide-in: Report Details Viewer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#d9d1c3]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#d9d1c3] bg-[#fbf9f4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">{selectedReport.test_name}</h3>
                  <p className="text-xs text-[#5c6b73]">
                    {selectedReport.report_date} · {selectedReport.hospital_or_lab}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl text-[#5c6b73] hover:bg-[#f3efe6] hover:text-[#15232b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Test Values Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#15232b]">
                  Documented Test Values
                </h4>
                <div className="overflow-x-auto border border-[#d9d1c3] rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#f3efe6] text-[#5c6b73] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Test Name</th>
                        <th className="p-3">Measured Value</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d9d1c3]">
                      {selectedReport.values?.map((v) => (
                        <tr key={v.id} className="hover:bg-[#fbf9f4]">
                          <td className="p-3 font-semibold text-[#15232b]">{v.test_name}</td>
                          <td className="p-3 font-bold text-[#0f6e6e] text-sm">{v.value}</td>
                          <td className="p-3 text-[#5c6b73]">{v.unit}</td>
                          <td className="p-3 text-[#5c6b73] font-mono">{v.reference_range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Plain-Language Explanation */}
              <div className="card p-5 bg-[#e4f2f1]/40 border-[#bce2df] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b4f4f]">
                  <Sparkles className="w-4 h-4 text-[#0f6e6e]" />
                  <span>AI Plain-Language Explanation</span>
                </div>
                <p className="text-xs text-[#15232b] leading-relaxed">
                  {selectedReport.explanation?.what_these_tests_measure ||
                    "This test measures key biological markers documented in your report against standard reference intervals."}
                </p>
              </div>

              {/* Action Buttons inside modal */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#d9d1c3]">
                <button
                  onClick={() => {
                    const repName = selectedReport.test_name;
                    setSelectedReport(null);
                    sendMessage(`Explain my ${repName} report in detail and what questions I should ask my doctor.`);
                  }}
                  className="btn btn-primary text-xs flex-1 justify-center"
                >
                  <Bot className="w-3.5 h-3.5 mr-1" />
                  <span>Ask AI Assistant About This Report</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    sendMessage(`Compare my recent reports and show key trend changes.`);
                  }}
                  className="btn btn-ghost text-xs bg-[#f3efe6]"
                >
                  <BarChart2 className="w-3.5 h-3.5 mr-1" />
                  <span>Compare Trends with AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
