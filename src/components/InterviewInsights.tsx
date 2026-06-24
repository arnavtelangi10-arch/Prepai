import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  Code, 
  Server, 
  UserCheck, 
  Plus, 
  X, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  Compass, 
  CheckCircle,
  TrendingUp,
  Award,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FeedbackReview {
  id: string;
  author: string;
  role: string;
  level: string;
  content: string;
  recommendStatus: string;
  timestamp: string;
}

interface CompanyProfile {
  technicalQuestions: string[];
  behavioralPatterns: string[];
  systemDesignTopics: string[];
  recentFeedback: FeedbackReview[];
}

interface InterviewInsightsProps {
  currentUsername: string;
  defaultCompany?: string;
}

export default function InterviewInsights({ currentUsername, defaultCompany = "Google" }: InterviewInsightsProps) {
  const [insights, setInsights] = useState<Record<string, CompanyProfile>>({});
  const [selectedCompany, setSelectedCompany] = useState<string>(defaultCompany);
  const [activeSubTab, setActiveSubTab] = useState<"questions" | "behavioral" | "design" | "reviews">("questions");
  
  // Feedback submission forms
  const [isContributing, setIsContributing] = useState(false);
  const [feedbackCompany, setFeedbackCompany] = useState<string>("Google");
  const [feedbackRole, setFeedbackRole] = useState("");
  const [feedbackLevel, setFeedbackLevel] = useState("Mid-Level");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRecommend, setFeedbackRecommend] = useState("Recommend");
  const [feedbackAuthor, setFeedbackAuthor] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [formError, setFormError] = useState("");

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/insights/companies");
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (e) {
      console.error("Failed to load company insights:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Update selected if default updates
  useEffect(() => {
    if (defaultCompany && ["Google", "Amazon", "Meta", "Microsoft", "Apple"].includes(defaultCompany)) {
      setSelectedCompany(defaultCompany);
    }
  }, [defaultCompany]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleContribSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackRole.trim() || !feedbackContent.trim()) {
      setFormError("Please fill out your roles and review details.");
      return;
    }
    setFormError("");

    try {
      const res = await fetch("/api/insights/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: feedbackCompany,
          role: feedbackRole.trim(),
          level: feedbackLevel,
          content: feedbackContent.trim(),
          recommendStatus: feedbackRecommend,
          author: feedbackAuthor.trim() || "Anonymized Contributor"
        })
      });
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights);
        setIsContributing(false);
        setFeedbackRole("");
        setFeedbackContent("");
        setFeedbackAuthor("");
        // Select the company we just contributed feedback on to show it immediately
        setSelectedCompany(feedbackCompany);
        setActiveSubTab("reviews");
        triggerToast(`Anonymized interview review for ${feedbackCompany} deployed successfully!`);
      } else {
        setFormError(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Server validation failed. Try again.");
    }
  };

  const activeProfile = insights[selectedCompany] || {
    technicalQuestions: [],
    behavioralPatterns: [],
    systemDesignTopics: [],
    recentFeedback: []
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-55 flex items-center gap-3 bg-indigo-950 border-2 border-indigo-400 px-4 py-3 rounded-xl shadow-2xl text-xs text-slate-100 font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Call to action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13161c]/30 p-6 border border-[#2d333d]/40 rounded-2xl animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Enterprise Research Hub</span>
            <span className="text-[10px] bg-slate-800 text-slate-350 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest">
              5 FAANG+ Blocks Loaded
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Corporate Interview Insights</h1>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Examine current assessment matrices, core behavioral loops, algorithms parameters, and recent timeline experience logs contributed by previous candidates.
          </p>
        </div>

        <button 
          onClick={() => {
            setIsContributing(true);
            setFeedbackCompany(selectedCompany);
            setFormError("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-indigo-505 border-indigo-500/35 hover:border-indigo-500/80 hover:bg-slate-850 text-indigo-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Contribute Anonymous Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Company selectors */}
        <div className="lg:col-span-3 space-y-3">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono block px-1">Select Enterprise Focus</span>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {[
              { name: "Google", desc: "Topological, scale-oriented, strict", color: "from-blue-600/20 to-indigo-600/5 hover:border-blue-500/40" },
              { name: "Amazon", desc: "16 Leadership Principles heavy", color: "from-amber-600/20 to-yellow-600/5 hover:border-amber-500/40" },
              { name: "Meta", desc: "Fast-paced concurrency, graph filters", color: "from-blue-600/20 to-sky-600/5 hover:border-sky-500/40" },
              { name: "Microsoft", desc: "Empathy, Teams concurrency, scale", color: "from-teal-600/20 to-blue-600/5 hover:border-blue-500/40" },
              { name: "Apple", desc: "Low-level structures, attention to detail", color: "from-slate-600/20 to-slate-200/5 hover:border-slate-400/40" }
            ].map((comp) => {
              const isSelected = selectedCompany === comp.name;
              return (
                <button
                  key={comp.name}
                  onClick={() => {
                    setSelectedCompany(comp.name);
                    setActiveSubTab("questions");
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none space-y-1 ${
                    isSelected
                      ? "bg-slate-950/90 border-[#38bdf8] shadow-md ring-1 ring-[#38bdf8]/35"
                      : "bg-[#13161c]/65 border-[#2d333d] hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className={`w-4 h-4 ${isSelected ? "text-[#38bdf8]" : "text-slate-450"}`} />
                    <span className="text-xs font-extrabold text-white">{comp.name}</span>
                  </div>
                  <p className="text-[9px] text-[#8c9bb0] line-clamp-1">{comp.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-[#13161c]/40 border border-[#2d333d]/50 p-4 rounded-xl space-y-2">
            <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-widest font-mono flex items-center gap-1.5 leading-none">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Mentor Insights
            </span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Insights profiles are pre-seeded compiled parameters verified by real interview feedback loops. Contribute your reviews to help candidates adapt to changing filters!
            </p>
          </div>
        </div>

        {/* Right column: Main profile parameters view with multi-subtabs */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Contribution interactive drawer overlay inside the page */}
          <AnimatePresence>
            {isContributing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#13161c]/80 border-2 border-indigo-400/25 rounded-2xl overflow-hidden shadow-2xl"
              >
                <form onSubmit={handleContribSubmit} className="p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-[#2d333d]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-[11px] font-black uppercase text-slate-100 font-mono tracking-wider">Deploy Anonymized Feedback Audit</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsContributing(false)}
                      className="text-slate-555 hover:text-slate-300 p-1 hover:bg-slate-900/50 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Company Panel</label>
                      <select
                        value={feedbackCompany}
                        onChange={(e) => setFeedbackCompany(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="Google">Google</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Meta">Meta</option>
                        <option value="Microsoft">Microsoft</option>
                        <option value="Apple">Apple</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Job Role / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Software Engineer (L5), Infrastructure Coder"
                        value={feedbackRole}
                        onChange={(e) => setFeedbackRole(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-slate-200 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Level Grade</label>
                      <select
                        value={feedbackLevel}
                        onChange={(e) => setFeedbackLevel(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-slate-205 text-xs focus:outline-none"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead/Staff">Lead / Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Outcome Recommendation</label>
                      <div className="grid grid-cols-3 gap-1 bg-[#0e1117] p-1 border border-[#2d333d] rounded-xl text-[9px] font-bold">
                        {["Recommend", "Maybe", "Do Not"].map((rec) => {
                          const value = rec === "Maybe" ? "Maybe Recommend" : rec === "Do Not" ? "Do Not Recommend" : "Recommend";
                          const isSel = feedbackRecommend === value;
                          return (
                            <button
                              key={rec}
                              type="button"
                              onClick={() => setFeedbackRecommend(value)}
                              className={`py-1.5 px-1 rounded-lg uppercase tracking-wider text-center cursor-pointer transition select-none ${
                                isSel 
                                  ? value.includes("Do Not")
                                    ? "bg-rose-950 text-rose-400 border border-rose-500/20"
                                    : value.includes("Maybe")
                                      ? "bg-amber-950/60 text-amber-400 border border-amber-500/20"
                                      : "bg-emerald-950 text-emerald-400 border border-emerald-500/20"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {rec}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Author Alias (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Secret Silicon Coder, L5 Engineer, Anonymized alumn"
                        value={feedbackAuthor}
                        onChange={(e) => setFeedbackAuthor(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 uppercase font-bold font-mono">Detailed Review of Interview Structure & Style</label>
                    <textarea
                      rows={4}
                      placeholder="Comment on technical depth, algorithmic style, systems complexity focus, tone of the panel, and general advice..."
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      className="w-full p-3 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-3.5 pt-1.5 border-t border-[#2d333d]/40">
                    <button
                      type="button"
                      onClick={() => setIsContributing(false)}
                      className="px-4 py-2 bg-slate-900 border border-[#2d333d] text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase font-mono text-[9px] tracking-widest rounded-lg cursor-pointer"
                    >
                      Publish Feedback
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Profile Sheet Board */}
          <div className="bg-[#13161c]/50 border border-[#2d333d]/65 rounded-2xl p-5 space-y-6">
            
            {/* Enterprise focus header line */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2d333d]/50 pb-4 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Enterprise Assessment Directory</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedCompany} Insights Overview</span>
                </h2>
              </div>

              {/* Navigation Sub-Tabs bar */}
              <div className="flex bg-[#0e1117]/80 p-0.5 border border-[#2d333d] rounded-xl self-stretch sm:self-auto text-[10px] font-bold">
                {[
                  { id: "questions", label: "💻 Coding Qs", icon: Code },
                  { id: "design", label: "📐 System Design", icon: Server },
                  { id: "behavioral", label: "👤 STAR Culture", icon: UserCheck },
                  { id: "reviews", label: "💬 Reviews Timeline", icon: MessageSquare }
                ].map((st) => {
                  const isCurSub = activeSubTab === st.id;
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setActiveSubTab(st.id as any)}
                      className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer select-none transition ${
                        isCurSub
                          ? "bg-indigo-650 bg-indigo-600 text-white font-black"
                          : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Tabs bodies */}
            <div className="space-y-4 text-xs">
              
              {/* Subdivision A: Coding Questions */}
              {activeSubTab === "questions" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-indigo-950/25 border border-indigo-500/10 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-indigo-400" />
                    <p className="text-[10px] text-slate-350 leading-normal">
                      Google algorithms are characterized by strict O() complexity expectations. Interviewers closely audit memory structures.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeProfile.technicalQuestions && activeProfile.technicalQuestions.length > 0 ? (
                      activeProfile.technicalQuestions.map((q, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-4 border border-[#2d333d]/50 rounded-xl space-y-2 flex gap-3.5 items-start">
                          <div className="w-6 h-6 bg-[#161a23] border border-slate-700/60 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-400 font-mono">
                            {idx + 1}
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[9px] text-[#38bdf8] font-black uppercase font-mono tracking-widest block">Primary Algorithmic Target</span>
                            <p className="text-slate-200 text-xs font-semibold leading-relaxed">{q}</p>
                            <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest pt-1.5 border-t border-slate-800/60 mt-2">
                              <span>Focus: O(N) traversals</span>
                              <span>•</span>
                              <span>Space Limit: In-Place pointer matrices</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-450 italic text-center py-6">No technical questions available for this register.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Subdivision B: System Design Topics */}
              {activeSubTab === "design" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-teal-950/20 border border-teal-500/10 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    <p className="text-[10px] text-slate-350 leading-normal">
                      Systems architecture loops audit failover bounds, cache hit math, eventual consistency bounds, and global sharding partitions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeProfile.systemDesignTopics && activeProfile.systemDesignTopics.length > 0 ? (
                      activeProfile.systemDesignTopics.map((item, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-4 border border-[#2d333d]/50 rounded-xl space-y-2 flex gap-3.5 items-start animate-fade-in">
                          <div className="w-6 h-6 bg-[#161a23] border border-slate-700/60 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black text-teal-400 font-mono">
                            0{idx + 1}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <span className="text-[8.5px] text-teal-400 font-black uppercase tracking-widest font-mono">Systems Topology Anchor</span>
                            <p className="text-slate-200 text-xs font-bold leading-relaxed">{item}</p>
                            <p className="text-[10px] text-slate-450 italic leading-normal font-sans">
                              Be loaded to detail cache invalidation strategy, write throughput scaling bounds, and replication lags constraints.
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-450 italic text-center py-6">No systems topic details mapped currently.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Subdivision C: Behavioral & Culture check */}
              {activeSubTab === "behavioral" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-500/10 rounded-xl">
                    <Award className="w-4 h-4 text-amber-400" />
                    <p className="text-[10px] text-slate-350 leading-normal">
                      Behavioral checks assess leadership, alignment to corporate values, growth mentality parameters, and collaborative resolution.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeProfile.behavioralPatterns && activeProfile.behavioralPatterns.length > 0 ? (
                      activeProfile.behavioralPatterns.map((pat, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-4 border border-[#2d333d]/50 rounded-xl space-y-2 flex gap-3.5 items-start">
                          <div className="w-6 h-6 bg-[#161a23] border border-slate-700/60 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-amber-405 text-amber-405/90 text-amber-400 font-mono">
                            ✓
                          </div>
                          <div className="space-y-1 flex-1">
                            <span className="text-[8.5px] text-amber-400 font-black uppercase tracking-widest font-mono">STAR Focus Principle</span>
                            <p className="text-slate-200 text-xs font-semibold leading-relaxed">{pat}</p>
                            <div className="text-[10px] text-slate-500 leading-normal font-sans pt-1 mt-1 border-t border-[#2d333d]/30">
                              Prepare stories quantifying dollar saves, latency recovery percentages, or conflict mitigation blocks.
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-450 italic text-center py-6">No target values compiled yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Subdivision D: Candidate Feedback Timeline */}
              {activeSubTab === "reviews" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
                    <BookOpen className="w-4 h-4 text-indigo-450" />
                    <p className="text-[10px] text-slate-350 leading-relaxed">
                      Real-time candidate reviews contributed by previous interviewees. These files are kept completely anonymized to conform to privacy protocols.
                    </p>
                  </div>

                  <div className="space-y-4 font-sans">
                    {activeProfile.recentFeedback && activeProfile.recentFeedback.length > 0 ? (
                      activeProfile.recentFeedback.map((fb) => {
                        const recStatus = fb.recommendStatus || "Recommend";
                        return (
                          <div key={fb.id} className="p-4 bg-slate-900/40 border border-[#2d333d]/60 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d333d]/45 pb-2.5 text-[10px] font-mono">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-[#38bdf8] uppercase tracking-wider block">{fb.role}</span>
                                <span className="text-slate-400">Level Grade: <strong>{fb.level}</strong></span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded uppercase font-extrabold text-[8.5px] border ${
                                  recStatus.includes("Do Not")
                                    ? "bg-rose-955 text-rose-400 border-rose-500/25"
                                    : recStatus.includes("Maybe")
                                      ? "bg-amber-955 text-amber-400 border-amber-500/25"
                                      : "bg-emerald-955 text-emerald-400 border-emerald-500/25"
                                }`}>
                                  {recStatus}
                                </span>
                                <span className="text-slate-600">|</span>
                                <span className="text-slate-500">{new Date(fb.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <p className="text-[11.5px] text-slate-300 leading-relaxed leading-normal italic whitespace-pre-wrap">
                              "{fb.content}"
                            </p>

                            <div className="flex items-center text-[9px] text-slate-500 justify-end font-mono">
                              <span>Author: {fb.author}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center bg-[#13161c]/25 border border-dashed border-[#2d333d]/60 rounded-xl">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto opacity-55 mb-2.5" />
                        <p className="text-slate-450 text-xs">No feedback reviews registered on this enterprise node yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
