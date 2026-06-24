import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Briefcase, 
  Mail, 
  Globe, 
  Github, 
  Linkedin, 
  Plus, 
  Trash2, 
  Award, 
  PenSquare, 
  Code, 
  ChevronRight, 
  Save, 
  Sparkles, 
  Building2, 
  Cpu, 
  Target, 
  Eye, 
  CheckCircle,
  FileText,
  Bookmark,
  Info,
  ExternalLink
} from "lucide-react";
import { ResumeProfile, Project } from "../types";

interface MyProfileProps {
  resumeProfile: ResumeProfile | null;
  domain: string;
  company: string;
  difficulty: string;
  onSave: (
    newDomain: string,
    newCompany: string,
    newDiff: string,
    newProfile: ResumeProfile | null
  ) => void;
  currentUser: {
    username: string;
    email: string;
  } | null;
}

export default function MyProfile({
  resumeProfile,
  domain: initialDomain,
  company: initialCompany,
  difficulty: initialDifficulty,
  onSave,
  currentUser
}: MyProfileProps) {
  // Local state for app preferences
  const [prefDomain, setPrefDomain] = useState(initialDomain);
  const [prefCompany, setPrefCompany] = useState(initialCompany);
  const [prefDifficulty, setPrefDifficulty] = useState(initialDifficulty);

  // Local state for profile values
  const [profName, setProfName] = useState(resumeProfile?.name || currentUser?.username || "Candidate");
  const [profBio, setProfBio] = useState(resumeProfile?.experienceSummary || "");
  const [skills, setSkills] = useState<string[]>(resumeProfile?.skills || [
    "React", "TypeScript", "Node.js", "System Design", "Algorithms"
  ]);
  const [projects, setProjects] = useState<Project[]>(resumeProfile?.projects || []);
  const [strengths, setStrengths] = useState<string[]>(resumeProfile?.strengths || [
    "System Scalability", "Algorithmic Efficiency", "Agile Leadership"
  ]);
  const [focusAreas, setFocusAreas] = useState<string[]>(resumeProfile?.suggestedFocusAreas || [
    "STAR communication framework", "Graph traversal optimizations"
  ]);

  // Socials and URLs
  const [portfolioUrl, setPortfolioUrl] = useState(resumeProfile?.portfolioUrl || "");
  const [githubUrl, setGithubUrl] = useState(resumeProfile?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(resumeProfile?.linkedinUrl || "");
  const [resumeCvUrl, setResumeCvUrl] = useState(resumeProfile?.resumeCvUrl || "");

  // Interactive controls
  const [newSkill, setNewSkill] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newFocus, setNewFocus] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "skills" | "projects" | "socials">("general");

  // Project Adder state
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTechText, setProjTechText] = useState("");
  const [showProjForm, setShowProjForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddStrength = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStrength.trim() && !strengths.includes(newStrength.trim())) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength("");
    }
  };

  const handleRemoveStrength = (item: string) => {
    setStrengths(strengths.filter(s => s !== item));
  };

  const handleAddFocusArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFocus.trim() && !focusAreas.includes(newFocus.trim())) {
      setFocusAreas([...focusAreas, newFocus.trim()]);
      setNewFocus("");
    }
  };

  const handleRemoveFocusArea = (item: string) => {
    setFocusAreas(focusAreas.filter(s => s !== item));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    const techs = projTechText
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newProj: Project = {
      title: projTitle.trim(),
      description: projDesc.trim(),
      technologies: techs.length > 0 ? techs : ["General Tech"]
    };

    setProjects([...projects, newProj]);
    setProjTitle("");
    setProjDesc("");
    setProjTechText("");
    setShowProjForm(false);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, idx) => idx !== index));
  };

  const handleTriggerSave = () => {
    setSaving(true);
    
    const updatedProfile: ResumeProfile = {
      name: profName.trim() || currentUser?.username || "Candidate",
      skills,
      experienceSummary: profBio.trim(),
      projects,
      strengths,
      suggestedFocusAreas: focusAreas,
      portfolioUrl: portfolioUrl.trim(),
      githubUrl: githubUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      resumeCvUrl: resumeCvUrl.trim()
    };

    setTimeout(() => {
      onSave(prefDomain, prefCompany, prefDifficulty, updatedProfile);
      setSaving(false);
    }, 800);
  };

  const menuItems = [
    { id: "general", label: "Preferences & Bio", icon: User, desc: "Personal metadata & brief biography summary" },
    { id: "skills", label: "Skills Taxonomy", icon: Code, desc: "Interactive key tech traits & strengths matrix" },
    { id: "projects", label: "Project Portfolio", icon: Briefcase, desc: "Highlight code showcases & core architectures" },
    { id: "socials", label: "External Connections", icon: Globe, desc: "Verifiable Github, LinkedIn, website & resume links" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Profile Header Block */}
      <div className="bg-[#171b22]/70 p-6 md:p-8 rounded-2xl border border-[#2d333d] backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10" />
        
        {/* Basic user info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center font-black text-lg shadow-inner">
            {profName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white font-sans tracking-tight flex items-center gap-2">
              <span>{profName}</span>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                {prefDifficulty}
              </span>
            </h2>
            <p className="text-slate-400 text-xs font-mono">{currentUser?.email || "No verified email linked"}</p>
          </div>
        </div>

        {/* Global actions bar */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={handleTriggerSave}
            disabled={saving}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition duration-150 text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-650/40 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Content: Left Sidebar Tabs / Right Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Nav buttons */}
        <div className="lg:col-span-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isTabActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full p-4 rounded-xl text-left border cursor-pointer transition flex items-start gap-3.5 select-none ${
                  isTabActive
                    ? "bg-slate-900/60 border-indigo-500/40 shadow-inner"
                    : "bg-[#171b22]/70 border-transparent hover:bg-slate-800/10"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isTabActive ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25" : "bg-slate-950 text-slate-500"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className={`text-xs font-extrabold block ${isTabActive ? "text-indigo-400" : "text-slate-200"}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block leading-snug">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl space-y-2 text-[10px] leading-relaxed text-slate-400">
            <div className="flex gap-2 text-indigo-450 font-black uppercase font-mono tracking-wider items-center">
              <Sparkles className="w-4 h-4" />
              <span>Matching Insights</span>
            </div>
            <p>
              Your skills and experience summary directly calibrate the interactive technical simulator prompts. Maintain correct references to ensure highly optimized interview role simulations.
            </p>
          </div>
        </div>

        {/* Dynamic Panel Area */}
        <div className="lg:col-span-8 bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] min-h-[420px] backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeSubTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-[#2d333d]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider">Preferences & Bio</h3>
                    <p className="text-[10px] text-slate-500">Formulate your core domain tracks and brief personal summary</p>
                  </div>
                  <User className="w-5 h-5 text-indigo-450" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#0b0d11] p-3 rounded-xl text-slate-200 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition font-sans"
                      placeholder="e.g. Arnav Telangi"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                    />
                  </div>

                  {/* Target Domain Preference */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Target Domain</label>
                    <select
                      className="w-full bg-[#0b0d11] p-3 rounded-xl text-slate-200 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition font-mono uppercase font-black"
                      value={prefDomain}
                      onChange={(e) => setPrefDomain(e.target.value)}
                    >
                      <option value="CSE">CSE / Software Engineering</option>
                      <option value="System">System Engineering & SRE</option>
                      <option value="WebDev">Full Stack Web Dev</option>
                      <option value="DataSci">Data Science / ML Ops</option>
                    </select>
                  </div>

                  {/* Target tier Company */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Target Tier / Company</label>
                    <select
                      className="w-full bg-[#0b0d11] p-3 rounded-xl text-slate-200 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition font-mono uppercase font-black"
                      value={prefCompany}
                      onChange={(e) => setPrefCompany(e.target.value)}
                    >
                      <option value="FAANG">FAANG (Google, Apple, Meta etc.)</option>
                      <option value="High-Growth Fintech">Fintech & High-Frequency Scale</option>
                      <option value="Unicorn Startup">Unicorn Startup Cohorts</option>
                      <option value="Mid-Market Enterprise">Legacy Mid-Market & Cloud</option>
                    </select>
                  </div>

                  {/* Target Difficulty */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Simulated Career Grade</label>
                    <select
                      className="w-full bg-[#0b0d11] p-3 rounded-xl text-slate-200 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition font-mono uppercase font-black"
                      value={prefDifficulty}
                      onChange={(e) => setPrefDifficulty(e.target.value)}
                    >
                      <option value="Junior-Level">Junior software developer</option>
                      <option value="Mid-Level">Mid-Level track specialist</option>
                      <option value="Senior-Level">Senior / Tech Lead designer</option>
                      <option value="Staff/Principal">Staff / Principal architect</option>
                    </select>
                  </div>
                </div>

                {/* Experience Summary Area */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Professional Biography Summary</label>
                  <textarea
                    rows={4}
                    className="w-full bg-[#0b0d11] p-3 rounded-xl text-slate-300 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition leading-relaxed"
                    placeholder="Provide a brief summary of your tech stack, system capabilities, past scale challenges, and overall development expertise..."
                    value={profBio}
                    onChange={(e) => setProfBio(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {activeSubTab === "skills" && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-[#2d333d]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider">Skills Taxonomy</h3>
                    <p className="text-[10px] text-slate-500">Maintain high impact engineering keywords and traits catalog</p>
                  </div>
                  <Code className="w-5 h-5 text-indigo-455" />
                </div>

                {/* Technical Skills Board */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Core Skills Repository</span>
                  
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-950/40 rounded-xl border border-[#2d333d]/55 min-h-[80px]">
                    {skills.length === 0 ? (
                      <span className="text-xs text-slate-500 font-mono italic">No interactive skills registered yet. Add skills below!</span>
                    ) : (
                      skills.map(s => (
                        <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 rounded-lg text-xs font-mono">
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s)}
                            className="p-0.5 text-slate-550 hover:text-rose-400 rounded transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add skill form */}
                  <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      className="flex-1 bg-[#0b0d11] p-2.5 rounded-lg text-slate-200 border border-[#2d333d] text-xs outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="e.g. Kubernetes"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-900 border border-[#2d333d] hover:border-indigo-505 text-indigo-400 text-xs rounded-lg font-black transition cursor-pointer flex items-center gap-1 uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" /> add
                    </button>
                  </form>
                </div>

                {/* Strengths & Focus Areas block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Strengths lists */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Career Strengths</span>
                    <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-xl border border-[#2d333d]/40 min-h-[110px] max-h-[140px] overflow-y-auto">
                      {strengths.map(st => (
                        <div key={st} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-baseline gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                            <span>{st}</span>
                          </span>
                          <button onClick={() => handleRemoveStrength(st)} className="text-slate-555 hover:text-rose-400 p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddStrength} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add strength..."
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        className="flex-1 bg-[#0b0d11] p-2 text-xs text-slate-200 border border-[#2d333d] rounded-lg outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className="px-3 py-2 bg-slate-900 border border-[#2d333d] text-slate-300 rounded-lg">+</button>
                    </form>
                  </div>

                  {/* Growth Areas list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Suggested Target Areas</span>
                    <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-xl border border-[#2d333d]/40 min-h-[110px] max-h-[140px] overflow-y-auto">
                      {focusAreas.map(fa => (
                        <div key={fa} className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-baseline gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                            <span>{fa}</span>
                          </span>
                          <button onClick={() => handleRemoveFocusArea(fa)} className="text-slate-555 hover:text-rose-400 p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddFocusArea} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add focus area..."
                        value={newFocus}
                        onChange={(e) => setNewFocus(e.target.value)}
                        className="flex-1 bg-[#0b0d11] p-2 text-xs text-slate-200 border border-[#2d333d] rounded-lg outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className="px-3 py-2 bg-slate-900 border border-[#2d333d] text-slate-300 rounded-lg">+</button>
                    </form>
                  </div>

                </div>
              </motion.div>
            )}

            {activeSubTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-[#2d333d]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider">Project Portfolio</h3>
                    <p className="text-[10px] text-slate-500">Record core technical systems to back behavioral mock statements</p>
                  </div>
                  <Briefcase className="w-5 h-5 text-indigo-460" />
                </div>

                {/* Projects grid list */}
                <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
                  {projects.length === 0 ? (
                    <div className="p-6 text-center bg-slate-950/20 border border-dashed border-[#2d333d] rounded-xl">
                      <p className="text-xs text-slate-450 font-medium">No showcased projects registered. Populate high priority architectures below.</p>
                    </div>
                  ) : (
                    projects.map((proj, idx) => (
                      <div key={idx} className="bg-[#0b0d11] p-4 rounded-xl border border-[#2d333d] relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-rose-450 bg-[#171b22] border border-[#2d333d] rounded-lg transition"
                          title="Delete Project info"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1.5 md:mr-10">
                          <h4 className="text-xs font-extrabold text-white">{proj.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{proj.description}</p>
                          
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.technologies.map(tech => (
                              <span key={tech} className="px-1.5 py-0.5 bg-slate-900 border border-[#2d333d] text-[9px] font-mono text-indigo-400 rounded uppercase">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Project adder block toggle */}
                <div className="pt-2">
                  {!showProjForm ? (
                    <button
                      type="button"
                      onClick={() => setShowProjForm(true)}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-indigo-400 text-xs rounded-xl font-bold flex items-center gap-1.5 border border-[#2d333d] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Showcase Project
                    </button>
                  ) : (
                    <form onSubmit={handleCreateProject} className="bg-slate-950/40 p-4 rounded-xl border border-indigo-500/20 space-y-3.5 relative">
                      <div className="flex justify-between items-center pb-1 border-b border-[#2d333d]/40">
                        <span className="text-[9px] uppercase font-mono font-black text-indigo-400">New Portfolio Node</span>
                        <button type="button" onClick={() => setShowProjForm(false)} className="text-slate-500 text-xs">Cancel</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Project Title</label>
                          <input
                            type="text"
                            placeholder="e.g. distributed ledger engine"
                            required
                            value={projTitle}
                            onChange={(e) => setProjTitle(e.target.value)}
                            className="w-full bg-[#0b0d11] text-xs p-2.5 border border-[#2d333d] rounded-lg text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Tech Stack (comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Go, Kafka, Redis"
                            value={projTechText}
                            onChange={(e) => setProjTechText(e.target.value)}
                            className="w-full bg-[#0b0d11] text-xs p-2.5 border border-[#2d333d] rounded-lg text-white focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">System Description / Solution Architecture</label>
                        <textarea
                          placeholder="What architectural problem did this solve? Describe microservice roles, datastores & bottlenecks handled..."
                          rows={2}
                          value={projDesc}
                          onChange={(e) => setProjDesc(e.target.value)}
                          className="w-full bg-[#0b0d11] text-xs p-2.5 border border-[#2d333d] rounded-lg text-slate-300 focus:border-indigo-500 font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/35 text-indigo-400 hover:text-white text-xs font-black rounded-lg transition uppercase tracking-wider cursor-pointer"
                      >
                        Register Project
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}

            {activeSubTab === "socials" && (
              <motion.div
                key="socials"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <div className="border-b border-[#2d333d]/50 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white font-sans uppercase tracking-wider">External Connections</h3>
                    <p className="text-[10px] text-slate-500">Enable recruiters to parse validated source profiles</p>
                  </div>
                  <Globe className="w-5 h-5 text-indigo-450" />
                </div>

                <div className="space-y-4 pt-1">
                  
                  {/* Portfolio Link */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#a5b4fc]" />
                      <span>Portfolio Website URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://myportfolio.io"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-[#0b0d11] text-xs p-3 border border-[#2d333d] rounded-xl text-slate-350 focus:border-indigo-500"
                    />
                  </div>

                  {/* GitHub link */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-455 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Github className="w-3.5 h-3.5 text-slate-350" />
                      <span>GitHub Username or Repository Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/myusername"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-[#0b0d11] text-xs p-3 border border-[#2d333d] rounded-xl text-slate-350 focus:border-indigo-500"
                    />
                  </div>

                  {/* LinkedIn Profile */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-455 uppercase font-mono tracking-wider flex items-center gap-2">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                      <span>LinkedIn Professional Profile</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/myprofile"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-[#0b0d11] text-xs p-3 border border-[#2d333d] rounded-xl text-slate-350 focus:border-indigo-500"
                    />
                  </div>

                  {/* CV Resume link */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-455 uppercase font-mono tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-405" />
                      <span>Verifiable PDF Resume / CV Cloud Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/.../view"
                      value={resumeCvUrl}
                      onChange={(e) => setResumeCvUrl(e.target.value)}
                      className="w-full bg-[#0b0d11] text-xs p-3 border border-[#2d333d] rounded-xl text-slate-350 focus:border-indigo-500"
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick inline info banner */}
          <div className="flex gap-2.5 items-start mt-6 p-3 bg-indigo-500/5 rounded-xl border border-[#2d333d]/50 text-[10px] text-slate-450 leading-relaxed font-sans">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 text-left" />
            <p>
              Your verified resume cv profile handles automatic score sync mappings for the simulated interviewer. To update these details, save using the primary header action.
            </p>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
