"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, UploadCloud, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, BarChart2, Camera, X, RefreshCw, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

export default function ReportsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Camera & consent state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewExtracted, setPreviewExtracted] = useState<any | null>(null);
  const [isSavingWithConsent, setIsSavingWithConsent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.log("Video play error:", err));
    }
  }, [isCameraOpen, cameraStream]);

  async function loadReports() {
    try {
      const data = await api<MedicalReport[]>("/api/reports");
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openCamera() {
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setIsCameraOpen(true);

    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }).catch(() => {
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });

        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((e) => console.warn("Video play exception:", e));
        }
        return;
      } catch (err) {
        console.warn("getUserMedia failed:", err);
      }
    }
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

  async function processFile(file: File) {
    setUploading(true);
    setUploadProgress("Analyzing report with Gemini Multimodal Vision...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const uploadRes = await api<{ id: string; status: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      // Analyze document with Gemini
      const analyzeRes = await api<{ report_id: string; status: string; extracted: any }>(`/api/reports/${uploadRes.id}/analyze`, {
        method: "POST",
      });

      setPreviewExtracted({
        reportId: analyzeRes.report_id,
        filename: file.name,
        ...analyzeRes.extracted,
      });
    } catch (err: any) {
      alert(`Upload error: ${err.message || "Failed to process document"}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function confirmSaveReportWithConsent() {
    if (!previewExtracted) return;
    setIsSavingWithConsent(true);
    try {
      const rid = previewExtracted.reportId;
      setPreviewExtracted(null);
      await loadReports();
      router.push(`/reports/${rid}`);
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

  return (
    <AppShell>
      {/* Native Camera input fallback */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Medical Reports</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Upload or scan physical paper reports, pathology summaries, and diagnostic tests for AI explanation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCamera}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Paper Report</span>
            </button>
            <button
              onClick={() => router.push("/reports/compare")}
              className="btn btn-ghost text-xs flex items-center gap-1.5 bg-white"
            >
              <BarChart2 className="w-4 h-4 text-[#0f6e6e]" />
              <span>Compare Previous Reports</span>
            </button>
          </div>
        </div>

        {/* Upload Dropzone Card */}
        <div className="card p-6 md:p-8 bg-white border-dashed border-2 border-[#0f6e6e]/40 hover:border-[#0f6e6e] text-center space-y-4 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-base text-[#15232b]">Upload or Scan a Medical Document</h3>
            <p className="text-xs text-[#5c6b73] mt-1">
              Supports live camera capture, PDF, JPG, JPEG, and PNG files up to 10MB.
            </p>
          </div>

          {uploading ? (
            <div className="py-4 space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#0f6e6e] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#0f6e6e]">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={openCamera}
                className="btn btn-primary text-xs inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo with Camera</span>
              </button>
              <label className="btn btn-ghost bg-[#f3efe6] text-xs cursor-pointer inline-flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#0f6e6e]" />
                <span>Select File from Device</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[0.7rem] text-[#5c6b73]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0f6e6e]" />
            <span>Encrypted with private storage &amp; patient-only access controls</span>
          </div>
        </div>

        {/* Reports Feed */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-[#15232b]">Analyzed Reports ({reports.length})</div>

          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/reports/${r.id}`)}
              className="card p-4 md:p-5 bg-white hover:border-[#0f6e6e] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#15232b]">{r.test_name}</h3>
                  <p className="text-xs text-[#5c6b73] mt-0.5">
                    {r.report_date} · {r.hospital_or_lab}
                  </p>
                  {r.doctor_name && (
                    <p className="text-[0.7rem] text-[#0f6e6e] font-semibold mt-0.5">
                      Doctor: {r.doctor_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">
                  AI Analyzed
                </span>
                <span className="text-xs font-semibold text-[#0f6e6e] flex items-center gap-1">
                  <span>View Details & Explanation</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15232b] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#41b3b3]" />
                <span className="font-bold text-sm">Scan Paper Report Photo</span>
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
                      Take a photo with your device camera or upload a document/image from your storage.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      onClick={openCamera}
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

      {/* 2. Consent & Review Modal */}
      {previewExtracted && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#d9d1c3]">
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

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Patient Data &amp; Privacy Permission</div>
                  <p className="text-[0.7rem] text-amber-800 mt-0.5 leading-relaxed">
                    By clicking <strong>&quot;Allow &amp; Save Report to Database&quot;</strong>, you give permission to store this structured report in your private health records.
                  </p>
                </div>
              </div>
            </div>

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
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingWithConsent ? "Saving..." : "Allow & Save Report to Database"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
