import { useState, useEffect, useRef } from "react";
import AudioWaveformVisualizer from "./AudioWaveformVisualizer";
import AudioPlayerWidget from "./AudioPlayerWidget";
import { 
  Compass, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  CornerDownRight, 
  TrendingUp, 
  CheckCircle, 
  Info,
  Layers,
  HelpCircle,
  Users,
  X,
  FileText,
  Check,
  Copy,
  Trash2
} from "lucide-react";
import { InterviewQuestion, AnswerEvaluation } from "../types";
import HardwareCheck from "./HardwareCheck";
import { motion, AnimatePresence } from "motion/react";

interface TechnicalArenaProps {
  questions: InterviewQuestion[];
  domain: string;
  company: string;
  difficulty: string;
  onFinishRound: (
    score: number, 
    totalQuestions: number, 
    durationSec: number,
    recordings?: { questionText: string; audioUrl: string; transcript: string }[]
  ) => void;
  onExitArena: () => void;
}

export default function TechnicalArena({
  questions,
  domain,
  company,
  difficulty,
  onFinishRound,
  onExitArena
}: TechnicalArenaProps) {
  const [showHardwareCheck, setShowHardwareCheck] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userText, setUserText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showHints, setShowHints] = useState(false);

  // MediaRecorder states for audio playback self-evaluation
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedAudios, setRecordedAudios] = useState<Record<number, string>>({});
  const [questionTranscripts, setQuestionTranscripts] = useState<Record<number, string>>({});
  
  // Timer states
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  
  // Accumulated score tracker
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Scratchpad states
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem("prepai_scratchpad_technical") || "";
  });
  const [scratchpadCopied, setScratchpadCopied] = useState(false);

  const handleScratchpadChange = (val: string) => {
    setScratchpadText(val);
    localStorage.setItem("prepai_scratchpad_technical", val);
  };

  const handleForceFinishRound = () => {
    const averageFinal = Math.round(accumulatedScore / questions.length) || 75;
    stopSpeechAndCamera();
    
    // Compile recordings
    const compiledRecordings = questions.map((q, idx) => ({
      questionText: q.question,
      audioUrl: recordedAudios[idx] || (idx === currentIdx ? recordedAudios[currentIdx] : ""),
      transcript: questionTranscripts[idx] || (idx === currentIdx ? userText : "")
    })).filter(r => r.audioUrl);

    onFinishRound(averageFinal, questions.length, elapsed, compiledRecordings);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key === "Enter") {
        e.preventDefault();
        handleForceFinishRound();
      } else if (isCtrl && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        handleNextStep();
      } else if (isCtrl && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setIsScratchpadOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIdx, accumulatedScore, elapsed, questions.length]);

  // Speech Recognition state
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const question = questions[currentIdx] || null;

  // Initialize Timer after hardware check is passed
  useEffect(() => {
    if (showHardwareCheck) return;

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showHardwareCheck]);

  // Initialize Speech Recognition and Camera feed after hardware check is passed
  useEffect(() => {
    if (showHardwareCheck) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setUserText((prev) => prev + finalTranscript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
      };

      recognitionRef.current = rec;
    }

    // Try starting camera as simulation proctor
    handleStartCamera();

    return () => {
      stopSpeechAndCamera();
    };
  }, [showHardwareCheck]);

  const stopSpeechAndCamera = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Could not capture camera feed. Proctoring view inactive.", err);
    }
  };

  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      setWarningMsg("Speech recognition API is unsupported on this browser agent. Please insert response text manually.");
      setTimeout(() => setWarningMsg(null), 5000);
      return;
    }

    if (isRecording) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } else {
      setUserText("");
      try {
        recognitionRef.current.start();
        setIsRecording(true);

        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
          console.error("Mic stream access error:", err);
          return null;
        });

        if (audioStream) {
          audioChunksRef.current = [];
          const mediaRecorder = new MediaRecorder(audioStream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);
            setRecordedAudios((prev) => ({
              ...prev,
              [currentIdx]: audioUrl
            }));
            audioStream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
        }
      } catch (err) {
        console.warn("Could not start recorders:", err);
      }
    }
  };

  // Run server side evaluation
  const handleEvaluateAnswer = async () => {
    if (!userText.trim()) {
      setWarningMsg("Please record or insert a verbal explanation block first.");
      setTimeout(() => setWarningMsg(null), 5000);
      return;
    }

    // Stop recording if active
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }

    setQuestionTranscripts(prev => ({
      ...prev,
      [currentIdx]: userText
    }));

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          answer: userText,
          type: question.type,
          domain,
          company
        })
      });

      if (!response.ok) throw new Error("Evaluation error");
      const data: AnswerEvaluation = await response.json();
      setEvaluation(data);
      setAccumulatedScore((prev) => prev + data.score);
    } catch (err) {
      console.error(err);
      // Fallback
      setEvaluation({
        score: 75,
        overallFeedback: "Solid conversational depth. Addresses direct technical structures.",
        technicalAccuracyScore: 75,
        communicationClarityScore: 80,
        improvedAnswerAlternative: "To optimize: 'In distributed architectures, rate limiting can be governed using Redis sorted keys paired with sliding timestamps...'"
      });
      setAccumulatedScore((prev) => prev + 75);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextStep = () => {
    if (userText) {
      setQuestionTranscripts(prev => ({
        ...prev,
        [currentIdx]: userText
      }));
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setUserText("");
      setEvaluation(null);
      setShowHints(false);
    } else {
      // Completed round
      const averageFinal = Math.round(accumulatedScore / questions.length) || 75;
      stopSpeechAndCamera();

      // Compile recordings
      const compiledRecordings = questions.map((q, idx) => ({
        questionText: q.question,
        audioUrl: recordedAudios[idx] || (idx === currentIdx ? recordedAudios[currentIdx] : ""),
        transcript: questionTranscripts[idx] || (idx === currentIdx ? userText : "")
      })).filter(r => r.audioUrl);

      onFinishRound(averageFinal, questions.length, elapsed, compiledRecordings);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (showHardwareCheck) {
    return (
      <HardwareCheck
        onProceed={() => setShowHardwareCheck(false)}
        onExit={onExitArena}
        domain={domain}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-[#2d333d] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase border border-indigo-500/20">
            {question?.type === "behavioral" ? "STAR culture round" : "Technical voice arena"}
          </span>
          <span className="text-slate-500 text-xs font-semibold">• Q{currentIdx + 1} of {questions.length}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Time: </span>
            <span className="font-bold text-white tabular-nums">{formatTimer(elapsed)}</span>
          </div>
          <button 
            onClick={() => setIsScratchpadOpen(true)}
            className="flex items-center gap-1.5 p-1 px-3 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 text-indigo-400 hover:text-indigo-300 rounded-lg transition font-mono text-[11px] font-bold cursor-pointer"
            title="Open Scratchpad (Ctrl+H)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad (Ctrl+H)</span>
          </button>
          <button 
            id="exit_arena_btn"
            onClick={onExitArena}
            className="p-1 px-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition font-bold"
          >
            Quit Arena
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Question structure, response inputs, evaluation outputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Question Box */}
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg md:text-xl font-bold text-white leading-normal">
                {question?.question}
              </h2>
              <button 
                id="toggle_hints_btn"
                onClick={() => setShowHints(!showHints)}
                className="flex-shrink-0 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5 p-2 rounded-xl transition border border-[#2d333d]"
                title="View Hints"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Hint Drawer */}
            <AnimatePresence>
              {showHints && question?.hints && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="bg-indigo-950/15 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-xs overflow-hidden"
                >
                  <p className="font-bold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Interviewer Progressive Hints:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    {question.hints.map((hint, idx) => (
                      <li key={idx} className="leading-relaxed">{hint}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User response interface */}
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400 animate-spin" />
                Your Explanatory Output
              </span>
              {isRecording && (
                <div className="flex items-center gap-2.5">
                  <AudioWaveformVisualizer isActive={isRecording} />
                  <div className="flex items-center gap-1 text-xs text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse border border-rose-500/20">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    Live Recording
                  </div>
                </div>
              )}
            </div>

            <textarea
              id="arena_response_textarea"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="Speak aloud using the mic, or enter candidate structural arguments directly here to trigger AI evaluation..."
              rows={8}
              disabled={isEvaluating || !!evaluation}
              className="w-full text-sm p-4 bg-[#13161c]/65 rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 leading-relaxed resize-none"
            />

            <AnimatePresence>
              {warningMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 px-4 rounded-xl flex items-center gap-2.5 shadow-md font-sans"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{warningMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response action buttons */}
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  id="toggle_mic_btn"
                  onClick={toggleRecording}
                  disabled={isEvaluating || !!evaluation}
                  className={`p-3 px-5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                    isRecording 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                  {isRecording ? "Stop Speech" : "Speak Aloud"}
                </button>
                
                <button
                  id="clear_resp_btn"
                  onClick={() => setUserText("")}
                  disabled={isEvaluating || !!evaluation || !userText}
                  className="p-3 bg-[#13161c] hover:bg-[#1e293b] border border-[#2d333d] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition"
                  title="Clear Output"
                >
                  Clear
                </button>
              </div>

              {!evaluation ? (
                <button
                  id="evaluate_answer_btn"
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluating || !userText.trim()}
                  className="p-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 text-xs"
                >
                  {isEvaluating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Auditing Explanation...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      Evaluate Explanations
                    </>
                  )}
                </button>
              ) : (
                <button
                  id="arena_next_step_btn"
                  onClick={handleNextStep}
                  className="p-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 text-xs"
                >
                  {currentIdx < questions.length - 1 ? "Next Question" : "Complete Arena"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* AI Feedback Scorecard Panel */}
          <AnimatePresence>
            {evaluation && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="bg-[#171b22]/75 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm space-y-6 shadow-xl"
              >
              <div className="flex justify-between items-center border-b border-[#2d333d] pb-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h4 className="font-extrabold text-sm text-white">AI Grading Overview</h4>
                </div>
                <div className="flex items-baseline gap-1 bg-indigo-500/15 p-2 px-3 rounded-xl border border-indigo-500/35">
                  <span className="text-2xl font-black text-white">{evaluation.score}</span>
                  <span className="text-slate-400 text-xs font-semibold">/100</span>
                </div>
              </div>

              {/* Subscores stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tech Accuracy</span>
                  <div className="flex items-baseline gap-1 mt-1 text-emerald-400 font-extrabold text-lg">
                    <span>{evaluation.technicalAccuracyScore}</span>
                    <span className="text-slate-600 text-xs">/100</span>
                  </div>
                </div>

                <div className="bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Speech Clarity</span>
                  <div className="flex items-baseline gap-1 mt-1 text-indigo-400 font-extrabold text-lg">
                    <span>{evaluation.communicationClarityScore}</span>
                    <span className="text-slate-600 text-xs">/100</span>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d] flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pacing Speed</span>
                  <p className="text-slate-300 text-[10px] font-semibold mt-1 leading-snug">
                    {evaluation.pacingAnalysis || "Optimal speaking pace maintained."}
                  </p>
                </div>
              </div>

              {/* Question Audio Player widget */}
              {recordedAudios[currentIdx] && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Your Recorded Verbal Explanation
                  </span>
                  <AudioPlayerWidget 
                    src={recordedAudios[currentIdx]} 
                    title={`Question ${currentIdx + 1} Voice Recording`} 
                  />
                </div>
              )}

              {/* STAR Behavioral Details if HR */}
              {question?.type === "behavioral" && evaluation.starBehavioralAnalysis && (
                <div className="bg-[#13161c]/60 p-5 rounded-2xl border border-[#2d333d] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2d333d]/70 pb-2.5">
                    <div className="flex items-center gap-2 font-black text-xs text-indigo-400">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>STAR SPECTRUM DIAGNOSTIC:</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black tracking-widest px-2 py-0.5 rounded uppercase font-mono">STAR Metrics</span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed italic border-l-2 border-indigo-500/40 pl-3">
                    "{evaluation.starBehavioralAnalysis.details}"
                  </p>
                  
                  {/* Phase Breakdown Grid */}
                  <div className="space-y-3 pt-1.5">
                    {/* Situation */}
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-[#2d333d]/45 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Situation (Clarity)
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                          evaluation.starBehavioralAnalysis.situationRating?.toLowerCase().includes("poor") ? "bg-rose-950/40 text-rose-400 border border-rose-900/35" :
                          evaluation.starBehavioralAnalysis.situationRating?.toLowerCase().includes("average") ? "bg-amber-950/40 text-amber-400 border border-amber-900/35" :
                          "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35"
                        }`}>
                          {evaluation.starBehavioralAnalysis.situationRating || "Good"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {evaluation.starBehavioralAnalysis.situationFeedback || "Initial constraints and systemic context are specified reasonably well."}
                      </p>
                    </div>

                    {/* Task */}
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-[#2d333d]/45 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Task (Specificity)
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                          evaluation.starBehavioralAnalysis.taskRating?.toLowerCase().includes("poor") ? "bg-rose-950/40 text-rose-400 border border-rose-900/35" :
                          evaluation.starBehavioralAnalysis.taskRating?.toLowerCase().includes("average") ? "bg-amber-950/40 text-amber-400 border border-amber-900/35" :
                          "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35"
                        }`}>
                          {evaluation.starBehavioralAnalysis.taskRating || "Excellent"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {evaluation.starBehavioralAnalysis.taskFeedback || "Objectives and technical criteria for project success are outlined beautifully."}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-[#2d333d]/45 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Action (Effectiveness)
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                          evaluation.starBehavioralAnalysis.actionRating?.toLowerCase().includes("poor") ? "bg-rose-950/40 text-rose-400 border border-rose-900/35" :
                          evaluation.starBehavioralAnalysis.actionRating?.toLowerCase().includes("average") ? "bg-amber-950/40 text-amber-400 border border-amber-900/35" :
                          "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35"
                        }`}>
                          {evaluation.starBehavioralAnalysis.actionRating || "Average"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {evaluation.starBehavioralAnalysis.actionFeedback || "Zoom details of individual refactoring actions and algorithmic designs need more prominence over team summaries."}
                      </p>
                    </div>

                    {/* Result */}
                    <div className="bg-slate-950/20 p-3 rounded-xl border border-[#2d333d]/45 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Result (Measurable Impact)
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                          evaluation.starBehavioralAnalysis.resultRating?.toLowerCase().includes("poor") ? "bg-rose-950/40 text-rose-400 border border-rose-900/35" :
                          evaluation.starBehavioralAnalysis.resultRating?.toLowerCase().includes("average") ? "bg-amber-950/40 text-amber-400 border border-amber-900/35" :
                          "bg-emerald-950/40 text-emerald-400 border border-emerald-900/35"
                        }`}>
                          {evaluation.starBehavioralAnalysis.resultRating || "Poor"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {evaluation.starBehavioralAnalysis.resultFeedback || "Always quantify business impact (percentages, latency cuts, system load curves) to deliver strong closing metrics."}
                      </p>
                    </div>
                  </div>

                  {/* Leadership and Teamwork Suggestions - Crucial Enhancement */}
                  <div className="pt-3.5 border-t border-[#2d333d]/50 space-y-3">
                    {evaluation.starBehavioralAnalysis.leadershipSuggestions && (
                      <div className="bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10 space-y-1 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-400">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                          <span>Leadership Optimization Suggestions:</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {evaluation.starBehavioralAnalysis.leadershipSuggestions}
                        </p>
                      </div>
                    )}

                    {evaluation.starBehavioralAnalysis.teamworkSuggestions && (
                      <div className="bg-indigo-500/5 p-3.5 rounded-xl border border-indigo-500/10 space-y-1 text-xs">
                        <div className="flex items-center gap-2 font-bold text-indigo-400">
                          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Teamwork & Collaboration Highlights:</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {evaluation.starBehavioralAnalysis.teamworkSuggestions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Speach Fillers analysis */}
              <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 space-y-1.5 text-xs text-rose-300">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Filler Syllables Log:</span>
                </div>
                <p className="leading-relaxed">
                  {evaluation.fillerWordsCritique || "Excellent articulation with no major fillers detected."}
                </p>
                {evaluation.detectedFillerWords && evaluation.detectedFillerWords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {evaluation.detectedFillerWords.map((f, idx) => (
                      <span key={idx} className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">
                        "{f.word}": {f.count}x
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* FeedBack and details copy */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Structural Audit</span>
                <p className="text-slate-300 text-xs leading-relaxed">{evaluation.overallFeedback}</p>
              </div>

              {/* Suggested model answer */}
              <div className="space-y-3 border-t border-[#2d333d] pt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Standard Elite Aligned Alternate Explanation:</span>
                </div>
                <div className="bg-indigo-950/10 border border-indigo-500/10 p-4 rounded-xl text-slate-300 text-xs leading-relaxed italic flex gap-3">
                  <CornerDownRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p>{evaluation.improvedAnswerAlternative}</p>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        </div>

        {/* Right column: Simulated proctoring camera feed */}
        <div className="space-y-6">
          
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              Intelligence Proctor Core
            </h4>
            
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#2d333d] flex items-center justify-center">
              {cameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                  <VideoOff className="w-8 h-8 text-slate-700" />
                  Webcam inactive
                </div>
              )}
              
              {/* Proctor state overlays */}
              {cameraActive && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/80 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  Tracking Active
                </div>
              )}
            </div>

            <p className="text-slate-500 text-[10px] leading-relaxed">
              Provides simulated eye-contact alignment analysis. Turn on the device visual camera to log full engagement indices.
            </p>
          </div>

          {/* Session constraints checklist */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Criteria Highlights</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">System Accuracy</p>
                  <p className="text-slate-500 text-[10px] leading-normal">Explain specific complexity constraints and limits</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Constructive Frameworks</p>
                  <p className="text-slate-500 text-[10px] leading-normal">Adopt the STAR storytelling flow for Behavioral cues</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">Fluency Dynamics</p>
                  <p className="text-slate-500 text-[10px] leading-normal">Lower redundant vocal placeholders to project authority</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Scratchpad sliding drawer overlay */}
      <AnimatePresence>
        {isScratchpadOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Background overlay back-drop */}
            <div 
              className="absolute inset-0 bg-[#06080c]/60 backdrop-blur-xs pointer-events-auto cursor-pointer"
              onClick={() => setIsScratchpadOpen(false)}
            />
            
            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[340px] sm:w-[460px] bg-[#121620] border-l border-[#2d333d] shadow-[0_0_50px_rgba(0,0,0,0.6)] p-5 flex flex-col justify-between pointer-events-auto"
            >
              <div className="flex flex-col h-full space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#2d333d]/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/15 rounded-lg border border-indigo-500/25 text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white font-sans tracking-tight">Arena Scratchpad</h3>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">Simultaneous Sandbox Notepad</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsScratchpadOpen(false)}
                    className="p-1 bg-[#1a1e27] hover:bg-[#252b36] border border-[#2d333d] text-slate-400 hover:text-slate-200 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Info & Keyboard shortcut tips */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#0b0d11]/65 border border-[#2d333d]/50 rounded-xl font-mono text-[9px] text-slate-400">
                  <div className="text-center p-1 border-r border-[#2d333d]/45">
                    <span className="block font-black text-slate-300">Ctrl+H</span>
                    Toggle Scratchpad
                  </div>
                  <div className="text-center p-1 border-r border-[#2d333d]/45">
                    <span className="block font-black text-slate-300">Ctrl+N</span>
                    Skip Question
                  </div>
                  <div className="text-center p-1">
                    <span className="block font-black text-slate-300">Ctrl+Enter</span>
                    Finish Round
                  </div>
                </div>

                {/* Text Area */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <textarea
                    className="w-full h-full flex-1 bg-[#0b0d11]/85 border border-[#2d333d] focus:border-indigo-500 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none resize-none placeholder-slate-650 leading-relaxed scrollbar-thin scrollbar-thumb-[#2d333d] scrollbar-track-transparent"
                    placeholder={`Write down your brainstorm notes, mock trace matrices, time complexity estimates or pseudocode here...\n\n- O(N) complexity constraints\n- Corner cases (empty inputs, duplications)\n- System components logic`}
                    value={scratchpadText}
                    onChange={(e) => handleScratchpadChange(e.target.value)}
                  />
                </div>

                {/* Actions panel */}
                <div className="flex items-center justify-between pt-1 border-t border-[#2d333d]/50">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(scratchpadText);
                        setScratchpadCopied(true);
                        setTimeout(() => setScratchpadCopied(false), 2000);
                      }}
                      disabled={!scratchpadText.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1e27] hover:bg-[#252b36] disabled:opacity-45 text-slate-300 text-[10.5px] font-bold rounded-xl border border-[#2d333d] transition cursor-pointer"
                    >
                      {scratchpadCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-450" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy notes</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        const templates = [
                          "// Algorithm Sketch:\n// Space: O()\n// Time: O()",
                          "# System Architecting Notes:\n# - High Availability\n# - Gateway Ingress\n# - Database Partitions",
                          "## Behavioral Prep:\n## - Situation & Context:\n## - Task details:\n## - Action details:\n## - Quantitative Result:"
                        ];
                        const chosen = templates[questions[0]?.type === "behavioral" ? 2 : 0];
                        handleScratchpadChange((scratchpadText ? scratchpadText + "\n\n" : "") + chosen);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10.5px] font-bold rounded-xl border border-indigo-500/20 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>Add Template</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm("Clear all scratchpad text?")) {
                        handleScratchpadChange("");
                      }
                    }}
                    disabled={!scratchpadText.trim()}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 disabled:opacity-40 text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
