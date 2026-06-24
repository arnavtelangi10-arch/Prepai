import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  ChevronRight, 
  RefreshCw, 
  Code, 
  Database, 
  UserCheck, 
  Server, 
  BookOpen, 
  LineChart,
  ArrowUpRight,
  Target,
  Plus,
  CheckCircle2,
  X,
  Lightbulb,
  Github,
  Linkedin,
  Globe,
  ExternalLink,
  FolderGit,
  User,
  Edit2,
  Twitter,
  FileText,
  Settings,
  Link as LinkIcon,
  Lock,
  Unlock,
  Sparkles,
  Check,
  Volume2,
  VolumeX,
  Grid,
  List,
  Pin,
  Share2,
  HelpCircle,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ChevronLeft
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  LineChart as RechartsLineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";
import { HistoricalSession, ResumeProfile } from "../types";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import MarketTrends from "./MarketTrends";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 160, 
      damping: 18 
    }
  }
};

interface PerspectiveTiltCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function PerspectiveTiltCard({ children, className = "", id }: PerspectiveTiltCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  
  const springX = useSpring(cardX, { damping: 25, stiffness: 220 });
  const springY = useSpring(cardY, { damping: 25, stiffness: 220 });

  const rotateXTransform = useTransform(springY, [-100, 100], [6, -6]);
  const rotateYTransform = useTransform(springX, [-100, 100], [-6, 6]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.clientX - centerX;
    const clientY = e.clientY - centerY;
    
    cardX.set(clientX);
    cardY.set(clientY);
  };

  const handleMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      className={`h-full ${className}`}
      id={id}
    >
      <motion.div
        style={{
          rotateX: rotateXTransform,
          rotateY: rotateYTransform,
          transformStyle: "preserve-3d"
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface DashboardProps {
  resumeProfile: ResumeProfile | null;
  domain: string;
  company: string;
  difficulty: string;
  sessions: HistoricalSession[];
  onStartNewSession: () => void;
  onNavigateToCoach: () => void;
  onNavigateToRoadmap?: () => void;
  onEditProfile?: () => void;
  zenMode?: boolean;
  dailyGoal?: number;
  setDailyGoal?: (val: number) => void;
  manualOffset?: number;
  setManualOffset?: (val: number) => void;
  historyDifficultyFilter?: string;
  allSessions?: HistoricalSession[];
}

const ACHIEVEMENTS_CATALOG = [
  {
    id: "first_blood",
    name: "First Blood",
    desc: "Complete your first practice session",
    category: "practice",
    rarity: "common",
    icon: Award,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    lore: "Your journey into the mock arena has begun. The terminal is warmed up and local indexes have compiled successfully.",
    globalRate: "84.9%",
    xpValue: 100,
    expertTip: "Complete any initial simulation module (Coding, System Design, or Behavioral) to lock in this starter milestone.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const current = sessions.length;
      return { unlocked: current >= 1, current, target: 1, unit: "session" };
    }
  },
  {
    id: "streak_3",
    name: "Streak Pioneer",
    desc: "Maintain a 3-day active practice streak",
    category: "streak",
    rarity: "common",
    icon: Flame,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    lore: "Consistency is the foundation of cognitive rewiring. A 72-hour pipeline has been successfully scheduled and executed.",
    globalRate: "43.2%",
    xpValue: 150,
    expertTip: "Run a quick session once every 24 hours. Keep it short or switch topics daily to avoid burning out early.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      return { unlocked: streak >= 3, current: streak, target: 3, unit: "days" };
    }
  },
  {
    id: "streak_5",
    name: "Consistency Guru",
    desc: "Maintain a 5-day active practice streak",
    category: "streak",
    rarity: "rare",
    icon: Sparkles,
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    lore: "A majestic rhythmic momentum has taken hold. Complex abstract concepts are now settling into permanent muscle memory.",
    globalRate: "21.6%",
    xpValue: 250,
    expertTip: "Activate custom notifications or set a daily calendar buffer block to preserve your active streak integrity.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      return { unlocked: streak >= 5, current: streak, target: 5, unit: "days" };
    }
  },
  {
    id: "streak_10",
    name: "Dedicated Scholar",
    desc: "Maintain a 10-day active practice streak",
    category: "streak",
    rarity: "epic",
    icon: Target,
    color: "text-[#ff9800] bg-[#ff9800]/10 border-[#ff9800]/20",
    lore: "The zen master of technical interview prep. Ten solar cycles of flawless simulator attendance, forging unbreakable systems logical flow.",
    globalRate: "4.8%",
    xpValue: 500,
    expertTip: "Vary your training focus! Alternate strenuous tree-traversal coding drills with soft-skilled STAR behavioral layouts.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      return { unlocked: streak >= 10, current: streak, target: 10, unit: "days" };
    }
  },
  {
    id: "sessions_5",
    name: "Interview Novice",
    desc: "Complete 5 technical interview mock sessions",
    category: "practice",
    rarity: "rare",
    icon: Target,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    lore: "The framework begins to concrete itself. Five complete trial cycles have calibrated your technical articulate delivery.",
    globalRate: "29.7%",
    xpValue: 200,
    expertTip: "Inspect your historical feedback logs underneath the active simulator to identify recurring weak points to patch.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const current = sessions.length;
      return { unlocked: current >= 5, current, target: 5, unit: "rounds" };
    }
  },
  {
    id: "sessions_10",
    name: "Polished Practitioner",
    desc: "Complete 10 technical interview mock sessions",
    category: "practice",
    rarity: "legendary",
    icon: Trophy,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    lore: "An absolute titan of the simulator. Complex question analysis, structured diagram breakdowns, and articulate responses are fully natural.",
    globalRate: "6.2%",
    xpValue: 600,
    expertTip: "Broaden your scope by switching your targeted categories to push the bounds of your adaptive mental agility.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const current = sessions.length;
      return { unlocked: current >= 10, current, target: 10, unit: "rounds" };
    }
  },
  {
    id: "coding_85",
    name: "Coding Virtuoso",
    desc: "Score 85% or higher in a Coding Round",
    category: "scores",
    rarity: "epic",
    icon: Code,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    lore: "Prisinte algorithmic execution with optimal O(1) space complexity. True pointers manipulation mastery and elegant logic flow.",
    globalRate: "8.1%",
    xpValue: 300,
    expertTip: "Explain your logic out loud before typing! Use helper structures to keep main scope code readable and modular.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const maxVal = sessions.filter(s => s.type === "coding").reduce((max, s) => s.score > max ? s.score : max, 0);
      return { unlocked: maxVal >= 85, current: maxVal, target: 85, unit: "%" };
    }
  },
  {
    id: "sysdesign_85",
    name: "System Overlord",
    desc: "Score 85% or higher in a System Design Round",
    category: "scores",
    rarity: "epic",
    icon: Server,
    color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
    lore: "Distributed caching, horizontal partition sharding, dynamic routing, and fault tolerant multi-region structures. Pure high-concurrency scale mastery.",
    globalRate: "5.5%",
    xpValue: 350,
    expertTip: "Start with an unambiguous system load estimate. Clearly highlight failure bottlenecks and state detailed custom backup plans.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const maxVal = sessions.filter(s => s.type === "system-design").reduce((max, s) => s.score > max ? s.score : max, 0);
      return { unlocked: maxVal >= 85, current: maxVal, target: 85, unit: "%" };
    }
  },
  {
    id: "behavioral_90",
    name: "Communication Star",
    desc: "Score 90% or higher in a Behavioral Round",
    category: "scores",
    rarity: "epic",
    icon: UserCheck,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    lore: "A master storyteller utilizing flawless structural layouts. Perfectly measured impact indices backed by precise numerical metrics.",
    globalRate: "3.2%",
    xpValue: 300,
    expertTip: "Structure all communications strictly using STAR: Situation, Task, Action, and quantifiably concrete Result matrices.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const maxVal = sessions.filter(s => s.type === "behavioral").reduce((max, s) => s.score > max ? s.score : max, 0);
      return { unlocked: maxVal >= 90, current: maxVal, target: 90, unit: "%" };
    }
  },
  {
    id: "apex_85",
    name: "Apex Competitor",
    desc: "Achieve an overall readiness of 85%+ (min 2 sessions)",
    category: "special",
    rarity: "legendary",
    icon: TrendingUp,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    lore: "The absolute peak performance state. Exceptional adaptive fluency across both theoretical high architecture design and concrete codebase execution.",
    globalRate: "1.1%",
    xpValue: 800,
    expertTip: "Secure flawless high scores (85%+) in multiple modules to solidify your baseline alignment calculations above this critical marker.",
    check: (sessions: HistoricalSession[], streak: number, readiness: number) => {
      const hasEnough = sessions.length >= 2;
      return { unlocked: readiness >= 85 && hasEnough, current: hasEnough ? readiness : 0, target: 85, unit: "%" };
    }
  }
];

const RARITY_STYLING: Record<string, {
  label: string;
  bgClass: string;
  badgeBorder: string;
  textAccent: string;
  glowClass: string;
  badgeLabelColor: string;
  dotColor: string;
}> = {
  common: {
    label: "Common",
    bgClass: "bg-[#13161c]/70 border-[#2d333d]/70 hover:bg-[#151921]",
    badgeBorder: "border-slate-700/30",
    textAccent: "text-slate-400",
    glowClass: "achievement-glow-common",
    badgeLabelColor: "bg-slate-500/10 border border-slate-500/20 text-slate-400",
    dotColor: "bg-slate-500"
  },
  rare: {
    label: "Rare",
    bgClass: "rare-bg border-[#1a3a4d]/50 hover:bg-[#132230]/70",
    badgeBorder: "border-cyan-500/40",
    textAccent: "text-cyan-400 font-bold",
    glowClass: "achievement-glow-rare",
    badgeLabelColor: "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
    dotColor: "bg-cyan-400 animate-pulse"
  },
  epic: {
    label: "Epic",
    bgClass: "epic-bg border-purple-500/25 hover:bg-[#20102e]/70",
    badgeBorder: "border-purple-500/50",
    textAccent: "text-purple-400 font-bold",
    glowClass: "achievement-glow-epic",
    badgeLabelColor: "bg-purple-500/15 border border-purple-500/25 text-purple-400 font-bold",
    dotColor: "bg-purple-500"
  },
  legendary: {
    label: "Legendary",
    bgClass: "shimmer-bg border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
    badgeBorder: "border-amber-500/60",
    textAccent: "text-amber-400 font-black",
    glowClass: "achievement-glow-legendary",
    badgeLabelColor: "bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold",
    dotColor: "bg-amber-400 animate-ping"
  }
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
}

const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    
    const updateSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateSize();
    
    window.addEventListener("resize", updateSize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        
        ctx.beginPath();
        if (p.size > 2.2) {
          const spikes = 5;
          let rot = (Math.PI / 2) * 3;
          let x = p.x;
          let y = p.y;
          const step = Math.PI / spikes;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          for (let s = 0; s < spikes; s++) {
            x = p.x + Math.cos(rot) * p.size;
            y = p.y + Math.sin(rot) * p.size;
            ctx.lineTo(x, y);
            rot += step;
            x = p.x + Math.cos(rot) * (p.size / 2.2);
            y = p.y + Math.sin(rot) * (p.size / 2.2);
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(p.x, p.y - p.size);
          ctx.closePath();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }

      animFrame = requestAnimationFrame(render);
    };
    render();

    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number; rarity: string }>;
      const { x, y, rarity } = customEvent.detail;
      const amount = rarity === "legendary" ? 40 : rarity === "epic" ? 25 : rarity === "rare" ? 16 : 10;
      const colors = 
        rarity === "legendary" ? ["#f59e0b", "#fbbf24", "#fb923c", "#fef3c7", "#ffffff"] :
        rarity === "epic" ? ["#a855f7", "#c084fc", "#e879f9", "#f3e8ff", "#ffffff"] :
        rarity === "rare" ? ["#06b6d4", "#22d3ee", "#38bdf8", "#ecfeff", "#ffffff"] :
        ["#94a3b8", "#cbd5e1", "#e2e8f0", "#ffffff"];

      const rect = canvas.getBoundingClientRect();
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;

      for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 4.0 + 1.2;
        particlesRef.current.push({
          x: relativeX,
          y: relativeY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3.0 + 1.0,
          alpha: 1.0,
          decay: Math.random() * 0.025 + 0.015,
          gravity: 0.1
        });
      }
    };

    window.addEventListener("trigger-particles" as any, handleTrigger);

    return () => {
      window.removeEventListener("trigger-particles" as any, handleTrigger);
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-40 transition-all duration-300"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default function Dashboard({
  resumeProfile,
  domain,
  company,
  difficulty,
  sessions,
  onStartNewSession,
  onNavigateToCoach,
  onNavigateToRoadmap,
  onEditProfile,
  zenMode = false,
  dailyGoal: dailyGoalProp,
  setDailyGoal: setDailyGoalProp,
  manualOffset: manualOffsetProp,
  setManualOffset: setManualOffsetProp,
  historyDifficultyFilter = "all",
  allSessions
}: DashboardProps) {
  const statsSessions = allSessions || sessions;

  // Benchmarks for comparative analytical evaluation metrics
  const BENCHMARK_SESSIONS: HistoricalSession[] = [
    {
      id: "benchmark_senior",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      domain: "System Architecture & High Availability",
      company: "Google/Meta (Standard Senior)",
      difficulty: "expert",
      type: "system-design",
      score: 92,
      durationSeconds: 1540,
      questionsCount: 4
    },
    {
      id: "benchmark_average",
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      domain: "Algorithms & OOP Standards",
      company: "Industry Average Candidate",
      difficulty: "intermediate",
      type: "coding",
      score: 72,
      durationSeconds: 2400,
      questionsCount: 3
    }
  ];

  const comparisonOptions = typeof statsSessions !== "undefined" && statsSessions.length > 0
    ? [...statsSessions, ...BENCHMARK_SESSIONS]
    : BENCHMARK_SESSIONS;

  const [compareSessionId1, setCompareSessionId1] = useState<string>(() => {
    if (statsSessions && statsSessions.length > 0) return statsSessions[0].id;
    return "benchmark_senior";
  });

  const [compareSessionId2, setCompareSessionId2] = useState<string>(() => {
    if (statsSessions && statsSessions.length > 1) return statsSessions[1].id;
    return "benchmark_average";
  });

  const [xp, setXp] = useState(380);
  const [level, setLevel] = useState(2);
  const [streak, setStreak] = useState(5);
  const [readinessScore, setReadinessScore] = useState(65);
  const [achievementsFilter, setAchievementsFilter] = useState<"all" | "streak" | "practice" | "scores" | "unlocked" | "locked" | "common" | "rare" | "epic" | "legendary">("all");
  const [achievementsLayoutMode, setAchievementsLayoutMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("prepai_achievements_layout") as "list" | "grid") || "list";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("prepai_sound_enabled") !== "false";
  });
  const [pinnedBadges, setPinnedBadges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("prepai_pinned_achievements");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "coding" | "behavioral" | "system-design" | "technical">("all");

  const playSynthTone = (rarity: string) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playFreqAtTime = (freq: number, time: number, duration: number, type: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.12, time + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration - 0.02);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      if (rarity === "common") {
        playFreqAtTime(329.63, now, 0.15); // E4
        playFreqAtTime(392.00, now + 0.08, 0.15); // G4
        playFreqAtTime(523.25, now + 0.16, 0.3); // C5
      } else if (rarity === "rare") {
        playFreqAtTime(261.63, now, 0.12, "triangle"); // C4
        playFreqAtTime(329.63, now + 0.06, 0.12, "triangle"); // E4
        playFreqAtTime(392.00, now + 0.12, 0.12, "triangle"); // G4
        playFreqAtTime(523.25, now + 0.18, 0.3, "sine"); // C5
      } else if (rarity === "epic") {
        const notes = [349.23, 440.00, 523.25, 659.25, 783.99]; // F4, A4, C5, E5, G5
        notes.forEach((freq, idx) => {
          playFreqAtTime(freq, now + idx * 0.05, 0.3, "sine");
        });
      } else {
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          playFreqAtTime(freq, now + idx * 0.06, 0.4, "triangle");
          playFreqAtTime(freq * 2, now + idx * 0.06, 0.4, "sine");
        });
        playFreqAtTime(130.81, now, 0.55, "sine"); // C3 sub
      }
    } catch (e) {
      console.warn("Audio initiation bypassed", e);
    }
  };

  const playUnlockChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = "sine", volume = 0.08) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.02);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Gentle, celebratory ascending major chord progression
      playTone(523.25, now, 0.22, "sine", 0.06); // C5
      playTone(659.25, now + 0.08, 0.22, "sine", 0.06); // E5
      playTone(783.99, now + 0.16, 0.22, "sine", 0.06); // G5
      playTone(1046.50, now + 0.24, 0.55, "triangle", 0.08); // C6
      
      // Steady supporting sub octave notes
      playTone(261.63, now, 0.65, "sine", 0.1); // C4
    } catch (e) {
      console.warn("Could not play achievement unlock sound:", e);
    }
  };

  const togglePinBadge = (badgeId: string) => {
    setPinnedBadges((prev) => {
      let next;
      if (prev.includes(badgeId)) {
        next = prev.filter((id) => id !== badgeId);
      } else {
        if (prev.length >= 3) {
          next = [...prev.slice(1), badgeId];
        } else {
          next = [...prev, badgeId];
        }
      }
      localStorage.setItem("prepai_pinned_achievements", JSON.stringify(next));
      return next;
    });
  };

  // Career Goal Target state variable and circular math
  const [careerGoalSessions, setCareerGoalSessions] = useState<number>(() => {
    return Number(localStorage.getItem("prepai_career_goal_sessions")) || 10;
  });

  const completionPercent = Math.min(100, Math.round((statsSessions.length / careerGoalSessions) * 100));
  const radius = 22;
  const strokeWidth = 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  // Daily Practice Goal states and storage sync
  const [internalDailyGoal, setInternalDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("prepai_daily_goal_target");
    return saved ? parseInt(saved, 10) : 3;
  });
  const dailyGoal = dailyGoalProp !== undefined ? dailyGoalProp : internalDailyGoal;

  const [internalManualOffset, setInternalManualOffset] = useState<number>(() => {
    const saved = localStorage.getItem("prepai_manual_questions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) {
          return parsed.count ?? 0;
        }
      } catch (_) {}
    }
    return 0;
  });
  const manualOffset = manualOffsetProp !== undefined ? manualOffsetProp : internalManualOffset;

  const handleUpdateGoal = (newGoal: number) => {
    const cleanGoal = Math.max(1, Math.min(20, newGoal));
    if (setDailyGoalProp) {
      setDailyGoalProp(cleanGoal);
    } else {
      setInternalDailyGoal(cleanGoal);
    }
    localStorage.setItem("prepai_daily_goal_target", String(cleanGoal));
  };

  const handleAddManualQuestion = () => {
    const newOffset = manualOffset + 1;
    if (setManualOffsetProp) {
      setManualOffsetProp(newOffset);
    } else {
      setInternalManualOffset(newOffset);
    }
    localStorage.setItem("prepai_manual_questions", JSON.stringify({
      date: new Date().toDateString(),
      count: newOffset
    }));
  };

  const handleResetManualQuestions = () => {
    if (setManualOffsetProp) {
      setManualOffsetProp(0);
    } else {
      setInternalManualOffset(0);
    }
    localStorage.removeItem("prepai_manual_questions");
  };

  // Math calculated based on current date stamp
  const completedToday = statsSessions.reduce((acc, s) => {
    if (s.timestamp) {
      try {
        const sDate = new Date(s.timestamp);
        if (sDate.toDateString() === new Date().toDateString()) {
          return acc + (s.questionsCount || 1);
        }
      } catch (_) {}
    }
    return acc;
  }, 0);

  useEffect(() => {
    // Generate adaptive stats based on sessions history
    if (statsSessions.length > 0) {
      const avg = Math.round(statsSessions.reduce((acc, curr) => acc + curr.score, 0) / statsSessions.length);
      setReadinessScore(Math.min(100, Math.max(0, avg)));
      setXp(380 + statsSessions.length * 120);
      setStreak(Math.max(1, Math.min(30, 5 + Math.floor(statsSessions.length / 2))));
    }
  }, [statsSessions]);

  // Derived level
  useEffect(() => {
    const nextLvl = Math.floor(xp / 500) + 1;
    setLevel(nextLvl);
  }, [xp]);

  const levelProgress = Math.round(((xp % 500) / 500) * 100);

  // Daily Pro-Tip states
  const [isTipVisible, setIsTipVisible] = useState(() => {
    const saved = localStorage.getItem("prepai_dismissed_tip_date");
    const today = new Date().toDateString();
    return saved !== today;
  });
  const [proTip, setProTip] = useState<string>("");
  const [loadingTip, setLoadingTip] = useState(false);

  useEffect(() => {
    if (!isTipVisible) return;
    
    let active = true;
    const fetchProTip = async () => {
      setLoadingTip(true);
      try {
        const response = await fetch(`/api/interview-protip?domain=${encodeURIComponent(domain)}`);
        if (response.ok) {
          const text = await response.text();
          if (text.trim().startsWith("<!doctype") || text.trim().startsWith("<html")) {
            throw new Error("Received HTML instead of JSON (stale deployment/routing fallback)");
          }
          const data = JSON.parse(text);
          if (active && data.tip) {
            setProTip(data.tip);
            return;
          }
        }
        throw new Error("Server returned non-ok status or empty tip");
      } catch (err) {
        console.warn("Using client-side pro-tip fallback:", err);
        const frontendFallbacks: Record<string, string[]> = {
          "software-engineering": [
            "Always start your whiteboard coding by defining edge cases: empty arrays, integer overflows, and single-element inputs.",
            "When explaining system design, decouple your components. Use message queues to handle spikes in traffic asynchronously.",
            "Make sure to mention Big-O space and time complexity for every coding solution you propose, without waiting for the interviewer to ask."
          ],
          "cse": [
            "Always start your whiteboard coding by defining edge cases: empty arrays, integer overflows, and single-element inputs.",
            "When explaining system design, decouple your components. Use message queues to handle spikes in traffic asynchronously.",
            "Make sure to mention Big-O space and time complexity for every coding solution you propose, without waiting for the interviewer to ask."
          ],
          "ai": [
            "When discussing model tuning, be prepared to explain the difference between parameters, hyperparameters, and when to use LoRA over full fine-tuning.",
            "Be ready to explain how tokenization affects context window sizes and how RAG pipelines optimize search queries.",
            "Always clarify data leakage risks when training validation vs training partitions."
          ],
          "general-tech": [
            "In interviews, clear structure is better than quick coding. Speak out loud and build a collaborative dialog with the proctor.",
            "Understand the underlying network and storage layers. Whether you are FE or BE, everything ultimately resolves to files and sockets.",
            "Show empathy. When given feedback, don't be defensive. Treat the interviewer as a teammate rather than an adversary."
          ]
        };
        const normalizedDomain = (domain || "general-tech").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const fallbacks = frontendFallbacks[normalizedDomain] || frontendFallbacks["general-tech"];
        const dayIndex = new Date().getDate();
        setProTip(fallbacks[dayIndex % fallbacks.length]);
      } finally {
        if (active) setLoadingTip(false);
      }
    };

    fetchProTip();
    return () => {
      active = false;
    };
  }, [domain, isTipVisible]);

  const handleDismissTip = () => {
    setIsTipVisible(false);
    localStorage.setItem("prepai_dismissed_tip_date", new Date().toDateString());
  };

  // Hardcoded target skills with adaptive score mappings
  const skillsList = [
    { name: "Algorithms & Complexity", score: statsSessions.filter(s => s.type === "coding").length > 0 ? readinessScore + 4 : 58, icon: Code },
    { name: "System Scalability & State", score: statsSessions.filter(s => s.type === "system-design").length > 0 ? readinessScore - 2 : 62, icon: Server },
    { name: "Database & Caching Schemas", score: 68, icon: Database },
    { name: "STAR Communication Framework", score: statsSessions.filter(s => s.type === "behavioral").length > 0 ? readinessScore + 6 : 60, icon: UserCheck },
    { name: "Diagnostic Problem Solving", score: 72, icon: LineChart }
  ];

  // Dynamic roadmap checklist topics
  const roadmapTopics = [
    { id: "r_1", topic: "Refactor nested loop states to O(N) Sliding Windows", completed: statsSessions.filter(s => s.type === "coding" && s.score >= 70).length > 0, detail: "Core array queries optimized via dynamic anchors" },
    { id: "r_2", topic: "Implement consistent hashing limits & Redis clusters", completed: false, detail: "Crucial for global load-balancing simulation rounds" },
    { id: "r_3", topic: "Eliminate 'Um' / 'Like' from verbal speech responses", completed: statsSessions.length >= 3, detail: "Enhances presentation articulation index" },
    { id: "r_4", topic: "Format a Situation story carrying precise dollar KPIs", completed: statsSessions.filter(s => s.type === "behavioral").length > 0, detail: "Required for senior FAANG behavioral rounds" }
  ];

  // Generate daily session counts for the last 7 days
  const getWeeklyPracticeData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toDateString();
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      
      // Calculate how many questions were solved / sessions conducted on this day
      let count = statsSessions.reduce((acc, s) => {
        if (s.timestamp) {
          try {
            const sDate = new Date(s.timestamp);
            if (sDate.toDateString() === dateString) {
              return acc + (s.questionsCount || 1);
            }
          } catch (_) {}
        }
        return acc;
      }, 0);
      
      // If it is today, we also include the offline logged questions (manualOffset)
      if (dateString === today.toDateString()) {
        count += manualOffset;
      }
      
      data.push({
        day: dayName,
        dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        drills: count,
      });
    }
    
    return data;
  };

  const weeklyPracticeData = getWeeklyPracticeData();
  const totalWeeklyDrills = weeklyPracticeData.reduce((acc, curr) => acc + curr.drills, 0);
  const daysHitGoal = weeklyPracticeData.filter((d) => d.drills >= dailyGoal).length;

  // Generate historical score trend line of the last 10 sessions to visualize performance improvement
  const getHistoricalTrendData = () => {
    const last10 = [...statsSessions].slice(-10);
    
    if (last10.length === 0) {
      // Mock progress trajectory showing a typical student path for intuitive understanding
      return [
        { sessionNum: 1, label: "Session 1", score: 58, topic: "Arrays & Strings", mock: true },
        { sessionNum: 2, label: "Session 2", score: 64, topic: "STAR Storytelling", mock: true },
        { sessionNum: 3, label: "Session 3", score: 68, topic: "Complexity Analysis", mock: true },
        { sessionNum: 4, label: "Session 4", score: 72, topic: "DBMS & Indexing", mock: true },
        { sessionNum: 5, label: "Session 5", score: 77, topic: "Sliding Windows", mock: true },
        { sessionNum: 6, label: "Session 6", score: 81, topic: "Microservices Design", mock: true }
      ];
    }

    return last10.map((s, idx) => {
      let label = `S${idx + 1}`;
      if (s.timestamp) {
        try {
          const date = new Date(s.timestamp);
          label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } catch (_) {}
      }
      return {
        sessionNum: idx + 1,
        label,
        score: s.score || 0,
        topic: s.type ? s.type.charAt(0).toUpperCase() + s.type.slice(1) : "Technical",
        company: s.company || "General",
        mock: false
      };
    });
  };

  const trendData: any[] = getHistoricalTrendData();
  const hasRealSessions = statsSessions.length > 0;
  const averageRecentScore = hasRealSessions 
    ? Math.round(trendData.reduce((acc: number, curr: any) => acc + curr.score, 0) / trendData.length)
    : 71;
  const scoreImprovement = hasRealSessions && trendData.length > 1
    ? trendData[trendData.length - 1].score - trendData[0].score
    : 23; // Realistic illustration value

  // Active compared sessions
  const comparedSession1 = comparisonOptions.find(o => o.id === compareSessionId1) || comparisonOptions[0] || BENCHMARK_SESSIONS[0];
  const comparedSession2 = comparisonOptions.find(o => o.id === compareSessionId2) || comparisonOptions[1] || BENCHMARK_SESSIONS[1];

  const getSessionMetrics = (s: HistoricalSession) => {
    if (!s) return { score: 0, pacing: 0, complexity: 0, depth: 0, focus: 0 };
    const durationPerQ = s.durationSeconds / Math.max(1, s.questionsCount);
    const pacing = Math.max(35, Math.min(100, Math.round(110 - (durationPerQ / 10))));
    
    let complexity = 50;
    const diff = String(s.difficulty || "mid").toLowerCase();
    if (diff === "expert") complexity = 100;
    else if (diff === "senior") complexity = 85;
    else if (diff === "intermediate" || diff === "mid-level" || diff === "mid") complexity = 70;
    else complexity = 55;

    const depth = Math.max(40, Math.min(100, s.questionsCount * 25));

    let focus = 75;
    if (s.type === "coding") focus = 95;
    else if (s.type === "system-design") focus = 90;
    else if (s.type === "technical") focus = 85;
    else if (s.type === "behavioral") focus = 80;

    return {
      score: s.score || 0,
      pacing,
      complexity,
      depth,
      focus
    };
  };

  const metrics1 = getSessionMetrics(comparedSession1);
  const metrics2 = getSessionMetrics(comparedSession2);

  const radarCompareData = [
    { subject: "Core Score", A: metrics1.score, B: metrics2.score, fullMark: 100 },
    { subject: "Pacing Speed", A: metrics1.pacing, B: metrics2.pacing, fullMark: 100 },
    { subject: "Complexity", A: metrics1.complexity, B: metrics2.complexity, fullMark: 100 },
    { subject: "Tackle Volume", A: metrics1.depth, B: metrics2.depth, fullMark: 100 },
    { subject: "Domain Focus", A: metrics1.focus, B: metrics2.focus, fullMark: 100 }
  ];

  // Achievements processing
  const achievementsWithStatus = React.useMemo(() => {
    return ACHIEVEMENTS_CATALOG.map((ach) => {
      const status = ach.check(statsSessions, streak, readinessScore);
      return {
        ...ach,
        ...status,
      };
    });
  }, [statsSessions, streak, readinessScore]);

  // Track the set of unlocked achievement IDs to play a chime when a new one is unlocked
  const currentUnlockedIds = React.useMemo(() => {
    return new Set(achievementsWithStatus.filter((a) => a.unlocked).map((a) => a.id));
  }, [achievementsWithStatus]);

  const prevUnlockedIdsRef = React.useRef<Set<string> | null>(null);

  React.useEffect(() => {
    if (prevUnlockedIdsRef.current === null) {
      // First render: initialize the reference with already unlocked badges
      prevUnlockedIdsRef.current = currentUnlockedIds;
      return;
    }

    const newlyUnlocked: string[] = [];
    currentUnlockedIds.forEach((id) => {
      if (!prevUnlockedIdsRef.current!.has(id)) {
        newlyUnlocked.push(id);
      }
    });

    if (newlyUnlocked.length > 0) {
      // Play a magnificent high quality audio chime
      playUnlockChime();
    }

    prevUnlockedIdsRef.current = currentUnlockedIds;
  }, [currentUnlockedIds]);

  const totalAchievements = achievementsWithStatus.length;
  const unlockedAchievementsCount = achievementsWithStatus.filter((a) => a.unlocked).length;
  const achievementsUnlockedPercent = Math.round((unlockedAchievementsCount / totalAchievements) * 100);

  const nextTargetBadge = React.useMemo(() => {
    const lockedWithProgress = achievementsWithStatus
      .filter((a) => !a.unlocked)
      .map((a) => {
        const percentLeft = Math.round((a.current / a.target) * 100);
        return { ...a, percent: Math.min(100, Math.max(0, percentLeft)) };
      });
    
    if (lockedWithProgress.length === 0) return null;
    // Sort descending by completion percentage
    lockedWithProgress.sort((a, b) => b.percent - a.percent);
    return lockedWithProgress[0];
  }, [achievementsWithStatus]);

  const filteredAchievements = React.useMemo(() => {
    return achievementsWithStatus.filter((ach) => {
      if (achievementsFilter === "all") return true;
      if (achievementsFilter === "unlocked") return ach.unlocked;
      if (achievementsFilter === "locked") return !ach.unlocked;
      if (["common", "rare", "epic", "legendary"].includes(achievementsFilter)) {
        return ach.rarity === achievementsFilter;
      }
      return ach.category === achievementsFilter;
    });
  }, [achievementsWithStatus, achievementsFilter]);

  // Generate 53 weeks * 7 days of practice grid (Trailing 365 days ending Saturday of current week)
  const trailingYearActivity = React.useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysUntilSaturday = 6 - currentDayOfWeek;
    const saturdayOfCurrentWeek = new Date(today);
    saturdayOfCurrentWeek.setDate(today.getDate() + daysUntilSaturday);

    // Sun of 52 weeks ago
    const startSunday = new Date(saturdayOfCurrentWeek);
    startSunday.setDate(saturdayOfCurrentWeek.getDate() - (53 * 7 - 1));

    const cells: { date: Date; count: number; isFuture: boolean }[] = [];
    const nowZeroed = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 0; i < 371; i++) {
      const cellDate = new Date(startSunday);
      cellDate.setDate(startSunday.getDate() + i);
      const cellDateZeroed = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
      const isFuture = cellDateZeroed > nowZeroed;
      const dateStr = cellDate.toDateString();

      let count = 0;
      if (!isFuture) {
        // Real session questions solved
        const realCount = statsSessions.reduce((acc, s) => {
          if (s.timestamp) {
            try {
              const sDate = new Date(s.timestamp);
              if (sDate.toDateString() === dateStr) {
                return acc + (s.questionsCount || 1);
              }
            } catch (_) {}
          }
          return acc;
        }, 0);

        // Offline manually logged drills for today
        const manualCount = dateStr === today.toDateString() ? manualOffset : 0;

        // Stable generated natural study habit baseline
        let baselineCount = 0;
        const timeMs = cellDateZeroed.getTime();
        const seedValue = Math.sin(timeMs * 0.0003) * 1000 % 1;
        const absSeed = Math.abs(seedValue);
        const cycle = Math.sin(timeMs / (1000 * 60 * 60 * 24 * 32)) * 0.4 + 0.55;

        if (absSeed < (cycle * 0.3)) {
          baselineCount = Math.floor(absSeed * 3) + 1;
        }

        count = realCount + manualCount + baselineCount;
      }

      cells.push({
        date: cellDate,
        count,
        isFuture,
      });
    }

    // Generate Month Labels
    const weekMonthLabels: string[] = [];
    let lastMonth = -1;
    for (let w = 0; w < 53; w++) {
      const sunDate = new Date(startSunday);
      sunDate.setDate(startSunday.getDate() + w * 7);
      const currentMonth = sunDate.getMonth();
      if (currentMonth !== lastMonth) {
        weekMonthLabels.push(sunDate.toLocaleDateString("en-US", { month: "short" }));
        lastMonth = currentMonth;
      } else {
        weekMonthLabels.push("");
      }
    }

    // Calculate trailing stats
    const totalYearDrills = cells.reduce((acc, c) => acc + c.count, 0);
    const activeDaysCount = cells.filter(c => c.count > 0 && !c.isFuture).length;
    const maxDayDrills = cells.reduce((max, c) => c.count > max ? c.count : max, 0);

    return {
      cells,
      weekMonthLabels,
      totalYearDrills,
      activeDaysCount,
      maxDayDrills,
      startSunday,
    };
  }, [statsSessions, manualOffset]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Upper header section */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto min-w-0 flex-1">
          {/* Circular Career Goal Progress Ring */}
          <div className="flex items-center gap-3.5 bg-[#11141b] p-3 px-4 rounded-xl border border-[#2d333d]/70 shadow-inner group shrink-0">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background track circle */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-[#2d333d]/60"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Visual completion stroke */}
                <motion.circle
                  cx="28"
                  cy="28"
                  r={radius}
                  className="stroke-indigo-500"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              {/* Dynamic center percentage */}
              <span className="absolute text-[10px] font-black tracking-tighter text-[#eaebee] font-mono">
                {completionPercent}%
              </span>
            </div>
            
            {/* Context metrics and interactive goal customization */}
            <div className="space-y-0.5 animate-fade-in">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block font-mono">
                Goal Progress
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-white font-black">
                  {statsSessions.length} / {careerGoalSessions}
                </span>
                <span className="text-[9px] text-[#526071] font-bold uppercase tracking-wider">sessions</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, careerGoalSessions - 1);
                    setCareerGoalSessions(next);
                    localStorage.setItem("prepai_career_goal_sessions", String(next));
                  }}
                  className="w-4 h-4 rounded bg-[#1c212b] border border-[#2d333d] flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer font-bold"
                  title="Decrease target session goal"
                >
                  -
                </button>
                <span className="text-[8px] font-bold text-slate-550 uppercase tracking-wide font-mono">Target</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(100, careerGoalSessions + 1);
                    setCareerGoalSessions(next);
                    localStorage.setItem("prepai_career_goal_sessions", String(next));
                  }}
                  className="w-4 h-4 rounded bg-[#1c212b] border border-[#2d333d] flex items-center justify-center text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer font-bold"
                  title="Increase target session goal"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-normal sm:leading-snug break-words">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent break-all inline-block">{resumeProfile?.name || "Ready Candidate"}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 break-words">
              Career Goal Settings: <span className="text-indigo-400 font-semibold">{difficulty || "Mid-Level"} {domain || "General Engineer"}</span> • targeting <span className="text-violet-400 font-semibold">{company || "FAANG firms"}</span>
            </p>

            {/* Pinned Showcase Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 rotate-45 text-indigo-400 fill-indigo-400/20" /> Badge Showcase
              </span>
              {pinnedBadges.length === 0 ? (
                <span className="text-[10px] text-slate-500 italic">No badges pinned yet. Click any badge under Achievements below to pin.</span>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {pinnedBadges.map((badgeId) => {
                    const badge = ACHIEVEMENTS_CATALOG.find((b) => b.id === badgeId);
                    if (!badge) return null;
                    const status = achievementsWithStatus.find((a) => a.id === badgeId);
                    const isUnlocked = status?.unlocked;
                    const rStyle = RARITY_STYLING[badge.rarity || "common"];
                    
                    return (
                      <button
                        key={badgeId}
                        onClick={() => {
                          setSelectedBadge({
                            ...badge,
                            unlocked: isUnlocked,
                            current: status?.current || 0,
                            target: status?.target || 1
                          });
                          playSynthTone(badge.rarity);
                        }}
                        className={`text-[9px] py-0.5 px-2 rounded-full border flex items-center gap-1.5 font-mono font-bold transition hover:scale-105 active:scale-95 cursor-pointer bg-[#11141c]/80 select-none ${
                          isUnlocked 
                            ? "border-indigo-500/30 text-slate-200" 
                            : "border-slate-800 text-slate-500 line-through select-none cursor-not-allowed opacity-55"
                        }`}
                        title={`${badge.name} (${badge.rarity}) - Click to inspect`}
                      >
                        <span className={`w-1 h-1 rounded-full ${isUnlocked ? rStyle.dotColor : "bg-slate-600"}`} />
                        <badge.icon className={`w-3 h-3 ${isUnlocked ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span>{badge.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end shrink-0">
          {onNavigateToRoadmap && (
            <button 
              id="dash_roadmap_btn"
              onClick={onNavigateToRoadmap}
              className="flex-1 lg:flex-none py-2.5 px-4 bg-indigo-650/15 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-indigo-600/20 font-bold transition flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Learning Roadmap
            </button>
          )}
          <button 
            id="dash_coach_btn"
            onClick={onNavigateToCoach}
            className="flex-1 lg:flex-none py-2.5 px-4 bg-[#1e293b] text-slate-200 rounded-xl hover:bg-[#1e293b]/80 font-medium transition flex items-center justify-center gap-2 border border-[#2d333d]"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            AI Coach
          </button>
          <button 
            id="dash_new_session_btn"
            onClick={onStartNewSession}
            className="flex-1 lg:flex-none py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            Start Practice
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Daily pro-tip banner (dismissible) */}
      {!zenMode && isTipVisible && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          id="daily_protip_banner"
          className="relative bg-gradient-to-r from-indigo-950/40 via-[#1b1c2b] to-indigo-950/40 border border-indigo-500/20 p-5 pr-12 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-lg shadow-indigo-950/15"
        >
          <div className="flex-none p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Lightbulb className="w-5 h-5 animate-pulse text-indigo-300" />
          </div>

          <div className="space-y-1 select-text flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Daily Interview Pro-Tip</span>
              <span className="text-slate-600 text-xs font-mono">•</span>
              <span className="text-[10px] text-slate-450 uppercase font-black tracking-widest">{domain || "General Tech"} stack</span>
            </div>
            {loadingTip ? (
              <div className="h-4 w-2/3 bg-slate-800/80 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-[11.5px] text-slate-200 leading-normal font-semibold italic">
                "{proTip || "Always clarify the problem requirements and constraints before writing code."}"
              </p>
            )}
          </div>

          <button
            onClick={handleDismissTip}
            id="dismiss_protip_btn"
            className="absolute top-4 right-4 sm:static flex-none p-1.5 hover:bg-slate-800/40 hover:text-slate-300 text-slate-500 rounded-lg transition"
            title="Dismiss today's tip"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Gamified KPI Grid */}
      {!zenMode && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak card */}
          <PerspectiveTiltCard>
            <div className="bg-[#171b22]/80 p-5 rounded-2xl border border-[#2d333d]/90 flex flex-col justify-between hover:border-amber-500/30 transition shadow-inner h-full select-none" style={{ transformStyle: "preserve-3d" }}>
              <div className="flex items-center gap-4" style={{ transform: "translateZ(25px)" }}>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shrink-0">
                  <Flame className="w-6 h-6 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Practice Streak</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">{streak}</span>
                    <span className="text-slate-500 text-sm">days</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#2d333d]/40 flex items-center justify-between text-[10px]" style={{ transform: "translateZ(15px)" }}>
                <span className="text-slate-500">Today's Target:</span>
                <span className={`font-bold ${(completedToday + manualOffset) >= dailyGoal ? "text-emerald-400" : "text-indigo-300"}`}>
                  {completedToday + manualOffset} / {dailyGoal} Solved
                </span>
              </div>
            </div>
          </PerspectiveTiltCard>

          {/* Level Card */}
          <PerspectiveTiltCard>
            <div className="bg-[#171b22]/80 p-5 rounded-2xl border border-[#2d333d]/90 flex flex-col justify-between hover:border-violet-500/30 transition h-full select-none" style={{ transformStyle: "preserve-3d" }}>
              <div className="flex items-center gap-4" style={{ transform: "translateZ(25px)" }}>
                <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Interview XP</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">Lvl {level}</span>
                    <span className="text-slate-500 text-xs font-medium">({xp} XP)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3" style={{ transform: "translateZ(15px)" }}>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Progress to level {level + 1}</span>
                  <span>{xp % 500} / 500 XP</span>
                </div>
                <div className="w-full bg-[#13161c] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${levelProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </PerspectiveTiltCard>

          {/* Readiness Index Card */}
          <PerspectiveTiltCard>
            <div className="bg-[#171b22]/80 p-5 rounded-2xl border border-[#2d333d]/90 flex flex-col justify-between hover:border-emerald-500/30 transition h-full select-none text-slate-200" style={{ transformStyle: "preserve-3d" }}>
              <div className="flex items-center gap-4" style={{ transform: "translateZ(25px)" }}>
                <div className="p-3 bg-emerald-500/10 text-emerald-550 rounded-xl shrink-0">
                  <TrendingUp className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Placement Readiness</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{readinessScore}%</span>
                    <span className="text-emerald-400 text-[9px] sm:text-[10px] font-semibold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                      +{statsSessions.length * 3}% Growth
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-[#2d333d]/40 pt-2" style={{ transform: "translateZ(15px)" }}>
                Aggregate of historical simulation metrics
              </div>
            </div>
          </PerspectiveTiltCard>

          {/* Peer benchmark quick lookup */}
          <PerspectiveTiltCard>
            <div className="bg-[#171b22]/80 p-5 rounded-2xl border border-[#2d333d]/90 flex flex-col justify-between hover:border-blue-500/30 transition h-full select-none" style={{ transformStyle: "preserve-3d" }}>
              <div className="flex items-center gap-4" style={{ transform: "translateZ(25px)" }}>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Peer Standings</h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">Top {Math.max(4, 35 - statsSessions.length * 4)}%</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] border-t border-[#2d333d]/40 pt-2" style={{ transform: "translateZ(15px)" }}>
                ranked against {domain || "CS"} candidates
              </p>
            </div>
          </PerspectiveTiltCard>
        </div>
      )}

      {/* Live Tech Job Market Trends Analytics module */}
      {!zenMode && (
        <MarketTrends 
          resumeProfile={resumeProfile} 
          onStartNewSession={onStartNewSession}
          onNavigateToRoadmap={onNavigateToRoadmap} 
        />
      )}

      {/* Activity Heatmap trailing 365 days */}
      {!zenMode && (
        <PerspectiveTiltCard className="w-full">
          <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm select-none" style={{ transformStyle: "preserve-3d" }}>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6" style={{ transform: "translateZ(25px)" }}>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Annual Practice Activity
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Trajectory of daily code challenges, interview mocks, and algorithmic calibrations completed over the trailing 365 days.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-[#13161c]/60 border border-[#2d333d]/50 p-2.5 px-4 rounded-xl flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" />
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Trailing 365 Days</span>
                    <span className="text-white text-xs font-black">{trailingYearActivity.totalYearDrills} exercises completed</span>
                  </div>
                </div>

                <div className="bg-[#13161c]/60 border border-[#2d333d]/50 p-2.5 px-4 rounded-xl flex items-center gap-2 font-sans">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-505" style={{ backgroundColor: "#10b981" }} />
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block">Consistency Ratio</span>
                    <span className="text-white text-xs font-black">{trailingYearActivity.activeDaysCount} Days Active ({Math.round((trailingYearActivity.activeDaysCount / 365) * 100)}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-[#13161c]/40 py-1.5 px-3 rounded-lg border border-slate-800">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#13161c]/50 border border-[#2d333d]/40" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#4f46e5]/15 border border-[#818cf8]/25" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#4f46e5]/35 border border-[#818cf8]/45" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#4f46e5]/60 border border-[#818cf8]/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#6366f1] border border-[#a5b4fc]/70" />
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Scrollable Heatmap Scroll Area */}
            <div className="overflow-x-auto scroller-slate pb-3 pt-1 -mx-2 px-2" style={{ transform: "translateZ(15px)" }}>
              <div className="min-w-[720px] pr-4">
                {/* Headers line (Months) */}
                <div className="grid grid-cols-[30px_1fr] gap-2 items-center mb-1">
                  <div className="w-[30px]"></div> {/* spacer for weekday labels */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(53, minmax(0, 1fr))" }} className="gap-[3px]">
                    {trailingYearActivity.weekMonthLabels.map((lbl, idx) => (
                      <div key={idx} className="text-[8px] font-mono font-bold text-slate-500 uppercase h-3 select-none">
                        {lbl}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid area */}
                <div className="grid grid-cols-[30px_1fr] gap-2 items-start">
                  {/* Left days Labels */}
                  <div className="grid grid-rows-7 h-[109px] text-[8px] font-mono font-bold text-slate-500 uppercase py-0.5 select-none text-right pr-1">
                    <div className="h-3 flex items-center justify-end"></div>
                    <div className="h-3 flex items-center justify-end">Mon</div>
                    <div className="h-3 flex items-center justify-end"></div>
                    <div className="h-3 flex items-center justify-end">Wed</div>
                    <div className="h-3 flex items-center justify-end"></div>
                    <div className="h-3 flex items-center justify-end">Fri</div>
                    <div className="h-3 flex items-center justify-end"></div>
                  </div>

                  {/* 53 columns x 7 rows cells */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(53, minmax(0, 1fr))" }} className="gap-[3px]">
                    {Array.from({ length: 53 }).map((_, weekIdx) => (
                      <div key={weekIdx} className="grid grid-rows-7 gap-[3px]">
                        {Array.from({ length: 7 }).map((_, dayIdx) => {
                          const cellIdx = weekIdx * 7 + dayIdx;
                          const cell = trailingYearActivity.cells[cellIdx];
                          if (!cell) return <div key={dayIdx} className="w-3 h-3 rounded-sm opacity-0 pointer-events-none" />;

                          let cellColorClass = "bg-[#13161c]/50 border border-[#2d333d]/40";
                          if (cell.isFuture) {
                            cellColorClass = "bg-[#13161c]/10 border border-[#2d333d]/10 opacity-30 cursor-not-allowed";
                          } else if (cell.count > 0) {
                            if (cell.count <= 2) {
                              cellColorClass = "bg-[#4f46e5]/15 border border-[#818cf8]/25 text-[#a5b4fc] cursor-pointer hover:border-[#818cf8]/60 hover:scale-115";
                            } else if (cell.count <= 4) {
                              cellColorClass = "bg-[#4f46e5]/35 border border-[#818cf8]/45 text-[#a5b4fc] cursor-pointer hover:border-[#818cf8]/80 hover:scale-115";
                            } else if (cell.count <= 6) {
                              cellColorClass = "bg-[#4f46e5]/60 border border-[#818cf8]/70 text-white cursor-pointer hover:border-white/50 hover:scale-115";
                            } else {
                              cellColorClass = "bg-[#6366f1] border border-[#a5b4fc]/70 text-white cursor-pointer hover:scale-115 hover:shadow-lg hover:shadow-indigo-500/20";
                            }
                          } else {
                            cellColorClass = "bg-[#13161c]/45 border border-[#2d333d]/70 cursor-pointer hover:border-indigo-500/30";
                          }

                          const formattedDate = cell.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                          const countText = cell.isFuture 
                            ? "Locked" 
                            : `${cell.count} ${cell.count === 1 ? "practice exercise" : "practice exercises"} completed`;

                          return (
                            <div key={dayIdx} className="group relative">
                              <div 
                                className={`w-3 h-3 sm:w-[13px] sm:h-[13px] rounded-[3px] transition duration-200 ${cellColorClass}`}
                              />
                              {/* Hover popover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#0e1117] border border-[#2d333d]/90 text-slate-200 text-[10px] font-medium p-2.5 rounded-xl whitespace-nowrap shadow-2xl z-50 pointer-events-none hover:scale-100 min-w-[130px] text-center">
                                <p className="font-bold text-white text-[10.5px] mb-0.5">{countText}</p>
                                <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">{formattedDate}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 border-t border-[#2d333d]/45 pt-3 mt-1 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-[#6366f1] inline-block animate-pulse"></span>
              Live updates active • Practice daily to maintain and calibrate your placement standing matrix
            </p>
          </div>
        </PerspectiveTiltCard>
      )}

      {/* Main dashboard splits */}
      <div className={`grid grid-cols-1 ${zenMode ? "" : "lg:grid-cols-3"} gap-6`}>
        {/* Left columns: Skill mastery and roadmap tasks */}
        <div className={`${zenMode ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}>
          
          {/* Skill Proficiency card */}
          {!zenMode && (
            <PerspectiveTiltCard className="w-full">
              <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full select-none" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex justify-between items-center mb-6" style={{ transform: "translateZ(25px)" }}>
                  <div>
                    <h3 className="text-lg font-bold text-white">Domain Competency Heatmap</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Aggregated metrics evaluated under stress simulations</p>
                  </div>
                  <button 
                    id="reset_metrics_btn"
                    onClick={() => setXp(prev => prev + 20)}
                    className="p-1 px-2.5 rounded bg-[#1e293b] text-slate-300 hover:bg-[#1e293b]/80 text-xs font-medium transition flex items-center gap-1 border border-[#2d333d]"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    Refresh
                  </button>
                </div>
                <div className="space-y-4" style={{ transform: "translateZ(15px)" }}>
                  {skillsList.map((skill, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-300">
                        <span className="flex items-center gap-2">
                          <skill.icon className="w-3.5 h-3.5 text-indigo-400" />
                          {skill.name}
                        </span>
                        <span className={`font-semibold ${skill.score >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {skill.score}%
                        </span>
                      </div>
                      <div className="w-full bg-[#13161c] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${skill.score >= 75 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
                          style={{ width: `${skill.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PerspectiveTiltCard>
          )}

          {/* Weekly Practice consistency (Bar Chart) */}
          {!zenMode && (
            <PerspectiveTiltCard className="w-full">
              <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full select-none" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6" style={{ transform: "translateZ(25px)" }}>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-400" />
                      Weekly Practice Consistency
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Visualize daily questions completed vs. onboarding target</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                      {daysHitGoal} / 7 Days Met
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                      {totalWeeklyDrills} Weekly Drills
                    </span>
                  </div>
                </div>

                <div className="h-[240px] w-full" style={{ transform: "translateZ(15px)" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyPracticeData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="drillGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d333d" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false} 
                        allowDecimals={false}
                        width={35}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                        contentStyle={{
                          backgroundColor: "#11141b",
                          borderColor: "#2d333d",
                          borderRadius: "12px",
                          padding: "8px 12px",
                        }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                        itemStyle={{ color: "#eaebee", fontSize: "12px" }}
                        formatter={(value: any, name: any, props: any) => {
                          const isSuccess = value >= dailyGoal;
                          return [
                            <span className="flex items-center gap-1.5 font-bold">
                              <span className={isSuccess ? "text-emerald-400" : "text-indigo-400"}>
                                {value}
                              </span>
                              <span className="text-slate-500 text-[10px] font-normal">
                                {isSuccess ? "🎯 Target Achieved" : `(${dailyGoal} target)`}
                              </span>
                            </span>,
                            "Drills Conducted"
                          ];
                        }}
                      />
                      <ReferenceLine 
                        y={dailyGoal} 
                        stroke="#34d399" 
                        strokeDasharray="4 4" 
                        strokeWidth={1.5}
                        label={{ 
                          value: `Daily Goal: ${dailyGoal}`, 
                          position: "insideTopRight", 
                          fill: "#34d399", 
                          fontSize: 9,
                          fontWeight: "bold"
                        }}
                      />
                      <Bar dataKey="drills" radius={[5, 5, 0, 0]} maxBarSize={30}>
                        {weeklyPracticeData.map((entry, index) => {
                          const isMet = entry.drills >= dailyGoal;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isMet ? "url(#goalGradient)" : "url(#drillGradient)"}
                              stroke={isMet ? "#34d399" : "#818cf8"}
                              strokeWidth={1}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between mt-4 text-[11px] text-slate-500 border-t border-[#2d333d]/40 pt-3">
                  <p className="flex items-center gap-1.5 leading-relaxed">
                    <span className="w-2 h-2 rounded bg-emerald-500 inline-block"></span>
                    Green indicates daily onboarding target was hit or exceeded.
                  </p>
                  <p className="font-mono text-[10px] font-bold text-slate-400">
                    LAST 7 DAYS
                  </p>
                </div>
              </div>
            </PerspectiveTiltCard>
          )}

          {/* Historical Score Trend (Line Chart) */}
          {!zenMode && (
            <PerspectiveTiltCard className="w-full">
              <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full select-none" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6" style={{ transform: "translateZ(25px)" }}>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      Historical Performance Progress
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {hasRealSessions 
                        ? `Trend line of your score trajectory over the last ${trendData.length} mock sessions` 
                        : "Visualized trajectory mapping typical learner progress"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                      Avg Score: {averageRecentScore}%
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                      scoreImprovement >= 0 
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}>
                      {scoreImprovement >= 0 ? "+" : ""}{scoreImprovement}% Improvement
                    </span>
                  </div>
                </div>

                <div className="h-[240px] w-full relative" style={{ transform: "translateZ(15px)" }}>
                  {!hasRealSessions && (
                    <div className="absolute inset-0 bg-[#13161c]/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center z-10 rounded-xl border border-dashed border-[#2d333d]/70">
                      <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">Demonstration Preview</p>
                      <p className="text-slate-300 text-xs max-w-sm">
                        You haven't conducted any mock evaluation sessions yet. Try a diagnostic simulator to plot your live assessment trend here!
                      </p>
                      <button 
                        onClick={onStartNewSession}
                        className="mt-3 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition"
                      >
                        Launch First Simulator
                      </button>
                    </div>
                  )}

                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={trendData}
                      margin={{ top: 12, right: 15, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d333d" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false} 
                        domain={[20, 100]}
                        width={35}
                      />
                      <Tooltip
                        cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "3 3" }}
                        contentStyle={{
                          backgroundColor: "#11141b",
                          borderColor: "#2d333d",
                          borderRadius: "12px",
                          padding: "8px 12px",
                        }}
                        labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                        itemStyle={{ color: "#eaebee", fontSize: "12px" }}
                        formatter={(value: any, name: any, props: any) => {
                          const payload = props.payload;
                          return [
                            <div className="space-y-1">
                              <span className="flex items-center gap-1 font-bold text-white text-xs">
                                <span>Score:</span>
                                <span className={value >= 75 ? "text-emerald-400" : "text-indigo-400"}>
                                  {value}%
                                </span>
                              </span>
                              {payload.topic && (
                                <p className="text-[10px] text-slate-400 font-medium leading-tight">
                                  Focus: <span className="text-slate-350">{payload.topic}</span>
                                </p>
                              )}
                              {payload.company && (
                                <p className="text-[9px] text-[#a5b4fc] font-mono">
                                  Target: {payload.company}
                                </p>
                              )}
                            </div>,
                            null
                          ];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#818cf8" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#11141b", stroke: "#818cf8" }}
                        activeDot={{ r: 6, strokeWidth: 2, fill: "#818cf8", stroke: "#ecefcf" }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between mt-4 text-[11px] text-slate-500 border-t border-[#2d333d]/40 pt-3">
                  <p className="flex items-center gap-1.5 leading-relaxed">
                    <span className="w-2 h-2 rounded bg-indigo-500 inline-block animate-pulse"></span>
                    Interactive tooltips highlight custom domains, topics, and company targets.
                  </p>
                  <p className="font-mono text-[10px] font-bold text-slate-400">
                    {hasRealSessions ? "LAST 10 SESSION EVALUATIONS" : "SAMPLE TRAJECTORY INDICATOR"}
                  </p>
                </div>
              </div>
            </PerspectiveTiltCard>
          )}

          {/* Side-by-Side Session Competency Comparison */}
          {!zenMode && (
            <PerspectiveTiltCard className="w-full">
              <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-6" style={{ transform: "translateZ(25px)" }}>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      Session Competency Matrix (Radar Index comparison)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Select and compare two mock interview rounds side-by-side using the spider index mapping
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-450 bg-indigo-550/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                      Side-By-Side Comparison
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ transform: "translateZ(15px)" }}>
                  {/* Left Column Selector & Stats (Indigo/A) */}
                  <div className="lg:col-span-4 bg-[#11141c]/50 p-4 rounded-xl border border-[#2d333d]/50 flex flex-col justify-between space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 font-mono">
                        Select Session [Axis A]
                      </label>
                      <select
                        id="compare_session_select_a"
                        value={compareSessionId1}
                        onChange={(e) => {
                          playSynthTone("common");
                          setCompareSessionId1(e.target.value);
                        }}
                        className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none cursor-pointer font-sans"
                      >
                        {comparisonOptions.map((opt) => {
                          const dateStr = opt.id.startsWith("benchmark") 
                            ? "Benchmark" 
                            : new Date(opt.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return (
                            <option key={`a_${opt.id}`} value={opt.id} className="bg-[#11141b]">
                              {opt.type.toUpperCase()} ({dateStr}) - {opt.score}% - {opt.company}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Target Level</span>
                        <span className="text-xs font-bold text-white capitalize">{comparedSession1.difficulty || "mid-level"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Company Standard</span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">{comparedSession1.company || "General"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Knowledge Type</span>
                        <span className="text-xs font-mono font-bold text-indigo-400 capitalize">{comparedSession1.type}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Time Expended</span>
                        <span className="text-xs font-bold text-white">
                          {Math.floor(comparedSession1.durationSeconds / 60)}m {comparedSession1.durationSeconds % 60}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-405 font-bold">Calculated Score</span>
                        <span className="text-sm font-black text-indigo-400">{comparedSession1.score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Central Radar Graph */}
                  <div className="lg:col-span-4 bg-[#11141c]/20 rounded-xl border border-[#2d333d]/30 p-2 flex flex-col items-center justify-center min-h-[260px]">
                    <div className="w-full h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarCompareData}>
                          <PolarGrid stroke="#2d333d" opacity={0.6} />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={{ fill: "#64748b", fontSize: 8 }} 
                            stroke="#2d333d" 
                            opacity={0.4} 
                          />
                          <Radar 
                            name="Axis A (Indigo)" 
                            dataKey="A" 
                            stroke="#818cf8" 
                            fill="#818cf8" 
                            fillOpacity={0.25} 
                          />
                          <Radar 
                            name="Axis B (Amber)" 
                            dataKey="B" 
                            stroke="#f59e0b" 
                            fill="#f59e0b" 
                            fillOpacity={0.2} 
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#11141b", 
                              borderColor: "#2d333d", 
                              borderRadius: "12px",
                              fontSize: "10.5px",
                              fontFamily: "monospace"
                            }} 
                            itemStyle={{ color: "#eaebee" }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-bold font-mono mt-2 pb-1">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <span className="w-2 h-2 rounded bg-indigo-500"></span> Axis A
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2 h-2 rounded bg-amber-500"></span> Axis B
                      </span>
                    </div>
                  </div>

                  {/* Right Column Selector & Stats (Amber/B) */}
                  <div className="lg:col-span-4 bg-[#11141c]/50 p-4 rounded-xl border border-[#2d333d]/50 flex flex-col justify-between space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2 font-mono">
                        Select Session [Axis B]
                      </label>
                      <select
                        id="compare_session_select_b"
                        value={compareSessionId2}
                        onChange={(e) => {
                          playSynthTone("common");
                          setCompareSessionId2(e.target.value);
                        }}
                        className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-200 outline-none cursor-pointer font-sans"
                      >
                        {comparisonOptions.map((opt) => {
                          const dateStr = opt.id.startsWith("benchmark") 
                            ? "Benchmark" 
                            : new Date(opt.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return (
                            <option key={`b_${opt.id}`} value={opt.id} className="bg-[#11141b]">
                              {opt.type.toUpperCase()} ({dateStr}) - {opt.score}% - {opt.company}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Target Level</span>
                        <span className="text-xs font-bold text-white capitalize">{comparedSession2.difficulty || "mid-level"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Company Standard</span>
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">{comparedSession2.company || "General"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Knowledge Type</span>
                        <span className="text-xs font-mono font-bold text-amber-500 capitalize">{comparedSession2.type}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#2d333d]/40 pb-2">
                        <span className="text-[11px] text-slate-405">Time Expended</span>
                        <span className="text-xs font-bold text-white">
                          {Math.floor(comparedSession2.durationSeconds / 60)}m {comparedSession2.durationSeconds % 60}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-450 font-bold">Calculated Score</span>
                        <span className="text-sm font-black text-amber-500">{comparedSession2.score}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 text-[11px] text-slate-500 border-t border-[#2d333d]/40 pt-3">
                  <p className="flex items-center gap-1.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 inline-block animate-pulse"></span>
                    Comparison integrates automatic speed indexes, complexity weight, and depth ratings relative to real-world expectations.
                  </p>
                  <p className="font-mono text-[10px] font-bold text-indigo-400">
                    REALTIME DELTA RADAR
                  </p>
                </div>
              </div>
            </PerspectiveTiltCard>
          )}

          {/* study roadmap task module */}
          <PerspectiveTiltCard className="w-full">
            <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full select-none" style={{ transformStyle: "preserve-3d" }}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4" style={{ transform: "translateZ(25px)" }}>
                <div>
                  <h3 className="text-lg font-bold text-white">Interview Preparedness Roadmap</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Personalized target checkpoints generated from past sessions</p>
                </div>
                {onNavigateToRoadmap ? (
                  <button
                    onClick={onNavigateToRoadmap}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 self-start sm:self-auto"
                  >
                    Open Interactive Roadmap <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Spaced repetition</span>
                )}
              </div>
              <div className={`grid grid-cols-1 ${zenMode ? "md:grid-cols-4" : "md:grid-cols-2"} gap-3`} style={{ transform: "translateZ(15px)" }}>
                {roadmapTopics.map((topic, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-xl border transition flex flex-col justify-between min-h-[100px] ${
                      topic.completed 
                        ? 'bg-emerald-950/10 border-emerald-800/30' 
                        : 'bg-[#171b22]/60 border-[#2d333d] hover:border-[#38bdf8]/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-tight ${topic.completed ? 'text-emerald-300 line-through' : 'text-slate-200'}`}>
                          {topic.topic}
                        </p>
                        {topic.completed && (
                          <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 p-0.5 px-1.5 rounded uppercase flex-shrink-0">Solved</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{topic.detail}</p>
                    </div>
                    {!topic.completed && (
                      <button 
                        id={`roadmap_solve_btn_${index}`}
                        onClick={onStartNewSession}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center mt-2"
                      >
                        Train Concept <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PerspectiveTiltCard>

        </div>

        {/* Right column sidebar */}
        {!zenMode && (
          <div className="space-y-6">
            {/* Daily Goal Tracking Widget */}
            <PerspectiveTiltCard className="w-full">
              <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm space-y-4 h-full select-none" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex items-center justify-between" style={{ transform: "translateZ(25px)" }}>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-bold text-white">Daily Target</h3>
                  </div>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Live Goal
                  </span>
                </div>

                <div className="flex flex-col gap-3" style={{ transform: "translateZ(15px)" }}>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Stay consistent to maximize retention. Updates automatically from mock rounds or manual logs of self-study.
                  </p>

                  {/* Progress Display */}
                  <div className="bg-[#13161c]/60 p-4 rounded-xl border border-[#2d333d]/70 flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-medium">Daily Completed</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">{completedToday + manualOffset}</span>
                        <span className="text-slate-500 text-xs">/</span>
                        <span className="text-sm font-semibold text-indigo-400">{dailyGoal} questions</span>
                      </div>
                    </div>

                    {/* Progress Bar with modern look */}
                    <div className="w-full bg-[#13161c] h-3 rounded-full overflow-hidden border border-[#2d333d]/30 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          (completedToday + manualOffset) >= dailyGoal
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-indigo-500 to-violet-500"
                        }`}
                        style={{ width: `${Math.min(100, ((completedToday + manualOffset) / dailyGoal) * 100)}%` }}
                      />
                    </div>

                    {/* Status or Celebration sentence */}
                    <div className="text-xs pt-0.5">
                      {(completedToday + manualOffset) >= dailyGoal ? (
                        <p className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Daily goal reached! Stellar job! 🎉
                        </p>
                      ) : (
                        <p className="text-slate-400 font-medium">
                          🎯 {Math.max(1, dailyGoal - (completedToday + manualOffset))} more to hit today's practice target.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action and Configuration Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Target setup */}
                    <div className="bg-[#13161c]/40 p-2.5 rounded-lg border border-[#2d333d]/50 flex flex-col gap-1.5 font-bold">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Set Daily Goal</span>
                      <div className="flex items-center justify-between">
                        <button
                          id="decrement_daily_goal_btn"
                          onClick={() => handleUpdateGoal(dailyGoal - 1)}
                          disabled={dailyGoal <= 1}
                          className="p-1 px-2.5 bg-[#171b22] border border-[#2d333d]/80 hover:border-slate-500 text-slate-300 rounded-md text-xs font-bold transition disabled:opacity-45 cursor-pointer hover:bg-[#1c212a]"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-white">{dailyGoal}</span>
                        <button
                          id="increment_daily_goal_btn"
                          onClick={() => handleUpdateGoal(dailyGoal + 1)}
                          disabled={dailyGoal >= 20}
                          className="p-1 px-2.5 bg-[#171b22] border border-[#2d333d]/80 hover:border-slate-500 text-slate-300 rounded-md text-xs font-bold transition disabled:opacity-45 cursor-pointer hover:bg-[#1c212a]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Manual self-study logger button */}
                    <div className="bg-[#13161c]/40 p-2.5 rounded-lg border border-[#2d333d]/50 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Log Offline Drill</span>
                      <div className="flex items-center gap-1">
                        <button
                          id="log_offline_drill_btn"
                          onClick={handleAddManualQuestion}
                          className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold rounded transition flex items-center justify-center gap-0.5 cursor-pointer"
                          title="Mark an offline practice question done today"
                        >
                          <Plus className="w-3 h-3 text-indigo-400" />
                          <span>Log drill</span>
                        </button>
                        {manualOffset > 0 && (
                          <button
                            id="reset_offline_drills_btn"
                            onClick={handleResetManualQuestions}
                            className="px-1.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/15 text-[10px] font-bold rounded transition cursor-pointer"
                            title="Clear offline exercises today"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PerspectiveTiltCard>

            {/* Connected Developer Profile Card */}
            {resumeProfile ? (
              <PerspectiveTiltCard className="w-full">
                <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm space-y-4 text-left select-none" style={{ transformStyle: "preserve-3d" }}>
                  <div className="flex items-center justify-between" style={{ transform: "translateZ(25px)" }}>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">My Portfolio</h3>
                    </div>
                    {onEditProfile && (
                      <button 
                        onClick={onEditProfile}
                        className="text-[10px] text-indigo-455 hover:text-indigo-350 font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Edit profile & portfolio links"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5 text-xs" style={{ transform: "translateZ(15px)" }}>
                    {/* Name & Title summary */}
                    <div className="bg-[#13161c]/60 p-3.5 rounded-xl border border-[#2d333d]/70 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-100 font-black text-sm tracking-tight">{resumeProfile.name || "Candidate Profile"}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{difficulty || "Mid-Level"} • {domain || "General Engineer"}</p>
                        </div>
                      </div>
                      {resumeProfile.experienceSummary && (
                        <p className="text-[10.5px] text-slate-455 leading-relaxed italic border-t border-slate-800/20 pt-2 font-sans">
                          "{resumeProfile.experienceSummary}"
                        </p>
                      )}
                    </div>

                    {/* Personal Links Badges Row */}
                    {(resumeProfile.portfolioUrl || resumeProfile.githubUrl || resumeProfile.linkedinUrl || resumeProfile.resumeCvUrl || resumeProfile.featuredProjectUrl || resumeProfile.twitterUrl || resumeProfile.otherWebsiteUrl) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {resumeProfile.portfolioUrl && (
                          <a 
                            href={resumeProfile.portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            <span>Portfolio</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.githubUrl && (
                          <a 
                            href={resumeProfile.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.linkedinUrl && (
                          <a 
                            href={resumeProfile.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <Linkedin className="w-3.5 h-3.5 text-[#0a66c2]" />
                            <span>LinkedIn</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.resumeCvUrl && (
                          <a 
                            href={resumeProfile.resumeCvUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            <span>Resume/CV</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.featuredProjectUrl && (
                          <a 
                            href={resumeProfile.featuredProjectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <FolderGit className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Featured Project</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.twitterUrl && (
                          <a 
                            href={resumeProfile.twitterUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <Twitter className="w-3.5 h-3.5 text-sky-400" />
                            <span>Twitter/X</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                        {resumeProfile.otherWebsiteUrl && (
                          <a 
                            href={resumeProfile.otherWebsiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 text-teal-450 px-2.5 py-1 rounded-xl text-[10px] transition font-bold"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-teal-405" />
                            <span>Website</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Project Portfolio Summary */}
                    {resumeProfile.projectSummaries && (
                      <div className="space-y-1.5 pt-2 border-t border-[#2d333d]/40" style={{ transform: "translateZ(15px)" }}>
                        <h4 className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <FolderGit className="w-3.5 h-3.5 text-indigo-400" />
                          Project Portfolio Summary
                        </h4>
                        <p className="text-[10.5px] text-slate-350 leading-relaxed bg-[#13161c]/45 border border-slate-800/80 p-2.5 rounded-xl font-sans">
                          {resumeProfile.projectSummaries}
                        </p>
                      </div>
                    )}

                    {/* Dynamic Standout Projects List */}
                    {resumeProfile.projects && resumeProfile.projects.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#2d333d]/40">
                        <h4 className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <FolderGit className="w-3.5 h-3.5 text-indigo-400" />
                          Standout Projects ({resumeProfile.projects.length})
                        </h4>

                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {resumeProfile.projects.map((proj, pIndex) => (
                            <div key={pIndex} className="p-3 bg-[#13161c]/45 border border-slate-800/80 rounded-xl space-y-1">
                              <h5 className="text-[11px] font-black text-slate-200">{proj.title}</h5>
                              <p className="text-[10px] text-slate-500 leading-relaxed">{proj.description}</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {proj.technologies.slice(0, 3).map((tech, tIndex) => (
                                  <span key={tIndex} className="text-[8px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded">
                                    {tech}
                                  </span>
                                ))}
                                {proj.technologies.length > 3 && (
                                  <span className="text-[8px] font-mono bg-slate-950 text-indigo-400 px-1.5 py-0.2 rounded font-extrabold">
                                    +{proj.technologies.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PerspectiveTiltCard>
            ) : (
              <PerspectiveTiltCard className="w-full">
                <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm space-y-4 text-left select-none" style={{ transformStyle: "preserve-3d" }}>
                  <div className="flex items-center justify-between" style={{ transform: "translateZ(25px)" }}>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400/70" />
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">My Portfolio</h3>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs animate-pulse" style={{ transform: "translateZ(15px)" }}>
                    <div className="bg-[#13161c]/65 p-5 rounded-xl border border-dashed border-[#2d333d] text-center space-y-3.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                        You are running in uncalibrated starter mode. Calibrate your target operating system profile to customize other mock practice rounds.
                      </p>
                      {onEditProfile && (
                        <button
                          onClick={onEditProfile}
                          className="mx-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Calibrate System Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </PerspectiveTiltCard>
            )}

            {/* Achievements & Milestones Panel */}
            <PerspectiveTiltCard className="w-full">
              <div id="achievements-section" className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm h-full select-none relative overflow-visible" style={{ transformStyle: "preserve-3d" }}>
                
                {/* Floating particle canvas bound directly to achievements container */}
                <ParticleCanvas />

                <div className="flex items-start justify-between mb-3" style={{ transform: "translateZ(25px)" }}>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                      <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                      Achievements
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Unlock prestige milestones & build your profile showcase</p>
                  </div>
                  
                  {/* Interactive Sound Status and Layout Toggles */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Audio Synth Toggle */}
                    <button
                      onClick={() => {
                        const nextSound = !soundEnabled;
                        setSoundEnabled(nextSound);
                        localStorage.setItem("prepai_sound_enabled", String(nextSound));
                      }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        soundEnabled
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                          : "bg-[#13161c]/50 border-slate-800 text-slate-500 hover:text-slate-405 hover:bg-[#13161c]/80"
                      }`}
                      title={soundEnabled ? "Audio Synth Activated - Click to Mute" : "Audio Synth Muted - Click to Unmute"}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Layout switcher (List/Grid) */}
                    <div className="bg-[#11141c] p-0.5 rounded-lg border border-[#2d333d]/50 flex items-center gap-0.5">
                      <button
                        onClick={() => {
                          setAchievementsLayoutMode("list");
                          localStorage.setItem("prepai_achievements_layout", "list");
                        }}
                        className={`p-1 rounded transition cursor-pointer ${
                          achievementsLayoutMode === "list"
                            ? "bg-indigo-500/20 text-indigo-400 font-bold"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                        title="Tabular List View"
                      >
                        <List className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setAchievementsLayoutMode("grid");
                          localStorage.setItem("prepai_achievements_layout", "grid");
                        }}
                        className={`p-1 rounded transition cursor-pointer ${
                          achievementsLayoutMode === "grid"
                            ? "bg-indigo-500/20 text-indigo-400 font-bold"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                        title="Prestige Gallery Grid View"
                      >
                        <Grid className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linear overall progress bar & sound status ticker line */}
                <div className="mb-4 bg-[#13161c]/60 p-2.5 rounded-lg border border-[#2d333d]/40" style={{ transform: "translateZ(15px)" }}>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold font-mono mb-1">
                    <span className="flex items-center gap-1">
                      Overall Milestone Progress 
                      <span className="text-[7.5px] uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-1 rounded">
                        {unlockedAchievementsCount}/{totalAchievements}
                      </span>
                    </span>
                    <span className="text-white font-extrabold">{achievementsUnlockedPercent}%</span>
                  </div>
                  <div className="w-full bg-[#1e232d] rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className="bg-indigo-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${achievementsUnlockedPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                       {/* Progress Toward Next Badge Focus Banner */}
                {nextTargetBadge && (
                  <div 
                    onClick={(e) => {
                      playSynthTone(nextTargetBadge.rarity || "common");
                      window.dispatchEvent(
                        new CustomEvent("trigger-particles", {
                          detail: { x: e.clientX, y: e.clientY, rarity: nextTargetBadge.rarity }
                        })
                      );
                      setSelectedBadge(nextTargetBadge);
                    }}
                    className="mb-4 bg-gradient-to-r from-indigo-950/20 via-[#181a24]/55 to-[#13161c]/20 p-3 rounded-xl border border-indigo-500/20 hover:border-indigo-500/35 transition-all shadow-md cursor-pointer hover:shadow-indigo-500/5 hover:-translate-y-0.5 active:translate-y-0 select-none group" 
                    style={{ transform: "translateZ(20px)" }}
                    title="Click to view strategy details"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0 flex items-center justify-center">
                        <svg className="w-11 h-11 -rotate-90">
                          <circle cx="22" cy="22" r="17" stroke="#1d202f" strokeWidth="2.5" fill="transparent" />
                          <circle
                            cx="22"
                            cy="22"
                            r="17"
                            stroke="url(#badgeFocusGrad)"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 17}
                            strokeDashoffset={2 * Math.PI * 17 - (nextTargetBadge.percent / 100) * (2 * Math.PI * 17)}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="badgeFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#c084fc" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-indigo-300 font-mono">
                          {nextTargetBadge.percent}%
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] uppercase font-bold tracking-widest text-[#a78bfa] bg-[#a78bfa]/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 animate-pulse" /> Focus Milestone
                          </span>
                        </div>
                        <h4 className="text-[11px] font-extrabold text-white mt-1 group-hover:text-indigo-300 transition-colors truncate">
                          {nextTargetBadge.name}
                        </h4>
                        <p className="text-[9.5px] text-slate-450 leading-normal line-clamp-1 mt-0.5">
                          {nextTargetBadge.desc}
                        </p>
                        <p className="text-[9px] text-indigo-300/95 font-medium mt-1">
                          Almost there! Only <span className="font-extrabold underline">{(nextTargetBadge.target - nextTargetBadge.current).toFixed(0)} more</span> {nextTargetBadge.unit} remaining.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filter tabs row */}
                <div className="flex flex-wrap gap-1 mb-4 border-b border-[#2d333d]/40 pb-3 font-mono" style={{ transform: "translateZ(15px)" }}>
                  {(["all", "unlocked", "locked", "streak", "practice", "scores", "common", "rare", "epic", "legendary"] as const).map((filter) => {
                    const isRarity = ["common", "rare", "epic", "legendary"].includes(filter);
                    let activeClass = "bg-indigo-500/15 border-indigo-500/30 text-white";
                    if (filter === "common") activeClass = "bg-slate-500/15 border-slate-500/35 text-slate-350";
                    if (filter === "rare") activeClass = "bg-cyan-500/15 border-cyan-500/35 text-cyan-350 font-bold";
                    if (filter === "epic") activeClass = "bg-purple-500/15 border-purple-500/35 text-purple-350 font-bold";
                    if (filter === "legendary") activeClass = "bg-amber-500/15 border-amber-500/35 text-amber-300 font-extrabold";
                    
                    return (
                      <button
                        key={filter}
                        onClick={() => setAchievementsFilter(filter)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-md border capitalize transition cursor-pointer flex items-center gap-1 ${
                          achievementsFilter === filter
                            ? activeClass
                            : "bg-transparent border-transparent text-slate-500 hover:text-slate-150"
                        }`}
                      >
                        {isRarity && (
                          <span className={`w-1 h-1 rounded-full ${
                            filter === "common" ? "bg-slate-500" :
                            filter === "rare" ? "bg-cyan-400" :
                            filter === "epic" ? "bg-purple-400" : "bg-amber-450"
                          }`} />
                        )}
                        {filter}
                      </button>
                    );
                  })}
                </div>

                {/* Layout List / Grid Switch rendering */}
                <div className="overflow-visible" style={{ transform: "translateZ(10px)" }}>
                  {filteredAchievements.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[11px] font-mono border border-dashed border-[#2d333d]/50 rounded-xl">
                      No achievements match selected criteria.
                    </div>
                  ) : achievementsLayoutMode === "list" ? (
                    /* Elegant interactive List mode with mouse trigger fire */
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {filteredAchievements.map((badge) => {
                        const percentLeft = Math.round((badge.current / badge.target) * 100);
                        const displayPercent = Math.min(100, Math.max(0, percentLeft));
                        const badgeRadius = 15;
                        const badgeCircumference = 2 * Math.PI * badgeRadius;
                        const badgeDashoffset = badgeCircumference - (displayPercent / 100) * badgeCircumference;
                        const rarityStyle = RARITY_STYLING[badge.rarity || "common"];
                        const isPinned = pinnedBadges.includes(badge.id);

                        return (
                          <div 
                            key={badge.id}
                            onClick={(e) => {
                              playSynthTone(badge.rarity);
                              window.dispatchEvent(
                                new CustomEvent("trigger-particles", {
                                  detail: { x: e.clientX, y: e.clientY, rarity: badge.rarity }
                                })
                              );
                              setSelectedBadge(badge);
                            }}
                            className={`flex gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.025] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group select-none ${
                              badge.unlocked 
                                ? `${rarityStyle.bgClass} ${rarityStyle.glowClass}` 
                                : 'bg-[#13161c]/25 border-slate-900/40 opacity-70 hover:opacity-100 hover:border-slate-800 hover:shadow-[0_0_15px_rgba(99,102,241,0.06)] transition-all'
                            }`}
                          >
                            {/* SVG Radial loader bound to icon */}
                            <div className="relative shrink-0 w-10.5 h-10.5 flex items-center justify-center">
                              <svg className="absolute w-10.5 h-10.5 -rotate-90">
                                <circle cx="21" cy="21" r={badgeRadius} stroke="#171922" strokeWidth="2.5" fill="transparent" />
                                <circle
                                  cx="21"
                                  cy="21"
                                  r={badgeRadius}
                                  stroke={badge.unlocked ? (badge.rarity === "legendary" ? "#f59e0b" : badge.rarity === "epic" ? "#a855f7" : badge.rarity === "rare" ? "#06b6d4" : "#10b981") : "#3b4252"}
                                  strokeWidth="2.5"
                                  fill="transparent"
                                  strokeDasharray={badgeCircumference}
                                  strokeDashoffset={badgeDashoffset}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className={`absolute w-7 h-7 flex items-center justify-center rounded-lg ${
                                badge.unlocked ? badge.color : 'text-slate-600 bg-slate-900/40 border border-slate-800'
                              }`}>
                                <badge.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className={`text-[11.5px] font-extrabold leading-tight tracking-tight flex items-center gap-1.5 ${badge.unlocked ? 'text-slate-100 group-hover:text-indigo-300 transition-colors' : 'text-slate-500'}`}>
                                    {badge.name}
                                    {isPinned && (
                                      <Pin className="w-2.5 h-2.5 text-indigo-400 rotate-45 shrink-0" />
                                    )}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className={`text-[7.5px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded font-mono ${rarityStyle.badgeLabelColor}`}>
                                      {rarityStyle.label}
                                    </span>
                                    <span className="text-[7.5px] text-slate-500 font-mono tracking-wider bg-[#10131a] px-1 rounded">
                                      {badge.xpValue} XP
                                    </span>
                                  </div>
                                </div>
                                {badge.unlocked ? (
                                  <span className="text-[7.5px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5 flex items-center gap-0.5 shrink-0 select-none">
                                    <Sparkles className="w-2.5 h-2.5 fill-emerald-500/10" />
                                    Unlocked
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 rounded px-1.5 py-0.5 flex items-center gap-0.5 shrink-0 select-none">
                                    <Lock className="w-2.5 h-2.5" />
                                    {displayPercent}%
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{badge.desc}</p>
                              
                              {/* Short sub-headline showing motivation for locked items */}
                              {!badge.unlocked && (
                                <div className="mt-2 text-[8.5px] text-slate-500 font-mono flex items-center justify-between">
                                  <span>Progress: {badge.current}/{badge.target} {badge.unit}</span>
                                  <span className="text-indigo-400/90 italic">Expert advice inside ⚡</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Spectacular Bento Grid prestige collectibles room layout */
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredAchievements.map((badge) => {
                        const percentLeft = Math.round((badge.current / badge.target) * 100);
                        const displayPercent = Math.min(100, Math.max(0, percentLeft));
                        const rarityStyle = RARITY_STYLING[badge.rarity || "common"];
                        const isPinned = pinnedBadges.includes(badge.id);

                        return (
                          <div
                            key={badge.id}
                            onClick={(e) => {
                              playSynthTone(badge.rarity);
                              window.dispatchEvent(
                                new CustomEvent("trigger-particles", {
                                  detail: { x: e.clientX, y: e.clientY, rarity: badge.rarity }
                                })
                              );
                              setSelectedBadge(badge);
                            }}
                            className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-[0.93] group relative overflow-hidden select-none aspect-square ${
                              badge.unlocked
                                ? `${rarityStyle.bgClass} ${rarityStyle.glowClass}`
                                : "bg-[#13161c]/15 border-slate-900/40 opacity-55 hover:opacity-100 hover:border-slate-800 hover:shadow-[0_0_15px_rgba(99,102,241,0.06)] transition-all"
                            }`}
                            title={`${badge.name} (${badge.rarity}) - Click to inspect`}
                          >
                            {/* Glow orb */}
                            {badge.unlocked && (
                              <div className="absolute w-12 h-12 rounded-full filter blur-md opacity-25 group-hover:scale-125 transition-all -z-10 bg-indigo-500" />
                            )}

                            {/* Badge Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:rotate-6 ${
                              badge.unlocked ? badge.color : "text-slate-650 bg-slate-900/40 border border-slate-800"
                            }`}>
                              <badge.icon className="w-5 h-5" />
                            </div>

                            {/* Title text */}
                            <p className={`text-[9.5px] font-black tracking-tight leading-tight px-1 uppercase font-mono truncate w-full ${
                              badge.unlocked ? "text-slate-100 group-hover:text-amber-400" : "text-slate-550"
                            }`}>
                              {badge.name}
                            </p>

                            {/* Rarity & pinned dot */}
                            <div className="flex items-center gap-1 mt-1 justify-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.unlocked ? rarityStyle.dotColor : "bg-slate-600"}`} />
                              {isPinned && <Pin className="w-2 h-2 text-indigo-400 rotate-45" />}
                              {!badge.unlocked && <span className="text-[7.5px] font-bold text-slate-500 font-mono">{displayPercent}%</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </PerspectiveTiltCard>


            {/* IMMERSIVE TROPHY INSPECTION POPUP DIALOG */}
            {selectedBadge && (() => {
              const rStyle = RARITY_STYLING[selectedBadge.rarity || "common"];
              const isPinned = pinnedBadges.includes(selectedBadge.id);
              
              return (
                <div className="fixed inset-0 bg-[#07090e]/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] select-none text-left">
                  {/* Backdrop Close click option */}
                  <div className="absolute inset-0" onClick={() => setSelectedBadge(null)} />

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className={`bg-gradient-to-b from-[#191e2b] to-[#12151d] border w-full max-w-md p-6 rounded-3xl shadow-2xl relative overflow-hidden z-20 ${rStyle.badgeBorder}`}
                  >
                    {/* Glowing effect inside the modal */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none" />

                    {/* Header buttons */}
                    <div className="flex justify-between items-center relative z-10 mb-4 pb-3 border-b border-slate-800/60">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#818cf8] font-mono flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Milestone Dossier
                      </span>
                      <button
                        onClick={() => setSelectedBadge(null)}
                        className="p-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition hover:scale-105 active:scale-95 animate-pulse"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Model rotating display Area */}
                    <div className="flex flex-col items-center justify-center py-6 text-center relative z-10">
                      {/* Big Glowing Circle wrapper */}
                      <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-[#11141c]/95 border border-slate-850 shadow-inner mb-4 hover:scale-105 active:scale-95 transition-transform duration-300 cursor-pointer group"
                        onClick={(e) => {
                          playSynthTone(selectedBadge.rarity);
                          window.dispatchEvent(
                            new CustomEvent("trigger-particles", {
                              detail: { x: e.clientX, y: e.clientY, rarity: selectedBadge.rarity }
                            })
                          );
                        }}
                        title="Click to spark synthesized synth chord!"
                      >
                        {/* Outer shining spin rings */}
                        <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-spin [animation-duration:15s] ${selectedBadge.unlocked ? (selectedBadge.rarity === "legendary" ? "border-amber-500/30" : selectedBadge.rarity === "epic" ? "border-purple-500/30" : selectedBadge.rarity === "rare" ? "border-cyan-500/30" : "border-emerald-500/30") : "border-slate-800"}`} />
                        <div className={`absolute inset-2 rounded-full border border-dotted animate-spin [animation-duration:8s] [animation-direction:reverse] ${selectedBadge.unlocked ? (selectedBadge.rarity === "legendary" ? "border-amber-400/20" : selectedBadge.rarity === "epic" ? "border-purple-400/20" : selectedBadge.rarity === "rare" ? "border-cyan-400/20" : "border-emerald-400/20") : "border-slate-800"}`} />

                        {/* Centered big vector launcher icon */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition ${selectedBadge.unlocked ? selectedBadge.color : 'text-slate-650 bg-slate-900/60 border border-slate-800'}`}>
                          <selectedBadge.icon className="w-9 h-9 group-hover:scale-110 group-hover:rotate-6 transition" />
                        </div>

                        {/* Prestige Rarity Starburst glowing tag */}
                        <span className={`absolute -bottom-1 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full inline-block font-mono ${rStyle.badgeLabelColor} shadow-md`}>
                          {selectedBadge.rarity}
                        </span>
                      </div>

                      {/* Title information */}
                      <h4 className="text-lg font-black text-white px-2">
                        {selectedBadge.name}
                      </h4>
                      
                      {/* Lore block */}
                      <p className="text-indigo-200/70 text-xs italic leading-relaxed mt-2.5 max-w-sm px-4">
                        "{selectedBadge.lore || "A mystery reward awaiting structural completion."}"
                      </p>
                    </div>

                    {/* Unlock Status / Reward block */}
                    <div className="bg-[#12151e] p-4 rounded-2xl border border-slate-850/80 mb-5 relative z-10 font-sans space-y-3.5">
                      {/* XP & owners rate rows */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-1 font-mono">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" /> REWARD VALUE:
                        </span>
                        <span className="font-extrabold text-amber-400 font-mono text-xs tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                          +{selectedBadge.xpValue || 150} XP
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-1 font-mono">
                          <Users className="w-3.5 h-3.5 text-indigo-400" /> COHORT ACQUISITION:
                        </span>
                        <span className="text-slate-300 font-mono text-xs font-bold">
                          {selectedBadge.globalRate || "N/A"} of users
                        </span>
                      </div>

                      <div className="border-t border-slate-850/40 my-2" />

                      {/* Conditions Checklist or strategies */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-slate-500">
                          <span>UNLOCK MILESTONE STRATEGY:</span>
                          <span className={selectedBadge.unlocked ? "text-emerald-400 font-bold" : "text-indigo-400 font-bold"}>
                            {selectedBadge.unlocked ? "PASSED" : `${selectedBadge.current} / ${selectedBadge.target} ${selectedBadge.unit}`}
                          </span>
                        </div>
                        
                        {/* Dynamic condition helper label */}
                        <div className="bg-[#181d29] p-3 rounded-xl border border-indigo-500/10 text-slate-300 text-[10px] leading-relaxed">
                          <strong>Strategy:</strong> {selectedBadge.expertTip || selectedBadge.desc}
                        </div>
                      </div>
                    </div>

                    {/* Showcase action button row */}
                    <div className="flex items-center gap-2 relative z-10">
                      <button
                        onClick={() => {
                          togglePinBadge(selectedBadge.id);
                        }}
                        disabled={!selectedBadge.unlocked}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          !selectedBadge.unlocked
                            ? "bg-slate-850/40 border border-slate-800/40 text-slate-550 cursor-not-allowed select-none line-through"
                            : isPinned
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95"
                            : "bg-indigo-600 border border-indigo-550 text-white hover:bg-indigo-550 active:scale-95 shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/10"
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? "rotate-0 text-rose-400 fill-rose-400/20" : "rotate-45"}`} />
                        <span>{isPinned ? "UNPIN FROM SHOWCASE" : "PIN TO PROFILE SHOWCASE"}</span>
                      </button>

                      {/* Trigger sound chord speaker inside modal option */}
                      <button
                        onClick={() => playSynthTone(selectedBadge.rarity)}
                        className="py-3 px-3 rounded-xl bg-[#13161c] border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition animate-pulse"
                        title="Play sound token"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </motion.div>
                </div>
              );
            })()}

            {/* Peer Standings Benchmark Box */}
            <PerspectiveTiltCard className="w-full">
              <div className="bg-gradient-to-br from-indigo-950/20 to-[#171b22]/75 p-6 rounded-2xl border border-indigo-500/15 h-full select-none" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex gap-2 items-center text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2" style={{ transform: "translateZ(25px)" }}>
                  <Users className="w-4 h-4" />
                  <span>Peer Alignment Index</span>
                </div>
                <div style={{ transform: "translateZ(15px)" }}>
                  <h4 className="text-white text-base font-extrabold">Weekly Placement Standing</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Your overall mock metric scorecard is outperforming <strong className="text-white text-indigo-300">{Math.min(96, 60 + statsSessions.length * 8)}%</strong> of standard CS graduates target testing {company || "FAANG"} roles this cohort.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#2d333d] flex justify-between items-center text-xs text-slate-400">
                    <span>Domain average: {62}%</span>
                    <span className="text-white font-bold">Your score: {readinessScore}%</span>
                  </div>
                </div>
              </div>
            </PerspectiveTiltCard>
          </div>
        )}
      </div>

      {/* Historical logs table */}
      <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              Activity Logs
            </h3>
            <p className="text-slate-400 text-xs">Complete mock practice records on local browser storage</p>
          </div>
          {historyDifficultyFilter !== "all" && (
            <span className="self-start sm:self-auto px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black tracking-wider rounded-lg font-mono">
              Filtered: {historyDifficultyFilter}
            </span>
          )}
        </div>
        
        {/* Type Filter Toggle Buttons */}
        {statsSessions.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 p-3 bg-[#11141c]/50 border border-[#2d333d]/55 rounded-xl">
            <span className="text-[10px] font-extrabold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Filter by Type:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All types", icon: Layers },
                { id: "coding", label: "Coding", icon: Code },
                { id: "behavioral", label: "Behavioral", icon: UserCheck },
                { id: "system-design", label: "System Design", icon: Server },
                { id: "technical", label: "Technical", icon: Sparkles }
              ].map((btn) => {
                const Icon = btn.icon;
                const isSelected = historyTypeFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => {
                      playSynthTone("common");
                      setHistoryTypeFilter(btn.id as any);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border border-indigo-550 text-white shadow shadow-indigo-500/10 scale-102"
                        : "bg-[#11141c]/40 border border-[#2d333d]/45 text-slate-400 hover:text-slate-200 hover:bg-[#131722]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {statsSessions.length === 0 ? (
          <div className="p-8 text-center bg-[#13161c]/40 rounded-xl border border-[#2d333d]/55">
            <p className="text-slate-400 text-sm">No exercises recorded. Launch your first simulator round to build performance indices!</p>
          </div>
        ) : (() => {
          if (sessions.length === 0) {
            return (
              <div className="p-8 text-center bg-[#13161c]/40 rounded-xl border border-[#2d333d]/55">
                <p className="text-slate-400 text-sm">
                  No practice sessions match the <strong className="text-indigo-400 capitalize">"{historyDifficultyFilter}"</strong> difficulty level filter.
                </p>
              </div>
            );
          }

          const filteredSessionsList = sessions.filter(s => {
            if (historyTypeFilter === "all") return true;
            return s.type === historyTypeFilter;
          });

          if (filteredSessionsList.length === 0) {
            return (
              <div className="p-8 text-center bg-[#13161c]/40 rounded-xl border border-[#2d333d]/55 flex flex-col items-center justify-center">
                <p className="text-slate-400 text-sm">
                  No practice sessions match the selected <strong className="text-indigo-400 capitalize">"{historyTypeFilter}"</strong> type filter under the current difficulty level filter.
                </p>
                <button
                  onClick={() => {
                    playSynthTone("common");
                    setHistoryTypeFilter("all");
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-mono font-bold rounded-xl transition shadow shadow-indigo-550/10 active:scale-95 cursor-pointer"
                >
                  Reset Type Filter
                </button>
              </div>
            );
          }

          const containerVariants = {
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04
              }
            }
          };

          const itemVariants = {
            hidden: { opacity: 0, y: 15 },
            show: { 
              opacity: 1, 
              y: 0, 
              transition: { 
                type: "spring", 
                stiffness: 160, 
                damping: 20 
              } 
            }
          };

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#2d333d] text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="py-2.5">Round Mode</th>
                    <th className="py-2.5">Domain Context</th>
                    <th className="py-2.5">Target Tier</th>
                    <th className="py-2.5">Difficulty</th>
                    <th className="py-2.5">Duration</th>
                    <th className="py-2.5">Grade Index</th>
                    <th className="py-2.5 text-right">Details</th>
                  </tr>
                </thead>
                <motion.tbody 
                  key={`${historyTypeFilter}-${historyDifficultyFilter}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-[#2d333d]/40"
                >
                  {filteredSessionsList.map((session) => (
                    <motion.tr 
                      key={session.id} 
                      variants={itemVariants}
                      className="hover:bg-slate-800/10 text-slate-300"
                    >
                      <td className="py-3 font-semibold text-white capitalize">{session.type} round</td>
                      <td className="py-3">{session.domain}</td>
                      <td className="py-3 text-slate-400">{session.company}</td>
                      <td className="py-3 font-mono text-[10px] text-[#a5b4fc] capitalize">{session.difficulty || "Mid-Level"}</td>
                      <td className="py-3 text-slate-400">
                        {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          session.score >= 80 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : session.score >= 60 
                              ? 'bg-amber-400/10 text-amber-400' 
                              : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {session.score}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          id={`session_view_btn_${session.id}`}
                          onClick={onStartNewSession}
                          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                        >
                          Retrain
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}
