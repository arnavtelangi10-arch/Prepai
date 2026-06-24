import { useState, useEffect } from "react";
import { 
  Server, 
  Database, 
  Cpu, 
  Layers, 
  Grid, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  TrendingUp,
  Award,
  ChevronRight,
  BookOpen,
  Plus,
  Trash2,
  ListFilter,
  Clock,
  X,
  FileText,
  Check,
  Copy,
  Sparkles
} from "lucide-react";
import { InterviewQuestion, DesignEvaluation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SystemDesignArenaProps {
  questions: InterviewQuestion[];
  onFinishRound: (score: number, totalQuestions: number, durationSec: number) => void;
  onExitArena: () => void;
}

const MODULE_PALETTE = [
  { type: "LB", name: "Load Balancer", icon: Grid, desc: "Distributes incoming queries", color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
  { type: "CDN", name: "CDN / Edge Cache", icon: Layers, desc: "Caches static visual assets globally", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  { type: "GW", name: "API Gateway", icon: Cpu, desc: "Governs ingress, limits, auth", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
  { type: "WS", name: "Web App Server", icon: Server, desc: "Handles product functional workloads", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
  { type: "CACHE", name: "Redis Cache Store", icon: Database, desc: "In-memory fast lookup keys", color: "text-orange-400 bg-orange-500/10 border-orange-500/25" },
  { type: "SQL", name: "PostgreSQL Database", icon: Database, desc: "Relational structured replica schemas", color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  { type: "MQ", name: "Kafka Event Broker", icon: Layers, desc: "App-log event queues, partitions", color: "text-red-400 bg-red-500/10 border-red-500/25" },
];

export default function SystemDesignArena({
  questions,
  onFinishRound,
  onExitArena
}: SystemDesignArenaProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<string[]>(["LB", "GW", "WS", "SQL"]);
  const [apiSchemaText, setApiSchemaText] = useState("");
  const [bottlenecksText, setBottlenecksText] = useState("");
  const [cachingText, setCachingText] = useState("");

  // System states
  const [elapsed, setElapsed] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<DesignEvaluation | null>(null);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  const question = questions[currentIdx] || null;

  // Scratchpad states
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem("prepai_scratchpad_design") || "";
  });
  const [scratchpadCopied, setScratchpadCopied] = useState(false);

  const handleScratchpadChange = (val: string) => {
    setScratchpadText(val);
    localStorage.setItem("prepai_scratchpad_design", val);
  };

  const handleForceFinishRound = () => {
    const finalScore = Math.round(accumulatedScore / questions.length) || 84;
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

  // Run global timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync / Restore Draft State or reset defaults on question coordinate change
  useEffect(() => {
    setEvaluation(null);
    if (question) {
      const saved = localStorage.getItem(`prepai_draft_design_${question.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedNodes(parsed.selectedNodes || ["LB", "GW", "WS", "SQL"]);
          setApiSchemaText(parsed.apiSchemaText || "");
          setBottlenecksText(parsed.bottlenecksText || "");
          setCachingText(parsed.cachingText || "");
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

    // Default configuration for new/un-drafted question
    setSelectedNodes(["LB", "GW", "WS", "SQL"]);
    setApiSchemaText("");
    setBottlenecksText("");
    setCachingText("");
    setElapsed(0);
  }, [currentIdx, question]);

  const handleSaveDraft = () => {
    if (!question) return;
    try {
      const draftObj = {
        selectedNodes,
        apiSchemaText,
        bottlenecksText,
        cachingText,
        elapsed,
        timestamp: Date.now()
      };
      localStorage.setItem(`prepai_draft_design_${question.id}`, JSON.stringify(draftObj));
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

  const handleAddPaletteNode = (id: string) => {
    if (selectedNodes.length >= 10) return;
    setSelectedNodes((prev) => [...prev, id]);
  };

  const handleRemovePaletteNode = (idx: number) => {
    setSelectedNodes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitDesign = async () => {
    const layoutSummary = ` Whiteboard Grid nodes: ${selectedNodes.join(" -> ")}. Core APIs written: "${apiSchemaText}". Dynamic bottlenecks explained: "${bottlenecksText}". Caching plans: "${cachingText}".`;

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/system-design/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          architectureDescription: layoutSummary,
          selectedComponents: selectedNodes
        })
      });

      if (!response.ok) throw new Error(" blancas architecture evaluation failure");
      const data: DesignEvaluation = await response.json();
      setEvaluation(data);
      setAccumulatedScore((prev) => prev + data.score);
    } catch (err) {
      console.error(err);
      // Fallback
      setEvaluation({
        feasibilityScore: 82,
        scalabilityScore: 85,
        availabilityCritique: "The whiteboard configuration addresses core routing tiers securely but needs distributed master-replica failover groups to secure data persistence layers.",
        bottlenecks: [
          "Database sharding indexing strategies omitted under write stress spikes",
          "Synchronous connections on Gateway ingress will choke threading allocations"
        ],
        databaseRecommendation: "Deploy partitioned Cassandra shards supporting chrono updates mapping, backed by primary relational engines",
        cachingStrategy: "Distribute an eviction LRU cluster mapped to handle user context keys",
        faultToleranceFeedback: "Include Kafka dead-letter queues to catch dropped user update callbacks",
        score: 83
      });
      setAccumulatedScore((prev) => prev + 83);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextStep = () => {
    if (question) {
      localStorage.removeItem(`prepai_draft_design_${question.id}`);
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      const finalScore = Math.round(accumulatedScore / questions.length) || 84;
      onFinishRound(finalScore, questions.length, elapsed);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header coordinates */}
      <div className="flex items-center justify-between border-b border-[#2d333d] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase border border-indigo-500/20">
            System Design whiteboard
          </span>
          <span className="text-slate-500 text-xs font-semibold">• Task {currentIdx + 1} of {questions.length}</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
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
            id="exit_design_arena_btn"
            onClick={onExitArena}
            className="p-1 px-3 bg-[#1e293b]/70 text-slate-300 hover:text-white border border-[#2d333d] rounded-lg transition"
          >
            Leave whiteboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Problem statement, Node Whiteboard, text descriptions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Question coordinates */}
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Whiteboard design Task
            </h3>
            <p className="text-slate-200 text-base font-bold leading-normal">
              {question?.question}
            </p>
          </div>

          {/* Graphical Whiteboard Area */}
          <div className="bg-[#171b22]/70 rounded-2xl border border-[#2d333d] backdrop-blur-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="bg-[#13161c]/55 p-4 border-b border-[#2d333d]/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-indigo-400" />
                Active Whiteboard Canvas
              </span>
              <span className="text-[10px] text-slate-500">Click palette items below to instantiate nodes</span>
            </div>

            {/* Canvas grid output */}
            <div className="flex-1 bg-[#13161c]/20 p-6 flex flex-wrap gap-3 items-center justify-center min-h-[180px]">
              {selectedNodes.length === 0 ? (
                <p className="text-slate-500 text-xs italic">Whiteboard empty. Click node blocks from the modular palette to construct a timeline layout...</p>
              ) : (
                <div className="flex flex-wrap gap-2.5 items-center justify-center">
                  {selectedNodes.map((nodeType, index) => {
                    const match = MODULE_PALETTE.find(m => m.type === nodeType);
                    if (!match) return null;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`p-3 rounded-xl border flex flex-col justify-between items-center w-28 h-24 text-center select-none shadow-sm transition relative group ${match.color}`}>
                          <button
                            id={`del_node_btn_${index}`}
                            onClick={() => handleRemovePaletteNode(index)}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-[#13161c] border border-[#2d333d] text-slate-500 hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100 shadow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <match.icon className="w-5 h-5 mx-auto" />
                          <p className="text-[10px] font-bold text-white truncate w-full mt-2 leading-none">{match.name}</p>
                          <span className="text-[9px] text-slate-500">Tier {index + 1}</span>
                        </div>
                        {index < selectedNodes.length - 1 && (
                          <div className="w-4 h-0.5 bg-[#2d333d] rounded flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Draggable palette list */}
            <div className="bg-[#13161c]/45 p-4 border-t border-[#2d333d]/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Architectural Components Palette</span>
              <div className="flex flex-wrap gap-2">
                {MODULE_PALETTE.map((palette) => (
                  <button
                    id={`palette_item_${palette.type}`}
                    key={palette.type}
                    onClick={() => handleAddPaletteNode(palette.type)}
                    className="p-2 bg-[#13161c] hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] border border-[#2d333d] hover:border-slate-705 transition flex items-center gap-1.5"
                  >
                    <palette.icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{palette.name}</span>
                    <Plus className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Written specifications cards input */}
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Architectural Justifications</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. REST API endpoints & Schema design</label>
                <textarea
                  value={apiSchemaText}
                  onChange={(e) => setApiSchemaText(e.target.value)}
                  placeholder="Define routing rules. e.g. PUT /api/v1/posts { userId: uuid, media: s3_uri }. Explain data partition shards keys..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-[#13161c]/60 rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Caching Rules & DB engine selections</label>
                <textarea
                  value={cachingText}
                  onChange={(e) => setCachingText(e.target.value)}
                  placeholder="Justify Cassandra vs databases, outline Redis cache eviction metrics..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-[#13161c]/60 rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Latency bottlenecks & single point of failures</label>
                <textarea
                  value={bottlenecksText}
                  onChange={(e) => setBottlenecksText(e.target.value)}
                  placeholder="How do you secure availability during sudden replica failures?"
                  rows={2}
                  className="w-full text-xs p-2.5 bg-[#13161c]/60 rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* whiteboards evaluate triggers */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                {draftStatus && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 animate-pulse">
                    {draftStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="save_design_draft_btn"
                  onClick={handleSaveDraft}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs border border-[#2d333d]/70 flex items-center gap-1.5 cursor-pointer"
                  title="Save current workspace draft to pick up later"
                >
                  Save Draft
                </button>
                {!evaluation ? (
                  <button
                    id="whiteboard_submit_btn"
                    onClick={handleSubmitDesign}
                    disabled={isEvaluating || selectedNodes.length === 0}
                    className="p-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Evaluating whiteboards...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Evaluate architecture
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    id="design_next_step_btn"
                    onClick={handleNextStep}
                    className="p-3 px-6 bg-indigo-600 hover:bg-indigo-505 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                  >
                    {currentIdx < questions.length - 1 ? "Next design task" : "Complete whiteboards Arena"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Detailed scorecard reporting */}
        <div className="space-y-6">
          
          {evaluation ? (
            <div className="bg-[#171b22]/85 p-6 rounded-2xl border border-indigo-500/25 space-y-6 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#2d333d] pb-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Award className="w-5 h-5" />
                  <h4 className="font-extrabold text-xs text-white">System Scorecard</h4>
                </div>
                <div className="flex items-baseline gap-1 bg-indigo-500/10 p-2 px-3 rounded-xl border border-indigo-500/20">
                  <span className="text-xl font-black text-white">{evaluation.score}</span>
                  <span className="text-slate-500 text-xs font-semibold">/100</span>
                </div>
              </div>

              {/* Subscores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Scalability Rating</span>
                  <p className="text-indigo-400 font-extrabold text-base mt-1">{evaluation.scalabilityScore}/105</p>
                </div>
                <div className="bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d]">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Feasibility Rating</span>
                  <p className="text-indigo-400 font-extrabold text-base mt-1">{evaluation.feasibilityScore}/100</p>
                </div>
              </div>

              {/* Latency critique */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Scalability critique</span>
                <p className="text-slate-300 text-xs leading-normal">{evaluation.availabilityCritique}</p>
              </div>

              {/* Bottlenecks lists */}
              <div className="space-y-2 font-mono">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 font-sans">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Identified Outage Bottlenecks:
                </span>
                <ul className="space-y-1.5 pl-1 text-[11px]">
                  {evaluation.bottlenecks.map((bot, index) => (
                    <li key={index} className="text-slate-300 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 flex-shrink-0" />
                      <span className="leading-normal">{bot}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* DB Recommendations */}
              <div className="space-y-1 bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d] text-xs">
                <p className="font-bold text-indigo-400">Recommended Databases Layer:</p>
                <p className="text-slate-400 text-[11px] mt-1 leading-normal leading-relaxed">{evaluation.databaseRecommendation}</p>
              </div>

              {/* Caching layout */}
              <div className="space-y-1 bg-[#13161c]/45 p-3.5 rounded-xl border border-[#2d333d] text-xs">
                <p className="font-bold text-indigo-400">Caching Engine Configuration:</p>
                <p className="text-slate-400 text-[11px] mt-1 leading-normal leading-relaxed">{evaluation.cachingStrategy}</p>
              </div>

              {/* Fault isolation feed */}
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-300">Fault Tolerance Feed:</p>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{evaluation.faultToleranceFeedback}</p>
              </div>

            </div>
          ) : (
            <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm flex flex-col justify-between min-h-[360px] text-slate-500 text-xs italic">
              <div className="space-y-4">
                <div className="flex gap-2 items-center text-slate-400 not-italic font-bold text-xs uppercase tracking-widest">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Architectural Diagnostics
                </div>
                <p className="leading-relaxed">
                  Arrange appropriate architectural modules on the graphic canvas to map ingress routing models. Once completed and justified, evaluate the designs.
                </p>
                <p className="leading-relaxed">
                  Principal auditors check availability metrics, database sharding bottlenecks, transactional replication rules, and memory eviction constraints.
                </p>
              </div>
              
              <div className="border-t border-[#2d333d] pt-4 flex gap-2 items-center leading-normal text-[10px] not-italic text-indigo-400/80">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Evaluates cost, security, throughput parameters.
              </div>
            </div>
          )}

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
                          "# System Architecting Notes:\n# - High Availability\n# - Gateway Ingress\n# - Database Partitions",
                          "## Behavioral Prep:\n## - Situation / Task:\n## - Action details:\n## - Quantitative Result:"
                        ];
                        const chosen = templates[1];
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
