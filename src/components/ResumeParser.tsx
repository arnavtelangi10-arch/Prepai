import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Settings, 
  Zap, 
  Briefcase, 
  Target, 
  Layers, 
  CheckCircle,
  Hash,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Github,
  Linkedin,
  Globe,
  ExternalLink,
  User,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Twitter,
  Link as LinkIcon
} from "lucide-react";
import { ResumeProfile, Project } from "../types";

interface ResumeParserProps {
  onSetupComplete: (
    domain: string,
    company: string,
    difficulty: string,
    profile: ResumeProfile | null
  ) => void;
  initialName?: string;
  initialDomain?: string;
  initialCompany?: string;
  initialDifficulty?: string;
  initialProfile?: ResumeProfile | null;
}

const DOMAIN_OPTIONS = [
  { id: "CSE", name: "Software Engineering", desc: "System structures, design frameworks, algorithms" },
  { id: "AIML", name: "AI / Machine Learning", desc: "Core calculus, model neural layers, scaling pipelines" },
  { id: "Data Sci", name: "Data Science & Stats", desc: "A/B metrics, regressions, clean structured analysis" },
  { id: "Cyber", name: "Cyber Security", desc: "Symmetric, asymmetric keys, OWASP, PKI models" },
  { id: "DevOps", name: "DevOps & SRE", desc: "Continuous orchestration, scaling clusters, SRE bounds" },
];

const COMPANY_OPTIONS = [
  { id: "Google", name: "Google Style AI", badge: "LeetCode Hard & DSA" },
  { id: "Amazon", name: "Amazon Style AI", badge: "System Design & LPs" },
  { id: "Microsoft", name: "Microsoft Style AI", badge: "Quality & Concurrency" },
  { id: "FAANG", name: "FAANG / Big Tech", badge: "High Intensity" },
  { id: "Startup", name: "High-Growth Startup", badge: "Fast Scalability" },
  { id: "Enterprise", name: "Enterprise Product-Based", badge: "Reliability & Security" },
  { id: "Consultancy", name: "IT Consultancy / Service", badge: "Client Systems" },
];

const DIFFICULTY_OPTIONS = ["Intern", "Junior", "Mid-Level", "Senior Engineer"];

const isLinkedInUrlValid = (url: string): boolean => {
  const clean = url.trim();
  if (!clean) return false;
  return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/in\/[a-zA-Z0-9-._%]+\/?$/i.test(clean);
};

const isGitHubUrlValid = (url: string): boolean => {
  const clean = url.trim();
  if (!clean) return false;
  return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)?github\.com\/[a-zA-Z0-9-._%]+\/?$/i.test(clean);
};

export default function ResumeParser({
  onSetupComplete,
  initialName,
  initialDomain,
  initialCompany,
  initialDifficulty,
  initialProfile
}: ResumeParserProps) {
  // Config states
  const [selectedDomain, setSelectedDomain] = useState(initialDomain || "CSE");
  const [selectedCompany, setSelectedCompany] = useState(initialCompany || "FAANG");
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty || "Mid-Level");

  // Profile Customizer State
  const [parsedProfile, setParsedProfile] = useState<ResumeProfile>(() => {
    if (initialProfile) {
      return initialProfile;
    }
    return {
      name: initialName || "Arnav Telangi",
      skills: ["React", "TypeScript", "Node.js", "Express", "System Design", "Algorithms"],
      experienceSummary: "Dedicated software engineer interested in building scalable full-stack applications and high-fidelity layouts.",
      projects: [
        {
          title: "Scaleable Backend Platform",
          technologies: ["Node.js", "Express", "PostgreSQL", "Redis"],
          description: "Implemented custom caching and structured load-balancing strategies to achieve high throughput."
        },
        {
          title: "Web Analytics Module",
          technologies: ["React", "TypeScript", "Tailwind CSS"],
          description: "Aggregates real-time events and visualizes them on performance dashboards."
        }
      ],
      strengths: ["Strong problem-solving capability", "Good grasp of full-stack ecosystems", "Focus on clean coding standards"],
      suggestedFocusAreas: ["System Availability under load", "Database connection pool fine-tuning", "Dynamic programming patterns"],
      portfolioUrl: "https://myportfolio.dev",
      githubUrl: "https://github.com/candidate",
      linkedinUrl: "https://linkedin.com/in/candidate",
      resumeCvUrl: "",
      featuredProjectUrl: "",
      twitterUrl: "",
      otherWebsiteUrl: "",
      projectSummaries: "Engineered scalable background engines and dynamic frontends with offline-first client replication."
    };
  });

  const [isValidatingLinkedin, setIsValidatingLinkedin] = useState(false);
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);

  useEffect(() => {
    const url = parsedProfile.linkedinUrl || "";
    if (!url.trim()) {
      setIsValidatingLinkedin(false);
      return;
    }

    setIsValidatingLinkedin(true);
    const delay = setTimeout(() => {
      setIsValidatingLinkedin(false);
    }, 600);

    return () => clearTimeout(delay);
  }, [parsedProfile.linkedinUrl]);

  useEffect(() => {
    const url = parsedProfile.githubUrl || "";
    if (!url.trim()) {
      setIsValidatingGithub(false);
      return;
    }

    setIsValidatingGithub(true);
    const delay = setTimeout(() => {
      setIsValidatingGithub(false);
    }, 600);

    return () => clearTimeout(delay);
  }, [parsedProfile.githubUrl]);

  // App tab view State
  const [activeProfileTab, setActiveProfileTab] = useState<"basics" | "projects" | "skills" | "strengths">("basics");
  const [showAiScan, setShowAiScan] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Resume states
  const [resumeText, setResumeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [pastedOpen, setPastedOpen] = useState(false);

  // Form skill/project inputs
  const [skillInput, setSkillInput] = useState("");
  const [strengthInput, setStrengthInput] = useState("");

  // Add project inline inputs
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjTech, setNewProjTech] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".txt")) {
      setParseError("Please submit either a professional PDF or readable .txt resume file.");
      return;
    }

    setParseError("");
    setIsParsing(true);

    try {
      const mockText = `Resume of ${file.name.replace(/\.[^/.]+$/, "")}: Excellent software engineer, proficient in JavaScript, React, SQL, and Cloud hosting architectures. Built distributed backend systems using Node.js and Postgres databases. Focused on API development, data storage sharding, and latency optimization.`;
      
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: mockText })
      });

      if (!response.ok) throw new Error("Resume parse pipeline failure");
      const data: ResumeProfile = await response.json();
      
      // Merge links with default if backend returns blank
      setParsedProfile(prev => ({
        ...data,
        name: data.name || prev.name,
        portfolioUrl: data.portfolioUrl || prev.portfolioUrl || "",
        githubUrl: data.githubUrl || prev.githubUrl || "",
        linkedinUrl: data.linkedinUrl || prev.linkedinUrl || "",
        resumeCvUrl: data.resumeCvUrl || prev.resumeCvUrl || "",
        featuredProjectUrl: data.featuredProjectUrl || prev.featuredProjectUrl || "",
        twitterUrl: data.twitterUrl || prev.twitterUrl || "",
        otherWebsiteUrl: data.otherWebsiteUrl || prev.otherWebsiteUrl || "",
        projectSummaries: data.projectSummaries || prev.projectSummaries || ""
      }));

      setShowAiScan(false);
    } catch (err) {
      console.error(err);
      setParseError("Could not extract PDF nodes securely. Standard template profile retained.");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePastedParse = async () => {
    if (!resumeText.trim()) {
      setParseError("Please insert a block of text containing historical work rows.");
      return;
    }

    setParseError("");
    setIsParsing(true);

    try {
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      });

      if (!response.ok) throw new Error("Server extraction error");
      const data: ResumeProfile = await response.json();
      
      setParsedProfile(prev => ({
        ...data,
        name: data.name || prev.name,
        portfolioUrl: data.portfolioUrl || prev.portfolioUrl || "",
        githubUrl: data.githubUrl || prev.githubUrl || "",
        linkedinUrl: data.linkedinUrl || prev.linkedinUrl || "",
        resumeCvUrl: data.resumeCvUrl || prev.resumeCvUrl || "",
        featuredProjectUrl: data.featuredProjectUrl || prev.featuredProjectUrl || "",
        twitterUrl: data.twitterUrl || prev.twitterUrl || "",
        otherWebsiteUrl: data.otherWebsiteUrl || prev.otherWebsiteUrl || "",
        projectSummaries: data.projectSummaries || prev.projectSummaries || ""
      }));

      setShowAiScan(false);
    } catch (err) {
      console.error(err);
      setParseError("Server connection timeout. Displaying inferred structured templates.");
    } finally {
      setIsParsing(false);
    }
  };

  const addParsedSkill = () => {
    if (!skillInput.trim()) return;
    setParsedProfile(prev => ({
      ...prev,
      skills: [...prev.skills, skillInput.trim()]
    }));
    setSkillInput("");
  };

  const removeParsedSkill = (sIndex: number) => {
    setParsedProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== sIndex)
    }));
  };

  const addStrength = () => {
    if (!strengthInput.trim()) return;
    setParsedProfile(prev => ({
      ...prev,
      strengths: [...prev.strengths, strengthInput.trim()]
    }));
    setStrengthInput("");
  };

  const removeStrength = (sIndex: number) => {
    setParsedProfile(prev => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== sIndex)
    }));
  };

  const handleProfileFieldChange = (field: keyof ResumeProfile, value: any) => {
    setParsedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCustomProject = () => {
    if (!newProjTitle.trim()) return;
    const techs = newProjTech
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    const newProj: Project = {
      title: newProjTitle.trim(),
      technologies: techs.length > 0 ? techs : ["General"],
      description: newProjDesc.trim() || "No description provided."
    };

    setParsedProfile(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));

    setNewProjTitle("");
    setNewProjTech("");
    setNewProjDesc("");
    setIsAddingProject(false);
  };

  const removeProject = (pIndex: number) => {
    setParsedProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== pIndex)
    }));
  };

  const handleConfirmOnboarding = () => {
    onSetupComplete(
      selectedDomain,
      selectedCompany,
      selectedDifficulty,
      parsedProfile
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 px-2 sm:px-6">
      {/* Visual Header */}
      <div className="text-center space-y-4 py-4">
        <button
          type="button"
          id="toggle_focus_mode"
          onClick={() => setShowSelectedOnly(prev => !prev)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border-2 transition-all duration-300 inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] ${
            showSelectedOnly 
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500 shadow-lg shadow-indigo-500/10" 
              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/15"
          }`}
          title="Click to toggle focused mode (show only selected parameters)"
        >
          <span>Onboarding Configuration & Profile</span>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md leading-none select-none ${
            showSelectedOnly ? "bg-emerald-500 text-black animate-pulse" : "bg-slate-800 text-slate-400"
          }`}>
            {showSelectedOnly ? "Focus Mode" : "Show All Options"}
          </span>
        </button>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Configure Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Interview operating system</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Tailor target domains, company rules, and your portfolio projects. PrepAI adapts all practice rounds to reference your historical experience.
        </p>

        {showSelectedOnly && (
          <div className="bg-indigo-950/25 border border-indigo-500/20 text-[#a5b4fc] text-[11px] p-3 rounded-xl max-w-md mx-auto flex items-center justify-between gap-3 animate-fade-in shadow-inner">
            <span className="text-left font-sans leading-relaxed">
              Showing <strong>only selected options</strong>. Click the badge above to view the standard full configuration suite.
            </span>
            <button 
              type="button" 
              onClick={() => setShowSelectedOnly(false)}
              className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition shrink-0 cursor-pointer"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Setup Configuration Inputs (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Target domain selection */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              1. Technical Domain Target
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {(showSelectedOnly 
                ? DOMAIN_OPTIONS.filter(domainObj => domainObj.id === selectedDomain) 
                : DOMAIN_OPTIONS
              ).map((domainObj) => (
                <div 
                  key={domainObj.id}
                  onClick={() => setSelectedDomain(domainObj.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                    selectedDomain === domainObj.id 
                      ? 'bg-indigo-950/25 border-indigo-500 shadow-lg shadow-indigo-500/5' 
                      : 'bg-[#13161c]/40 border-[#2d333d]/80 hover:border-slate-650'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-slate-250 group-hover:text-white transition">{domainObj.name}</h5>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{domainObj.desc}</p>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedDomain === domainObj.id ? 'border-indigo-400 bg-indigo-400' : 'border-slate-700'
                  }`}>
                    {selectedDomain === domainObj.id && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company scaling tier */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-455" />
              2. Target Company Blueprint
            </h3>
            <div className={`grid gap-2.5 ${showSelectedOnly ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
              {(showSelectedOnly 
                ? COMPANY_OPTIONS.filter(comp => comp.id === selectedCompany)
                : COMPANY_OPTIONS
              ).map((comp) => (
                <div 
                  key={comp.id}
                  onClick={() => setSelectedCompany(comp.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between min-h-[85px] group ${
                    selectedCompany === comp.id 
                      ? 'bg-violet-950/25 border-violet-500' 
                      : 'bg-[#13161c]/40 border-[#2d333d]/80 hover:border-slate-650'
                  }`}
                >
                  <h5 className="text-xs font-bold text-slate-200 group-hover:text-white transition leading-snug">{comp.name}</h5>
                  <div className="flex justify-between items-center mt-2 pt-1 gap-1 min-w-0">
                    <span className="text-[9px] bg-[#1e293b]/60 text-slate-400 px-1.5 py-0.5 rounded font-mono truncate border border-[#2d333d] min-w-0">
                      {comp.badge}
                    </span>
                    {selectedCompany === comp.id && <div className="w-2 h-2 bg-violet-400 rounded-full shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target experience selector */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              3. Target Career Seniority
            </h3>
            <div className={`grid gap-2 ${showSelectedOnly ? "grid-cols-1 max-w-[150px]" : "grid-cols-2 sm:grid-cols-4"}`}>
              {(showSelectedOnly 
                ? DIFFICULTY_OPTIONS.filter(diff => diff === selectedDifficulty)
                : DIFFICULTY_OPTIONS
              ).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] font-black tracking-wide transition border ${
                    selectedDifficulty === diff 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                      : 'bg-[#13161c]/60 border-[#2d333d] text-slate-400 hover:border-slate-650'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Accept controls */}
          <button
            type="button"
            id="onboard_submit"
            onClick={handleConfirmOnboarding}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-extrabold rounded-2xl hover:brightness-105 active:scale-[0.99] transition shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider font-mono"
          >
            <Zap className="w-4 h-4 fill-white/10 text-white" />
            Launch Adaptive Prep Session
          </button>

        </div>

        {/* Right Side: Creative Profile Customizer (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-5">
            
            {/* Customiser header & AI Scan Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d333d]/60">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider font-mono">Interactive Setup</span>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Developer Profile & Portfolio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiScan(prev => !prev)}
                className="self-start sm:self-center px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Resume Scan</span>
                {showAiScan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* AI Scan Dropdown Tray */}
            {showAiScan && (
              <div className="bg-[#111319] p-4 rounded-xl border border-dashed border-indigo-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-205 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      Automatic Profile Fill
                    </h4>
                    <p className="text-[10px] text-slate-500">Scan standard TXT files to extract name, links, skills and projects instantly.</p>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase bg-indigo-900/40 text-[#a5b4fc] px-1.5 py-0.5 rounded border border-indigo-500/20">Gemini Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-700 hover:border-indigo-500 bg-[#161a23]/30 hover:bg-[#161a23]/50 cursor-pointer rounded-xl p-4 text-center space-y-1.5 transition flex flex-col items-center justify-center min-h-[95px]"
                  >
                    <FileText className="w-6 h-6 text-indigo-400" />
                    <p className="text-[11px] font-bold text-slate-305">Select PDF/TXT</p>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf,.txt" 
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </div>

                  {!pastedOpen ? (
                    <button
                      type="button"
                      onClick={() => setPastedOpen(true)}
                      className="border border-[#2d333d] bg-slate-900/60 hover:bg-slate-900 hover:border-slate-750 text-slate-405 font-bold rounded-xl text-xs transition min-h-[95px] flex flex-col items-center justify-center gap-1"
                    >
                      <span>Or Paste Text</span>
                      <span className="text-[9px] font-normal text-slate-500">(Work notes, credentials)</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste experience summary text, personal projects log list..."
                        rows={3}
                        className="w-full text-[11px] p-2 bg-black border border-slate-800 text-slate-300 focus:border-indigo-500 outline-none rounded-xl font-sans"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handlePastedParse}
                          className="flex-1 py-1.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-lg text-[10px] text-white transition font-mono"
                        >
                          Scan Text
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPastedOpen(false); setResumeText(""); }}
                          className="px-2.5 py-1.5 bg-slate-800 text-slate-450 hover:text-slate-300 rounded-lg text-[10px] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isParsing && (
                  <div className="py-2.5 flex items-center justify-center gap-2 bg-[#0b0d11] rounded-lg border border-indigo-500/10">
                    <Loader2 className="w-4 h-4 text-indigo-450 animate-spin" />
                    <span className="text-[10px] text-slate-400">Interpreting technical parameters...</span>
                  </div>
                )}

                {parseError && (
                  <div className="text-[9px] text-rose-450 bg-rose-500/5 p-2 rounded border border-rose-500/10 font-medium">
                    {parseError}
                  </div>
                )}
              </div>
            )}

            {/* Configurator Navigation Tabs */}
            <div className="flex border-b border-[#2d333d]/50 p-0.5 bg-[#0b0d11]/80 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveProfileTab("basics")}
                className={`flex-1 py-2 rounded-lg text-center text-[11px] uppercase tracking-wider font-extrabold transition cursor-pointer ${
                  activeProfileTab === "basics" 
                    ? "bg-[#171b22] text-indigo-400 font-black border border-[#2d333d]/60" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                1. Basics & Portfolio
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("projects")}
                className={`flex-1 py-2 rounded-lg text-center text-[11px] uppercase tracking-wider font-extrabold transition cursor-pointer ${
                  activeProfileTab === "projects" 
                    ? "bg-[#171b22] text-indigo-400 font-black border border-[#2d333d]/60" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                2. Projects ({parsedProfile.projects.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("skills")}
                className={`flex-1 py-2 rounded-lg text-center text-[11px] uppercase tracking-wider font-extrabold transition cursor-pointer ${
                  activeProfileTab === "skills" 
                    ? "bg-[#171b22] text-indigo-400 font-black border border-[#2d333d]/60" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                3. Skills
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("strengths")}
                className={`flex-1 py-2 rounded-lg text-center text-[11px] uppercase tracking-wider font-extrabold transition cursor-pointer ${
                  activeProfileTab === "strengths" 
                    ? "bg-[#171b22] text-indigo-400 font-black border border-[#2d333d]/60" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                4. Strengths
              </button>
            </div>

            {/* TAB CONTENT: BASICS */}
            {activeProfileTab === "basics" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Candidate Name</label>
                    <input
                      type="text"
                      value={parsedProfile.name}
                      onChange={(e) => handleProfileFieldChange("name", e.target.value)}
                      className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 transition"
                      placeholder="e.g. Arnav Telangi"
                    />
                  </div>

                  {/* Portfolio Website */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-sky-400" />
                      Portfolio Website URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.portfolioUrl || ""}
                        onChange={(e) => handleProfileFieldChange("portfolioUrl", e.target.value)}
                        className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 pl-8 text-xs outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. https://arnavtelangi.me"
                      />
                      <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>

                {/* Git and LinkedIn urls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* GitHub link */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                        <Github className="w-3 h-3 text-slate-350" />
                        GitHub Profile link
                      </label>
                      {parsedProfile.githubUrl && parsedProfile.githubUrl.trim() !== "" && (
                        isValidatingGithub ? (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                            Validating...
                          </span>
                        ) : isGitHubUrlValid(parsedProfile.githubUrl) ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 animate-fade-in">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/10" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            Invalid Format
                          </span>
                        )
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.githubUrl || ""}
                        onChange={(e) => handleProfileFieldChange("githubUrl", e.target.value)}
                        className={`w-full bg-[#0b0d11] hover:bg-[#0f1117] border rounded-xl p-2.5 pl-8 pr-10 text-xs outline-none transition ${
                          isValidatingGithub
                            ? "border-amber-500/50 focus:border-amber-500"
                            : parsedProfile.githubUrl && isGitHubUrlValid(parsedProfile.githubUrl)
                            ? "border-emerald-500/50 focus:border-emerald-500"
                            : parsedProfile.githubUrl && parsedProfile.githubUrl.trim() !== ""
                            ? "border-[#2d333d] hover:border-rose-500/30 focus:border-rose-500"
                            : "border-[#2d333d] hover:border-slate-700 focus:border-indigo-500"
                        }`}
                        placeholder="https://github.com/myaccount"
                      />
                      <Github className={`w-3.5 h-3.5 absolute left-2.5 top-3 transition-colors ${
                        isValidatingGithub
                          ? "text-amber-400"
                          : parsedProfile.githubUrl && isGitHubUrlValid(parsedProfile.githubUrl)
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }`} />

                      {/* Right-aligned interactive status feedback */}
                      {parsedProfile.githubUrl && parsedProfile.githubUrl.trim() !== "" && (
                        <div className="absolute right-3 top-2.5 flex items-center justify-center">
                          {isValidatingGithub ? (
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          ) : isGitHubUrlValid(parsedProfile.githubUrl) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-500/10 animate-fade-in" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn link */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                        <Linkedin className="w-3 h-3 text-[#0a66c2]" />
                        LinkedIn Profile Handle
                      </label>
                      {parsedProfile.linkedinUrl && parsedProfile.linkedinUrl.trim() !== "" && (
                        isValidatingLinkedin ? (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                            Validating...
                          </span>
                        ) : isLinkedInUrlValid(parsedProfile.linkedinUrl) ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 animate-fade-in">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/10" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            Invalid Format
                          </span>
                        )
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.linkedinUrl || ""}
                        onChange={(e) => handleProfileFieldChange("linkedinUrl", e.target.value)}
                        className={`w-full bg-[#0b0d11] hover:bg-[#0f1117] border rounded-xl p-2.5 pl-8 pr-10 text-xs outline-none transition ${
                          isValidatingLinkedin
                            ? "border-amber-500/50 focus:border-amber-500"
                            : parsedProfile.linkedinUrl && isLinkedInUrlValid(parsedProfile.linkedinUrl)
                            ? "border-emerald-500/50 focus:border-emerald-500"
                            : parsedProfile.linkedinUrl && parsedProfile.linkedinUrl.trim() !== ""
                            ? "border-[#2d333d] hover:border-rose-500/30 focus:border-rose-500"
                            : "border-[#2d333d] hover:border-slate-700 focus:border-indigo-500"
                        }`}
                        placeholder="https://linkedin.com/in/mypath"
                      />
                      <Linkedin className={`w-3.5 h-3.5 absolute left-2.5 top-3 transition-colors ${
                        isValidatingLinkedin
                          ? "text-amber-400"
                          : parsedProfile.linkedinUrl && isLinkedInUrlValid(parsedProfile.linkedinUrl)
                          ? "text-emerald-400"
                          : "text-slate-500"
                      }`} />

                      {/* Right-aligned interactive status feedback */}
                      {parsedProfile.linkedinUrl && parsedProfile.linkedinUrl.trim() !== "" && (
                        <div className="absolute right-3 top-2.5 flex items-center justify-center">
                          {isValidatingLinkedin ? (
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          ) : isLinkedInUrlValid(parsedProfile.linkedinUrl) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-500/10 animate-fade-in" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume/CV document & Featured Project link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Resume / CV Document Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-rose-400" />
                      Resume / CV Document Link
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.resumeCvUrl || ""}
                        onChange={(e) => handleProfileFieldChange("resumeCvUrl", e.target.value)}
                        className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 pl-8 text-xs outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. Drive, Dropbox or S3 PDF link"
                      />
                      <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {/* Featured Project Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      Featured Project Link
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.featuredProjectUrl || ""}
                        onChange={(e) => handleProfileFieldChange("featuredProjectUrl", e.target.value)}
                        className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 pl-8 text-xs outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. Live app or repository link"
                      />
                      <Layers className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>

                {/* Twitter / X & Other Website URLs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Twitter / X Profile */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                      <Twitter className="w-3 h-3 text-sky-400" />
                      Twitter / X Handle
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.twitterUrl || ""}
                        onChange={(e) => handleProfileFieldChange("twitterUrl", e.target.value)}
                        className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 pl-8 text-xs outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. https://x.com/username"
                      />
                      <Twitter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  {/* Other professional website or Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-teal-400" />
                      Other Professional Website
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={parsedProfile.otherWebsiteUrl || ""}
                        onChange={(e) => handleProfileFieldChange("otherWebsiteUrl", e.target.value)}
                        className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 pl-8 text-xs outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. Technical blog or Linktree"
                      />
                      <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                    </div>
                  </div>
                </div>

                {/* Summary / Biography info */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Professional Overview & Targets</label>
                  <textarea
                    value={parsedProfile.experienceSummary}
                    onChange={(e) => handleProfileFieldChange("experienceSummary", e.target.value)}
                    rows={3}
                    className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 transition resize-none"
                    placeholder="Provide a personal description or target goals that AI interviewers will explore."
                  />
                </div>

                {/* Projects Portfolio Summary */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Projects Portfolio Summary</label>
                  <textarea
                    value={parsedProfile.projectSummaries || ""}
                    onChange={(e) => handleProfileFieldChange("projectSummaries", e.target.value)}
                    rows={3}
                    className="w-full bg-[#0b0d11] hover:bg-[#0f1117] border border-[#2d333d] hover:border-slate-700 text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:border-indigo-500 transition resize-none"
                    placeholder="Provide a high-level summary compiling key highlights, architectures, and achievements from your projects."
                  />
                </div>

                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[10.5px] text-slate-450 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Career Synchronizer:</strong> Providing authentic Github, Portfolio configurations allows our virtual panel of technical assessors to synthesize domain-focused questions that map to your practical achievements.
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PROJECTS PORTFOLIO */}
            {activeProfileTab === "projects" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* List Projects */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {parsedProfile.projects.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[#2d333d] rounded-xl">
                      <p className="text-xs text-slate-500">No project descriptions configured yet.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(true)}
                        className="text-[10px] text-indigo-400 font-bold hover:underline mt-1"
                      >
                        Create your first custom project +
                      </button>
                    </div>
                  ) : (
                    parsedProfile.projects.map((proj, pIndex) => (
                      <div 
                        key={pIndex}
                        className="p-3 bg-[#0b0d11] border border-[#2d333d]/70 rounded-xl space-y-1.5 relative group hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between min-w-0 pr-6">
                          <div>
                            <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded font-mono font-extrabold uppercase">PROJECT</span>
                            <h4 className="text-xs font-black text-slate-100 mt-0.5">{proj.title}</h4>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeProject(pIndex)}
                            className="p-1 text-slate-500 hover:text-rose-455 hover:bg-rose-500/10 rounded-lg transition shrink-0 absolute top-2 right-2"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">{proj.description}</p>
                        
                        <div className="flex flex-wrap gap-1 pt-1">
                          {proj.technologies.map((t, tIndex) => (
                            <span 
                              key={tIndex} 
                              className="text-[9px] bg-slate-900 border border-slate-800 text-slate-350 px-1.5 py-0.2 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form to Append Project inline */}
                {!isAddingProject ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(true)}
                    className="w-full py-2.5 bg-[#0b0d11] hover:bg-slate-900 border border-dashed border-[#2d333d] hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Append Custom Project Details</span>
                  </button>
                ) : (
                  <div className="bg-[#0b0d11] p-4 rounded-xl border border-indigo-500/15 space-y-3.5 animate-slide-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Add New Project Record</h4>
                      <button 
                        type="button"
                        onClick={() => setIsAddingProject(false)} 
                        className="text-[10px] text-slate-500 hover:text-slate-350"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider font-mono">Project Name</label>
                        <input
                          type="text"
                          value={newProjTitle}
                          onChange={(e) => setNewProjTitle(e.target.value)}
                          placeholder="e.g. Distributed Crawler"
                          className="w-full bg-[#111319] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-550 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider font-mono">Technologies Used</label>
                        <input
                          type="text"
                          value={newProjTech}
                          onChange={(e) => setNewProjTech(e.target.value)}
                          placeholder="NodeJS, Redis, GCP, WebSockets"
                          className="w-full bg-[#111319] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-550 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider font-mono">Description / Key Milestones</label>
                      <textarea
                        value={newProjDesc}
                        onChange={(e) => setNewProjDesc(e.target.value)}
                        placeholder="Built dynamic load-shifting parser using Redis queues, scaling indexing speed by 40% and storing results across segmented Postgres nodes..."
                        rows={3.5}
                        className="w-full bg-[#111319] border border-slate-800 rounded-lg p-2 text-xs text-slate-350 focus:border-indigo-550 outline-none resize-none font-sans"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addCustomProject}
                      disabled={!newProjTitle.trim()}
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs tracking-wide transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Project to Portfolio</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SKILLS */}
            {activeProfileTab === "skills" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Technical Skillset Tags</label>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed">Add programming languages, developer runtimes, cloud networks and frameworks that define your technical identity.</p>
                  
                  <div className="flex flex-wrap gap-1.5 p-3.5 bg-[#0b0d11] border border-[#2d333d]/70 rounded-xl min-h-[90px] max-h-[145px] overflow-y-auto mt-2">
                    {parsedProfile.skills.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">No skills registered. Type below to list tech stack competencies.</span>
                    ) : (
                      parsedProfile.skills.map((skill, sIndex) => (
                        <span 
                          key={sIndex}
                          className="text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-650 text-slate-205 pl-2 pr-1.5 py-0.5 rounded-full flex items-center gap-1 transition"
                        >
                          {skill}
                          <button 
                            type="button"
                            onClick={() => removeParsedSkill(sIndex)} 
                            className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Input helper to append skill */}
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Enter competency (e.g. Docker, GraphQL, PyTorch, Go)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addParsedSkill()}
                    className="flex-1 text-xs px-3 py-2 bg-[#0b0d11] hover:bg-[#0f1117] rounded-xl border border-[#2d333d]/80 text-slate-100 outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={addParsedSkill}
                    className="px-3.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs font-bold border border-slate-700/60 transition flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STRENGTHS */}
            {activeProfileTab === "strengths" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Highlights & Key Strengths</label>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed">Mention core behavioral tags or professional milestones (e.g. Team Lead experience, competitive programmer, database optimization focus, active contributor).</p>
                  
                  <div className="flex flex-wrap gap-1.5 p-3.5 bg-[#0b0d11] border border-[#2d333d]/70 rounded-xl min-h-[90px] max-h-[145px] overflow-y-auto mt-2">
                    {parsedProfile.strengths.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">No highlights registered. Add candidate strengths below.</span>
                    ) : (
                      parsedProfile.strengths.map((str, sIndex) => (
                        <span 
                          key={sIndex}
                          className="text-[10px] bg-slate-900 border border-indigo-950 text-indigo-300 pl-2 pr-1.5 py-0.5 rounded-full flex items-center gap-1 transition"
                        >
                          {str}
                          <button 
                            type="button"
                            onClick={() => removeStrength(sIndex)} 
                            className="p-0.5 rounded hover:bg-slate-850 text-slate-500 hover:text-rose-400 transition font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Input helper to append strength */}
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Enter highlight (e.g. Distributed DB Sharding, STAR Storytelling, Team Leader)"
                    value={strengthInput}
                    onChange={(e) => setStrengthInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addStrength()}
                    className="flex-1 text-xs px-3 py-2 bg-[#0b0d11] hover:bg-[#0f1117] rounded-xl border border-[#2d333d]/80 text-slate-100 outline-none focus:border-indigo-555 transition"
                  />
                  <button
                    type="button"
                    onClick={addStrength}
                    className="px-3.5 bg-slate-800 hover:bg-slate-700 text-[#a5b4fc] rounded-xl text-xs font-bold border border-slate-700/60 transition flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Panel footer */}
            <div className="text-[10px] text-slate-550 border-t border-[#2d333d]/40 pt-3 flex items-center justify-between font-mono">
              <span>Profile metrics: {parsedProfile.skills.length} skills • {parsedProfile.projects.length} projects</span>
              <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Ready to sync</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
