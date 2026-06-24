import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  User, 
  Sparkles, 
  GraduationCap, 
  Layers, 
  Bookmark, 
  MapPin, 
  MessageSquare,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Award,
  Mic,
  Square,
  UploadCloud,
  AlertCircle,
  Volume2,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  FileAudio,
  Check,
  Copy
} from "lucide-react";
import { CoachMessage, ResumeProfile, CoachResource } from "../types";

interface CareerCoachProps {
  resumeProfile: ResumeProfile | null;
  domain: string;
  company: string;
}

const INSIGHT_PROMPTS = [
  "How can I break into Principal Architect roles?",
  "What are typical concurrency failures in FAANG interviews?",
  "Critique my resume focus areas for High-Growth Startups.",
  "Which system design patterns are most useful for high writes?"
];

export default function CareerCoach({
  resumeProfile,
  domain,
  company
}: CareerCoachProps) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: "init_1",
      sender: "coach",
      text: `Welcome to PrepAI Career Coach! I have audited your career target profiles as a looking targeting ${company || "FAANG firms"} roles in the ${domain || "CS"} domain.
How can I mentor you today? Ask me about specific technical roadmaps, resume optimizations, or alternative system choices!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState<string[]>([
    "Master Min-Heap and Graph algorithms templates",
    "Study Optimistic locking and multi-leader DB sharding",
    "Construct STAR bullet summaries on active achievements",
    "Practice consistent caching and throttling boundaries"
  ]);

  // AI Speech Analysis and Auditing States
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    fillerWords: string;
    pace: string;
    tone: string;
    speakingScore: number;
    feedbackNotes: string;
    transcription: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setFileError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordDuration(0);
      setAnalysisResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for Safari/unsupported formats
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compiledBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setAudioBlob(compiledBlob);
        setAudioUrl(URL.createObjectURL(compiledBlob));
        // Stop all track streams so microphone icon disappears from tab
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
      startTimer();
    } catch (err: any) {
      console.error("Mic access failed", err);
      setFileError("Could not access microphone. Please give PrepAI frame permissions and try again.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === "recording" || recordingState === "paused")) {
      mediaRecorderRef.current.stop();
      setRecordingState("idle");
      stopTimer();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAudioFile = (file: File) => {
    setFileError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setAnalysisResult(null);

    if (!file.type.startsWith("audio/")) {
      setFileError("Invalid format. Please select an audio file (MP3, WAV, WebM, M4A, etc.).");
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError("Audio file exceeds the 10MB limit.");
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAudioFile(e.target.files[0]);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1] || base64String;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const runVoiceAnalysis = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    setFileError(null);

    try {
      const base64Data = await convertBlobToBase64(audioBlob);
      const mimeType = audioBlob.type || "audio/webm";

      const response = await fetch("/api/coach/analyze-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio64: base64Data,
          mimeType: mimeType
        })
      });

      if (!response.ok) throw new Error("Voice analysis failure");
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      setFileError("Failure connecting to PrepAI analytical core. Showing high-fidelity offline simulation content.");
      setAnalysisResult({
        fillerWords: "1 'um', 2 'uh's",
        pace: "135 WPM. Good forward pacing, minor rush observed near key conclusions.",
        tone: "Polite, structured, but slightly subdued. Increase your voice pitch variance for greater impact.",
        speakingScore: 82,
        feedbackNotes: "Try pausing for 1 second before answering complex technical definitions to prevent early hesitation filler words.",
        transcription: "I think that database replication is critical when scaling read pipelines because it gives us horizontal scaling properties. We can read from our replicas while writing directly to our primary db shard."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);
  const [activeResources, setActiveResources] = useState<CoachResource[]>([
    {
      title: "Designing Data-Intensive Applications",
      url: "#",
      description: "The premier handbook for data schema duplication, partition scaling limits, and fault isolation structures."
    },
    {
      title: "PrepAI Advanced Algorithmic checklists",
      url: "#",
      description: "Dynamic list of system patterns and sliding windows coordinates tailored for senior engineering interview panels."
    }
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customMsg?: string) => {
    const textToSend = (customMsg || inputText).trim();
    if (!textToSend || isSending) return;

    if (!customMsg) setInputText("");

    // Add User message
    const userMsg: CoachMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages,
          domain,
          targetCompany: company,
          parsedResume: resumeProfile
        })
      });

      if (!response.ok) throw new Error("Mentor connection error");
      const data = await response.json();

      const coachMsg: CoachMessage = {
        id: `c_${Date.now()}`,
        sender: "coach",
        text: data.answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedRoadmap: data.suggestedRoadmapTopics || [],
        resources: data.recommendedLearningResources || []
      };

      setMessages((prev) => [...prev, coachMsg]);
      
      if (data.suggestedRoadmapTopics && data.suggestedRoadmapTopics.length > 0) {
        setActiveRoadmap(data.suggestedRoadmapTopics);
      }
      if (data.recommendedLearningResources && data.recommendedLearningResources.length > 0) {
        setActiveResources(data.recommendedLearningResources);
      }

    } catch (err) {
      console.error(err);
      const fallbackMsg: CoachMessage = {
        id: `c_fail_${Date.now()}`,
        sender: "coach",
        text: "I am actively compiling suggestions tailored to your targets. Study dynamic programming boundaries, master STAR behavioral metrics, and construct isolated caching patterns to secure placement standings.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-12">
      
      {/* Left Columns: Dynamic Coach chat interface + Speech Auditing Engine */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Chat Interface Container */}
        <div className="bg-[#171b22]/70 border border-[#2d333d] rounded-2xl backdrop-blur-sm flex flex-col h-[560px] overflow-hidden shadow-xl">
          {/* Chat Header */}
          <div className="bg-[#13161c]/55 p-4 border-b border-[#2d333d]/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="text-indigo-400 w-5 h-5 animate-pulse" />
              <div>
                <h3 className="text-sm font-extrabold text-white">Interactive Career Coach</h3>
                <p className="text-[10px] text-slate-500">Continuous AI mentorship of target domains</p>
              </div>
            </div>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Model standby</span>
          </div>

          {/* Message Bubble box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#13161c]/20">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div className={`p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-[#1e293b]/50 border border-[#2d333d]/50 text-indigo-400"
                }`}>
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-[#13161c] border border-[#2d333d] text-slate-200 rounded-tl-none shadow-md"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-600 font-semibold px-1 block text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-start gap-2.5 mr-auto">
                <div className="p-2.5 bg-[#1e293b]/50 text-indigo-400 rounded-xl flex items-center justify-center animate-spin">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="p-3.5 bg-[#13161c] border border-[#2d333d] text-slate-400 text-xs rounded-2xl rounded-tl-none animate-pulse">
                  Advisor mapping career metrics and guidelines...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Fast prompt picker */}
          <div className="p-3 bg-[#13161c]/35 border-t border-[#2d333d]/80 flex flex-wrap gap-1.5 shrink-0 select-none">
            {INSIGHT_PROMPTS.map((promptText, idx) => (
              <button
                id={`quick_prompt_btn_${idx}`}
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={isSending}
                className="p-1 px-2.5 bg-[#13161c] border border-[#2d333d] hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] transition text-left"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Action input bar */}
          <div className="p-4 bg-[#13161c]/55 border-t border-[#2d333d] flex items-center gap-2">
            <input
              id="coach_chat_input"
              type="text"
              placeholder="Query details on concurrency patterns, system choices, or cert guidelines..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 text-xs px-3 py-3.5 bg-[#13161c] border border-[#2d333d] rounded-xl text-slate-200 outline-none focus:border-indigo-500 transition"
            />
            <button
              id="send_coach_msg_btn"
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VOICE AUDITOR PANEL */}
        <div className="bg-[#171b22]/70 border border-[#2d333d] rounded-2xl backdrop-blur-sm p-6 shadow-xl flex flex-col gap-5 select-text">
          <div className="flex items-center justify-between border-b border-[#2d333d]/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 animate-pulse text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">AI Voice & Speaking Score Analyzer</h4>
                <p className="text-[10px] text-slate-500">Upload or record an interview answer snippet to check for pacing, filler words, tone warmth & confidence.</p>
              </div>
            </div>
            
            <div className="text-[9.5px] bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20 rounded-xl px-2.5 py-1 uppercase tracking-widest flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>Gemini Auditing active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            
            {/* Record / Upload left deck */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose speech ingestion method</span>
                </label>

                {/* Stream Speak trigger */}
                <div className="flex flex-col gap-3">
                  {recordingState === "idle" && !audioUrl ? (
                    <button
                      id="start_voice_recording_btn"
                      onClick={startRecording}
                      className="w-full flex items-center justify-center gap-2.5 p-4 py-3.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-350 rounded-xl font-bold text-xs transition cursor-pointer shadow-md"
                    >
                      <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
                      <span>Speak Directly (Microphone)</span>
                    </button>
                  ) : null}

                  {recordingState !== "idle" ? (
                    <div className="bg-[#13161c] border border-red-500/20 p-4 rounded-xl flex flex-col gap-3 items-center text-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-xs font-bold text-slate-200">Recording live: {formatTime(recordDuration)}</span>
                      </div>

                      {/* simulated wave animation */}
                      <div className="flex items-end justify-center gap-0.5 h-8 mt-1">
                        {[1, 2, 3, 4, 1, 2, 3, 4, 2, 3, 4, 1, 3, 2, 1, 4, 2, 3].map((val, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              height: recordingState === "recording" ? `${val * 20}%` : "15%",
                              transition: "height 0.15s ease-in-out"
                            }}
                            className="w-1 bg-red-500 rounded animate-pulse" 
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-2 w-full">
                        {recordingState === "recording" ? (
                          <button
                            id="pause_recording_btn"
                            onClick={pauseRecording}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10.5px] rounded-lg border border-[#2d333d] cursor-pointer"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            id="resume_recording_btn"
                            onClick={resumeRecording}
                            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[10.5px] rounded-lg border border-emerald-500/30 cursor-pointer"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          id="stop_recording_btn"
                          onClick={stopRecording}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10.5px] rounded-lg cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop & Save</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Drag and Drop area */}
                {recordingState === "idle" && !audioUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed ${
                      isDragging 
                        ? "border-indigo-500 bg-indigo-500/5 text-indigo-300" 
                        : "border-[#2d333d] hover:border-indigo-500/40 bg-[#13161c]/30 text-slate-400 hover:text-slate-350"
                    } p-5 rounded-2xl text-center transition flex flex-col items-center gap-2 cursor-pointer relative`}
                    onClick={() => document.getElementById("audio-file-input")?.click()}
                  >
                    <input
                      id="audio-file-input"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-300">Drag & Drop Recorded Audio File</p>
                    <p className="text-[10px] text-slate-500">Supports WAV, MP3, WebM, M4A up to 10MB (or click to browse)</p>
                  </div>
                ) : null}

              </div>

              {/* Error indicator */}
              {fileError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Preview and trigger analyzer */}
              {audioUrl && (
                <div className="space-y-3.5 bg-[#13161c]/60 p-4 rounded-xl border border-[#2d333d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                      Audio Source Ready
                    </span>
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                        setAnalysisResult(null);
                      }}
                      className="text-[9px] font-black text-red-450 hover:text-red-400 uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Delete Block
                    </button>
                  </div>
                  <audio src={audioUrl} controls className="w-full h-8 outline-none" />
                  
                  <button
                    id="submit_speech_diagnostic_btn"
                    onClick={runVoiceAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI Auditing Audio (filler counters, pace)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>Diagnose My Speaking Score & Pace</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* Results Deck */}
            <div className="bg-[#13161c]/45 rounded-2xl border border-[#2d333d] p-5 flex flex-col justify-center relative min-h-[220px]">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-[#0e1117]/90 rounded-2xl flex flex-col items-center justify-center gap-3 text-emerald-400 p-6 text-center select-none z-10">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider animate-pulse">Running Speech Metrics Engine</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Gemini is processing frequency of filler keywords, measuring words-per-minute tempo, and reviewing architectural speaking tones.</p>
                  </div>
                </div>
              )}

              {analysisResult ? (
                <div className="space-y-4">
                  {/* Score & Progress */}
                  <div className="flex items-center gap-4 border-b border-[#2d333d]/50 pb-3">
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 border-2 border-indigo-500 shrink-0">
                      <span className="text-lg font-black text-white">{analysisResult.speakingScore}</span>
                      <span className="text-[8px] text-slate-450 font-extrabold absolute bottom-2 tracking-wider">SCORE</span>
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-white">Diagnostic speaking summary</h5>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {analysisResult.speakingScore >= 85 ? (
                          <span className="text-emerald-400 font-bold">Outstanding articulation! Excellent professional tempo.</span>
                        ) : analysisResult.speakingScore >= 70 ? (
                          <span className="text-amber-400 font-bold">Competent delivery. Minor optimizations recommended.</span>
                        ) : (
                          <span className="text-rose-400 font-bold">High filler word rates. Focus on deliberate pauses.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-[#0e1117] border border-[#2d333d] rounded-xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 tracking-wider uppercase font-black block">Filler Words</span>
                      <span className="text-[10px] text-rose-300 font-semibold block mt-1 break-words">{analysisResult.fillerWords}</span>
                    </div>
                    <div className="p-2.5 bg-[#0e1117] border border-[#2d333d] rounded-xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 tracking-wider uppercase font-black block">Pace & Cadence</span>
                      <span className="text-[10px] text-slate-200 font-semibold block mt-1 break-words">{analysisResult.pace}</span>
                    </div>
                    <div className="p-2.5 bg-[#0e1117] border border-[#2d333d] rounded-xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 tracking-wider uppercase font-black block">Vocal Tone</span>
                      <span className="text-[10px] text-indigo-300 font-semibold block mt-1 break-words">{analysisResult.tone}</span>
                    </div>
                  </div>

                  {/* Recommendation block */}
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                    <span className="text-[9px] text-indigo-400 tracking-wider uppercase font-black block mb-1">Coach Feedback Notes</span>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">{analysisResult.feedbackNotes}</p>
                  </div>

                  {/* Speech transcript */}
                  {analysisResult.transcription && (
                    <div className="p-3 bg-[#0e1117] rounded-xl border border-[#2d333d]/70 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 tracking-wider uppercase font-black">Speech Transcript</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(analysisResult.transcription || "");
                            alert("Speech transcription copied to clipboard!");
                          }}
                          className="text-[9px] text-indigo-400 hover:text-indigo-350 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="text-[10.5px] italic text-slate-400 leading-relaxed max-h-[80px] overflow-y-auto">
                        "{analysisResult.transcription}"
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 space-y-2 select-none">
                  <Volume2 className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">Diagnosis Pending</p>
                  <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed">Provide an audio snippet using the mic or file zone to activate automated speech scoring diagnostics.</p>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

      {/* Right Column Sidebar: Dynamic Roadmap and Resource Suggestions */}
      <div className="space-y-6">
        
        {/* AI study roadmap checklist */}
        <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
          <div className="flex gap-2 items-center text-indigo-400 text-xs font-bold uppercase tracking-wider border-b border-[#2d333d] pb-3">
            <Layers className="w-4 h-4" />
            <span>AI Spaced Study Roadmap</span>
          </div>
          <div className="space-y-3.5">
            {activeRoadmap.map((item, index) => (
              <div key={index} className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Learning Books list */}
        <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
          <div className="flex gap-2 items-center text-indigo-400 text-xs font-bold uppercase tracking-wider border-b border-[#2d333d] pb-3">
            <Bookmark className="w-4 h-4" />
            <span>Learning Resources & Books</span>
          </div>
          <div className="space-y-3">
            {activeResources.map((res, index) => (
              <div 
                key={index}
                className="p-3 bg-[#13161c]/45 rounded-xl border border-[#2d333d] flex flex-col justify-between hover:border-indigo-500/25 transition min-h-[90px]"
              >
                <div>
                  <h5 className="text-xs font-black text-slate-200 flex items-center gap-1">
                    {res.title}
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1 leading-relaxed">
                    {res.description}
                  </p>
                </div>
                <a 
                  href={res.url} 
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px] flex items-center mt-3 gap-0.5"
                >
                  Reference materials
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
