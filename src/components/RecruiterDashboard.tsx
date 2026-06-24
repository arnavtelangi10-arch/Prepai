import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Search, 
  Users, 
  CheckCircle, 
  ChevronRight, 
  FileText, 
  Award, 
  Layers, 
  Mail, 
  Phone, 
  Compass, 
  Trophy, 
  Filter,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Trash2,
  UserPlus,
  Plus,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Project, ResumeProfile } from "../types";

interface Applicant {
  id: string;
  name: string;
  email: string;
  domain: string;
  difficulty: string;
  stage: "Applied" | "Tech Completed" | "Coding Completed" | "Shortlisted";
  avgScore: number;
  commScore: number;
  codingScore: number;
  architectureScore: number;
  fillerWordsRate: string;
  lastActive: string;
  resumeDetails: string;
}

const APPLICANTS_MOCK: Applicant[] = [
  {
    id: "app_1",
    name: "Aryan Mehta",
    email: "aryan.mehta@university.edu",
    domain: "CSE",
    difficulty: "Junior",
    stage: "Shortlisted",
    avgScore: 92,
    commScore: 88,
    codingScore: 95,
    architectureScore: 93,
    fillerWordsRate: "Very low filler counts (<0.8/min)",
    lastActive: "Today, 10:20 am",
    resumeDetails: "Parsed resume contains deep React hooks mastery, sliding-window algorithm optimizations, and Postgres DB sharding schemes."
  },
  {
    id: "app_2",
    name: "Priya Sharma",
    email: "sharma.p@ai-institute.org",
    domain: "AIML",
    difficulty: "Mid-Level",
    stage: "Coding Completed",
    avgScore: 86,
    commScore: 92,
    codingScore: 80,
    architectureScore: 86,
    fillerWordsRate: "Optimal conversant (<1.2/min)",
    lastActive: "Yesterday, 04:15 pm",
    resumeDetails: "Highly proficient in PyTorch, scikit-learn models, training neural layer graphs, and model tuning algorithms."
  },
  {
    id: "app_3",
    name: "Rohan Das",
    email: "rohan.das@cse.tech",
    domain: "CSE",
    difficulty: "Senior Engineer",
    stage: "Tech Completed",
    avgScore: 78,
    commScore: 70,
    codingScore: 82,
    architectureScore: 82,
    fillerWordsRate: "Moderate fillers ('like', 'um')",
    lastActive: "June 06, 2026",
    resumeDetails: "Significant backend knowledge. Built custom in-memory distributed load-balancers and handled consistency constraints."
  },
  {
    id: "app_4",
    name: "Sneha Kulkarni",
    email: "sneha.k@datasci-labs.io",
    domain: "Data Sci",
    difficulty: "Junior",
    stage: "Applied",
    avgScore: 68,
    commScore: 78,
    codingScore: 60,
    architectureScore: 66,
    fillerWordsRate: "Hesitant pace (~1.8/min)",
    lastActive: "June 05, 2026",
    resumeDetails: "Interested in A/B testing, regression indexes, data visualizer charts, and standard statistical structures."
  },
  {
    id: "app_5",
    name: "Nikhil Joshi",
    email: "nikhil.j@cloudops.net",
    domain: "DevOps",
    difficulty: "Mid-Level",
    stage: "Tech Completed",
    avgScore: 82,
    commScore: 84,
    codingScore: 78,
    architectureScore: 84,
    fillerWordsRate: "Optimal conversation pace",
    lastActive: "June 03, 2026",
    resumeDetails: "Experienced in Docker orchestration, Kubernetes cluster nodes duplication, SRE metrics limits, and CI/CD pipelines rules."
  }
];

interface RecruiterDashboardProps {
  currentUser?: { username: string; email: string } | null;
  resumeProfile?: ResumeProfile | null;
  currentDomain?: string;
  currentDifficulty?: string;
}

export default function RecruiterDashboard({ 
  currentUser, 
  resumeProfile, 
  currentDomain = "CSE", 
  currentDifficulty = "Mid-Level" 
}: RecruiterDashboardProps) {
  const [applicants, setApplicants] = useState<Applicant[]>(() => {
    const saved = localStorage.getItem("prepai_recruiter_candidates");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved candidates", e);
      }
    }
    return APPLICANTS_MOCK;
  });

  useEffect(() => {
    localStorage.setItem("prepai_recruiter_candidates", JSON.stringify(applicants));
  }, [applicants]);

  const [selectedAppId, setSelectedAppId] = useState<string>("app_1");
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("ALL");

  // Form states for adding real user manually
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newCamName, setNewCamName] = useState("");
  const [newCamEmail, setNewCamEmail] = useState("");
  const [newCamDomain, setNewCamDomain] = useState("CSE");
  const [newCamDifficulty, setNewCamDifficulty] = useState("Mid-Level");
  const [newCamScore, setNewCamScore] = useState(88);
  const [newCamResume, setNewCamResume] = useState("");

  const currentUserEmail = currentUser?.email || "arnav.telangi24@pccoepune.org";
  const isProfileImported = applicants.some(a => a.email === currentUserEmail);

  const handleImportUserProfile = () => {
    if (!resumeProfile) return;
    
    // Check if already in list
    if (isProfileImported) return;

    const newApp: Applicant = {
      id: `real_user_${Date.now()}`,
      name: resumeProfile.name || "Real User",
      email: currentUserEmail,
      domain: currentDomain,
      difficulty: currentDifficulty,
      stage: "Applied",
      avgScore: 94,
      commScore: 92,
      codingScore: 96,
      architectureScore: 94,
      fillerWordsRate: "Extremely low counts (<0.4/min)",
      lastActive: "Just now",
      resumeDetails: `Imported Real User. Experience summary: ${resumeProfile.experienceSummary || "Not specified"}. Key Skills: ${resumeProfile.skills?.join(", ") || "None"}. Projects: ${resumeProfile.projects?.map(p => p.title).join(", ") || "None"}`
    };

    setApplicants(prev => [newApp, ...prev]);
    setSelectedAppId(newApp.id);
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName.trim()) return;

    const avgScoreVal = Number(newCamScore) || 85;
    const commSc = Math.min(100, Math.max(10, avgScoreVal + Math.floor(Math.random() * 10) - 5));
    const codSc = Math.min(100, Math.max(10, avgScoreVal + Math.floor(Math.random() * 10) - 5));
    const archSc = Math.min(100, Math.max(10, avgScoreVal + Math.floor(Math.random() * 10) - 5));

    const newApp: Applicant = {
      id: `custom_user_${Date.now()}`,
      name: newCamName.trim(),
      email: newCamEmail.trim() || "candidate@organization.net",
      domain: newCamDomain,
      difficulty: newCamDifficulty,
      stage: "Applied",
      avgScore: avgScoreVal,
      commScore: commSc,
      codingScore: codSc,
      architectureScore: archSc,
      fillerWordsRate: "Optimal conversation pacing (<1.1/min)",
      lastActive: "Just now",
      resumeDetails: newCamResume.trim() || "Parsed candidate details. Demonstrates solid competency and practical familiarity."
    };

    setApplicants(prev => [newApp, ...prev]);
    setSelectedAppId(newApp.id);
    setIsAddFormOpen(false);
    
    // Clear form
    setNewCamName("");
    setNewCamEmail("");
    setNewCamResume("");
  };

  const handleShortlistCandidate = (id: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage: "Shortlisted" } : app))
    );
  };

  const selectedApp = applicants.find((a) => a.id === selectedAppId) || applicants[0] || null;

  // Filter lists
  const filteredApplicants = applicants.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = domainFilter === "ALL" || app.domain === domainFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Enterprise Upper Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              Enterprise Recruiter Console
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Automated screening metrics, pipelines, and shortlist benchmarks</p>
          </div>
        </div>
        
        {/* Quick cumulative metrics */}
        <div className="flex gap-4 text-xs font-semibold">
          <div className="bg-[#13161c]/45 p-2.5 px-4 rounded-xl border border-[#2d333d] flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Total Pipeline:</span>
            <span className="text-white font-extrabold">{applicants.length}</span>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-2.5 px-4 rounded-xl border border-emerald-500/20 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span>Shortlisted:</span>
            <span className="font-extrabold">{applicants.filter(a => a.stage === "Shortlisted").length}</span>
          </div>
        </div>
      </div>

      {/* Real Candidate Quick Control Panel */}
      <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Candidate Manager
            </h2>
            <p className="text-[11px] text-slate-400">Add yourself or register real custom candidates into the ATS directory below to evaluate live interview readiness stats.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {/* Import Profile Button */}
            {resumeProfile ? (
              <button
                onClick={handleImportUserProfile}
                disabled={isProfileImported}
                className={`p-2.5 px-4 rounded-xl border font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  isProfileImported
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-450 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-550 border-indigo-500 text-white"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                {isProfileImported ? "Your Profile Sync'd" : "Import Your Real Profile"}
              </button>
            ) : (
              <div className="p-2.5 px-3 bg-slate-900/40 border border-dashed border-[#2d333d] text-slate-400 rounded-xl text-[10px] italic flex items-center gap-1">
                <span>Complete onboarding to import your active resume</span>
              </div>
            )}

            {/* Manual Candidate creation toggle button */}
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="p-2.5 px-4 bg-[#13161c] hover:bg-[#1a1e27] border border-[#2d333d] hover:border-slate-600 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {isAddFormOpen ? <X className="w-4 h-4 text-rose-400" /> : <UserPlus className="w-4 h-4 text-indigo-400" />}
              {isAddFormOpen ? "Cancel Form" : "Create Real Candidate"}
            </button>
          </div>
        </div>

        {/* Create Candidate Form Panel (Collapsible via motion) */}
        <AnimatePresence>
          {isAddFormOpen && (
            <motion.form
              onSubmit={handleCreateCandidate}
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              className="border-t border-[#2d333d]/50 pt-4 mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs overflow-hidden"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Candidate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. liam.h@gmail.com"
                  value={newCamEmail}
                  onChange={(e) => setNewCamEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono text-indigo-400">Expected Readiness Score (10-100)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  placeholder="e.g. 88"
                  value={newCamScore}
                  onChange={(e) => setNewCamScore(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Practice Domain</label>
                <select
                  value={newCamDomain}
                  onChange={(e) => setNewCamDomain(e.target.value)}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none"
                >
                  <option value="CSE">Software Engineering (CSE)</option>
                  <option value="AIML">AI / Machine Learning</option>
                  <option value="Data Sci">Data Science</option>
                  <option value="DevOps">DevOps & SRE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Seniority Level</label>
                <select
                  value={newCamDifficulty}
                  onChange={(e) => setNewCamDifficulty(e.target.value)}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior Engineer">Senior Engineer</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills & Brief Background / Resume Strengths summary</label>
                <textarea
                  placeholder="e.g. Mastered React concurrent rendering, Rust WASM pipelines structures, and high efficiency caching schemas..."
                  value={newCamResume}
                  onChange={(e) => setNewCamResume(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 transition text-[11px]"
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  className="p-3 px-6 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white font-extrabold rounded-xl text-xs transition uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add To ATS Directory
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side Column: Candidate Directory & Screening Statuses */}
        <div className="lg:col-span-1 space-y-4">
          
          <div className="bg-[#171b22]/70 p-4 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                id="recruiter_search"
                type="text"
                placeholder="Search candidates, universities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-3 bg-[#13161c]/60 rounded-xl border border-[#2d333d] text-slate-300 outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filtering Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter by target domain
              </label>
              <select
                id="recruiter_domain_filter"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#13161c]/45 border border-[#2d333d] text-slate-300 rounded-xl outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Domains</option>
                <option value="CSE">Software Engineering (CSE)</option>
                <option value="AIML">AI / Machine Learning</option>
                <option value="Data Sci">Data Science</option>
                <option value="DevOps">DevOps & SRE</option>
              </select>
            </div>

          </div>

          {/* Directory list */}
          <div className="bg-[#171b22]/70 p-4 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-2 max-h-[360px] overflow-y-auto">
            {filteredApplicants.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-4">No matching candidates found.</p>
            ) : (
              filteredApplicants.map((app) => (
                <div 
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex justify-between items-center group relative ${
                    selectedAppId === app.id
                      ? "bg-indigo-950/20 border-indigo-500 shadow-md shadow-indigo-500/5"
                      : "bg-[#13161c]/20 border-[#2d333d]/80 hover:border-slate-600"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-100 truncate">{app.name}</p>
                    <div className="flex gap-1.5 text-[9px] text-slate-400">
                      <span className="text-indigo-400 font-bold">{app.domain}</span>
                      <span>•</span>
                      <span>{app.difficulty}</span>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1 flex-shrink-0 flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-indigo-400 font-mono">{app.avgScore}%</span>
                      <p className={`text-[9px] font-extrabold uppercase tracking-wide ${
                        app.stage === "Shortlisted" ? "text-emerald-400" : "text-slate-500"
                      }`}>
                        {app.stage}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setApplicants(prev => prev.filter(cand => cand.id !== app.id));
                        if (selectedAppId === app.id) {
                          const remaining = applicants.filter(cand => cand.id !== app.id);
                          if (remaining.length > 0) {
                            setSelectedAppId(remaining[0].id);
                          } else {
                            setSelectedAppId("");
                          }
                        }
                      }}
                      className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-450 rounded-lg transition"
                      title="Remove Demo Candidate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Side Column: Target Candidate's AI Scorecard Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedApp ? (
            <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-6 shadow-xl animate-fade-in">
              
              {/* Profile Overview */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2d333d] pb-5">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">{selectedApp.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-0.5 bg-indigo-505/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold">
                      {selectedApp.domain} Domain Target
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#1e293b]/70 border border-[#2d333d] text-slate-300 rounded-full font-bold">
                      {selectedApp.difficulty}
                    </span>
                  </div>
                </div>

                {selectedApp.stage !== "Shortlisted" ? (
                  <button
                    id={`shortlist_btn_${selectedApp.id}`}
                    onClick={() => handleShortlistCandidate(selectedApp.id)}
                    className="p-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-[0.98] text-black font-extrabold rounded-xl shadow-lg shadow-emerald-500/10 text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 fill-current text-emerald-950/40" />
                    Shortlist Candidate
                  </button>
                ) : (
                  <span className="p-2 px-4 bg-emerald-500/10 text-emerald-400 font-black rounded-xl border border-emerald-500/20 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    👑 Placement Shortlisted
                  </span>
                )}
              </div>

              {/* General competency scorecard values */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#13161c]/45 p-4 rounded-xl border border-[#2d333d] text-center space-y-1 relative overflow-hidden group">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Alignment</span>
                  <div className="text-2xl font-black text-white">{selectedApp.avgScore}%</div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-600" />
                </div>

                <div className="bg-[#13161c]/45 p-4 rounded-xl border border-[#2d333d] text-center space-y-1 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Communication metrics</span>
                  <div className="text-2xl font-black text-white">{selectedApp.commScore}%</div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-600" />
                </div>

                <div className="bg-[#13161c]/45 p-4 rounded-xl border border-[#2d333d] text-center space-y-1 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Coding efficiency</span>
                  <div className="text-2xl font-black text-white">{selectedApp.codingScore}%</div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-violet-600" />
                </div>

                <div className="bg-[#13161c]/45 p-4 rounded-xl border border-[#2d333d] text-center space-y-1 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">System Design scaling</span>
                  <div className="text-2xl font-black text-white">{selectedApp.architectureScore}%</div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-orange-600" />
                </div>
              </div>

              {/* Articulation details */}
              <div className="bg-indigo-950/10 border border-indigo-500/10 p-4.5 rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span>Resume Insights Checklist:</span>
                </div>
                <p className="leading-relaxed">{selectedApp.resumeDetails}</p>
                <div className="text-[10px] text-indigo-400/80 font-bold flex gap-1.5 items-center">
                  <Trophy className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Filler syllables output: {selectedApp.fillerWordsRate}</span>
                </div>
              </div>

              {/* Contact parameters logs to invite candidate */}
              <div className="border-t border-[#2d333d] pt-5 space-y-3.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Candidate outreach metadata</span>
                <div className="flex flex-col sm:flex-row gap-3 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{selectedApp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>+1 (555) 0192-3849</span>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Compass className="w-4 h-4 text-slate-500" />
                    <span>Last Active: {selectedApp.lastActive}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#171b22]/70 p-8 rounded-2xl border border-[#2d333d] text-center text-slate-500 text-sm italic py-16">
              Please select a candidate profile from the directory to display their system scorecards.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
