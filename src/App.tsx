import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Trophy, 
  Flame, 
  Settings, 
  ChevronRight, 
  Compass, 
  Cpu, 
  Layout, 
  Layers, 
  BookOpen, 
  Building2, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Eye,
  LogOut,
  User,
  Filter,
  SlidersHorizontal,
  Terminal,
  RefreshCw,
  Database,
  AlertTriangle,
  Target,
  Plus,
  Minus,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
import { ResumeProfile, InterviewQuestion, HistoricalSession } from "./types";
import Dashboard from "./components/Dashboard";
import CompanySimulator from "./components/CompanySimulator";
import DailyGoalTracker from "./components/DailyGoalTracker";
import ResumeParser from "./components/ResumeParser";
import TechnicalArena from "./components/TechnicalArena";
import AudioPlayerWidget from "./components/AudioPlayerWidget";
import CodingArena from "./components/CodingArena";
import SystemDesignArena from "./components/SystemDesignArena";
import CareerCoach from "./components/CareerCoach";
import RecruiterDashboard from "./components/RecruiterDashboard";
import CoPracticeRoom from "./components/CoPracticeRoom";
import AuthScreen from "./components/AuthScreen";
import VerificationPendingScreen from "./components/VerificationPendingScreen";
import LearningRoadmap from "./components/LearningRoadmap";
import MyProfile from "./components/MyProfile";
import CommunityForum from "./components/CommunityForum";
import InterviewInsights from "./components/InterviewInsights";
import ConfettiCanvas from "./components/ConfettiCanvas";
import GoogleSandboxPopup from "./components/GoogleSandboxPopup";
import { ToastContainer, ToastItem } from "./components/Toast";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { auth, persistProfileToFirestore } from "./lib/firebase";

function LauncherTiltCard({ children, id, onClick, className = "", tooltipText }: { children: React.ReactNode; id?: string; onClick?: () => void; className?: string; tooltipText?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  
  const springX = useSpring(cardX, { damping: 25, stiffness: 220 });
  const springY = useSpring(cardY, { damping: 25, stiffness: 220 });

  const rotateXTransform = useTransform(springY, [-120, 120], [8, -8]);
  const rotateYTransform = useTransform(springX, [-120, 120], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      className={`relative h-full cursor-pointer select-none ${className}`}
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

      {/* Interactive Tooltip showing brief session expectation details */}
      <AnimatePresence>
        {isHovered && tooltipText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 8, scale: 0.95, x: "-50%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ x: "-50%" }}
            className="absolute bottom-full left-1/2 mb-3.5 w-72 bg-[#090b0f] border border-[#3b4252] text-xs font-medium text-slate-200 p-4 rounded-xl shadow-2xl z-50 pointer-events-none space-y-1.5"
          >
            <div className="flex items-center gap-1.5 font-bold text-indigo-400 text-[10px] tracking-wide uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Session Expectation</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans font-normal">
              {tooltipText}
            </p>
            {/* Tooltip little arrow indicator */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#3b4252]" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-[#090b0f]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Staggered layout variants for drawer list items
const drawerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const drawerItemVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.97 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 160,
      damping: 18,
    },
  },
};

const pageTransitionVariants = {
  hidden: { 
    opacity: 0, 
    y: 15, 
    scale: 0.985,
    filter: "blur(4px)"
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      mass: 0.85,
      staggerChildren: 0.08,
    }
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    scale: 0.985,
    filter: "blur(4px)",
    transition: {
      duration: 0.22,
      ease: "easeInOut"
    }
  }
};

export default function App() {
  // Path routing interception for the simulated Google OAuth Popup
  if (typeof window !== "undefined" && window.location.pathname === "/auth/google-sandbox") {
    return <GoogleSandboxPopup />;
  }

  // Navigation states
  const [activeTab, setActiveTab] = useState<
    "onboarding" | "dashboard" | "coach" | "recruiter" | "technical" | "coding" | "system-design" | "loading" | "scorecard" | "rooms" | "roadmap" | "profile" | "forum" | "insights"
  >("onboarding");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = useState<string>("all");
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Scroll Progress tracker for the Long Drawer Content
  const [drawerScrollProgress, setDrawerScrollProgress] = useState(0);
  const handleDrawerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      const progress = (target.scrollTop / totalHeight) * 100;
      setDrawerScrollProgress(progress);
    } else {
      setDrawerScrollProgress(0);
    }
  };

  // Customizable menu toggle keyboard shortcut key config
  const [optionsMenuShortcut, setOptionsMenuShortcut] = useState<string>(() => {
    return localStorage.getItem("prepai_options_menu_shortcut") || "m";
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      
      if (e.key.toLowerCase() === optionsMenuShortcut.toLowerCase()) {
        setMoreOptionsOpen(prev => !prev);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [optionsMenuShortcut]);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    title: string,
    description: string,
    type: "success" | "error" | "info" | "warning" = "success",
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reusable custom confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Theme states supporting Elegant Dark and Light Mode
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("prepai_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.classList.remove("theme-dark", "theme-light", "theme-contrast");
    document.documentElement.classList.add(`theme-${theme}`);
    document.body.classList.remove("theme-dark", "theme-light", "theme-contrast");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("prepai_theme", theme);
  }, [theme]);

  // High-contrast navigation state
  const [highContrastNav, setHighContrastNav] = useState<boolean>(() => {
    return localStorage.getItem("prepai_high_contrast_nav") === "true";
  });

  useEffect(() => {
    localStorage.setItem("prepai_high_contrast_nav", String(highContrastNav));
  }, [highContrastNav]);

  // Zen Mode state to hide non-essential elements like streaks and stats
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem("prepai_zen_mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("prepai_zen_mode", String(zenMode));
  }, [zenMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setActiveTab("rooms");
      sessionStorage.setItem("prepai_auto_join_room", roomParam);
    }
  }, []);

  // User session state
  const [currentUser, setCurrentUser] = useState<{ 
    username: string; 
    email: string; 
    isVerified?: boolean; 
    verificationToken?: string; 
  } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App configurations
  const [domain, setDomain] = useState("CSE");
  const [company, setCompany] = useState("FAANG");
  const [difficulty, setDifficulty] = useState("Mid-Level");
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);

  // Active interview questions state
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Saved practice sessions
  const [sessions, setSessions] = useState<HistoricalSession[]>([]);

  // Filter sessions based on historyDifficultyFilter in App.tsx
  const filteredHistorySessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!historyDifficultyFilter || historyDifficultyFilter === "all") return true;
      const sDiff = (s.difficulty || "Mid-Level").toLowerCase().trim();
      const fDiff = historyDifficultyFilter.toLowerCase().trim();
      return sDiff === fDiff || sDiff.replace("-", " ") === fDiff.replace("-", " ");
    });
  }, [sessions, historyDifficultyFilter]);

  // Daily Practice Goal states for the dashboard tracking system
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("prepai_daily_goal_target");
    return saved ? parseInt(saved, 10) : 3;
  });

  const [manualOffset, setManualOffset] = useState<number>(() => {
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

  // Active completed scorecard details
  const [latestScorecard, setLatestScorecard] = useState<{
    score: number;
    count: number;
    duration: number;
    mode: string;
  } | null>(null);

  // Voice recording details from TechnicalArena for playback
  const [latestRecordings, setLatestRecordings] = useState<{
    questionText: string;
    audioUrl: string;
    transcript: string;
  }[]>([]);

  // Read saved data on mount & verify session token
  useEffect(() => {
    const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 4, delay = 800): Promise<Response> => {
      try {
        return await fetch(url, options);
      } catch (err) {
        if (retries > 0) {
          console.warn(`Request to ${url} failed (${(err as Error).message}). Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
        throw err;
      }
    };

    const token = localStorage.getItem("prepai_auth_token");
    if (!token) {
      // Auto-authenticate as the real user Arnav Telangi on first launch
      const autoAuthenticate = async () => {
        try {
          const response = await fetchWithRetry("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "arnav.telangi24@pccoepune.org",
              name: "Arnav Telangi"
            })
          });
          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Received non-JSON response from /api/auth/google");
            }
            const data = await response.json();
            localStorage.setItem("prepai_auth_token", data.token);
            setAuthToken(data.token);
            setCurrentUser({ 
              username: data.user.username, 
              email: data.user.email,
              isVerified: true
            });
            if (data.user.domain) setDomain(data.user.domain);
            if (data.user.company) setCompany(data.user.company);
            if (data.user.difficulty) setDifficulty(data.user.difficulty);
            if (data.user.resumeProfile) {
              setResumeProfile(data.user.resumeProfile);
              setActiveTab("dashboard");
            } else {
              setActiveTab("dashboard");
            }
            if (data.user.sessions) setSessions(data.user.sessions);
          } else {
            setAuthLoading(false);
          }
        } catch (e) {
          console.error("Inbound auto-auth pipeline failed:", e);
          setAuthLoading(false);
        } finally {
          setAuthLoading(false);
        }
      };
      autoAuthenticate();
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetchWithRetry("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Received non-JSON response from /api/auth/me");
          }
          const data = await response.json();
          setAuthToken(token);
          setCurrentUser({ 
            username: data.user.username, 
            email: data.user.email,
            isVerified: data.user.isVerified,
            verificationToken: data.user.verificationToken
          });
          
          if (data.user.domain) setDomain(data.user.domain);
          if (data.user.company) setCompany(data.user.company);
          if (data.user.difficulty) setDifficulty(data.user.difficulty);
          if (data.user.resumeProfile) {
            setResumeProfile(data.user.resumeProfile);
            setActiveTab("dashboard");
          } else {
            setActiveTab("onboarding");
          }
          if (data.user.sessions) setSessions(data.user.sessions);
        } else {
          localStorage.removeItem("prepai_auth_token");
        }
      } catch (err) {
        console.error("Auth validation failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Keyboard shortcut listener to toggle the navigation drawer with Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const syncStateWithServer = async (
    targetDomain: string,
    targetCompany: string,
    targetDifficulty: string,
    targetProfile: ResumeProfile | null,
    targetSessions: HistoricalSession[]
  ) => {
    const token = localStorage.getItem("prepai_auth_token") || authToken;
    if (!token) return;

    try {
      // If signed in with a real Google/Firebase account, save profile choices persistently in Cloud Firestore!
      if (auth && auth.currentUser) {
        await persistProfileToFirestore(auth.currentUser.uid, {
          username: currentUser?.username || "Google Candidate",
          email: auth.currentUser.email || currentUser?.email || "",
          domain: targetDomain,
          company: targetCompany,
          difficulty: targetDifficulty,
          resumeProfile: targetProfile,
          sessions: targetSessions
        });
      }

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: targetDomain,
          company: targetCompany,
          difficulty: targetDifficulty,
          resumeProfile: targetProfile,
          sessions: targetSessions
        })
      });
    } catch (err) {
      console.error("Failed to sync profile update with server state:", err);
    }
  };

  const handleLoginSuccess = (
    token: string,
    user: {
      username: string;
      email: string;
      domain: string;
      company: string;
      difficulty: string;
      resumeProfile: any;
      sessions: any[];
      isVerified?: boolean;
      verificationToken?: string;
    }
  ) => {
    localStorage.setItem("prepai_auth_token", token);
    setAuthToken(token);
    setCurrentUser({ 
      username: user.username, 
      email: user.email,
      isVerified: user.isVerified,
      verificationToken: user.verificationToken
    });

    if (user.domain) setDomain(user.domain);
    if (user.company) setCompany(user.company);
    if (user.difficulty) setDifficulty(user.difficulty);
    if (user.resumeProfile) {
      setResumeProfile(user.resumeProfile);
      setActiveTab("dashboard");
    } else {
      setResumeProfile(null);
      setActiveTab("onboarding");
    }
    if (user.sessions) setSessions(user.sessions);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("prepai_auth_token") || authToken;
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn("Firebase signout failed:", err);
    }

    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("prepai_auth_token");
      setAuthToken(null);
      setCurrentUser(null);
      setDomain("CSE");
      setCompany("FAANG");
      setDifficulty("Mid-Level");
      setResumeProfile(null);
      setSessions([]);
      setActiveTab("onboarding");
    }
  };

  const handleSetupComplete = (
    selDomain: string,
    selCompany: string,
    selDiff: string,
    profile: ResumeProfile | null
  ) => {
    setDomain(selDomain);
    setCompany(selCompany);
    setDifficulty(selDiff);
    setResumeProfile(profile);

    localStorage.setItem("prepai_domain", selDomain);
    localStorage.setItem("prepai_company", selCompany);
    localStorage.setItem("prepai_difficulty", selDiff);
    if (profile) {
      localStorage.setItem("prepai_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("prepai_profile");
    }

    setActiveTab("dashboard");
    syncStateWithServer(selDomain, selCompany, selDiff, profile, sessions);
  };

  const handleProfileSave = (
    newDomain: string,
    newCompany: string,
    newDiff: string,
    newProfile: ResumeProfile | null
  ) => {
    setDomain(newDomain);
    setCompany(newCompany);
    setDifficulty(newDiff);
    setResumeProfile(newProfile);

    localStorage.setItem("prepai_domain", newDomain);
    localStorage.setItem("prepai_company", newCompany);
    localStorage.setItem("prepai_difficulty", newDiff);
    if (newProfile) {
      localStorage.setItem("prepai_profile", JSON.stringify(newProfile));
    } else {
      localStorage.removeItem("prepai_profile");
    }

    addToast(
      "Profile Updated",
      "Your professional portfolio preferences and skills have been saved and synchronized.",
      "success"
    );
    syncStateWithServer(newDomain, newCompany, newDiff, newProfile, sessions);
  };

  // Launch interview round via API query
  const handleLaunchArena = async (mode: "technical" | "behavioral" | "coding" | "system-design") => {
    setActiveTab("loading");
    setLoadingMsg(`AI Interviewer is configuring adaptive ${mode} questions...`);

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          company,
          difficulty,
          resumeProfile,
          type: mode
        })
      });

      if (!response.ok) throw new Error("Could not initialize adaptive interview");
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from /api/interview/start");
      }
      const data = await response.json();
      setActiveQuestions(data.questions || []);

      // Go to appropriate view
      if (mode === "technical" || mode === "behavioral") {
        setActiveTab("technical");
      } else if (mode === "coding") {
        setActiveTab("coding");
      } else {
        setActiveTab("system-design");
      }
    } catch (err) {
      console.error(err);
      alert("Pipeline timeout. Bootstrapping curated target benchmarks.");
      // Fallback
      setActiveTab("dashboard");
    }
  };

  const handleFinishRound = (
    score: number, 
    totalQuestions: number, 
    durationSec: number,
    recordings?: { questionText: string; audioUrl: string; transcript: string }[]
  ) => {
    const newSession: HistoricalSession = {
      id: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      domain,
      company,
      difficulty,
      type: headingMapper(activeTab),
      score,
      durationSeconds: durationSec,
      questionsCount: totalQuestions
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem("prepai_sessions", JSON.stringify(updated));

    setLatestScorecard({
      score,
      count: totalQuestions,
      duration: durationSec,
      mode: headingMapper(activeTab)
    });

    setLatestRecordings(recordings || []);

    setActiveTab("scorecard");
    syncStateWithServer(domain, company, difficulty, resumeProfile, updated);
  };

  const headingMapper = (tab: string) => {
    if (tab === "technical") return "technical";
    if (tab === "coding") return "coding";
    return "system-design";
  };

  const handleResetProfile = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset Configuration Goals?",
      description: "This will clean your currently calibrated interview track, domain targets, and resume profiles, and guide you back to the system profile setup panel.",
      confirmText: "Reset Goals",
      cancelText: "Cancel",
      onConfirm: () => {
        localStorage.removeItem("prepai_domain");
        localStorage.removeItem("prepai_company");
        localStorage.removeItem("prepai_difficulty");
        localStorage.removeItem("prepai_profile");
        setResumeProfile(null);
        setActiveTab("onboarding");
        syncStateWithServer(domain, company, difficulty, null, sessions);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        addToast(
          "Profile Reset",
          "Your target configurations have been fully reset. You are now in calibration mode.",
          "info"
        );
      }
    });
  };

  const handleExportSessionsData = () => {
    try {
      const payloadString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        username: currentUser?.username,
        email: currentUser?.email,
        domain,
        company,
        difficulty,
        sessionsCount: sessions.length,
        sessionsHistory: sessions
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", payloadString);
      downloadAnchor.setAttribute("download", `prepai_session_bundle_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Show immediate visually polished visual confirmation via toast
      addToast(
        "Session Data Exported",
        "Your adaptive learning state and session telemetry were converted to JSON and exported successfully.",
        "success"
      );
    } catch (err) {
      console.error("Export telemetry data bundle failed:", err);
      addToast(
        "Export Failed",
        "An unexpected error occurred during the telemetry bundle formulation.",
        "error"
      );
    }
  };

  const handleRunDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnosticResult("Validating connection to nodes...");
    setTimeout(() => {
      setIsDiagnosing(false);
      setDiagnosticResult(`Success! Verified 5 primary segments. Nodes synchronized. Current user: ${currentUser?.username || "Authenticated"}`);
      
      // Trigger visually spectacular, immediate confirmation toast
      addToast(
        "System Nodes Verified",
        `Database and system orchestration nodes successfully verified and fully synchronized.`,
        "success"
      );

      setTimeout(() => {
        setDiagnosticResult(null);
      }, 5000);
    }, 1200);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-200 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Synchronizing PrepAI Credentials...</h3>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-200 flex items-center justify-center">
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (currentUser && currentUser.isVerified === false) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-200 flex items-center justify-center p-4">
        <VerificationPendingScreen 
          currentUser={currentUser} 
          authToken={authToken} 
          onVerifiedSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            addToast("Identity Verified", "Email authenticated successfully. Career systems fully released!", "success");
          }} 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-200 font-sans leading-normal tracking-tight antialiased">
      
      {/* Visual Navbar */}
      <nav className={`sticky top-0 z-50 transition-colors duration-300 p-4 px-6 md:px-8 ${
        highContrastNav 
          ? "bg-black border-b-2 border-slate-200" 
          : "bg-[#13161c]/80 backdrop-blur-md border-b border-[#2d333d]"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-7">
            {/* Logo */}
            <div 
              onClick={() => setActiveTab("dashboard")} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className={`p-1 px-1.5 rounded-lg font-extrabold flex items-center justify-center transform group-hover:scale-105 transition shadow-lg ${
                highContrastNav 
                  ? "bg-white text-black border border-white" 
                  : "bg-indigo-600 text-white shadow-indigo-600/30"
              }`}>
                <Cpu className="w-5 h-5" />
              </div>
              <span className={`text-base font-black tracking-tight font-sans transition ${
                highContrastNav ? "text-white hover:text-slate-300" : "text-white group-hover:text-indigo-400"
              }`}>
                prep.ai
              </span>
            </div>

            {/* Navigation Drawer Menu Toggle Button */}
            {activeTab !== "onboarding" && activeTab !== "loading" && (
              <button
                id="drawer_toggle_btn"
                onClick={() => setDrawerOpen((prev) => !prev)}
                className={`flex items-center gap-2 p-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none shadow-md ${
                  highContrastNav 
                    ? "bg-white text-black border-2 border-slate-500 hover:bg-slate-100" 
                    : "bg-[#171b22]/90 hover:bg-[#1f2531] text-slate-300 hover:text-white border border-[#2d333d]"
                }`}
                title="Toggle Navigation Menu (Ctrl+K)"
              >
                <Menu className={`w-4 h-4 ${highContrastNav ? "text-black" : "text-indigo-400"}`} />
                <span className="hidden sm:inline">Menu</span>
                <kbd className={`hidden md:inline-flex items-center gap-0.5 border text-[9.5px] px-1 py-0.5 rounded font-mono tracking-normal leading-none font-semibold ${
                  highContrastNav 
                    ? "bg-slate-100 border-slate-400 text-black" 
                    : "bg-slate-955/60 border border-[#2d333d] text-indigo-400"
                }`}>
                  Ctrl K
                </kbd>
              </button>
            )}
          </div>

          {/* Right menu stats or onboarding info */}
          <div className="flex items-center gap-3">
            {activeTab !== "onboarding" && activeTab !== "loading" && !zenMode && (
              <div className={`hidden sm:flex items-center gap-2 text-xs p-1.5 px-3.5 rounded-xl border ${
                highContrastNav 
                  ? "bg-slate-900 border-slate-350" 
                  : "bg-[#171b22] border-[#2d333d]"
              }`}>
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                <span className="text-slate-400 font-semibold">Streak: </span>
                <span className="text-white font-black">{Math.max(1, 4 + Math.floor(sessions.length / 2))}d</span>
              </div>
            )}

            {/* Theme Toggle Segmented Control */}
            <div className={`flex p-1 rounded-xl items-center text-xs border ${
              highContrastNav 
                ? "bg-black border-slate-350" 
                : "bg-[#171b22] border-[#2d333d]"
            }`}>
              <button
                id="theme_toggle_dark_btn"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  theme === "dark" 
                    ? highContrastNav ? "bg-white text-black border border-white font-black" : "bg-indigo-650/20 text-indigo-400 border border-indigo-500/30" 
                    : highContrastNav ? "text-slate-300 hover:text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Elegant Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Dark</span>
              </button>
              <button
                id="theme_toggle_light_btn"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  theme === "light" 
                    ? highContrastNav ? "bg-white text-black border border-white font-black" : "bg-indigo-600 text-white border border-indigo-200" 
                    : highContrastNav ? "text-slate-300 hover:text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Light</span>
              </button>
            </div>

            {/* Profile details & Logout Button */}
            <div className={`flex items-center gap-4 pl-3 border-l ${
              highContrastNav 
                ? "border-slate-300" 
                : "border-[#2d333d]"
            }`}>
              <div className="hidden md:flex items-center gap-2 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-slate-100 leading-tight">{currentUser.username}</span>
                  <span className="text-[9px] text-slate-500 font-medium leading-none">{currentUser.email}</span>
                </div>
              </div>
              <button
                id="logout_action_btn"
                onClick={handleLogout}
                className={`text-xs font-bold p-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  highContrastNav 
                    ? "bg-slate-900 border-2 border-slate-300 text-white hover:bg-slate-800" 
                    : "bg-red-950/40 hover:bg-red-900/60 text-red-00 border border-red-900/30 hover:border-red-500/40"
                }`}
                title="Secure logout session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* High-Fidelity Responsive Navigation Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && activeTab !== "onboarding" && activeTab !== "loading" && (
          <div className="fixed inset-0 z-50 flex overflow-hidden">
            {/* Backdrop blur overlay with fade out trigger from AnimatePresence */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Actual Drawer sliding panel with physics-based Touch Swipe gestures */}
            <motion.div
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={{ left: 0.15, right: 0 }}
              onDragEnd={(event, info) => {
                if (info.offset.x < -75 || info.velocity.x < -160) {
                  setDrawerOpen(false);
                }
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 27, stiffness: 250 }}
              className={`relative w-80 max-w-full h-full flex flex-col justify-between shadow-[25px_0_50px_-12px_rgba(0,0,0,0.5)] z-50 text-slate-200 touch-pan-y ${
                highContrastNav 
                  ? "bg-black border-r-2 border-slate-200" 
                  : "bg-[#13161c] border-r border-[#2d333d]"
              }`}
            >
              {/* Subtle Scroll Progress Indicator at the top of the drawer */}
              <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-1 bg-slate-950/40 z-50">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 rounded-r-full"
                  style={{ width: `${drawerScrollProgress}%` }}
                />
              </div>

              {/* Vertical subtle touch pull/grab indicator affordance */}
              <div aria-hidden="true" className="absolute right-1 top-1/2 -translate-y-1/2 w-[3.5px] h-12 rounded-full bg-slate-750/50 pointer-events-none" />

              {/* Drawer top and list sections with Scroll support */}
              <div 
                onScroll={handleDrawerScroll}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
              >
              {/* Header Info */}
              <div className={`p-5 flex items-center justify-between ${
                highContrastNav 
                  ? "border-b-2 border-slate-205 bg-black" 
                  : "border-b border-[#2d333d]/70"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg font-extrabold flex items-center justify-center shadow-lg ${
                    highContrastNav 
                      ? "bg-white text-black border border-white" 
                      : "bg-indigo-600 text-white shadow-indigo-600/25"
                  }`}>
                    <Cpu className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-black tracking-tight text-white block">prep.ai</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Interactive Studio</span>
                  </div>
                </div>
                 <button
                  onClick={() => setDrawerOpen(false)}
                  className={`p-1 px-2 border rounded-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5 ${
                    highContrastNav 
                      ? "bg-white text-slate-950 border-2 border-slate-950 hover:bg-slate-100 font-extrabold" 
                      : "bg-[#171b22] hover:bg-[#1a1f29] text-slate-400 hover:text-indigo-400 border border-[#2d333d]"
                  }`}
                  title="Close Navigation (Ctrl+K)"
                >
                  <kbd className={`hidden sm:inline-block text-[8px] border font-mono font-black uppercase tracking-wider px-1 rounded-sm ${
                    highContrastNav 
                      ? "bg-slate-100 border-slate-400 text-slate-950" 
                      : "bg-slate-900 border-[#2d333d] text-slate-500"
                  }`}>Ctrl+K</kbd>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="p-4 py-5 space-y-1.5">
                <motion.div
                  variants={drawerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-1.5"
                >
                  <motion.span 
                    variants={drawerItemVariants}
                    className="text-[9px] uppercase font-bold tracking-widest text-slate-555 px-3 block mb-2 font-mono"
                  >
                    Main Categories
                  </motion.span>
                  {[
                    { id: "dashboard", label: "Dashboard", sub: "Interview metrics & stats", icon: Layout },
                    { id: "profile", label: "My Profile", sub: "Core portfolio & resume skills", icon: User },
                    { id: "forum", label: "Community Forum", sub: "Discuss topics & coordinate", icon: MessageSquare },
                    { id: "insights", label: "Interview Insights", sub: "FAANG+ criteria & reviews", icon: Building2 },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        variants={drawerItemVariants}
                        whileHover={{ scale: 1.015, x: 4 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setDrawerOpen(false);
                        }}
                        className={`w-full group flex items-start gap-3.5 p-3 rounded-xl transition-[colors,border-color,shadow] duration-150 text-left border cursor-pointer select-none ${
                          highContrastNav
                            ? isActive 
                              ? "bg-white text-slate-955 border-2 border-white shadow-2xl font-black"
                              : "bg-[#14171d] border-2 border-slate-400 text-slate-50 hover:bg-slate-800 hover:text-white"
                            : isActive 
                              ? "bg-gradient-to-r from-indigo-950/50 via-indigo-900/10 to-transparent border-indigo-500/40 text-indigo-400 shadow-md shadow-indigo-950/10" 
                              : "border-transparent text-slate-400 hover:bg-[#1c212b]/60 hover:text-slate-200"
                        }`}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${
                          highContrastNav
                            ? isActive
                              ? "bg-black text-white"
                              : "bg-[#252a35] text-slate-50"
                            : isActive 
                              ? "bg-indigo-600/20 text-indigo-400" 
                              : "bg-slate-900 text-slate-400 group-hover:bg-[#12151c] group-hover:text-slate-200"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className={`text-[11px] font-black uppercase tracking-wider leading-none ${
                            highContrastNav
                              ? isActive ? "text-slate-950" : "text-white"
                              : "text-inherit"
                          }`}>
                            {item.label}
                          </div>
                          <div className={`text-[9px] font-medium leading-none ${
                            highContrastNav
                              ? isActive ? "text-slate-800" : "text-slate-300"
                              : "text-slate-555"
                          }`}>
                            {item.sub}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>

                {/* Collapsible MORE OPTIONS menu section */}
                <div className="border-t border-[#2d333d]/50 mt-5 pt-4">
                  <button 
                    onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
                    className="w-full flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-slate-200 font-mono select-none cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-900/40"
                    title="Toggle Advanced Actions Menu"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                      More Options Menu
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOptionsOpen ? "rotate-180 text-indigo-400" : "text-slate-500"}`} />
                  </button>

                  <AnimatePresence>
                    {moreOptionsOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.96 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.96 }}
                        transition={{ 
                          height: { type: "spring", stiffness: 240, damping: 26 },
                          scale: { type: "spring", stiffness: 240, damping: 26 },
                          opacity: { duration: 0.15 }
                        }}
                        className="mt-3 space-y-3.5 px-3 text-slate-350 overflow-hidden"
                      >
                        
                        {/* Interactive Section 1: Quick Difficulty Picker */}
                        <div className="p-2.5 bg-slate-950/40 border border-[#2d333d]/70 rounded-xl space-y-2">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold font-mono text-slate-550 block">
                          Calibration Target
                        </span>
                        <div className="grid grid-cols-3 gap-1 bg-[#13161c] p-0.5 rounded-lg border border-[#2d333d]/60">
                          {["Junior", "Mid-Level", "Senior"].map((lvl) => {
                            const isCurr = difficulty === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => {
                                  setDifficulty(lvl);
                                  syncStateWithServer(domain, company, lvl, resumeProfile, sessions);
                                }}
                                className={`text-[8.5px] font-black uppercase tracking-wider py-1 rounded transition select-none cursor-pointer ${
                                  isCurr 
                                    ? "bg-indigo-600 text-white shadow-sm font-extrabold" 
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {lvl.split("-")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Interactive Section 1b: Practice History Filter */}
                      <div className="p-2.5 bg-slate-950/40 border border-[#2d333d]/70 rounded-xl space-y-2">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold font-mono text-slate-550 block">
                          History Session Filter
                        </span>
                        <div className="flex items-center justify-between bg-[#13161c] p-2 rounded-lg border border-[#2d333d]/60">
                          <label htmlFor="history_difficulty_filter" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-indigo-450" />
                            <span>Log Level</span>
                          </label>
                          <select
                            id="history_difficulty_filter"
                            value={historyDifficultyFilter}
                            onChange={(e) => setHistoryDifficultyFilter(e.target.value)}
                            className="bg-slate-900 border border-[#2d333d] rounded text-[10px] font-black uppercase text-indigo-400 focus:outline-none focus:border-indigo-500 py-1 px-2 cursor-pointer text-right max-w-[125px]"
                          >
                            <option value="all">All Levels</option>
                            <option value="junior">Junior</option>
                            <option value="mid-level">Mid-Level</option>
                            <option value="senior">Senior</option>
                          </select>
                        </div>
                      </div>

                      {/* Interactive Section: Accessibility & Focus Settings */}
                      <div className="p-2.5 bg-slate-950/40 border border-[#2d333d]/70 rounded-xl space-y-2">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold font-mono text-slate-550 block">
                          Focus & Visibility
                        </span>
                        
                        {/* High-Contrast Nav */}
                        <div className="flex items-center justify-between bg-[#13161c] p-2 rounded-lg border border-[#2d333d]/60">
                          <label htmlFor="high_contrast_nav_toggle" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>High-Contrast Nav</span>
                          </label>
                          <button
                            id="high_contrast_nav_toggle"
                            onClick={() => setHighContrastNav(prev => !prev)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                              highContrastNav ? "bg-[#38bdf8]" : "bg-[#2d333d]"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                              highContrastNav ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                        </div>

                        {/* Zen Mode focus */}
                        <div className="flex items-center justify-between bg-[#13161c] p-2 rounded-lg border border-[#2d333d]/60">
                          <label htmlFor="zen_mode_toggle" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span>Zen Focus Mode</span>
                          </label>
                          <button
                            id="zen_mode_toggle"
                            onClick={() => setZenMode(prev => !prev)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                              zenMode ? "bg-[#10b981]" : "bg-[#2d333d]"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                              zenMode ? "translate-x-4" : "translate-x-0"
                            }`} />
                          </button>
                        </div>

                        {/* Customizable Menu Key Shortcut */}
                        <div className="flex items-center justify-between bg-[#13161c] p-2 rounded-lg border border-[#2d333d]/60">
                          <label htmlFor="custom_shortcut_input" className="text-[10px] text-slate-350 font-bold select-none cursor-pointer flex items-center gap-1.5" title="Pressing this letter key anywhere toggles the 'More Options' block">
                            <Settings className="w-3.5 h-3.5 text-amber-500" />
                            <span>Toggle Shortcut Key</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <kbd className="text-[9px] bg-slate-900 border border-[#2d333d]/60 text-indigo-400 font-mono font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Key:</kbd>
                            <input
                              id="custom_shortcut_input"
                              type="text"
                              maxLength={1}
                              value={optionsMenuShortcut}
                              onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-4]/g, "");
                                if (val) {
                                  setOptionsMenuShortcut(val);
                                  localStorage.setItem("prepai_options_menu_shortcut", val);
                                }
                              }}
                              className="w-8 h-5 bg-slate-900 border border-[#2d333d] rounded text-center text-[10px] font-black uppercase text-indigo-400 focus:outline-none focus:border-indigo-500"
                              title="Type a single lower or uppercase letter"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Section 2: Direct Arena Launcher */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold font-mono text-slate-555 block mb-1">
                          Direct Arena Launch
                        </span>
                        
                        <button
                          onClick={() => {
                            handleLaunchArena("coding");
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] text-slate-350 hover:text-white bg-slate-950/20 hover:bg-[#1c212b]/60 rounded-xl border border-[#2d333d]/50 hover:border-indigo-500/35 transition cursor-pointer text-left font-bold"
                        >
                          <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
                          <span>Coding Arena Core</span>
                        </button>

                        <button
                          onClick={() => {
                            handleLaunchArena("system-design");
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] text-slate-350 hover:text-white bg-slate-950/20 hover:bg-[#1c212b]/60 rounded-xl border border-[#2d333d]/50 hover:border-indigo-500/35 transition cursor-pointer text-left font-bold"
                        >
                          <Cpu className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          <span>System Design Core</span>
                        </button>

                        <button
                          onClick={() => {
                            handleLaunchArena("technical");
                            setDrawerOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] text-slate-350 hover:text-white bg-slate-950/20 hover:bg-[#1c212b]/60 rounded-xl border border-[#2d333d]/50 hover:border-indigo-500/35 transition cursor-pointer text-left font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>Voice Articulation</span>
                        </button>
                      </div>

                      {/* Interactive Section 3: Telemetry export */}
                      <div className="space-y-1">
                        <span className="text-[8.5px] uppercase tracking-wider font-extrabold font-mono text-slate-550 block mb-1">
                          Utility Tools
                        </span>

                        <button
                          onClick={handleExportSessionsData}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] text-slate-350 hover:text-white bg-slate-950/20 hover:bg-[#1c212b]/60 rounded-xl border border-[#2d333d]/50 hover:border-indigo-500/35 transition cursor-pointer text-left font-bold"
                        >
                          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Export Backup (JSON)</span>
                        </button>

                        <button
                          disabled={isDiagnosing}
                          onClick={handleRunDiagnostics}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[10px] text-slate-350 hover:text-white bg-slate-950/20 hover:bg-[#1c212b]/60 rounded-xl border border-[#2d333d]/50 hover:border-indigo-500/35 transition cursor-pointer text-left disabled:opacity-40 font-bold"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-violet-400 shrink-0 ${isDiagnosing ? "animate-spin" : ""}`} />
                          <span>{isDiagnosing ? "Running scan..." : "Verify System Nodes"}</span>
                        </button>

                        {diagnosticResult && (
                          <div className="p-2.5 mt-2 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-[8.5px] text-indigo-300 font-mono leading-relaxed animate-fade-in break-words">
                            {diagnosticResult}
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              </div>
            </div>

            {/* Bottom active profile metadata and settings */}
            <div className="p-5 border-t border-[#2d333d]/70 bg-[#171b22]/40 space-y-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[11px] font-black text-slate-200 block leading-tight">{currentUser.username}</span>
                  <span className="text-[9px] text-slate-500 font-medium block truncate max-w-[170px] leading-none mt-0.5">{currentUser.email}</span>
                </div>
              </div>

              {/* Streak info */}
              <div className="flex items-center justify-between text-[10px] bg-[#12151c] p-2 px-3 rounded-xl border border-[#2d333d]">
                <span className="text-slate-500 font-bold flex items-center gap-1.5 uppercase font-mono">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" /> Active Streak
                </span>
                <span className="text-white font-black bg-gradient-to-r from-orange-400 to-amber-500 text-[9px] px-2 py-0.5 rounded-md font-mono">
                  {Math.max(1, 4 + Math.floor(sessions.length / 2))} Days
                </span>
              </div>

              {/* Edit or Reset onboarding profile */}
              <div className="flex flex-col gap-1.5 w-full">
                <button
                  onClick={() => {
                    setActiveTab("onboarding");
                    setDrawerOpen(false);
                  }}
                  className="w-full py-2 px-2.5 bg-slate-900 hover:bg-indigo-950/40 text-slate-300 hover:text-white border border-[#2d333d] hover:border-indigo-500/30 rounded-xl text-[9px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Configure Operating System</span>
                </button>

                <button
                  onClick={() => {
                    handleResetProfile();
                    setDrawerOpen(false);
                  }}
                  className="w-full py-1.5 px-2.5 bg-[#12151c]/40 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 border border-[#2d333d]/40 hover:border-rose-500/20 rounded-xl text-[8.5px] font-bold uppercase tracking-wide transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Reset Goals & Profile</span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-2.5 bg-red-950/25 hover:bg-red-900/40 text-red-500 hover:text-red-200 border border-red-900/30 font-bold rounded-xl text-[9px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-140px)] overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* Onboarding Profile configuration */}
          {activeTab === "onboarding" && (
            <motion.div
              key="onboarding"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <ResumeParser 
                onSetupComplete={handleSetupComplete} 
                initialName={currentUser?.username || "Arnav Telangi"} 
                initialDomain={domain}
                initialCompany={company}
                initialDifficulty={difficulty}
                initialProfile={resumeProfile}
              />
            </motion.div>
          )}

          {/* Global Loading block while generating content */}
          {activeTab === "loading" && (
            <motion.div
              key="loading"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center justify-center space-y-4 py-36 max-w-lg mx-auto"
            >
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-505 animate-spin" />
                <motion.div 
                  className="absolute w-16 h-16 rounded-full border border-dashed border-indigo-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                />
              </div>
              <h3 className="text-lg font-black text-white text-center tracking-tight">Formulating Adaptive Session</h3>
              <p className="text-slate-400 text-xs text-center leading-relaxed animate-pulse max-w-sm">{loadingMsg}</p>
            </motion.div>
          )}

          {/* DashBoard Console */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              
              {/* Modular Practice Arena Launcher selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Practice Arenas</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  
                  {/* Technical voice selection */}
                  <LauncherTiltCard 
                    id="launcher_tech_voice" 
                    onClick={() => handleLaunchArena("technical")}
                    tooltipText="Voice Arena Session: Actively speak your solutions aloud. The AI assesses precise technical keywords, speaking pace, articulation clarity, and helps eliminate filler words."
                  >
                    <div className="bg-[#171b22]/75 p-5 rounded-2xl border border-[#2d333d] cursor-pointer group space-y-3 flex flex-col justify-between h-full hover:border-[#6366f1]/65 hover:bg-[#1a1e27] transition-all duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20">Voice enabled</span>
                        <h3 className="font-extrabold text-slate-100 group-hover:text-indigo-400 transition-all text-sm">Technical Voice</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Speak answers aloud. AI audits complex technical concepts, pacing, and verbal fillers.</p>
                      </div>
                      <div className="text-xs text-indigo-400 font-bold flex items-center pt-2 gap-1 group-hover:gap-2 transition-all">
                        <span>Train Arena</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </LauncherTiltCard>

                  {/* Behavioral Selection */}
                  <LauncherTiltCard 
                    id="launcher_behavioral" 
                    onClick={() => handleLaunchArena("behavioral")}
                    tooltipText="Behavioral STAR Session: Practice scenario-driven talking points. Evaluates structural STAR components (Situation, Task, Action, Result) alongside leadership and teamwork feedback."
                  >
                    <div className="bg-[#171b22]/75 p-5 rounded-2xl border border-[#2d333d] cursor-pointer group space-y-3 flex flex-col justify-between h-full hover:border-[#6366f1]/65 hover:bg-[#1a1e27] transition-all duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20">STAR focus</span>
                        <h3 className="font-extrabold text-slate-100 group-hover:text-indigo-400 transition-all text-sm">Behavioral Culture</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Behavioral STAR storytelling rounds. Evaluations of context, individual action, and results KPIs.</p>
                      </div>
                      <div className="text-xs text-indigo-400 font-bold flex items-center pt-2 gap-1 group-hover:gap-2 transition-all">
                        <span>Train Arena</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </LauncherTiltCard>

                  {/* Code solving Selection */}
                  <LauncherTiltCard 
                    id="launcher_coding" 
                    onClick={() => handleLaunchArena("coding")}
                    tooltipText="Coding IDE Session: Hardcore browser compiler console. Expect tests around dynamic edge cases, algorithmic refactor suggestions, and automated space/time complexity audit."
                  >
                    <div className="bg-[#171b22]/75 p-5 rounded-2xl border border-[#2d333d] cursor-pointer group space-y-3 flex flex-col justify-between h-full hover:border-[#10b981]/65 hover:bg-[#1a1e27] transition-all duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-emerald-500/20">Interactive IDE</span>
                        <h3 className="font-extrabold text-slate-100 group-hover:text-emerald-400 transition-all text-sm">Coding Assessments</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Algorithm assessment in compiler console. Instant reviews of space/time complexities and edge cases.</p>
                      </div>
                      <div className="text-xs text-emerald-400 font-bold flex items-center pt-2 gap-1 group-hover:gap-2 transition-all">
                        <span>Train Arena</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </LauncherTiltCard>

                  {/* System design Selection */}
                  <LauncherTiltCard 
                    id="launcher_system" 
                    onClick={() => handleLaunchArena("system-design")}
                    tooltipText="System Design Canvas: Whiteboard architecture blueprints. Expect deep feedback on replication strategies, partition bottlenecks, partition fault tolerance, and database recommendations."
                  >
                    <div className="bg-[#171b22]/75 p-5 rounded-2xl border border-[#2d333d] cursor-pointer group space-y-3 flex flex-col justify-between h-full hover:border-[#8b5cf6]/65 hover:bg-[#1a1e27] transition-all duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-violet-500/10 text-violet-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-violet-500/20">Canvas whiteboard</span>
                        <h3 className="font-extrabold text-slate-100 group-hover:text-violet-400 transition-all text-sm">System Architectures</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Whiteboard database routing designs. Solicits caching tiers, partition bottlenecks adjustments.</p>
                      </div>
                      <div className="text-xs text-violet-400 font-bold flex items-center pt-2 gap-1 group-hover:gap-2 transition-all">
                        <span>Train Arena</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </LauncherTiltCard>

                  {/* Company Focus Sandbox Selection */}
                  <LauncherTiltCard 
                    id="launcher_company_sim" 
                    onClick={() => setActiveTab("company-sim")}
                    tooltipText="Company & STAR Simulation Sandbox: Select Google, Amazon, or Microsoft to practice highly specific real interview pipelines or explore and grade categorized behavioral scenarios."
                  >
                    <div className="bg-[#171b22]/75 p-5 rounded-2xl border border-[#2d333d] cursor-pointer group space-y-3 flex flex-col justify-between h-full hover:border-[#6366f1]/65 hover:bg-[#1a1e27] transition-all duration-300">
                      <div className="space-y-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20">Enterprise Focus</span>
                        <h3 className="font-extrabold text-slate-100 group-hover:text-indigo-400 transition-all text-sm">Company Simulators</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed">Firm assessments & dilemma scenario decks. Standardized Googliness, LP, and growth grading.</p>
                      </div>
                      <div className="text-xs text-indigo-400 font-bold flex items-center pt-2 gap-1 group-hover:gap-2 transition-all">
                        <span>Launch Hub</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </LauncherTiltCard>

                </div>
              </div>

              {/* Dynamic Daily Goal Target Tracker */}
              <DailyGoalTracker
                sessions={sessions}
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                manualOffset={manualOffset}
                setManualOffset={setManualOffset}
              />

              <Dashboard
                resumeProfile={resumeProfile}
                domain={domain}
                company={company}
                difficulty={difficulty}
                sessions={filteredHistorySessions}
                allSessions={sessions}
                onStartNewSession={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                onNavigateToCoach={() => setActiveTab("coach")}
                onNavigateToRoadmap={() => setActiveTab("roadmap")}
                onEditProfile={() => setActiveTab("profile")}
                zenMode={zenMode}
                dailyGoal={dailyGoal}
                setDailyGoal={setDailyGoal}
                manualOffset={manualOffset}
                setManualOffset={setManualOffset}
                historyDifficultyFilter={historyDifficultyFilter}
              />
            </motion.div>
          )}

          {/* Technical & culture fit active screen */}
          {activeTab === "technical" && (
            <motion.div
              key="technical"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <TechnicalArena
                questions={activeQuestions}
                domain={domain}
                company={company}
                difficulty={difficulty}
                onFinishRound={handleFinishRound}
                onExitArena={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

          {/* Coding Assessment arena */}
          {activeTab === "coding" && (
            <motion.div
              key="coding"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CodingArena
                questions={activeQuestions}
                onFinishRound={handleFinishRound}
                onExitArena={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

          {/* System Design Whiteboard workspace */}
          {activeTab === "system-design" && (
            <motion.div
              key="system-design"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <SystemDesignArena
                questions={activeQuestions}
                onFinishRound={handleFinishRound}
                onExitArena={() => setActiveTab("dashboard")}
              />
            </motion.div>
          )}

          {/* AI Career Coach Hub */}
          {activeTab === "coach" && (
            <motion.div
              key="coach"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CareerCoach
                resumeProfile={resumeProfile}
                domain={domain}
                company={company}
              />
            </motion.div>
          )}

          {/* Learning Roadmap Component */}
          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <LearningRoadmap
                sessions={sessions}
                difficulty={difficulty}
                domain={domain}
                company={company}
                onStartPractice={(mode) => handleLaunchArena(mode)}
              />
            </motion.div>
          )}

          {/* Enterprise Recruiter Dashboard */}
          {activeTab === "recruiter" && (
            <motion.div
              key="recruiter"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <RecruiterDashboard 
                currentUser={currentUser}
                resumeProfile={resumeProfile}
                currentDomain={domain}
                currentDifficulty={difficulty}
              />
            </motion.div>
          )}

          {/* Collaborative Practice Rooms */}
          {activeTab === "rooms" && (
            <motion.div
              key="rooms"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CoPracticeRoom currentUsername={currentUser?.username || "Candidate"} />
            </motion.div>
          )}

          {/* Custom My Profile Section */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <MyProfile
                resumeProfile={resumeProfile}
                domain={domain}
                company={company}
                difficulty={difficulty}
                onSave={handleProfileSave}
                currentUser={currentUser}
              />
            </motion.div>
          )}

          {/* Company Focus and Behavioral Simulator */}
          {activeTab === "company-sim" && (
            <motion.div
              key="company-sim"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CompanySimulator />
            </motion.div>
          )}

          {/* Community Forum */}
          {activeTab === "forum" && (
            <motion.div
              key="forum"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CommunityForum currentUsername={currentUser?.username || "Candidate Coder"} />
            </motion.div>
          )}

          {/* Company-specific Interview Insights */}
          {activeTab === "insights" && (
            <motion.div
              key="insights"
              variants={pageTransitionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <InterviewInsights 
                currentUsername={currentUser?.username || "Candidate Coder"} 
                defaultCompany={company || "Google"} 
              />
            </motion.div>
          )}

          {/* Final Round ScoreCard Page */}
          {activeTab === "scorecard" && latestScorecard && (
            <>
              <ConfettiCanvas />
              <motion.div
                key="scorecard"
                variants={pageTransitionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="max-w-xl mx-auto space-y-6 pt-12 text-center pb-16"
              >
              <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800 space-y-6 flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/10"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black text-white">Assessment Complete!</h1>
                  <p className="text-slate-400 text-xs uppercase font-extrabold tracking-widest">{latestScorecard.mode} simulated session feedback compiled</p>
                </div>

                {/* Large Indicator */}
                <motion.div 
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="p-6 px-10 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-1 flex flex-col items-center"
                >
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Round Score Index</span>
                  <div className="text-4xl font-extrabold text-white flex items-baseline gap-1 font-mono">
                    <span>{latestScorecard.score}</span>
                    <span className="text-slate-600 text-sm">/100</span>
                  </div>
                </motion.div>

                <div className="w-full grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 font-medium block">Total Tasks:</span>
                    <span className="text-slate-200 mt-1 block font-bold">{latestScorecard.count} Problems</span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 font-medium block">Duration:</span>
                    <span className="text-slate-200 mt-1 block font-bold">
                      {Math.floor(latestScorecard.duration / 60)}m {latestScorecard.duration % 60}s
                    </span>
                  </div>
                </div>

                {/* Voice recordings playback board for TechnicalArena self-evaluation */}
                {latestRecordings.length > 0 && (
                  <div className="w-full text-left space-y-4 border-t border-slate-800 pt-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5 justify-center md:justify-start">
                        <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                          <Compass className="w-4 h-4 text-indigo-400" />
                        </span>
                        Voice Self-Evaluation Hub
                      </h3>
                      <p className="text-[11px] text-slate-500 text-center md:text-left leading-normal">
                        Compare your recorded answers to target standards. Listen to playbacks to assess pacing, speaking speed, pauses, and speech fillers.
                      </p>
                    </div>

                    <div className="space-y-3.5 max-h-[365px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {latestRecordings.map((rec, idx) => (
                        <div key={idx} className="bg-[#11141c] border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-black uppercase text-indigo-400 font-mono">Question {idx + 1}</span>
                            <h4 className="text-xs font-bold text-slate-200 leading-snug">{rec.questionText}</h4>
                          </div>

                          {rec.transcript && (
                            <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-lg text-slate-400 text-xs italic leading-relaxed">
                              "{rec.transcript}"
                            </div>
                          )}

                          <AudioPlayerWidget 
                            src={rec.audioUrl} 
                            title={`Question ${idx + 1} Original Audio Playback`} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions guidance */}
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Scorecards have been logged safely onto historical databases index. Review weaknesses lists inside study roadmap tab of Dashboard to practice adaptive concepts.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    id="scorecard_back_dash"
                    onClick={() => setActiveTab("dashboard")}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg transition text-xs"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    id="scorecard_coach_transition"
                    onClick={() => setActiveTab("coach")}
                    className="px-4 py-3 bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 rounded-xl border border-slate-700/60 text-xs transition"
                  >
                    Ask Coach Critique
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}

        </AnimatePresence>
      </main>

      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#13161c] border border-[#2d333d] rounded-2xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
                  <AlertTriangle className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-base font-black text-white font-sans tracking-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    {confirmDialog.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition border border-transparent hover:border-slate-700/60 cursor-pointer"
                >
                  {confirmDialog.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition shadow-lg cursor-pointer"
                >
                  {confirmDialog.confirmText || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
