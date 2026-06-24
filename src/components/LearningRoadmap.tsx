import React, { useState, useEffect } from "react";
import { 
  Code, 
  Server, 
  Terminal, 
  UserCheck, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ArrowUpRight, 
  ChevronRight, 
  AlertCircle, 
  Award, 
  Flame, 
  Compass, 
  BookOpen,
  Zap,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoricalSession } from "../types";

interface LearningRoadmapProps {
  sessions: HistoricalSession[];
  difficulty: string;
  domain: string;
  company: string;
  onStartPractice: (mode: "technical" | "behavioral" | "coding" | "system-design") => void;
}

interface SkillArea {
  id: "coding" | "system-design" | "technical" | "behavioral";
  name: string;
  category: string;
  avgScore: number;
  testCount: number;
  status: "untested" | "weakness" | "improving" | "strength";
  icon: any;
  colorClass: string;
  borderClass: string;
  description: string;
}

interface TopicDetail {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  difficultyTarget: string;
  subTasks: { id: string; label: string }[];
  resources: { title: string; url: string; source: string }[];
}

export default function LearningRoadmap({
  sessions,
  difficulty,
  domain,
  company,
  onStartPractice,
}: LearningRoadmapProps) {
  const [skills, setSkills] = useState<SkillArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<"coding" | "system-design" | "technical" | "behavioral">("coding");
  
  // Persistent checklist state
  const [completedSubTasks, setCompletedSubTasks] = useState<Record<string, boolean>>({});
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Explainer AI states
  const [explainingTopic, setExplainingTopic] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load persistent checkboxes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prepai_roadmap_completed_tasks");
      if (saved) {
        setCompletedSubTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read completed roadmap tasks", e);
    }
  }, []);

  // Sync completion states
  const handleToggleSubTask = (taskId: string) => {
    const updated = {
      ...completedSubTasks,
      [taskId]: !completedSubTasks[taskId],
    };
    setCompletedSubTasks(updated);
    localStorage.setItem("prepai_roadmap_completed_tasks", JSON.stringify(updated));
  };

  const handleResetChecklist = () => {
    setCompletedSubTasks({});
    localStorage.removeItem("prepai_roadmap_completed_tasks");
    setIsConfirmingReset(false);
  };

  // Analyze past sessions dynamically
  useEffect(() => {
    // Standard baseline mappings
    const defaultBaseline = {
      coding: { name: "Algorithmic Complexity", category: "Data Structures & Coding Assessments", desc: "Evaluating optimized array operations, binary search pivots, graph DFS/BFS traversals, and dynamic recursion tables." },
      "system-design": { name: "System Scalability", category: "Architecture & Low-latency whiteboards", desc: "Designing multi-tier caching architectures, horizontal consistent hashing, active-passive database sharding, and fault tolerance." },
      technical: { name: "Technical Deep-Dives", category: "Core Computer Science Fundamentals", desc: "Exploring thread process threading limits, TCP client handshake latencies, ACID transaction isolates, and compiler operations." },
      behavioral: { name: "Behavioral Alignment", category: "STAR Framework & Cultural Fitness", desc: "Expressing professional growth retrospects, architectural disagreements de-escalation, and metric KPI result ownership." }
    };

    const aggregated = {
      coding: { total: 0, count: 0 },
      "system-design": { total: 0, count: 0 },
      technical: { total: 0, count: 0 },
      behavioral: { total: 0, count: 0 },
    };

    sessions.forEach(s => {
      // Normalize different types in data logs to standard groups
      const normalizedType = s.type === "technical" ? "technical" :
                             s.type === "coding" ? "coding" :
                             s.type === "system-design" ? "system-design" : "behavioral";
      aggregated[normalizedType].total += s.score;
      aggregated[normalizedType].count += 1;
    });

    const parsedSkills: SkillArea[] = [
      {
        id: "coding",
        name: defaultBaseline.coding.name,
        category: defaultBaseline.coding.category,
        avgScore: aggregated.coding.count > 0 ? Math.round(aggregated.coding.total / aggregated.coding.count) : 0,
        testCount: aggregated.coding.count,
        icon: Code,
        colorClass: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
        borderClass: "border-emerald-500/35 hover:border-emerald-500/70",
        description: defaultBaseline.coding.desc,
        status: "untested"
      },
      {
        id: "system-design",
        name: defaultBaseline["system-design"].name,
        category: defaultBaseline["system-design"].category,
        avgScore: aggregated["system-design"].count > 0 ? Math.round(aggregated["system-design"].total / aggregated["system-design"].count) : 0,
        testCount: aggregated["system-design"].count,
        icon: Server,
        colorClass: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30",
        borderClass: "border-indigo-500/35 hover:border-indigo-500/70",
        description: defaultBaseline["system-design"].desc,
        status: "untested"
      },
      {
        id: "technical",
        name: defaultBaseline.technical.name,
        category: defaultBaseline.technical.category,
        avgScore: aggregated.technical.count > 0 ? Math.round(aggregated.technical.total / aggregated.technical.count) : 0,
        testCount: aggregated.technical.count,
        icon: Terminal,
        colorClass: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
        borderClass: "border-blue-500/35 hover:border-blue-500/70",
        description: defaultBaseline.technical.desc,
        status: "untested"
      },
      {
        id: "behavioral",
        name: defaultBaseline.behavioral.name,
        category: defaultBaseline.behavioral.category,
        avgScore: aggregated.behavioral.count > 0 ? Math.round(aggregated.behavioral.total / aggregated.behavioral.count) : 0,
        testCount: aggregated.behavioral.count,
        icon: UserCheck,
        colorClass: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30",
        borderClass: "border-purple-500/35 hover:border-purple-500/70",
        description: defaultBaseline.behavioral.desc,
        status: "untested"
      }
    ];

    // Compute status
    parsedSkills.forEach(s => {
      if (s.testCount === 0) {
        s.status = "untested";
      } else if (s.avgScore < 60) {
        s.status = "weakness";
      } else if (s.avgScore < 80) {
        s.status = "improving";
      } else {
        s.status = "strength";
      }
    });

    // Bubble lowest scores or untested ones up to the top
    const sorted = [...parsedSkills].sort((a, b) => {
      // Untested (0 score) goes first
      if (a.testCount === 0 && b.testCount > 0) return -1;
      if (b.testCount === 0 && a.testCount > 0) return 1;
      // Then lower scores first
      return a.avgScore - b.avgScore;
    });

    setSkills(sorted);
    // Auto-select lowest area
    if (sorted.length > 0) {
      setSelectedArea(sorted[0].id);
    }
  }, [sessions]);

  // Comprehensive static database of interactive roadmap topics matching the chosen focus areas
  const roadmapTopicsDb: Record<"coding" | "system-design" | "technical" | "behavioral", TopicDetail[]> = {
    coding: [
      {
        id: "topic_code_1",
        title: "Sliding Window & Two-Pointer Optimizations",
        shortDesc: "Optimize nested O(N²) loops into O(N) linear scans by pacing slow/fast window indices.",
        fullDesc: "Learn key techniques to maintain active running windows across dynamic ranges. Essential for subarray, substring, and circular index optimizations target testing high-difficulty algorithmic challenges.",
        difficultyTarget: "Optimal complexity bounds",
        subTasks: [
          { id: "task_c_1_1", label: "Implement a sliding window to search longest substring without duplicates" },
          { id: "task_c_1_2", label: "Solve the Container With Most Water problem using twin inward pointers" },
          { id: "task_c_1_3", label: "Contrast fixed window sums with sliding dynamic conditions" }
        ],
        resources: [
          { title: "Sliding Window Core Patterns Guide", url: "https://techinterviewhandbook.org/algorithms/sliding-window/", source: "Tech Interview Handbook" },
          { title: "Top 7 TWO Pointer Coding Scenarios", url: "https://leetcode.com", source: "LeetCode Patterns" }
        ]
      },
      {
        id: "topic_code_2",
        title: "Directed Graphs, BFS & Topological Traversal",
        shortDesc: "Traverse non-linear node states safely. Learn dependencies resolution, cycle locks, and BFS routing.",
        fullDesc: "Graph networks represent core engineering states. Master the usage of colors, vis sets, and stacks to traverse trees, matrices, and dependencies safely.",
        difficultyTarget: "Standard BFS & DFS",
        subTasks: [
          { id: "task_c_2_1", label: "Compute structural topological order for multi-stage tasks dependency logs" },
          { id: "task_c_2_2", label: "Solve the Course Schedule problem ensuring no deadlocks exist" },
          { id: "task_c_2_3", label: "Apply breadth-first level traversals on matrix maps" }
        ],
        resources: [
          { title: "Topological Sort Deep Dive", url: "https://visualgo.net/en/dfsbfs", source: "VisuAlgo" },
          { title: "LeetCode Course Schedule Playbook", url: "https://leetcode.com", source: "Interview Patterns" }
        ]
      },
      {
        id: "topic_code_3",
        title: "Dynamic Programming: Recursion & Sub-structure Caching",
        shortDesc: "Avoid redundant work through memoization tables and iterative bottom-up array offsets.",
        fullDesc: "Eliminate duplicated tree recursion branches by caching solved computations inside local arrays, matrices, or maps. Learn space-saving state techniques.",
        difficultyTarget: "Advanced Math Patterns",
        subTasks: [
          { id: "task_c_3_1", label: "Solve the classic 0/1 Knapsack optimization using single array state compression" },
          { id: "task_c_3_2", label: "Implement Longest Common Subsequence utilizing iterative bottom-up table mapping" },
          { id: "task_c_3_3", label: "Measure spatial footprint reductions on fibonacci iteration blocks" }
        ],
        resources: [
          { title: "Dynamic Programming Demystified Guide", url: "https://techinterviewhandbook.org/algorithms/dynamic-programming/", source: "Tech Interview Handbook" },
          { title: "DP Patterns for FAANG Roles", url: "https://leetcode.com", source: "FAANG Prep" }
        ]
      }
    ],
    "system-design": [
      {
        id: "topic_sys_1",
        title: "Consistent Hashing & Ring Token Load Balancing",
        shortDesc: "Formulate a distributed server hashring to allocate key data structures evenly without hotspots.",
        fullDesc: "Consistent hashing lets systems scale up database nodes dynamically while minimizing keys remapping. Study virtual nodes strategies crucial for massive global system designs.",
        difficultyTarget: "Distributed Hash rings",
        subTasks: [
          { id: "task_s_1_1", label: "Calculate virtual token distributions to balance heavily skewed requests" },
          { id: "task_s_1_2", label: "Model how system handles server joins without service interruption logs" },
          { id: "task_s_1_3", label: "Compare consistent hash targets with generic modulo-N allocations" }
        ],
        resources: [
          { title: "Grokking Consistent Hashing", url: "https://systemdesignprimer.com", source: "System Design Primer" },
          { title: "AWS DynamoDB Hashing Strategies", url: "https://aws.amazon.com", source: "AWS Architecture Docs" }
        ]
      },
      {
        id: "topic_sys_2",
        title: "Multi-Tier Web Caching & Cache-Aside Eviction Policies",
        shortDesc: "Relieve relational SQL databases from bottleneck loads using fast memory CDN and Redis caches.",
        fullDesc: "Analyze cache concurrency states: cache-aside, write-through, write-behind, and CDN architectures. Learn to prevent cache stampedes and mitigate stale read conditions.",
        difficultyTarget: "Low-latency systems",
        subTasks: [
          { id: "task_s_2_1", label: "Implement cache-aside workflows checking cache before fallback SQL reads" },
          { id: "task_s_2_2", label: "Establish TTL limits and LRU caching policies for warm objects" },
          { id: "task_s_2_3", label: "Design mitigation blueprints for Cache Stampede under sudden hot key requests traffic" }
        ],
        resources: [
          { title: "Redis Caching Best Practices", url: "https://redis.io", source: "Redis Official Docs" },
          { title: "Scalable Caching Strategies on Edge CDN", url: "https://cloudflare.com", source: "Cloudflare Education" }
        ]
      },
      {
        id: "topic_sys_3",
        title: "Database Partitioning, Range Sharding & Replication",
        shortDesc: "Scale write capacity by slicing database rows into distinct shards. Balance replication lag.",
        fullDesc: "Master read/write scaling. Solve partition key design, eventual consistency, and split-brain scenarios under distributed constraints.",
        difficultyTarget: "Global scale architectures",
        subTasks: [
          { id: "task_s_3_1", label: "Draft a sharding map leveraging hash partitioning on global User ID" },
          { id: "task_s_3_2", label: "Examine eventual consistency sync loops between Primary and Replica databases" },
          { id: "task_s_3_3", label: "Define master election mechanisms during total network partition failures" }
        ],
        resources: [
          { title: "Designing Data-Intensive Applications: Chapter 5", url: "https://www.oreilly.com", source: "O'Reilly Media" },
          { title: "Horizontal Database Partitioning Demystified", url: "https://systemdesignprimer.com", source: "System Design Primer" }
        ]
      }
    ],
    technical: [
      {
        id: "topic_tech_1",
        title: "Multi-Region Distributed Transactions & ACID Isolation",
        shortDesc: "Maintain global transaction consistency using 2-Phase Commits or consensus algorithms safely.",
        fullDesc: "Safeguard high-frequency financial or seat reservations bookings across continents. Evaluate MVCC, optimistic locks, and consensus protocols.",
        difficultyTarget: "Atomic persistence states",
        subTasks: [
          { id: "task_t_1_1", label: "Contrast Two-Phase Commit blocking bottlenecks with Raft/Paxos consensus systems" },
          { id: "task_t_1_2", label: "Explain how Spanner Synchronizer bounds network time uncertainties using atomic clocks" },
          { id: "task_t_1_3", label: "Audit dirty reads and write skew behaviors under Repeatable Read levels" }
        ],
        resources: [
          { title: "Distributed Consensus: Raft Guide", url: "https://raft.github.io", source: "Raft Consensus Project" },
          { title: "Google Spanner Architecture Whitepaper", url: "https://research.google", source: "Google Research Labs" }
        ]
      },
      {
        id: "topic_tech_2",
        title: "Process Memory Management, Stack, Heap, & Cache Locality",
        shortDesc: "Understand spatial-temporal cache line alignments and Garbage Collection paradigms.",
        fullDesc: "Optimize code parsing directly at the hardware layer. Learn stack fast allocations, pointer jumps, garbage collector pauses, and modern spatial locality caching.",
        difficultyTarget: "Low-level structures",
        subTasks: [
          { id: "task_t_2_1", label: "Trace process execution stack frames and locate heap pointer allocations" },
          { id: "task_t_2_2", label: "Analyze why cache-misses occur during disorganized linked list pointer hops" },
          { id: "task_t_2_3", label: "Measure GC stop-the-world pauses under high memory allocations rate" }
        ],
        resources: [
          { title: "What Every Programmer Should Know About Memory", url: "https://lwn.net", source: "LWN Linux Weekly" },
          { title: "How garbage collection algorithms sweep inactive blocks", url: "https://v8.dev", source: "V8 Engine Architecture" }
        ]
      },
      {
        id: "topic_tech_3",
        title: "High Concurrency Socket Networks & Async Event loops",
        shortDesc: "Achieve C10K concurrency using non-blocking I/O events instead of heavy threads pools spawning.",
        fullDesc: "Assess how async platforms balance network connections without spinning expensive context-switch threads. Learn epoll, kqueue, and asynchronous reactors.",
        difficultyTarget: "Asynchronous IO patterns",
        subTasks: [
          { id: "task_t_3_1", label: "Diagram how and when I/O multiplexing yields core loop control back to the thread OS" },
          { id: "task_t_3_2", label: "Explain why standard Apache multi-thread pools saturate under long-lived socket polls" },
          { id: "task_t_3_3", label: "Verify why Node.js keeps running single-threaded event loops safely" }
        ],
        resources: [
          { title: "Async Network Programming Primer", url: "https://nginx.org", source: "NGINX Dev Docs" },
          { title: "Understanding Node.js Event Loop Stages", url: "https://nodejs.org", source: "NodeJS Guides" }
        ]
      }
    ],
    behavioral: [
      {
        id: "topic_beh_1",
        title: "STAR Structural Delivery & Quantitative Metrics Result Logging",
        shortDesc: "Inject numerical metrics KPIs into behavioral stories to demonstrate measurable business success.",
        fullDesc: "Reframe typical team stories into clear, structured frameworks carrying high impact metrics: $ revenue saved, % millisecond latency cuts, or dev-hours optimized.",
        difficultyTarget: "L6 Mid-Senior Leadership",
        subTasks: [
          { id: "task_b_1_1", label: "Rewrite a project description to detail the starting risk metrics and end outcome metrics" },
          { id: "task_b_1_2", label: "Quantify the team developer-velocity improvements following CI/CD pipeline automation" },
          { id: "task_b_1_3", label: "Isolate your custom individual actions from the overall team contributions" }
        ],
        resources: [
          { title: "Behavioral STAR Template for FAANG Candidates", url: "https://techinterviewhandbook.org/behavioral-interview/", source: "Tech Interview Handbook" },
          { title: "Answering L6 Leadership Questions", url: "https://amazon.jobs", source: "Amazon Careers guide" }
        ]
      },
      {
        id: "topic_beh_2",
        title: "Navigating Conflict Resolution & Data-driven Non-Authority Influence",
        shortDesc: "De-escalate passionate architectural stalemates using objective, peer-aligned metric tests.",
        fullDesc: "Learn how to establish alignment when key engineers differ. Leverage quick prototypes, test coverage benchmarks, and a selfless team commitment structure.",
        difficultyTarget: "Senior Alignment Principles",
        subTasks: [
          { id: "task_b_2_1", label: "Draft a collaborative proof-of-concept setup to de-escalate architectural disputes" },
          { id: "task_b_2_2", label: "Model how to disagree-and-commit constructively once stakeholders decide" },
          { id: "task_b_2_3", label: "Deliver blameless peer critiques centered on code-quality logs" }
        ],
        resources: [
          { title: "Influence without Authority handbook", url: "https://hbr.org", source: "Harvard Business Review" },
          { title: "Collaborating with difficult stakeholders guide", url: "https://techinterviewhandbook.org", source: "Tech Handbook" }
        ]
      },
      {
        id: "topic_beh_3",
        title: "Production Failure Ownership & Blameless Postmortems",
        shortDesc: "Adopt full accountability during major production downtime, guiding blameless prevent loop fixes.",
        fullDesc: "Learn how senior candidates earn massive trust by analyzing system outages transparently, documenting details objectively, and writing regression guards.",
        difficultyTarget: "Reliability ownership principles",
        subTasks: [
          { id: "task_b_3_1", label: "Draft a formal Root Cause Analysis (RCA) explaining a simulated PostgreSQL deadlock outage" },
          { id: "task_b_3_2", label: "Define automated test safeguards to isolate and block regressions on hot payment endpoints" },
          { id: "task_b_3_3", label: "Organize an incident retrospective timeline outlining quick triage benchmarks" }
        ],
        resources: [
          { title: "SRE Book: Blameless Postmortems Chapter", url: "https://sre.google/books/site-reliability-engineering/", source: "Google Site Reliability Engineering" },
          { title: "How to draft a stellar incident timeline", url: "https://atlassian.com", source: "Atlassian SRE Guidelines" }
        ]
      }
    ]
  };

  // Trigger server-side AI Explainer for a given study topic
  const handleExplainConcept = async (topicTitle: string, areaId: string) => {
    setExplainingTopic(topicTitle);
    setAiExplanation(null);
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/roadmap/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle,
          areaId,
          difficulty,
          domain,
          company
        })
      });

      if (!response.ok) {
        throw new Error("Could not reach study assistant. Re-attempting offline backup.");
      }

      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err: any) {
      console.error(err);
      // Clean fallback explanation
      let fallbackText = `### CONCEPT EXPLAINER: **${topicTitle}**\n\n`;
      fallbackText += `*Targeting:* **${difficulty} ${domain}** levels at **${company}**.\n\n`;
      fallbackText += `#### Core Architecture Overview\n`;
      fallbackText += `This topic evaluates how to mitigate high-scale resource limitations. To stand out in your upcoming mock rounds, focus on these critical pillars:\n\n`;
      fallbackText += `1. **Complexity Allocation**: Ensure all operations conform to strict constraints. Reduce nested arrays scanning immediately.\n`;
      fallbackText += `2. **Resilient Failovers**: Outline redundancy strategies. Include deep diagrams showing exactly where caches are updated.\n`;
      fallbackText += `3. **Numeric Proofs**: Back your answers in the voice panel or text input with quantitative metrics ($ budget cuts, ms latencies, % concurrency gains).\n\n`;
      fallbackText += `*PRO TIPS FOR ${company.toUpperCase()}:* Incorporate their exact system terms (e.g. distributed queues, eventual sync structures, or strict SLA tiers) to demonstrate deep alignment.`;
      
      setAiExplanation(fallbackText);
    } finally {
      setAiLoading(false);
    }
  };

  // Count progress rate
  const selectedTopics = roadmapTopicsDb[selectedArea] || [];
  const totalSubTasksInSelectedArea = selectedTopics.reduce((acc, t) => acc + t.subTasks.length, 0);
  const completedSubTasksInSelectedArea = selectedTopics.reduce((acc, t) => {
    return acc + t.subTasks.filter(st => completedSubTasks[st.id]).length;
  }, 0);
  const completionPercentage = totalSubTasksInSelectedArea > 0 
    ? Math.round((completedSubTasksInSelectedArea / totalSubTasksInSelectedArea) * 100)
    : 0;

  // Find the selected skill metadata
  const activeSkillMeta = skills.find(s => s.id === selectedArea);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>Target Study Companion</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Dynamic Learning Roadmap</h1>
          <p className="text-slate-400 text-sm mt-1">
            Analyzing past session scorecards to target and patch your weakest skill dimensions automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isConfirmingReset ? (
            <div className="flex items-center gap-2 animate-fade-in bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-500/20">
              <span className="text-[11px] font-bold text-red-400 font-sans">Clear achievements?</span>
              <button
                onClick={handleResetChecklist}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setIsConfirmingReset(false)}
                className="px-2.5 py-1 bg-slate-900 border border-[#2d333d] hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmingReset(true)}
              className="flex-1 md:flex-none py-2 px-3.5 bg-slate-900 border border-[#2d333d] text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Progress
            </button>
          )}
        </div>
      </div>

      {/* Grid: Left - Weakness Heatmap Analysis, Right - Interactive Topic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 4 Cols: Ranked Performance Stack */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 tracking-widest uppercase font-extrabold px-1">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
            <span>Weakness Priority Stack</span>
          </div>

          <div className="space-y-3">
            {skills.map((skill, idx) => {
              const Icon = skill.icon;
              const isSelected = selectedArea === skill.id;
              
              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedArea(skill.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? `bg-indigo-600/15 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.08)]` 
                      : `bg-[#13161c]/80 border-[#2d333d] hover:bg-[#171b22] hover:${skill.borderClass}`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-slate-950/70 border border-slate-800 ${skill.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold select-none">
                          Rank #{idx + 1} • {idx === 0 ? "Highest Urgency" : "Secondary Priority"}
                        </span>
                        <h4 className="text-sm font-black text-white mt-0.5 truncate">{skill.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">{skill.category}</p>
                      </div>
                    </div>
                    
                    {/* Urgency Indicators */}
                    <div className="text-right">
                      {skill.testCount === 0 ? (
                        <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-md px-1.5 py-0.5 font-black uppercase tracking-wider block">
                          Untested
                        </span>
                      ) : (
                        <span className={`text-xs font-mono font-black ${
                          skill.avgScore >= 80 ? 'text-emerald-400' :
                          skill.avgScore >= 60 ? 'text-yellow-400' : 'text-rose-400'
                        }`}>
                          {skill.avgScore}%
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500 font-medium block mt-1">
                        {skill.testCount === 0 ? "None" : `${skill.testCount} rounds`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Placement Standing Box */}
          <div className="p-5 bg-gradient-to-b from-[#171b22]/80 to-[#13161c] rounded-xl border border-[#2d333d] space-y-4">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Cohort Benchmark
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your overall progress index is currently mapped to address senior-level rubric expectations at <strong>{company}</strong>. Ensure all Weakness categories (Red/Yellow) reach at least 75% to maximize cohort placement.
            </p>
          </div>
        </div>

        {/* Right 8 Cols: Interactive Study Materials & Actions */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedArea}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-6"
            >
              {/* Category meta badge & title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-[#2d333d]/60">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {activeSkillMeta?.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-white">{activeSkillMeta?.name} Syllabus</h2>
                  <p className="text-xs text-slate-400 max-w-xl">{activeSkillMeta?.description}</p>
                </div>

                {/* Progress bar info for selected area */}
                <div className="w-full md:w-44 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-end text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    <span>Task Progress</span>
                    <span className="text-indigo-400">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-[#0b0d11] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-zinc-500 text-right block">
                    {completedSubTasksInSelectedArea} of {totalSubTasksInSelectedArea} tasks cleared
                  </span>
                </div>
              </div>

              {/* Topics stack */}
              <div className="space-y-6">
                {selectedTopics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    className="p-5 bg-slate-900/30 border border-[#2d333d]/60 rounded-xl space-y-4 hover:border-slate-800 transition duration-150"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-[#0b0d11]/40 p-3 rounded-lg border border-[#232933]/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.2 rounded font-mono">
                            0{index + 1}
                          </span>
                          <h3 className="text-sm font-black text-white">{topic.title}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{topic.shortDesc}</p>
                      </div>

                      <div className="flex gap-2 shrink-0 border-t md:border-t-0 border-[#2d333d]/50 pt-2 md:pt-0">
                        {/* Interactive Explain with AI */}
                        <button
                          id={`explain_concept_btn_${topic.id}`}
                          onClick={() => handleExplainConcept(topic.title, selectedArea)}
                          className="py-1.5 px-3 bg-[#1e293b] hover:bg-[#2e3e57] text-[#38bdf8] hover:text-[#7dd3fc] text-2xs font-extrabold uppercase rounded-lg border border-[#38bdf8]/10 hover:border-[#38bdf8]/40 transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#38bdf8]" />
                          Explain with AI
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed leading-normal">{topic.fullDesc}</p>

                    {/* Sub-tasks interactive list */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Required Focus Exercises</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topic.subTasks.map(st => {
                          const isCleared = !!completedSubTasks[st.id];
                          return (
                            <div 
                              key={st.id} 
                              onClick={() => handleToggleSubTask(st.id)}
                              className={`p-3 rounded-lg border cursor-pointer select-none transition flex items-start gap-2.5 ${
                                isCleared 
                                  ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300' 
                                  : 'bg-[#0b0d11] hover:bg-slate-800/10 border-slate-900 text-slate-300'
                              }`}
                            >
                              <div className={`p-0.5 rounded-md mt-0.5 transition ${isCleared ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 bg-[#171b22]'}`}>
                                <CheckCircle2 className={`w-3.5 h-3.5 ${isCleared ? 'fill-emerald-500/10' : ''}`} />
                              </div>
                              <span className={`text-[11px] leading-tight font-medium ${isCleared ? 'line-through opacity-70' : ''}`}>
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Curated Resources */}
                    <div className="pt-2 border-t border-[#2d333d]/40">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mb-2">Curated Study Material</span>
                      <div className="flex flex-wrap gap-3">
                        {topic.resources.map((res, rid) => (
                          <a 
                            key={rid}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0b0d11]/60 hover:bg-[#13161c] border border-slate-800 hover:border-slate-700/80 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1.5 font-medium"
                          >
                            <BookOpen className="w-3 h-3 text-slate-500" />
                            <span>{res.title}</span>
                            <span className="text-[9px] text-slate-600 flex items-center font-bold">({res.source}) <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" /></span>
                          </a>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Action Banner to trigger mock sessions of the specific area directly */}
              <div className="bg-gradient-to-r from-indigo-950/20 via-indigo-950/10 to-slate-900/40 border border-indigo-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                    <span>Instant Remediation</span>
                  </div>
                  <h3 className="text-sm font-black text-white">Trigger real-time assessments for {activeSkillMeta?.name || "Topic"}</h3>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-lg">
                    Formulate a fully personalized, AI-driven practice round tailored directly to patching the weaknesses analyzed in this roadmap module.
                  </p>
                </div>
                
                <button
                  id={`roadmap_start_assess_${selectedArea}`}
                  onClick={() => onStartPractice(selectedArea)}
                  className="w-full md:w-auto px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:-translate-y-0.5 transform transition shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Clear Weakness Area
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* AI Concept Explainer Overlay Modal */}
      <AnimatePresence>
        {explainingTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#13161c] border border-[#2d333d] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#2d333d]/70 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Career Operating System</span>
                  </div>
                  <h2 className="text-lg font-black text-white">{explainingTopic}</h2>
                </div>
                <button 
                  onClick={() => setExplainingTopic(null)}
                  className="text-xs bg-[#1a1f29] hover:bg-[#252c3b] text-slate-400 hover:text-slate-200 border border-[#2d333d] px-3 py-1.5 rounded-lg cursor-pointer transition"
                >
                  Close Explainer
                </button>
              </div>

              {/* Explainer Body */}
              <div className="space-y-4">
                {aiLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-bold tracking-wider uppercase animate-pulse">Running Deep Retrieval Explainer...</p>
                  </div>
                ) : aiError ? (
                  <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 text-red-400 p-4 rounded-xl text-xs">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span>{aiError}</span>
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-slate-300 font-medium whitespace-pre-wrap breakdown-docs select-text selection:bg-indigo-600/30">
                    {/* Rendered prompt results cleanly */}
                    {aiExplanation}
                  </div>
                )}
              </div>

              {/* Footnote */}
              <div className="pt-4 border-t border-[#2d333d]/70 flex flex-col sm:flex-row justify-between items-center gap-2">
                <p className="text-[9px] text-slate-500">
                  Concept coaching tailored in connection with {company.toUpperCase()} interview parameters.
                </p>
                <button 
                  id="explainer_begin_practice_modal"
                  onClick={() => {
                    setExplainingTopic(null);
                    onStartPractice(selectedArea);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xs uppercase tracking-wider rounded-lg transition"
                >
                  Start Assessment Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
