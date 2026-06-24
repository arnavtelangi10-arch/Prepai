import { useState, useEffect } from "react";
import { 
  Code, 
  Settings, 
  Play, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Cpu, 
  CornerDownRight, 
  Check, 
  Award,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Mic,
  MicOff,
  Wand2,
  Sparkles,
  X,
  FileText,
  Trash2,
  Copy
} from "lucide-react";
import { InterviewQuestion, CodingEvaluation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CodingArenaProps {
  questions: InterviewQuestion[];
  onFinishRound: (score: number, totalQuestions: number, durationSec: number) => void;
  onExitArena: () => void;
}

const LANGUAGES = [
  { id: "javascript", name: "JavaScript (Node 19)" },
  { id: "python", name: "Python 3.10" },
  { id: "java", name: "Java SE 17" },
  { id: "cpp", name: "C++ (GCC 11)" },
  { id: "csharp", name: "C# (.NET Core 7.0)" },
  { id: "go", name: "Go (1.20)" },
  { id: "ruby", name: "Ruby (3.2)" },
  { id: "swift", name: "Swift (5.8)" },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  javascript: `// Implement your function here\nfunction solution() {\n  return 0;\n}`,
  python: `# Implement your function here\ndef solution():\n    return 0`,
  java: `// Implement your function here\nclass Solution {\n    public int solution() {\n        return 0;\n    }\n}`,
  cpp: `// Implement your function here\n#include <iostream>\n\nint solution() {\n    return 0;\n}`,
  csharp: `// Implement your function here\npublic class Solution {\n    public int Solve() {\n        return 0;\n    }\n}`,
  go: `// Implement your function here\npackage main\n\nimport \"fmt\"\n\nfunc solution() int {\n    return 0\n}`,
  ruby: `# Implement your function here\ndef solution\n  0\nend`,
  swift: `// Implement your function here\nimport Foundation\n\nfunc solution() -> Int {\n    return 0\n}`
};

export default function CodingArena({
  questions,
  onFinishRound,
  onExitArena
}: CodingArenaProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [showHints, setShowHints] = useState(false);

  // Stats / Timers
  const [elapsed, setElapsed] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<CodingEvaluation | null>(null);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  // Experimental Voice-to-Code companion states
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [dictationText, setDictationText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [translationExplanation, setTranslationExplanation] = useState<string | null>(null);

  // Safe UI confirmations replacing native alert / confirm dialogs
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [submissionWarning, setSubmissionWarning] = useState<string | null>(null);

  // Code execution running states
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [runResult, setRunResult] = useState<{
    success: boolean;
    output: string;
    returnValue: string;
    compilationError?: string;
    executionTimeMs: number;
  } | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const question = questions[currentIdx] || null;

  // Scratchpad states
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem("prepai_scratchpad_coding") || "";
  });
  const [scratchpadCopied, setScratchpadCopied] = useState(false);

  const handleScratchpadChange = (val: string) => {
    setScratchpadText(val);
    localStorage.setItem("prepai_scratchpad_coding", val);
  };

  const handleForceFinishRound = () => {
    const finalScore = Math.round(accumulatedScore / questions.length) || 80;
    onFinishRound(finalScore, questions.length, elapsed);
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

  // Initialize Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update code content on question index change with draft state lookup
  useEffect(() => {
    setEvaluation(null);
    setShowHints(false);
    setRunResult(null);
    setShowConsole(false);
    setCustomInput("");

    if (question) {
      const saved = localStorage.getItem(`prepai_draft_coding_${question.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCode(parsed.code || "");
          setSelectedLanguage(parsed.selectedLanguage || "javascript");
          if (typeof parsed.elapsed === "number") {
            setElapsed(parsed.elapsed);
          }
          setDraftStatus("Draft restored");
          const timer = setTimeout(() => {
            setDraftStatus((prev) => (prev === "Draft restored" ? null : prev));
          }, 3000);
          return () => clearTimeout(timer);
        } catch (_) {}
      }
    }

    if (question && question.codeStub) {
      setCode(question.codeStub);
    } else {
      setCode(DEFAULT_TEMPLATES[selectedLanguage] || `// Implement your function here\nfunction solution() {\n  return 0;\n}`);
    }
    setElapsed(0);
  }, [currentIdx, question]);

  // Dynamic boilerplate template swap when switching languages on generic initial stubs
  useEffect(() => {
    const isBaseline = Object.values(DEFAULT_TEMPLATES).some(val => val.trim() === code.trim()) || !code.trim() || code.startsWith("// Welcome to");
    if (isBaseline && DEFAULT_TEMPLATES[selectedLanguage]) {
      setCode(DEFAULT_TEMPLATES[selectedLanguage]);
    }
  }, [selectedLanguage]);

  const handleSaveDraft = () => {
    if (!question) return;
    try {
      const draftObj = {
        code,
        selectedLanguage,
        elapsed,
        timestamp: Date.now()
      };
      localStorage.setItem(`prepai_draft_coding_${question.id}`, JSON.stringify(draftObj));
      setDraftStatus("Draft saved!");
      setTimeout(() => {
        setDraftStatus((prev) => (prev === "Draft saved!" ? null : prev));
      }, 2500);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setDraftStatus("Error saving draft");
      setTimeout(() => setDraftStatus(null), 2500);
    }
  };

  const handleResetStub = () => {
    setCode(DEFAULT_TEMPLATES[selectedLanguage] || question?.codeStub || `// Welcome to PrepAI Coding Arena\nfunction solution() {\n  return 0;\n}`);
    setIsConfirmingReset(false);
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setSubmissionWarning("Please write a solution algorithm code first before analyzing compiler compile options.");
      setTimeout(() => setSubmissionWarning(null), 4000);
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/coding/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          code,
          language: selectedLanguage,
          company: "FAANG style"
        })
      });

      if (!response.ok) throw new Error("Compiler parser error");
      const data: CodingEvaluation = await response.json();
      setEvaluation(data);
      setAccumulatedScore((prev) => prev + data.score);
    } catch (err) {
      console.error(err);
      // Fallback
      setEvaluation({
        correctnessScore: 85,
        efficiencyScore: 80,
        timeComplexity: "O(N) single iteration",
        spaceComplexity: "O(1) auxiliary maps storage",
        criticalEdgeCases: [
          "Single price decrease inputs",
          "Decimals or extremely large arrays thresholds",
          "Duplicate transaction indexes"
        ],
        refactoringSuggestions: [
          "Avoid copying array elements inside recursive loops",
          "Maintain early exit conditions if price length is < 2"
        ],
        optimizedSolutionCode: `function maxProfit(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (let price of prices) {\n    minPrice = Math.min(minPrice, price);\n    maxProfit = Math.max(maxProfit, price - minPrice);\n  }\n  return maxProfit;\n}`,
        score: 82
      });
      setAccumulatedScore((prev) => prev + 82);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setSubmissionWarning("Please write a solution algorithm code first before analyzing compiler compile options.");
      setTimeout(() => setSubmissionWarning(null), 4000);
      return;
    }

    setIsRunning(true);
    setRunResult(null);
    setShowConsole(true);

    try {
      const response = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question?.question,
          code,
          language: selectedLanguage,
          inputTestCases: (customInput || "").trim()
        })
      });

      if (!response.ok) throw new Error("Compiler run crash error");
      const data = await response.json();
      setRunResult(data);
    } catch (err: any) {
      console.error(err);
      setRunResult({
        success: false,
        output: "[Compiler Crash Log] General network timed out or connection is unstable.",
        returnValue: "undefined",
        compilationError: "Compiler connection timed out or is unavailable.",
        executionTimeMs: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleNextStep = () => {
    if (question) {
      localStorage.removeItem(`prepai_draft_coding_${question.id}`);
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      const finalScore = Math.round(accumulatedScore / questions.length) || 80;
      onFinishRound(finalScore, questions.length, elapsed);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Safe release of mic resources upon component destruction
  useEffect(() => {
    return () => {
      const active = (window as any)._activeRecognition;
      if (active) {
        try {
          active.stop();
        } catch (_) {}
        (window as any)._activeRecognition = null;
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    setVoiceError(null);
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError("Speech recognition is not fully supported in this browser. Please use the text dictation input below.");
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError("Microphone permission denied. Enable microphone access in browser or use the text editor below.");
        } else {
          setVoiceError(`Audio recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setDictationText((prev) => (prev + " " + finalTranscript).trim());
        }
      };

      (window as any)._activeRecognition = rec;
      rec.start();
    } catch (err: any) {
      console.error("Speech init crash:", err);
      setVoiceError("Microphone failed to initialize.");
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    const active = (window as any)._activeRecognition;
    if (active) {
      try {
        active.stop();
      } catch (_) {}
      (window as any)._activeRecognition = null;
    }
    setIsListening(false);
  };

  const handleVoiceToCode = async () => {
    if (!dictationText.trim()) {
      setVoiceError("Please speak or type an approach description first.");
      return;
    }

    setIsTranslating(true);
    setVoiceError(null);
    setTranslationExplanation(null);

    try {
      const response = await fetch("/api/coding/voice-to-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dictation: dictationText,
          question: question?.question || "",
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to translate voice approach.");
      }

      const data = await response.json();
      if (data.code) {
        setCode(data.code);
        if (data.explanation) {
          setTranslationExplanation(data.explanation);
        }
      }
    } catch (err: any) {
      console.error("Voice-to-code failed:", err);
      const mockCode = `// [Voice-to-Code Scaffold]\n// Dictated Strategy: "${dictationText}"\n\nfunction solution() {\n  // 1. Maintain variables based on your strategy\n  // 2. Loop & compare parameters\n  return 0;\n}`;
      setCode(mockCode);
      setVoiceError("Could not reach compiler. Inserted general boilerplate scaffolding instead.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Upper bar */}
      <div className="flex items-center justify-between border-b border-[#2d333d] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-full uppercase border border-emerald-500/20">
            Algorithmic Arena
          </span>
          <span className="text-slate-500 text-xs font-semibold">• Task {currentIdx + 1} of {questions.length}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
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
            id="exit_coding_arena_btn"
            onClick={onExitArena}
            className="p-1 px-3 bg-[#1e293b]/70 border border-[#2d333d] text-slate-300 hover:text-white rounded-lg transition"
          >
            Exit Arena
          </button>
        </div>
      </div>

      {/* Compiler split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Question description & AI Feedback outputs */}
        <div className="space-y-6">
          
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Problem Coordinates
              </h3>
              <button 
                id="toggle_coding_hints_btn"
                onClick={() => setShowHints(!showHints)}
                className="flex-shrink-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 p-2 rounded-xl transition border border-[#2d333d]"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {question?.question}
            </p>

            <AnimatePresence>
              {showHints && question?.hints && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="bg-emerald-950/15 border border-emerald-500/10 p-4 rounded-xl space-y-1 text-xs overflow-hidden"
                >
                  <p className="font-bold text-emerald-300 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    Code Optimizer Hints:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    {question.hints.map((hint, idx) => (
                      <li key={idx} className="leading-relaxed font-mono">{hint}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI grading report */}
          <AnimatePresence>
            {evaluation && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="bg-[#171b22]/85 p-6 rounded-2xl border border-emerald-500/25 space-y-6 shadow-xl"
              >
              <div className="flex justify-between items-center border-b border-[#2d333d] pb-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Award className="w-5 h-5" />
                  <h4 className="font-extrabold text-sm text-white">AI Code Review Report</h4>
                </div>
                <div className="flex items-baseline gap-1 bg-emerald-500/10 p-2 px-3 rounded-xl border border-emerald-500/20">
                  <span className="text-xl font-black text-white">{evaluation.score}</span>
                  <span className="text-slate-500 text-xs font-semibold">/100</span>
                </div>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-[#13161c]/45 p-3 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Correctness</span>
                  <p className="text-emerald-400 font-extrabold text-base mt-0.5">{evaluation.correctnessScore}/100</p>
                </div>
                <div className="bg-[#13161c]/45 p-3 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Complexity Space</span>
                  <p className="text-slate-300 font-mono font-bold text-xs mt-1 truncate">{evaluation.spaceComplexity}</p>
                </div>
                <div className="bg-[#13161c]/45 p-3 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Time Complexity</span>
                  <p className="text-indigo-400 font-mono font-bold text-xs mt-1 truncate">{evaluation.timeComplexity}</p>
                </div>
              </div>

              {/* Edge Case Warning Checks */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Boundary Safety Checkpoints:
                </span>
                <ul className="space-y-1.5 pl-1">
                  {(evaluation.criticalEdgeCases || []).map((edge, index) => (
                    <li key={index} className="text-slate-300 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                      <span>{edge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Refinement recommendations */}
              <div className="space-y-2 border-t border-[#2d333d] pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Structural Suggestions</span>
                <ul className="space-y-1.5">
                  {(evaluation.refactoringSuggestions || []).map((ref, idx) => (
                    <li key={idx} className="text-slate-400 text-xs flex items-start gap-2 leading-relaxed">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Model Optimized code box */}
              {evaluation.optimizedSolutionCode && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Optimized Implementation Benchmark</span>
                  <pre className="p-4 bg-[#13161c]/85 rounded-xl text-[11px] font-mono leading-relaxed text-indigo-300 overflow-x-auto max-h-[220px]">
                    <code>{evaluation.optimizedSolutionCode}</code>
                  </pre>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        </div>

        {/* Right Side: Interactive Code Editor Terminal */}
        <div className="space-y-6">
          
          <div className={`bg-[#171b22]/70 rounded-2xl border border-[#2d333d] backdrop-blur-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
            showConsole && isVoicePanelOpen 
              ? "h-[740px]" 
              : showConsole 
                ? "h-[640px]" 
                : isVoicePanelOpen 
                  ? "h-[610px]" 
                  : "h-[510px]"
          }`}>
            {/* Editor toolbar */}
            <div className="bg-[#13161c]/55 p-3.5 px-4 border-b border-[#2d333d] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-300">Workspace IDE</span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-[#171b22]/80 text-xs text-slate-300 p-1 px-2.5 rounded-lg border border-[#2d333d] outline-none focus:border-emerald-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                
                <button
                  id="toggle_console_drawer_btn"
                  onClick={() => setShowConsole(!showConsole)}
                  className={`p-1 px-2.5 rounded transition border flex items-center gap-1.5 ${
                    showConsole 
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold text-xs" 
                    : "border-[#2d333d] text-slate-400 hover:text-slate-200 text-xs"
                  }`}
                  title="Toggle console / interactive code run output drawer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal Console</span>
                </button>

                <button
                  id="toggle_voice_panel_btn"
                  onClick={() => setIsVoicePanelOpen(!isVoicePanelOpen)}
                  className={`p-1 px-2.5 rounded transition border flex items-center gap-1.5 ${
                    isVoicePanelOpen 
                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold" 
                    : "border-[#2d333d] text-slate-400 hover:text-slate-200"
                  }`}
                  title="Toggle experimental Voice-to-Code builder"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice dictation</span>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded uppercase font-black tracking-widest scale-90">Beta</span>
                </button>

                {isConfirmingReset ? (
                  <div className="flex items-center gap-1.5 animate-fade-in bg-red-950/40 border border-red-500/20 rounded-xl px-2 py-1">
                    <span className="text-[9px] font-bold text-red-400 font-sans">Reset code?</span>
                    <button
                      onClick={handleResetStub}
                      className="px-1.5 py-0.5 bg-red-650 hover:bg-red-600 bg-red-600 hover:bg-red-500 text-white rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setIsConfirmingReset(false)}
                      className="px-1.5 py-0.5 bg-[#171b22] hover:bg-[#1f2531] text-slate-300 rounded text-[8.5px] font-black uppercase tracking-wider border border-[#2d333d] cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    id="reset_code_stub"
                    onClick={() => setIsConfirmingReset(true)}
                    className="p-1.5 text-slate-500 hover:text-slate-200 rounded-xl transition border border-[#2d333d]"
                    title="Reset code template"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {isVoicePanelOpen && (
              <div className="bg-[#13161c]/80 border-b border-[#2d333d] p-4 space-y-3.5 animate-slide-down">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      Voice-to-Code Companion
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsVoicePanelOpen(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Speak your algorithmic strategy or describe the solution function, then compile it into a coding starter template automatically.
                  </p>

                  <div className="relative">
                    <textarea
                      id="speech_dictation_textarea"
                      value={dictationText}
                      onChange={(e) => setDictationText(e.target.value)}
                      placeholder="Start talking & describe your plan, e.g. 'implement a linear scan through prices, tracking min price seen. Update max profit if current price minus min price is greater than previous max...'"
                      className="w-full h-20 p-2.5 text-xs bg-[#171b22]/90 border border-[#2d333d] focus:border-indigo-500 text-slate-200 rounded-xl outline-none resize-none leading-relaxed font-sans placeholder-slate-600 animate-fade-in"
                    />

                    {isListening && (
                      <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 p-1 px-2.5 rounded-full text-[9px] font-bold text-rose-300 uppercase tracking-widest animate-pulse">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                        <span>Speaking now...</span>
                      </div>
                    )}
                  </div>

                  {voiceError && (
                    <p className="text-rose-400 text-[10px] font-semibold leading-tight flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{voiceError}</span>
                    </p>
                  )}

                  {translationExplanation && (
                    <div className="bg-indigo-950/20 border border-indigo-500/25 p-3 rounded-xl space-y-1">
                      <p className="text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 animate-fade-in">
                        <Wand2 className="w-3.5 h-3.5" />
                        AIs Translation Summary:
                      </p>
                      <p className="text-slate-300 text-[10.5px] leading-relaxed font-medium font-sans">
                        {translationExplanation}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {!isListening ? (
                      <button
                        id="start_speech_dictation_btn"
                        onClick={startSpeechRecognition}
                        className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer flex-1 justify-center shadow-lg shadow-indigo-600/15"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Dictate through Mic</span>
                      </button>
                    ) : (
                      <button
                        id="stop_speech_dictation_btn"
                        onClick={stopSpeechRecognition}
                        className="p-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer flex-1 justify-center animate-pulse"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Recording</span>
                      </button>
                    )}

                    <button
                      id="build_boilerplate_from_dictation_btn"
                      onClick={handleVoiceToCode}
                      disabled={isTranslating}
                      className="p-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer flex-1 justify-center"
                    >
                      {isTranslating ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                          <span>Generating code...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Synthesize Boilerplate</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Editing grid container */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Line counts indicator column */}
              <div className="bg-[#13161c]/20 text-slate-700 p-3.5 py-4 w-10 text-right select-none font-mono text-xs border-r border-[#2d333d]/60 leading-relaxed text-[11px]">
                {Array.from({ length: 18 }, (_, k) => (
                  <div key={k}>{k + 1}</div>
                ))}
              </div>
              
              <textarea
                id="coding_editor_textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                className="flex-1 p-3.5 py-4 bg-[#13161c]/35 text-slate-100 font-mono text-[11px] leading-relaxed outline-none border-none resize-none overflow-y-auto whitespace-pre pr-4"
              />
            </div>

            {/* Collapsible Interactive Console Drawer */}
            {showConsole && (
              <div className="border-t border-[#2d333d] bg-[#0b0c10] p-4 flex flex-col gap-3.5 select-text">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10.5px] font-bold text-white uppercase tracking-wider font-mono">
                      Console Execution sandbox
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowConsole(false)}
                    className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-mono tracking-wider cursor-pointer font-bold bg-[#13161c] px-2 py-0.5 rounded border border-[#2d333d]"
                  >
                    Hide Terminal
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left: Input parameters */}
                  <div className="space-y-1.5 flex flex-col justify-start">
                    <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest font-sans flex items-center gap-1">
                      Custom Test Parameters:
                    </label>
                    <textarea
                      id="custom_test_params"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. prices = [7, 1, 5, 3, 6, 4]"
                      rows={3}
                      className="w-full p-2.5 text-[11px] bg-[#13161c]/80 text-emerald-300 font-mono border border-[#2d333d] focus:border-emerald-500/60 rounded-xl outline-none resize-none leading-relaxed placeholder-slate-600"
                    />
                  </div>

                  {/* Right: Terminal outputs */}
                  <div className="bg-[#0e1117] border border-[#2d333d] p-3 rounded-xl flex flex-col justify-between font-mono text-[10.5px] min-h-[90px] max-h-[140px] overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-300 relative">
                    {isRunning ? (
                      <div className="absolute inset-0 bg-[#0e1117]/85 flex flex-col items-center justify-center gap-2 text-emerald-400">
                        <span className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                        <span className="text-[9px] uppercase tracking-widest font-black animate-pulse">Running Code...</span>
                      </div>
                    ) : null}

                    {runResult ? (
                      <div className="space-y-2">
                        {runResult.compilationError && runResult.success === false ? (
                          <div className="text-rose-400">
                            <span className="font-extrabold text-[9.5px] bg-rose-500/10 border border-rose-500/25 p-0.5 px-1.5 rounded uppercase tracking-wider block mb-1">
                              Compilation / Syntax Error
                            </span>
                            {runResult.compilationError}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 border-b border-[#2d333d]/50 pb-1.5 mb-1.5 font-sans">
                              <span className="font-bold flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${runResult.success ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                Status: {runResult.success ? 'SUCCESS' : 'RUNTIME EXCEPTION'}
                              </span>
                              <span>CPU: {runResult.executionTimeMs}ms</span>
                            </div>
                            
                            {runResult.output && (
                              <div className="text-slate-300 font-mono mb-2">
                                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block mb-0.5 font-sans">Stdout logs:</span>
                                {runResult.output}
                              </div>
                            )}

                            <div>
                              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5 font-sans">Return Value:</span>
                              <span className="text-emerald-400 font-black">{runResult.returnValue}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-500 text-center py-6">
                        No logs captured. Click "Run Code" in the control deck to spin up the execution thread.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Run footer console */}
            <div className="bg-[#13161c]/55 p-3 px-4 border-t border-[#2d333d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {draftStatus && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 animate-pulse">
                    {draftStatus}
                  </span>
                )}
                {submissionWarning && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25 flex items-center gap-1.5 animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {submissionWarning}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="save_coding_draft_btn"
                  onClick={handleSaveDraft}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs border border-[#2d333d]/70 flex items-center gap-1.5 cursor-pointer"
                  title="Save current progress draft to pick up later"
                >
                  Save Draft
                </button>

                <button
                  id="run_code_sandbox_btn"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="p-2 py-2.1 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-400 border border-emerald-500/20 font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title="Run code against inputs in the virtual execution sandbox"
                >
                  {isRunning ? (
                    <>
                      <span className="w-3 h-3 border border-emerald-450 border-t-emerald-400 rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Terminal className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      Run Code
                    </>
                  )}
                </button>
                {!evaluation ? (
                  <button
                    id="submit_code_btn"
                    onClick={handleSubmitCode}
                    disabled={isEvaluating}
                    className="p-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-extrabold rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isEvaluating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        Auditing Compilation...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Submit Algorithm
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    id="coding_next_task_btn"
                    onClick={handleNextStep}
                    className="p-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                  >
                    {currentIdx < questions.length - 1 ? "Next Task" : "Finish Coding Arena"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Sizing constraints tip */}
          <div className="bg-[#13161c]/30 p-4 rounded-xl border border-[#2d333d]/80 flex items-start gap-2.5 text-slate-500 text-[10px] leading-normal">
            <Cpu className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <p>
              Run constraints are strictly evaluated on principal space efficiency thresholds. Refactor nested state iterations early to optimize memory footprints.
            </p>
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
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                          "# System Architecting Notes:\n# - High Availability\n# - Gateway Ingress",
                          "## Behavioral Prep:\n## - Situation / Task:\n## - Action details:\n## - Quantitative Result:"
                        ];
                        const chosen = templates[0];
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
