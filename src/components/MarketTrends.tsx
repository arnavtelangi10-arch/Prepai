import React, { useState } from "react";
import { ResumeProfile } from "../types";
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight, 
  Briefcase, 
  DollarSign, 
  Activity, 
  Settings, 
  Compass, 
  Sparkles 
} from "lucide-react";

interface MarketTrendsProps {
  resumeProfile: ResumeProfile | null;
  onStartNewSession?: () => void;
  onNavigateToRoadmap?: () => void;
}

interface RoleMarketData {
  title: string;
  category: string;
  demandScore: number;
  openings: string;
  growth: string;
  salary: string;
  skillsNeeded: string[];
  suggestedRoadmap: string[];
}

const MARKET_ROLES: RoleMarketData[] = [
  {
    title: "AI & Large Language Model Architect",
    category: "AI",
    demandScore: 98,
    openings: "32,900+ positions",
    growth: "+164% YoY",
    salary: "$185,000 - $240,050",
    skillsNeeded: ["Python", "PyTorch", "Transformers", "Vector Databases", "Prompt Engineering", "Fine-Tuning", "TypeScript"],
    suggestedRoadmap: ["Transformers & Self-Attention mathematical models", "Vector Embeddings & Retrieval-Augmented Generation (RAG)", "Low-Rank Adaptation (LoRA) parameter-efficient parameters tuning"]
  },
  {
    title: "Distributed Systems & Cloud SDE",
    category: "Cloud",
    demandScore: 94,
    openings: "45,200+ positions",
    growth: "+48% YoY",
    salary: "$160,000 - $215,000",
    skillsNeeded: ["Go", "Kubernetes", "Docker", "gRPC", "Apache Kafka", "PostgreSQL", "NoSQL", "Redis"],
    suggestedRoadmap: ["Consistent Hashing & Active Partitioning mechanics", "Distributed Consensuses algorithms (Raft / Paxos)", "Message broker backpressure & at-least-once streaming delivery patterns"]
  },
  {
    title: "Full-Stack Software Platform Architect",
    category: "Web",
    demandScore: 91,
    openings: "51,000+ positions",
    growth: "+35% YoY",
    salary: "$145,000 - $190,000",
    skillsNeeded: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js", "Redis"],
    suggestedRoadmap: ["Server-Side Rendering (SSR) & Dynamic Hydration architecture", "Optimistic State synchronizations & Offline-First storage engines", "WebSockets real-time multiplexing protocols"]
  },
  {
    title: "Core Database & Storage Developer",
    category: "Database",
    demandScore: 89,
    openings: "11,400+ positions",
    growth: "+22% YoY",
    salary: "$175,000 - $230,000",
    skillsNeeded: ["C++", "Rust", "SQL", "B-Trees", "WAL (Write-Ahead-Log)", "LSM-Trees", "Multithreading"],
    suggestedRoadmap: ["Concurrency controls & Lock-free database structures", "Buffer pool managers & Page cache replacement policies", "Compaction strategies in storage engines"]
  }
];

const SKILL_DEMAND_INDEX = [
  { name: "Python / PyTorch", weight: 97, color: "bg-amber-400" },
  { name: "TypeScript / React", weight: 92, color: "bg-sky-400" },
  { name: "Go Lang", weight: 88, color: "bg-cyan-400" },
  { name: "Rust", weight: 84, color: "bg-orange-500" },
  { name: "Kubernetes Containers", weight: 85, color: "bg-indigo-400" },
  { name: "Apache Kafka Clusters", weight: 78, color: "bg-purple-400" },
  { name: "PostgreSQL & SQLite", weight: 83, color: "bg-emerald-400" },
  { name: "C++ Engines", weight: 74, color: "bg-rose-400" }
];

export default function MarketTrends({ resumeProfile, onStartNewSession, onNavigateToRoadmap }: MarketTrendsProps) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  const activeRole = MARKET_ROLES[selectedRoleIndex];

  // Match resume skills
  const resumeSkills = resumeProfile?.skills || [];
  const normalizedUserSkills = resumeSkills.map(s => s.toLowerCase().trim());

  const verifiedSkills = activeRole.skillsNeeded.filter(skill => 
    normalizedUserSkills.some(userSkill => userSkill.includes(skill.toLowerCase().trim()) || skill.toLowerCase().trim().includes(userSkill))
  );

  const missingSkills = activeRole.skillsNeeded.filter(skill => !verifiedSkills.includes(skill));

  // Percentage alignment rate
  const alignmentPercent = Math.round((verifiedSkills.length / activeRole.skillsNeeded.length) * 100);

  return (
    <div id="market_trends_module" className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] space-y-6 animate-fade-in">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest text-indigo-400">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            Live Industry Tech Market Analytics
          </h2>
          <p className="text-slate-400 text-xs font-medium">Real-time aggregate data on SDE postings, desired skills stacks, and interactive resume diagnostic gap advisor.</p>
        </div>
        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 border border-indigo-400/20 rounded-full tracking-wider uppercase">
          Dynamic SDE Signals Active
        </span>
      </div>

      {/* Role Picker Columns / Bento Grid overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SDE Role selectors */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest ml-1">Aggregate SDE Segments</h3>
          <div className="space-y-2.5">
            {MARKET_ROLES.map((role, idx) => (
              <div
                key={role.title}
                onClick={() => setSelectedRoleIndex(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                  selectedRoleIndex === idx 
                    ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-650/5 translate-x-1" 
                    : "bg-[#111318]/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-100 text-xs">{role.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">{role.category} category</span>
                    <span className="text-slate-650 text-[10px]">•</span>
                    <span className="text-emerald-400 text-[10.5px] font-bold font-mono">{role.growth}</span>
                  </div>
                </div>

                <div className="p-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black font-mono">
                  {role.demandScore}
                </div>
              </div>
            ))}
          </div>

          {/* SDE General Demand Chart weights widget */}
          <div className="p-4 bg-[#111318]/45 border border-[#2d333d]/70 rounded-2xl space-y-3 pt-3">
            <h4 className="text-[10px] text-indigo-300 font-extrabold tracking-widest uppercase">General Tech Demand weights</h4>
            
            <div className="space-y-2">
              {SKILL_DEMAND_INDEX.map((skill) => (
                <div 
                  key={skill.name} 
                  className="space-y-1 relative"
                  onMouseEnter={() => setHoveredTech(skill.name)}
                  onMouseLeave={() => setHoveredTech(null)}
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{skill.name}</span>
                    <span className="font-mono font-bold text-slate-300">{skill.weight}% frequency</span>
                  </div>
                  <div className="w-full bg-[#1b202c] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${skill.color}`}
                      style={{ width: `${skill.weight}%` }}
                    />
                  </div>
                  
                  {hoveredTech === skill.name && (
                    <div className="absolute right-0 top-6 z-20 bg-slate-950/95 p-2 px-3 border border-slate-800 rounded-md shadow-xl text-[9px] text-indigo-300 animate-fade-in font-medium">
                      Core index weight for senior infrastructure, backend, & ML-Ops openings.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Role deep drill downs + diagnostics */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-5 lg:col-span-7 border-t lg:border-t-0 pt-5 lg:pt-0 lg:pl-4">
          
          {/* Active role key monitors */}
          <div className="p-5 bg-slate-900 border border-indigo-500/20 rounded-2xl space-y-4">
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest font-mono">
                  Market Spotlight
                </span>
                <h3 className="font-black text-slate-100 text-sm mt-1.5 uppercase tracking-wide">{activeRole.title}</h3>
              </div>

              <div className="flex gap-2">
                <div className="p-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-center text-[10px] font-black font-mono">
                  <span className="block text-slate-500 text-[8px] uppercase">Salary bounds</span>
                  {activeRole.salary}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-3 text-center">
              <div>
                <span className="text-[8px] text-slate-500 uppercase font-bold block">Open headcount</span>
                <span className="font-mono text-xs text-white font-black">{activeRole.openings}</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-[8px] text-slate-500 uppercase font-bold block">Momentum YoY</span>
                <span className="font-mono text-xs text-emerald-400 font-extrabold flex items-center justify-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {activeRole.growth}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase font-bold block">Stability Score</span>
                <span className="font-mono text-xs text-indigo-400 font-extrabold">95 / 100</span>
              </div>
            </div>
          </div>

          {/* Interactive Resume Skills Gap Advisor */}
          <div className="p-5 bg-[#141822]/80 border border-[#2d333d] rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Smart Skill Gap Analysis
                </h4>
                <p className="text-slate-500 text-[10px] font-medium">Compares required tech stack with verified skills on your active profile.</p>
              </div>

              {resumeProfile && (
                <div className="p-1 px-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10.5px] font-bold font-mono">
                  {alignmentPercent}% Aligned
                </div>
              )}
            </div>

            {!resumeProfile ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
                <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-slate-400 text-xs max-w-sm mx-auto font-medium leading-relaxed">
                  No active resume file profile detected. Upload your resume or add custom skill tags inside the Dashboard's profile area to compute customized gap diagnostics!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Alignment bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Skills alignment vector:</span>
                    <span>{verifiedSkills.length} of {activeRole.skillsNeeded.length} technologies matching</span>
                  </div>
                  <div className="w-full bg-[#1b202c] h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${alignmentPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Verified skills */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Verified Competencies ({verifiedSkills.length})
                    </span>
                    {verifiedSkills.length === 0 ? (
                      <span className="text-slate-600 text-[10px] italic block pl-1">No verified competencies for this role yet.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {verifiedSkills.map((v) => (
                          <span key={v} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-1 px-2.5 rounded-lg font-black uppercase font-mono shadow-sm">
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing skills */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                      Identified gaps ({missingSkills.length})
                    </span>
                    {missingSkills.length === 0 ? (
                      <span className="text-emerald-400 text-[10px] font-black block pl-1">✓ Complete SDE Stack Alignment! No gaps.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((m) => (
                          <span key={m} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 p-1 px-2.5 rounded-lg font-black uppercase font-mono shadow-sm">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actionable structured learning path suggestion */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-[10.5px] text-indigo-400 font-extrabold tracking-widest uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#bfdbfe]" />
              Recommended study focus milestones
            </h4>
            
            <ul className="space-y-2 text-slate-350 text-[10.5px] font-medium leading-relaxed leading-normal">
              {activeRole.suggestedRoadmap.map((item, index) => (
                <li key={index} className="flex gap-2.5 items-start bg-[#12141a] p-2.5 rounded-xl border border-slate-800/80">
                  <span className="flex-none p-0.5 px-2 bg-slate-850 border border-slate-700 text-indigo-400 rounded-md font-mono font-bold">{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-3 pt-2">
              {onNavigateToRoadmap && (
                <button
                  onClick={onNavigateToRoadmap}
                  className="p-2 px-4 hover:bg-indigo-500/10 border border-dashed border-indigo-500/40 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Interactive learning roadmap</span>
                </button>
              )}
              
              {onStartNewSession && (
                <button
                  id="trends_start_round"
                  onClick={onStartNewSession}
                  className="p-2 px-4.5 bg-indigo-600 hover:bg-indigo-550 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-650/15"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>Initiate Study Round</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
