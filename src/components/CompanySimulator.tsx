import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Award, Zap, Code, ShieldCheck, HelpCircle, Users, Brain, 
  RefreshCw, Send, ArrowLeft, Target, Trophy, Play, Star, Sparkles, 
  MessageSquare, AudioLines, Info, Copy, Check, ChevronRight, Briefcase 
} from "lucide-react";

interface QuestionProps {
  id: string;
  title: string;
  question: string;
  type: "coding" | "system-design" | "behavioral" | "technical";
  hints?: string[];
  codeStub?: string;
}

// Curated high-fidelity behavioral pool (FALLBACK + Base index)
const CURATED_BEHAVIORAL_SCENARIOS = {
  workplace: [
    {
      id: "b_work_1",
      category: "Workplace Challenge",
      title: "Sudden Scale SLA Breach",
      challenge: "A marketing-driven traffic surge triggers an API rate limit collapse on your payment gateway. Transaction latencies skyrocket, and checkout failure rates spike to 12% during peak sales.",
      stakeholders: "Product Managers demanding immediate fix, Finance tracking lost checkout volume, DevOps struggling with storage limits.",
      hints: [
        "Detail how you diagnosed the rate bottleneck (network tools, system monitors).",
        "Explain short-term mitigation (throttling minor requests) vs long-term repair (optimistic versioning).",
        "Provide quantified results (e.g. latency cut from 12s to 120ms, success recovery back to 99.98%)."
      ]
    },
    {
      id: "b_work_2",
      category: "Workplace Challenge",
      title: "The Legacy System Debt Triage",
      challenge: "Your department must scale a core authentication service. However, the service relies on an undocumented, monolithic legacy codebase with no automated tests. Stakeholders push to release a feature immediately.",
      stakeholders: "Engineering Managers wanting quick feature delivery, QA asserting massive regression risks, security auditing warning of unsafe legacy cookies.",
      hints: [
        "How did you isolate the refactoring task scope to avoid project creep?",
        "Define your safety harness (unit testing scaffolding, parallel shadows testing).",
        "Quantify business returns: developer speed velocity, testing coverage gains (e.g. 0% to 82%)."
      ]
    },
    {
      id: "b_work_3",
      category: "Workplace Challenge",
      title: "Ad-hoc Scope Escalation Friction",
      challenge: "Halfway through a critical database migration sprint, key product leads introduce several unvetted compliance requirements, threatening a milestone deadline for a highly visible stakeholder demo.",
      stakeholders: "Compliance Managers enforcing strict data locks, tech leads warning of sprint failure, business executives counting on the demo timeline.",
      hints: [
        "How did you guide stakeholders through objective trade-off calculations?",
        "Explain your prioritization formula (SLA standards, incremental rollouts).",
        "Outline the milestone result: demo launched on time with compliance phase 1 locked."
      ]
    }
  ],
  ethical: [
    {
      id: "b_eth_1",
      category: "Ethical Dilemma",
      title: "The Silent Telemetry Injection",
      challenge: "An executive VP asks your team to inject silent, obfuscated telemetry hooks to capture detailed user location logs. This request bypasses standard consent disclosure checkboxes to optimize target ads profiles.",
      stakeholders: "VP of Growth pushing for monetization, Privacy Compliance team unaware of the bypass, Developer peers feeling uncomfortable but hesitant to argue.",
      hints: [
        "How did you raise the concern constructively using data privacy laws or corporate code of ethics?",
        "Explain alternative approaches (explicit opt-in programs, aggregated analytics).",
        "State the final resolution: opt-in policy preserved, saving the team from compliance lawsuits."
      ]
    },
    {
      id: "b_eth_2",
      category: "Ethical Dilemma",
      title: "The Compressed Security Release Triage",
      challenge: "You detect a race condition vulnerability in a newly compiled cryptography routing path. Fixing it delayed the release by 4 days, meaning the company will miss an SLA deadline and incur active financial penalties.",
      stakeholders: "Operations Manager tracking late fees, Sales Director panicking about broken contracts, Chief Information Security Officer (CISO) expecting zero risk.",
      hints: [
        "Evaluate the risk spectrum (severity of possible exploits vs late fee impact).",
        "Explain how you collaborated with security experts to expedite a high-quality patch.",
        "Highlight the metrics of safety achieved (prevented potential data exposure of 1.2M accounts)."
      ]
    },
    {
      id: "b_eth_3",
      category: "Ethical Dilemma",
      title: "Third-Party Data Scraping Pipeline",
      challenge: "To train a high-priority pricing model, your lead developer recommends bypassing a competitor's robots.txt files via commercial rotating proxy services, raising potential intellectual property and legal concerns.",
      stakeholders: "AI/Data Science leads demanding competitors' data, general counsel warning about API terms violation, SREs tasked with implementing the proxy sweep.",
      hints: [
        "Detail your argument regarding platform reputation and sustainable research approaches.",
        "Suggest compliant paths (authorized syndication feeds, academic partnerships).",
        "Highlight the resulting risk aversion from standardizing copyright-safe pipelines."
      ]
    }
  ],
  leadership: [
    {
      id: "b_lead_1",
      category: "Leadership Situation",
      title: "Steering a Dispirited Turnaround",
      challenge: "You inherit a development crew suffering from severe burnout, high attrition, and multiple failed release deadlines. Sprint velocity has plummeted, and team communication is non-existent.",
      stakeholders: "Stressed developers holding defensive attitudes, product directors feeling frustrated, HR inquiring about psychological health concerns.",
      hints: [
        "How did you gather subjective feedback (one-on-ones, transparent anonymous channels)?",
        "Detail the structural decompression actions (scoping adjustments, clear definition of done, celebrating small milestones).",
        "Share performance numbers: sprint completion rate increased by 45%, retention stabilized to 100% over two quarters."
      ]
    },
    {
      id: "b_lead_2",
      category: "Leadership Situation",
      title: "The Non-trivial Technical Divide",
      challenge: "Your engineering squad is deeply divided on a core framework decision (e.g. NoSQL vs Relational postgres for transactional records). Friction is high, and decision-paralysis has stalled all active work for over three weeks.",
      stakeholders: "Two vocal staff engineers defending competing architectures, product leads upset about zero velocity, developers confused on execution directions.",
      hints: [
        "Explain how you established objective evaluation benchmarks (cost, maintainability, testing proof of concepts).",
        "Describe the 'Disagree and Commit' model execution.",
        "Outline the final architecture stability and the team unification outcome."
      ]
    },
    {
      id: "b_lead_3",
      category: "Leadership Situation",
      title: "Active Outage Commander Pivot",
      challenge: "During a major holiday sales window, a cascading regional network drop takes down the core checkout pipeline. No logging is responding, and team engineers are panicking on a chaotic incident call.",
      stakeholders: "Frustrated customers on social channels, Executives calling for updates every 5 minutes, SRE team in high cognitive overload.",
      hints: [
        "How did you assert yourself as Outage Commander to establish structured triage channels (diagnose, communicate, remediate)?",
        "Detail the steps taken to stop the bleeding (traffic redirection, rolling restarts).",
        "State the post-incident results: complete system restore in 18 minutes, SLA compliance preserved, robust circuit breakers built."
      ]
    }
  ]
};

// Curated Company Interview Processes & Typical Question Banks
const COMP_PROFILES: Record<string, {
  name: string;
  focusPrinciples: string[];
  processSummary: string;
  challenges: QuestionProps[];
}> = {
  Google: {
    name: "Google",
    focusPrinciples: ["Googliness & Leadership", "Informal Authority", "Scale & Speed (O(N) Rigor)", "TrueTime Synchronization"],
    processSummary: "Highly technical assessments on algorithms, data structures (especially complex graphs), distribution models (MapReduce, Spanner), and a dedicated behavioral round gauging Googliness, psychological safety, and leadership.",
    challenges: [
      {
        id: "g_sim_1",
        title: "Longest Path in a Strict Ascending 2D Matrix",
        question: "Given a 2D matrix of grid size M x N, find the longest path where each subsequent step increases strictly. Optimize for O(MN) using memoized DFS.",
        type: "coding",
        codeStub: "function longestIncreasingPath(matrix) {\n  // Implement O(MN) DFS with Memoization here\n  return 0;\n}"
      },
      {
        id: "g_sim_2",
        title: "Google Search Auto-Complete Trie Partitions",
        question: "Design Google's prefix-search suggestions system. Support 100ms keystroke timeouts and explain how you distribute the data across global regional partitions.",
        type: "system-design"
      },
      {
        id: "g_sim_3",
        title: "Googliness: Aligning Cross-Team Subsystem Inefficiencies",
        question: "Describe a time you noticed an engineering inefficiency in another team's core module. How did you coordinate cross-functionally and fix the problem without having formal authority?",
        type: "behavioral",
        hints: ["Focus on objective benchmark metrics.", "Explain how you gained buy-in from the other team's lead."]
      }
    ]
  },
  Microsoft: {
    name: "Microsoft",
    focusPrinciples: ["Growth Mindset", "Accountability & Ownership", "Practical Error Handlers", "MS Teams Concurrency"],
    processSummary: "Evaluates production-grade programming details, practical error handling, concurrency, multithreading, and a strong cultural expectation around collaboration, learning from failures, and 'Growth Mindset'.",
    challenges: [
      {
        id: "m_sim_1",
        title: "Sort and Merge Overlapping CPU Thread Intervals",
        question: "A processor scales allocations by scheduling threads. Given a list of non-overlapping time slices, merge all overlapping ranges to maximize computational density. Optimize for O(N log N).",
        type: "coding",
        codeStub: "function mergeThreadIntervals(intervals) {\n  // Sort and merge adjacent intervals\n  return [];\n}"
      },
      {
        id: "m_sim_2",
        title: "MS Teams Real-time Canvas Collaborative Whiteboard",
        question: "Design a conflict-free real-time collaborative document editor like MS PowerPoint Online. Detail how to resolve concurrent write actions with low network lag.",
        type: "system-design"
      },
      {
        id: "m_sim_3",
        title: "Mindset: Accountability on Systemic Project Failures",
        question: "Tell me about a time you owned a major technical project failure. How did you manage stakeholder communication, and what preventative refactoring did you engineer afterwards?",
        type: "behavioral",
        hints: ["Emphasize clear responsibilities.", "Explain what you learned and implemented to automate future safeguards."]
      }
    ]
  },
  Amazon: {
    name: "Amazon",
    focusPrinciples: ["Customer Obsession", "Bias for Action", "Ownership", "Dive Deep / Deliver Results"],
    processSummary: "Highly structured behavioral interviews revolving around the 16 Leadership Principles (especially Customer Obsession and Bias for Action) alongside rigorous coding and system-design assessments for high-scalability workflows.",
    challenges: [
      {
        id: "a_sim_1",
        title: "Shortest Unsorted Subarray for Fulfillment Row Ordering",
        question: "Under Amazon's warehouse row optimization, find the shortest continuous sub-array of packages that must be sorted to make the entire fulfillment row chronological. Optimize for O(N) time and O(1) space.",
        type: "coding",
        codeStub: "function findShortestUnsortedSubarray(packages) {\n  // Implement O(N) sliding window logic\n  return 0;\n}"
      },
      {
        id: "a_sim_2",
        title: "Ultra-High Scalability Checkout Ledger",
        question: "Design the high-throughput Amazon basket checkout system. The architecture must handle 15M requests/min during massive sales events without losing cart state, ensuring strict Ledger idempotency.",
        type: "system-design"
      },
      {
        id: "a_sim_3",
        title: "Leadership Check: bias for Action",
        question: "Tell me about a high-stakes engineering decision you had to make with high uncertainty and incomplete technical data. What calculated risks did you identify, and what was the outcome?",
        type: "behavioral",
        hints: ["Frame the high-risk context clearly.", "Quantify performance results or system saves achieved."]
      }
    ]
  },
  Meta: {
    name: "Meta",
    focusPrinciples: ["Move Fast", "Be Bold", "Build Social Value", "Be Open / Direct Collaboration"],
    processSummary: "Intensive loops focusing heavily on high-throughput systems scaling, distributed social graphs (TAO caching), product engineering design, and direct, analytical communication style.",
    challenges: [
      {
        id: "meta_sim_1",
        title: "K Closest Media Posts in Proximity Mapping",
        question: "Given a 2D coordinates map of millions of media stories and a location origin, identify the K closest posts relative to the origin coordinate pointer. Optimize for O(N log K) time.",
        type: "coding",
        codeStub: "function kClosestPosts(posts, k) {\n  // Implement Max Heap or Quickselect solution\n  return [];\n}"
      },
      {
        id: "meta_sim_2",
        title: "Instagram Live Feed and Story Delivery Engine",
        question: "Design a real-time system architecture capable of scaling feed reads/writes and pushes to 1 billion monthly active users. Explain the fan-out write partition and TAO database cache hierarchy.",
        type: "system-design"
      },
      {
        id: "meta_sim_3",
        title: "Speed: Move Fast & Clear Obstacles",
        question: "Describe a high-stakes scenario where you had to push an urgent, untested code repair or critical platform update directly to production. How did you secure fail-safes and coordinate risks under extreme pressure?",
        type: "behavioral",
        hints: ["Emphasize your rolling deployment checkpoints.", "Quantify performance recovery parameters."]
      }
    ]
  }
};

const HIRING_TRENDS: Record<string, {
  averageOfferDuration: string;
  codingWeight: number;
  sysDesignWeight: number;
  behavioralWeight: number;
  recentEmphasis: string;
  hiringStatus: string;
}> = {
  Google: {
    averageOfferDuration: "4 - 6 weeks",
    codingWeight: 50,
    sysDesignWeight: 30,
    behavioralWeight: 20,
    recentEmphasis: "Strong focus on strict O(N) log-scale graph traversals, memcache latency mitigation, and informal authority execution blocks.",
    hiringStatus: "Highly Selective"
  },
  Microsoft: {
    averageOfferDuration: "3 - 5 weeks",
    codingWeight: 40,
    sysDesignWeight: 40,
    behavioralWeight: 20,
    recentEmphasis: "Heavy emphasis on distributed service fail-safes (MS Teams live whiteboard), multithreaded queues, and Growth Mindset resolution metrics.",
    hiringStatus: "Active Expansion"
  },
  Amazon: {
    averageOfferDuration: "2 - 4 weeks",
    codingWeight: 35,
    sysDesignWeight: 30,
    behavioralWeight: 35,
    recentEmphasis: "Obsessive focus on the 16 Leadership Principles (Bias for Action & Customer Obsession). Coding questions focus heavily on sliding matrices.",
    hiringStatus: "High Volume Seasonal"
  },
  Meta: {
    averageOfferDuration: "3 - 6 weeks",
    codingWeight: 45,
    sysDesignWeight: 35,
    behavioralWeight: 20,
    recentEmphasis: "Focuses on high-concurrency feeds, TAO memory architecture optimizations, WhatsApp delivery receipts, and Move Fast execution checks.",
    hiringStatus: "Currently Hiring"
  }
};

export default function CompanySimulator() {
  const [activeView, setActiveView] = useState<"hub" | "behavioral-scenarios" | "company-details">("hub");
  
  // States for Behavioral scenarios
  const [selectedScenarioCategory, setSelectedScenarioCategory] = useState<"workplace" | "ethical" | "leadership">("workplace");
  const [activeScenario, setActiveScenario] = useState<any>(null);
  
  // States for Company Focus Simulators
  const [selectedCompKey, setSelectedCompKey] = useState<string>("Google");
  const [activeChallenge, setActiveChallenge] = useState<QuestionProps | null>(null);

  // General evaluation parameters
  const [responseInput, setResponseInput] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated live voice recording intervals
  const [audioWaves, setAudioWaves] = useState<number[]>([12, 28, 15, 34, 18, 40, 22, 10, 30, 15]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    triggerToast("Live mock audio capture activated... Speak your answer clearly.");
    const interval = setInterval(() => {
      setAudioWaves(prev => prev.map(() => Math.floor(Math.random() * 35) + 5));
    }, 180);
    
    // Simulate speaking text insertion after 5s
    setTimeout(() => {
      clearInterval(interval);
      setIsRecording(false);
      setResponseInput((prev) => {
        const textToInsert = "Situation: In our previous team, we faced a sudden 10x database load during Black Friday sales. Task: The team objective was to resolve the 4.5 second query latencies before Checkouts dropped. Action: I diagnosed the slow query using explain plans, added composite indexes for (user_id, status), and set up Redis caching to store hot session files. Result: Latency reduced immediately to 12 milliseconds, successfully protecting 100% of the transactions with zero checkout errors.";
        return prev ? `${prev} ${textToInsert}` : textToInsert;
      });
      triggerToast("Voice transcribed successfully using STAR formatting structure.");
    }, 6000);
  };

  const generateLiveGeminiScenario = async (category: string) => {
    setIsEvaluating(true);
    triggerToast("Querying Gemini API to write a custom, high-fidelity STAR scenario...");
    try {
      const res = await fetch("/api/interview/generate-sim-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          company: selectedCompKey,
          type: "behavioral"
        })
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from /api/interview/generate-sim-question");
      }
      const data = await res.json();
      if (data.scenario) {
        setActiveScenario(data.scenario);
        setActiveView("behavioral-scenarios");
        setResponseInput("");
        setEvaluationResult(null);
        triggerToast("Custom scenario synthesized successfully.");
      } else {
        throw new Error("Fallback to local bank");
      }
    } catch (_) {
      // Fallback
      const collection = CURATED_BEHAVIORAL_SCENARIOS[category as keyof typeof CURATED_BEHAVIORAL_SCENARIOS];
      const random = collection[Math.floor(Math.random() * collection.length)];
      setActiveScenario(random);
      setActiveView("behavioral-scenarios");
      setResponseInput("");
      setEvaluationResult(null);
      triggerToast("Loaded highly curated offline scenario.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const generateCompanySpecificAiChallenge = async (type: "coding" | "system-design" | "behavioral") => {
    setIsEvaluating(true);
    triggerToast(`Querying Gemini with ${selectedCompKey}'s specific processes to formulate a strict ${type} task...`);
    try {
      const res = await fetch("/api/interview/generate-sim-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedCompKey,
          type
        })
      });
      const data = await res.json();
      if (data.scenario) {
        const syntheticChallenge: QuestionProps = {
          id: `ai_${Date.now()}`,
          title: data.scenario.title,
          question: data.scenario.challenge,
          type: type as any,
          hints: data.scenario.hints || [],
          codeStub: data.scenario.codeStub || ""
        };
        setActiveChallenge(syntheticChallenge);
        setResponseInput("");
        setEvaluationResult(null);
        setActiveView("company-details");
        triggerToast(`Specialized ${selectedCompKey} AI ${type} mock task synthesized successfully!`);
      } else {
        throw new Error("Unable to synthesize.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to connect with Gemini. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const submitResponseEvaluation = async (questionTitle: string, questionText: string, type: string) => {
    if (!responseInput.trim()) {
      alert("Please provide or speak your response before requesting a grading review.");
      return;
    }
    
    setIsEvaluating(true);
    setEvaluationResult(null);
    triggerToast("AI Interrogator is grading your STAR structure components...");

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          answer: responseInput,
          type: "behavioral",
          domain: "Engineering Management",
          company: selectedCompKey
        })
      });

      if (!res.ok) throw new Error("Grading timeout.");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from /api/interview/evaluate");
      }
      const assessment = await res.json();
      setEvaluationResult(assessment);
      triggerToast("Technical and Communication scorecard ready!");
    } catch (e) {
      console.error(e);
      triggerToast("API Pipeline error. Displaying diagnostic score.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12 font-sans text-slate-250">
      
      {/* Dynamic Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#161a25] border border-indigo-500/30 text-indigo-300 p-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold font-mono"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Back Button */}
      {activeView !== "hub" && (
        <button
          onClick={() => {
            setActiveView("hub");
            setResponseInput("");
            setEvaluationResult(null);
            setIsRecording(false);
          }}
          className="p-2 px-4 bg-[#171b22]/70 hover:bg-[#1a1f29] border border-[#2d333d] hover:border-slate-500 text-slate-350 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Simulators Hub</span>
        </button>
      )}

      {/* RENDER VIEW: HUB */}
      {activeView === "hub" && (
        <div className="space-y-8">
          
          {/* Banner Header */}
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-2.5">
                <Building2 className="w-7 h-7 text-indigo-400" />
                PrepAI Company Focus & STAR Simulator
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
                Unlock specialized simulators focused on specific top tech firms alongside general behavioral generators. Construct stories following strict STAR blueprints (Situation, Task, Action, Result) for ultimate FAANG compliance.
              </p>
            </div>
            <div className="p-2 py-1.5 bg-indigo-505/10 border border-indigo-400/20 text-indigo-400 text-[10px] uppercase font-black tracking-widest rounded-full font-mono bg-indigo-500/10">
              Googliness & LP Ready
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1 & 2: Firm Simulators */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Select Target Tech Enterprise</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(COMP_PROFILES).map((key) => {
                    const profile = COMP_PROFILES[key];
                    const isSelected = selectedCompKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCompKey(key)}
                        className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-40 transition-all duration-300 ${
                          isSelected 
                            ? "bg-indigo-950/20 border-indigo-500 shadow-lg shadow-indigo-500/5 scale-[1.02]" 
                            : "bg-[#13161c]/80 border-[#2d333d] hover:border-slate-655 text-slate-400 hover:text-slate-200 hover:bg-[#1a1f29]/70"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <Building2 className={`w-5 h-5 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                          <h4 className="font-extrabold text-sm text-white">{profile.name}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{profile.processSummary}</p>
                        </div>
                        <div className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 mt-2">
                          <span>Explore Profile</span> <ChevronRight className="w-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Company Focus details */}
                <div className="bg-[#13161c]/60 p-5 rounded-xl border border-[#2d333d] space-y-5 animate-fade-in text-xs">
                  <div className="flex justify-between items-center border-b border-[#2d333d]/50 pb-2.5">
                    <span className="font-extrabold text-white text-xs">{selectedCompKey} Assessment Outline & Hiring Trends</span>
                    <span className="text-[9px] bg-slate-800 text-indigo-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Sim Active</span>
                  </div>

                  <p className="text-slate-400 leading-normal leading-relaxed text-[11px] font-medium">
                    {COMP_PROFILES[selectedCompKey].processSummary}
                  </p>

                  {/* Corporate Hiring Trends Analytics Board */}
                  {HIRING_TRENDS[selectedCompKey] && (
                    <div className="bg-[#171b22]/90 p-4 rounded-xl border border-indigo-500/10 space-y-3.5">
                      <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                        <span className="text-indigo-400 uppercase tracking-widest">Enterprise Hiring Trends</span>
                        <span className="text-slate-400 px-2 py-0.5 bg-slate-850 border border-slate-700 rounded capitalize">
                          {HIRING_TRENDS[selectedCompKey].hiringStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Timeline:</span>
                          <strong>{HIRING_TRENDS[selectedCompKey].averageOfferDuration}</strong> (Median Offer Speed)
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Recent Interview Trends:</span>
                          <p className="text-[10px] text-slate-400/90 leading-normal mt-0.5">
                            {HIRING_TRENDS[selectedCompKey].recentEmphasis}
                          </p>
                        </div>
                      </div>

                      {/* Flex progress indicator for technical loops weighting */}
                      <div className="space-y-1.5 border-t border-[#2d333d]/40 pt-2.5">
                        <div className="flex justify-between text-[8px] font-extrabold text-slate-500 uppercase tracking-wide font-mono">
                          <span>Algorithm Ratio ({HIRING_TRENDS[selectedCompKey].codingWeight}%)</span>
                          <span>Systems Architecture ({HIRING_TRENDS[selectedCompKey].sysDesignWeight}%)</span>
                          <span>STAR Culture ({HIRING_TRENDS[selectedCompKey].behavioralWeight}%)</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-800 border border-slate-700/60">
                          <div className="bg-emerald-550 bg-emerald-500" style={{ width: `${HIRING_TRENDS[selectedCompKey].codingWeight}%` }} title="Coding" />
                          <div className="bg-[#38bdf8]" style={{ width: `${HIRING_TRENDS[selectedCompKey].sysDesignWeight}%` }} title="System Design" />
                          <div className="bg-indigo-500" style={{ width: `${HIRING_TRENDS[selectedCompKey].behavioralWeight}%` }} title="Behavioral STAR" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[9px] text-[#38bdf8] font-extrabold uppercase tracking-widest block font-mono">Core Evaluation Pillars:</span>
                    <div className="flex flex-wrap gap-2">
                      {COMP_PROFILES[selectedCompKey].focusPrinciples.map((princ, i) => (
                        <span key={i} className="text-[9px] bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 p-1 px-2.5 rounded-md">
                          {princ}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI CHALLENGE SYNTHESIS BAR */}
                  <div className="bg-indigo-950/20 p-4 border border-indigo-500/15 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Synthesize Dynamic Gemini Chalenge</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Instruct Gemini to generate a brand new, highly realistic corporate interview question based on modern technical stacks of <strong>{selectedCompKey}</strong>.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      <button
                        onClick={() => generateCompanySpecificAiChallenge("coding")}
                        disabled={isEvaluating}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-indigo-500/20 hover:border-indigo-500/40 text-slate-200 hover:text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition cursor-pointer disabled:opacity-50"
                      >
                        💻 Algorithms
                      </button>
                      <button
                        onClick={() => generateCompanySpecificAiChallenge("system-design")}
                        disabled={isEvaluating}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-indigo-500/20 hover:border-indigo-500/40 text-slate-200 hover:text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition cursor-pointer disabled:opacity-50"
                      >
                        📐 System Design
                      </button>
                      <button
                        onClick={() => generateCompanySpecificAiChallenge("behavioral")}
                        disabled={isEvaluating}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-indigo-500/20 hover:border-indigo-500/40 text-slate-200 hover:text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition cursor-pointer disabled:opacity-50"
                      >
                        👤 Behavioral
                      </button>
                    </div>
                  </div>

                  {/* Company specific list */}
                  <div className="space-y-2.5 pt-3 border-t border-[#2d333d]/50">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase block font-mono">Target Company Curated Scenarios Checklist:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {COMP_PROFILES[selectedCompKey].challenges.map((chal) => (
                        <div key={chal.id} className="p-3 bg-[#171b22] hover:bg-[#1b212c] rounded-xl border border-[#2d333d] transition flex justify-between items-center">
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-white text-xs">{chal.title}</h5>
                            <p className="text-[10px] text-slate-500 capitalize">{chal.type === "coding" ? "💻 Coding assessment" : chal.type === "system-design" ? "📐 Systems whiteboard architecture" : "👤 Googliness / Leadership behavioral"}</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveChallenge(chal);
                              setResponseInput("");
                              setEvaluationResult(null);
                              setActiveView("company-details");
                            }}
                            className="p-1 px-3 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-650 hover:text-white transition rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Launch</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* COLUMN 3: Behavioral STAR Generator */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">STAR Scenario Generator</h3>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Synthesize complex workplace situations tailored to test STAR communication frameworks. Select a preset dimension below to explore pre-crafted dilemma boards or query Gemini.
                  </p>

                  <div className="flex bg-[#13161c]/60 p-1 rounded-xl border border-[#2d333d] gap-1 text-[10px] font-black uppercase tracking-wider font-mono">
                    <button
                      onClick={() => setSelectedScenarioCategory("workplace")}
                      className={`flex-1 py-1.5 rounded-lg text-center ${selectedScenarioCategory === "workplace" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Workplace
                    </button>
                    <button
                      onClick={() => setSelectedScenarioCategory("ethical")}
                      className={`flex-1 py-1.5 rounded-lg text-center ${selectedScenarioCategory === "ethical" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Ethical
                    </button>
                    <button
                      onClick={() => setSelectedScenarioCategory("leadership")}
                      className={`flex-1 py-1.5 rounded-lg text-center ${selectedScenarioCategory === "leadership" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Lead
                    </button>
                  </div>

                  {/* Scenarios Checklist from chosen Category */}
                  <div className="space-y-2 mt-4 max-h-[178px] overflow-y-auto">
                    {CURATED_BEHAVIORAL_SCENARIOS[selectedScenarioCategory].map((scen) => (
                      <button
                        key={scen.id}
                        onClick={() => {
                          setActiveScenario(scen);
                          setResponseInput("");
                          setEvaluationResult(null);
                          setActiveView("behavioral-scenarios");
                        }}
                        className="w-full text-left p-2.5 px-3 bg-[#13161c]/80 border border-[#2d333d] hover:border-slate-500 hover:bg-[#1a1f29] rounded-xl text-[10px] font-bold transition flex items-center justify-between"
                      >
                        <span className="line-clamp-1">{scen.title}</span>
                        <ChevronRight className="w-3 text-slate-555" />
                      </button>
                    ))}
                  </div>

                </div>

                <div className="pt-4 border-t border-[#2d333d]/40 space-y-2">
                  <button
                    onClick={() => generateLiveGeminiScenario(selectedScenarioCategory)}
                    disabled={isEvaluating}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-indigo-200" />
                    <span>Synthesize Live via Gemini</span>
                  </button>
                  <span className="text-[8.5px] text-slate-500 text-center block">Tethers actual model logic to compose challenging context environments</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* RENDER VIEW: BEHAVIORAL SCENARIOS ACTIVE TEST */}
      {activeView === "behavioral-scenarios" && activeScenario && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Context back story */}
          <div className="lg:col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5">
              
              <div className="space-y-1.5">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20 font-mono">
                  {activeScenario.category || "Behavioral Alignment"}
                </span>
                <h2 className="text-lg font-extrabold text-white">{activeScenario.title}</h2>
              </div>

              <div className="p-4 bg-[#13161c]/70 rounded-xl border border-[#2d333d]/70 text-slate-300 text-xs leading-relaxed leading-normal font-medium">
                <span className="text-[#38bdf8] font-bold block mb-1">Backstory Scenario Context:</span>
                "{activeScenario.challenge}"
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono">Key Stakeholders in Crisis:</span>
                <p className="text-[11px] text-slate-400 italic">
                  {activeScenario.stakeholders || "Engineering teams, QA leads, business sponsors"}
                </p>
              </div>

              <div className="space-y-2 border-t border-[#2d333d]/40 pt-4">
                <span className="text-[9px] text-indigo-400 font-extrabold uppercase font-mono">STAR Target Response Guidelines:</span>
                <ul className="space-y-1.5 pl-1">
                  {activeScenario.hints?.map((hint: string, i: number) => (
                    <li key={i} className="text-[10.5px] text-slate-400 flex items-start gap-2.5 leading-relaxed">
                      <span className="text-indigo-500 font-extrabold mt-0.5 font-mono">{i === 0 ? "S" : i === 1 ? "A" : "R"}:</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* Right panel: Response inputs and evaluation scoreboards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5">
              <div className="flex justify-between items-center border-b border-[#2d333d]/40 pb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-indigo-400" />
                  Format STAR Storyboard Response
                </span>
                <span className="text-[9px] bg-[#13161c] text-indigo-300 border border-[#2d333d] px-2 rounded-full font-mono font-medium">
                  Spoken format supported
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-slate-500 text-[10.5px] leading-relaxed">
                  Compose your response clearly delineating Situation, Goals, Action sequence edits, and Metric outcomes. You can type freely or use the Voice Sim to stream mock transcription patterns automatically.
                </p>

                <textarea
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="e.g. [Situation]: We detected active transaction latency breach peak checkout spikes... [Task]: Target latency was restoring sub-150ms... [Action]: I implemented a sliding-window Redis cache registry... [Result]: Latency plummeted to 12ms..."
                  rows={8}
                  className="w-full text-xs p-4 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />

                <div className="flex justify-between items-center bg-[#13161c]/40 p-3 rounded-xl border border-[#2d333d]">
                  <div className="flex items-center gap-3">
                    {isRecording ? (
                      <div className="flex items-center gap-1">
                        {audioWaves.map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: h }}
                            className="w-1 bg-rose-500 rounded-full"
                            style={{ height: 10 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono">interviewer voice recorder</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleStartRecording}
                      disabled={isRecording || isEvaluating}
                      className={`p-2 px-3.5 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1.5 transition ${
                        isRecording 
                          ? "bg-rose-950/30 border border-rose-500/30 text-rose-400" 
                          : "bg-[#13161c] border border-[#2d333d] hover:border-slate-500 text-slate-300 hover:text-white"
                      }`}
                    >
                      <AudioLines className={`w-3.5 h-3.5 ${isRecording ? "animate-pulse text-rose-500" : "text-indigo-400"}`} />
                      <span>{isRecording ? "Live Recording..." : "Simulate Speaking"}</span>
                    </button>

                    <button
                      onClick={() => submitResponseEvaluation(activeScenario.title, activeScenario.challenge, "behavioral")}
                      disabled={isEvaluating || isRecording}
                      className="p-2 px-4 bg-indigo-650 hover:bg-indigo-600 border border-indigo-550/40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Assess STAR Response</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* RENDER EVALUATION METRICS CARDS */}
              {evaluationResult && (
                <div className="border-t border-[#2d333d]/50 pt-5 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Interviewer Assessment Results Matrix</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold font-mono">Overall Grade:</span>
                      <span className={`text-[#38bdf8] font-black font-mono text-base bg-indigo-500/10 p-1 px-3 border border-indigo-500/25 rounded-md`}>
                        {evaluationResult.score}/100
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#13161c]/60 border border-[#2d333d] rounded-xl text-[11px] leading-relaxed text-slate-350">
                    <strong className="text-white block mb-0.5">Summary Feedback:</strong>
                    "{evaluationResult.overallFeedback}"
                  </div>

                  {evaluationResult.starBehavioralAnalysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 bg-slate-900/40 border border-[#2d333d] rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono font-bold">Situation (S)</span>
                        <span className="text-xs font-black text-indigo-400">{evaluationResult.starBehavioralAnalysis.situationRating || "Good"}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 border border-[#2d333d] rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono font-bold">Task (T)</span>
                        <span className="text-xs font-black text-[#38bdf8]">{evaluationResult.starBehavioralAnalysis.taskRating || "Excellent"}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 border border-[#2d333d] rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono font-bold">Action (A)</span>
                        <span className="text-xs font-black text-amber-500">{evaluationResult.starBehavioralAnalysis.actionRating || "Average"}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 border border-[#2d333d] rounded-xl">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono font-bold">Result (R)</span>
                        <span className="text-xs font-black text-rose-400">{evaluationResult.starBehavioralAnalysis.resultRating || "Poor"}</span>
                      </div>
                    </div>
                  )}

                  {evaluationResult.starBehavioralAnalysis && (
                    <div className="space-y-3.5 border-t border-[#2d333d]/30 pt-4 text-xs font-medium">
                      <div className="space-y-1 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                        <span className="text-[9px] text-amber-400 font-extrabold uppercase block font-mono">Action Improvement Suggestion:</span>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{evaluationResult.starBehavioralAnalysis.actionFeedback}</p>
                      </div>
                      <div className="space-y-1 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                        <span className="text-[9px] text-rose-400 font-extrabold uppercase block font-mono">Result Metric Suggestion:</span>
                        <p className="text-slate-300 text-[10.5px] leading-relaxed">{evaluationResult.starBehavioralAnalysis.resultFeedback}</p>
                      </div>
                    </div>
                  )}

                  {evaluationResult.pacingAnalysis && (
                    <div className="bg-[#13161c]/55 p-3 rounded-xl border border-[#2d333d] text-[10.5px] text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200">Speaking Pacing Analysis:</strong> {evaluationResult.pacingAnalysis}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* RENDER VIEW: COMPANY SPECIFIC CHALLENGE ACTIVE TEST */}
      {activeView === "company-details" && activeChallenge && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Prompt & criteria */}
          <div className="lg:col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5">
              
              <div className="space-y-1.5">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20 font-mono">
                  {selectedCompKey} Specialization Set
                </span>
                <h2 className="text-lg font-extrabold text-white">{activeChallenge.title}</h2>
              </div>

              <div className="p-4 bg-[#13161c]/70 rounded-xl border border-[#2d333d]/70 text-slate-300 text-xs leading-relaxed leading-normal">
                <span className="text-[#38bdf8] font-bold block mb-1">Detailed Interactive Prompt:</span>
                "{activeChallenge.question}"
              </div>

              {activeChallenge.hints && activeChallenge.hints.length > 0 && (
                <div className="space-y-2 border-t border-[#2d333d]/40 pt-4">
                  <span className="text-[9px] text-indigo-400 font-extrabold uppercase font-mono">Firm Focus Evaluation Vectors:</span>
                  <ul className="space-y-1 pl-1">
                    {activeChallenge.hints.map((hint, i) => (
                      <li key={i} className="text-[10.5px] text-slate-400 flex items-start gap-2 leading-relaxed">
                        <span className="text-indigo-400 font-black mt-0.5">•</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeChallenge.codeStub && (
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono">Boilerplate code stub</span>
                  <pre className="bg-[#13161c] p-3 rounded-lg text-[9px] text-emerald-400 font-mono border border-[#2d333d] overflow-x-auto select-all">
                    {activeChallenge.codeStub}
                  </pre>
                </div>
              )}

            </div>
          </div>

          {/* Right panel: Response submissions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] space-y-5">
              
              <div className="flex justify-between items-center border-b border-[#2d333d]/40 pb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
                  Mock Response Submission Sandbox
                </span>
                <span className="text-[9px] text-slate-400 capitalize bg-[#13161c] px-2.5 border border-[#2d333d] rounded-full font-mono font-normal">
                  {activeChallenge.type} Focus
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-slate-500 text-[10.5px] leading-relaxed">
                  Provide your solution. For behavioral questions, structure Situation/Task/Action/Result clearly. For coding / design questions, outline your system nodes routing or detailed logical block sequences.
                </p>

                <textarea
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="Provide your systematic solution blueprint here..."
                  rows={8}
                  className="w-full text-xs p-4 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />

                <div className="flex justify-end items-center gap-2">
                  <button
                    onClick={() => submitResponseEvaluation(activeChallenge.title, activeChallenge.question, activeChallenge.type)}
                    disabled={isEvaluating}
                    className="p-3 px-6 bg-indigo-650 hover:bg-indigo-600 border border-indigo-550/40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/10"
                  >
                    {isEvaluating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                    <span>Grade Solution Alignment</span>
                  </button>
                </div>

              </div>

              {/* RENDER EVALUATION SCOREBOARDS */}
              {evaluationResult && (
                <div className="border-t border-[#2d333d]/50 pt-5 space-y-4 animate-slide-up text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">SIMULATOR FEEDBACK SCORECARD</span>
                    <span className="text-[#38bdf8] font-black font-mono text-sm bg-indigo-505/10 p-1 px-3 border border-indigo-500/20 rounded bg-indigo-500/10">
                      Overall Score: {evaluationResult.score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#13161c]/60 rounded-xl border border-[#2d333d] space-y-1">
                      <span className="text-[8px] text-slate-500 font-extrabold uppercase font-mono">Communication Clarity:</span>
                      <span className="text-xs font-black text-white">{evaluationResult.communicationClarityScore || 75}%</span>
                    </div>
                    <div className="p-3 bg-[#13161c]/60 rounded-xl border border-[#2d333d] space-y-1">
                      <span className="text-[8px] text-slate-500 font-extrabold uppercase font-mono">Technical Accuracy:</span>
                      <span className="text-xs font-black text-white">{evaluationResult.technicalAccuracyScore || 70}%</span>
                    </div>
                  </div>

                  <div className="p-3 pb-3.5 bg-[#13161c]/40 border border-[#2d333d] rounded-xl text-slate-350 text-[11px]">
                    <strong className="text-white block mb-0.5">interviewer Critique:</strong>
                    "{evaluationResult.overallFeedback}"
                  </div>

                  {evaluationResult.improvedAnswerAlternative && (
                    <div className="p-4 bg-indigo-950/10 rounded-xl border border-indigo-500/15 space-y-2">
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2.5 py-0.5 border border-indigo-500/30 rounded font-mono uppercase tracking-wide">
                        Polished alternative reference response
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[10.5px]">
                        {evaluationResult.improvedAnswerAlternative}
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
