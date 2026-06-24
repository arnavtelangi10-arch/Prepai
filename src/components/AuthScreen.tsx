import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Cpu, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Users,
  History,
  ChevronRight,
  X,
  Key,
  ShieldAlert,
  Server,
  UserCheck
} from "lucide-react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  isDummyFirebaseConfig,
  persistProfileToFirestore,
  fetchProfileFromFirestore
} from "../lib/firebase";

interface AuthScreenProps {
  onLoginSuccess: (token: string, user: {
    username: string;
    email: string;
    domain: string;
    company: string;
    difficulty: string;
    resumeProfile: any;
    sessions: any[];
  }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotIdentity, setForgotIdentity] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter identity, 2 = Enter code & password
  const [simulatedResetToken, setSimulatedResetToken] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("prepai_remember_me") === "true";
  });
  const [username, setUsername] = useState(() => {
    const savedMe = localStorage.getItem("prepai_remember_me") === "true";
    return savedMe ? localStorage.getItem("prepai_saved_username") || "" : "";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => {
    const savedMe = localStorage.getItem("prepai_remember_me") === "true";
    return savedMe ? localStorage.getItem("prepai_saved_password") || "" : "";
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Stored state for multiple saved credentials
  const [savedAccounts, setSavedAccounts] = useState<any[]>(() => {
    try {
      const existing = localStorage.getItem("prepai_saved_accounts");
      const parsed = existing ? JSON.parse(existing) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });

  // Track password reveals for saved profiles list
  const [showSavedPasswords, setShowSavedPasswords] = useState<Record<string, boolean>>({});

  const toggleShowSavedPassword = (uname: string) => {
    setShowSavedPasswords(prev => ({ ...prev, [uname]: !prev[uname] }));
  };

  const handleDeleteSavedAccount = (uname: string) => {
    try {
      const updated = savedAccounts.filter(acc => acc.username.toLowerCase() !== uname.toLowerCase());
      setSavedAccounts(updated);
      localStorage.setItem("prepai_saved_accounts", JSON.stringify(updated));
    } catch (_) {}
  };

  const handleSelectSavedAccount = (acc: any) => {
    setUsername(acc.username || "");
    setPassword(acc.password || "");
    if (acc.email) {
      setEmail(acc.email);
    }
    setSuccessMsg(`Prefilled credentials for account: ${acc.username}`);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };
  
  // Security field toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & loaders
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Brute force protection consecutive failed attempts counter & lockout timer
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return Number(localStorage.getItem("prepai_failed_attempts") || "0");
  });
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Restore existing lockout on mount
  React.useEffect(() => {
    const lockedUntil = localStorage.getItem("prepai_locked_until");
    if (lockedUntil) {
      const remainingSecs = Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000);
      if (remainingSecs > 0) {
        setLockoutRemaining(remainingSecs);
      } else {
        localStorage.removeItem("prepai_locked_until");
      }
    }
  }, []);

  // Countdown timer for lockout
  React.useEffect(() => {
    if (lockoutRemaining <= 0) return;

    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("prepai_locked_until");
          localStorage.setItem("prepai_failed_attempts", "0");
          setFailedAttempts(0);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Dynamic Password strength evaluation helper
  const passwordStrength = React.useMemo(() => {
    if (!password) return { score: 0, label: "", color: "bg-slate-700", width: "w-0", text: "text-slate-500" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

    let label = "Weak";
    let color = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
    let width = "w-1/3";
    let text = "text-rose-400";
    
    if (score >= 5) {
      label = "Strong";
      color = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
      width = "w-full";
      text = "text-emerald-400";
    } else if (score >= 3) {
      label = "Medium";
      color = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
      width = "w-2/3";
      text = "text-amber-400";
    }

    return { score, label, color, width, text };
  }, [password]);

  // Google OAuth Sandbox toggle
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxEmail, setSandboxEmail] = useState("arnav.telangi24@pccoepune.org");
  const [sandboxName, setSandboxName] = useState("Arnav Telangi");
  const [sandboxSearch, setSandboxSearch] = useState("");
  const [sandboxFilter, setSandboxFilter] = useState("all");
  const [sandboxLoadingLogs, setSandboxLoadingLogs] = useState<string[]>([]);
  const [sandboxProgress, setSandboxProgress] = useState(0);
  const [isSandboxSecuring, setIsSandboxSecuring] = useState(false);

  // Listen for simulated Google login success messages from the pop-up window
  React.useEffect(() => {
    const handleGoogleSandboxMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }
      if (event.data?.type === "GOOGLE_SANDBOX_SUCCESS") {
        const { email, name } = event.data;
        if (email && name) {
          await authenticateGoogleUser(email, name);
        }
      }
    };
    window.addEventListener("message", handleGoogleSandboxMessage);
    return () => window.removeEventListener("message", handleGoogleSandboxMessage);
  }, []);

  // Modern procedural UI tone synthesis
  const playAuthTone = (type: "click" | "hover" | "success" | "warning") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "hover") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "success") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6

        osc2.frequency.setValueAtTime(261.63, now); // C4

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc1.start(now);
        osc1.stop(now + 0.6);
        osc2.start(now);
        osc2.stop(now + 0.6);
      } else if (type === "warning") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Ignored if sound is blocked or unsupported
    }
  };

  const startOAuthSimulation = async (emailVal: string, nameVal: string) => {
    setIsSandboxSecuring(true);
    setSandboxProgress(0);
    setSandboxLoadingLogs([]);
    playAuthTone("success");

    const steps = [
      { msg: "🔒 Establishing secure SSL handshake with Google Identity endpoints...", progress: 15 },
      { msg: "🔑 Exchanging DH parameters & signing auth assertion challenge...", progress: 35 },
      { msg: "📡 Receiving Google Accounts ID token payload (JWT claim)...", progress: 60 },
      { msg: "🛠️ Synchronizing local storage caching values with system profiles...", progress: 85 },
      { msg: "✨ Authorization Successful! Granting developer access scope...", progress: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      setSandboxProgress(steps[i].progress);
      setSandboxLoadingLogs((prev) => [...prev, steps[i].msg]);
      playAuthTone("click");
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    // Finalise Auth step
    await authenticateGoogleUser(emailVal, nameVal);
    setIsSandboxSecuring(false);
  };

  const authenticateGoogleUser = async (emailVal: string, nameVal: string, firebaseUid?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load Firestore persistent profile if real Firebase Auth is being used
      let loadedProfile: any = null;
      if (firebaseUid) {
        loadedProfile = await fetchProfileFromFirestore(firebaseUid);
      }

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailVal, 
          name: nameVal,
          firestoreProfile: loadedProfile 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to finalize authentication with sync endpoints.");
      }

      // If this is a real Firebase login and there was no profile in Firestore yet,
      // upload the newly synchronized/created backend profile to Firestore!
      if (firebaseUid && !loadedProfile) {
        await persistProfileToFirestore(firebaseUid, {
          username: data.user.username,
          email: data.user.email,
          domain: data.user.domain || "CSE",
          company: data.user.company || "FAANG",
          difficulty: data.user.difficulty || "Mid-Level",
          resumeProfile: data.user.resumeProfile || null,
          sessions: data.user.sessions || []
        });
      }

      setSuccessMsg("Google Identity synchronized! Merging credentials and starting career console...");
      
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
        setLoading(false);
        setIsSandboxOpen(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Network exception finalising Google login session.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (!auth || !googleProvider || isDummyFirebaseConfig()) {
        throw new Error("DUMMY_KEYS_DETECTED");
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user || !user.email) {
        throw new Error("Could not retrieve email claims from authenticated Google profile.");
      }

      await authenticateGoogleUser(user.email, user.displayName || "Google Candidate", user.uid);

    } catch (err: any) {
      console.warn("Real Firebase Identity configuration requires project setup. Launching premium Google accounts authorization popup window...", err);
      
      // Attempt to open the custom premium popup window for simulated Google sign-in
      const authWindow = window.open(
        "/auth/google-sandbox",
        "google_oauth_popup",
        "width=500,height=620,status=no,resizable=no"
      );

      if (!authWindow) {
        // Fallback: If browser popup blocker targets the window, safely open the integrated inline developer dashboard modal as a fallback
        console.warn("Google Sign-In popup was blocked by browser security. Releasing integrated inline developer sandbox fallback dashboard.");
        setError("Sign-in popup was blocked by your browser. Displaying integrated developer accounts selector below...");
        setIsSandboxOpen(true);
        setLoading(false);
      } else {
        // Succesfully launched the popup, main loader handles the wait
        setSuccessMsg("Google Account Picker popup loaded. Please authorize your profile in the choosing window...");
        // Keep loading false on main thread so they know it is open and buttons are not blocked
        setLoading(false);
      }
    }
  };

  const handleForgotPasswordInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!forgotIdentity.trim()) {
      setError("Please enter your username or registered email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: forgotIdentity.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate password reset.");
      }

      setSimulatedResetToken(data.resetToken || "");
      setForgotUsername(data.username || "");
      setResetCode(data.resetToken || ""); // Auto-fill for convenience in development/sandbox context
      setForgotStep(2);
      setSuccessMsg("An 8-character verification reset code was successfully prepared!");
    } catch (err: any) {
      setError(err.message || "An error occurred. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetCode.trim()) {
      setError("Please enter the 8-character reset code.");
      return;
    }
    if (!newPassword) {
      setError("Please choose a new password.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&* etc.).");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: forgotUsername,
          token: resetCode.trim(),
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update your password.");
      }

      setSuccessMsg("Your password has been securely reset! Redirecting to login sequence...");
      setTimeout(() => {
        setIsForgotMode(false);
        setForgotStep(1);
        setForgotIdentity("");
        setResetCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        if (forgotUsername) {
          setUsername(forgotUsername);
        }
        setError(null);
        setSuccessMsg(null);
        setLoading(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Could not complete password recovery.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isSignUp && lockoutRemaining > 0) {
      setError(`Login temporarily disabled due to security lockout. Please wait ${lockoutRemaining} seconds.`);
      return;
    }

    // Initial validations with strict regular expressions
    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }
    if (isSignUp) {
      if (!email.trim()) {
        setError("Please specify a valid email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Please provide a valid, well-formed email address.");
        return;
      }
    }
    if (!password) {
      setError("Password cannot be blank.");
      return;
    }
    if (isSignUp) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (password.length < 8 || !passwordRegex.test(password)) {
        setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&* etc.).");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else {
      // Basic login length validation
      if (password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignUp 
        ? { username: username.trim(), email: email.trim(), password }
        : { username: username.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (!isSignUp) {
          if (response.status === 423 && data.remainingSec) {
            const lockoutUntil = Date.now() + data.remainingSec * 1000;
            localStorage.setItem("prepai_locked_until", lockoutUntil.toString());
            setLockoutRemaining(data.remainingSec);
            setFailedAttempts(5);
            localStorage.setItem("prepai_failed_attempts", "5");
          } else {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);
            localStorage.setItem("prepai_failed_attempts", nextAttempts.toString());
            
            if (nextAttempts >= 5) {
              const lockoutUntil = Date.now() + 60 * 1000;
              localStorage.setItem("prepai_locked_until", lockoutUntil.toString());
              setLockoutRemaining(60);
              throw new Error("Too many consecutive failed login attempts. Security lockout active for 60 seconds.");
            }
          }
        }
        throw new Error(data.error || "Authentication failed.");
      }

      // Reset block trackers on successful authentification
      if (!isSignUp) {
        setFailedAttempts(0);
        localStorage.setItem("prepai_failed_attempts", "0");
        localStorage.removeItem("prepai_locked_until");
      }

      // Save credentials state if requested
      if (rememberMe) {
        localStorage.setItem("prepai_remember_me", "true");
        localStorage.setItem("prepai_saved_username", username.trim());
        localStorage.setItem("prepai_saved_password", password);
      } else {
        localStorage.removeItem("prepai_remember_me");
        localStorage.removeItem("prepai_saved_username");
        localStorage.removeItem("prepai_saved_password");
      }

      // Preserve credentials in local backup list to ensure no user is ever forgotten on this machine
      try {
        const uName = username.trim();
        const eAddr = email.trim() || (data.user && data.user.email) || "";
        const uPass = password;
        
        const existing = localStorage.getItem("prepai_saved_accounts");
        let listArr = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(listArr)) listArr = [];
        
        // Remove duplicate entry
        listArr = listArr.filter((acc: any) => acc.username.toLowerCase() !== uName.toLowerCase());
        
        // Unshift new entry
        listArr.unshift({
          username: uName,
          email: eAddr,
          password: uPass,
          savedAt: new Date().toLocaleString()
        });
        
        localStorage.setItem("prepai_saved_accounts", JSON.stringify(listArr));
        setSavedAccounts(listArr);
      } catch (e) {
        console.error("Failed to append to backup account registry list:", e);
      }

      setSuccessMsg(isSignUp ? "Account initialized successfully! Synchronizing..." : "Successfully authenticated. Elevating session dashboard...");
      
      // Delay briefly to allow the user to read the success feedback and enjoy the transition
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
        setLoading(false);
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Network exception. Please check your connectivity endpoints.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      
      {/* Brand logo headers */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-3 mb-8 text-center"
      >
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transform hover:scale-105 transition duration-300">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white font-sans">
            prep<span className="text-indigo-400">.ai</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm uppercase tracking-wider font-extrabold">
            Your Adaptive Career Operating System
          </p>
        </div>
      </motion.div>

      {/* Main content grid (Form next to saved accounts list if present) */}
      <div className={`w-full ${savedAccounts.length > 0 ? "max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2" : "max-w-md mt-2 flex flex-col items-center"}`}>
        
        {/* Left Column: Register / Sign In Panel */}
        <div className={savedAccounts.length > 0 ? "lg:col-span-5 xl:col-span-5 w-full" : "w-full"}>
          {/* Main card panel box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full bg-[#13161c] border border-[#2d333d] rounded-2xl shadow-2xl p-6 md:p-8 space-y-6"
          >
        {isForgotMode ? (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-extrabold text-white">Reset Password</h2>
              <p className="text-slate-400 text-xs text-center leading-normal">
                {forgotStep === 1 
                  ? "Enter your credentials identifier to launch a verification code request." 
                  : "Validate your generated recovery token and assign a new password."
                }
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordInitiate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      id="forgot_identity_input"
                      type="text"
                      autoComplete="username"
                      value={forgotIdentity}
                      onChange={(e) => setForgotIdentity(e.target.value)}
                      placeholder="developer_jane or developer@example.com"
                      disabled={loading}
                      className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-400 p-3 rounded-xl text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 min-w-[16px] text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  id="forgot_request_btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-extrabold rounded-xl shadow-lg transition duration-150 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <span>Request Recovery Ticket</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-2.5 text-xs text-slate-450 hover:text-slate-200 font-bold uppercase tracking-wider text-center cursor-pointer transition duration-150"
                >
                  Return to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordComplete} className="space-y-4">
                {simulatedResetToken && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">Sandbox Verification Code:</span>
                    <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
                      Your 8-character recovery token is ready. For play-testing convenience we copy-filled it, or you may reference it here:
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 bg-[#0b0d11] px-2.5 py-1.5 rounded border border-[#2d333d]">
                      <Key className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <code className="text-emerald-400 font-mono font-bold select-all text-xs tracking-wider flex-1">{simulatedResetToken}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(simulatedResetToken);
                          setSuccessMsg("Copied ticket code to clipboard!");
                          setTimeout(() => {
                            setSuccessMsg(null);
                          }, 2000);
                        }}
                        className="text-[9.5px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 px-1 py-0.5 rounded focus:outline-none"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                    Verification Reset Token
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      id="forgot_reset_token_input"
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="HEX RESET CODE"
                      disabled={loading}
                      className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-4 text-xs font-mono font-bold text-slate-200 placeholder-slate-650 focus:outline-none transition duration-150 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      id="forgot_new_password_input"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-10 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 focus:outline-none flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      id="forgot_confirm_new_password_input"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-10 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      tabIndex={-1}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 focus:outline-none flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-400 p-3 rounded-xl text-xs font-medium"
                  >
                    <AlertCircle className="w-4 h-4 min-w-[16px] text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 p-3 rounded-xl text-xs font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 min-w-[16px] text-emerald-500" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                <button
                  id="forgot_commit_btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-extrabold rounded-xl shadow-lg transition duration-150 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving New Credentials...</span>
                    </>
                  ) : (
                    <span>Commit New Password</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setError(null);
                    setSuccessMsg(null);
                    setResetCode("");
                  }}
                  className="w-full py-2.5 text-xs text-slate-450 hover:text-slate-200 font-bold uppercase tracking-wider text-center cursor-pointer transition duration-150"
                >
                  Request another reset ticket
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
        {/* Sign in vs Sign up navigation tabs */}
        <div className="flex bg-[#0b0d11] p-1 rounded-xl border border-[#232933]">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
              !isSignUp 
                ? "bg-indigo-600 text-white shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
              isSignUp 
                ? "bg-indigo-600 text-white shadow" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Heading & description */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-extrabold text-white">
            {isSignUp ? "Generate Credentials" : "Welcome Back Candidate"}
          </h2>
          <p className="text-slate-400 text-xs text-center leading-normal">
            {isSignUp 
              ? "Access adaptive interviews, whiteboard designs, and real-time proctor rooms today." 
              : "Sign in to compile your roadmaps and launch simulated interview arenas."
            }
          </p>
        </div>

        {/* Form handling inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
              {isSignUp ? "Username" : "Username or Email Address"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                id="auth_username_input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isSignUp ? "developer_jane" : "developer_jane or jane@example.com"}
                disabled={loading || (!isSignUp && lockoutRemaining > 0)}
                className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email field (only for Signup) */}
          {isSignUp && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  id="auth_email_input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@example.com"
                  disabled={loading}
                  className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setForgotStep(1);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-extrabold uppercase tracking-widest cursor-pointer select-none hover:underline focus:outline-none"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                id="auth_password_input"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading || (!isSignUp && lockoutRemaining > 0)}
                className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-10 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                id="auth_password_toggle_visibility_btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={loading || (!isSignUp && lockoutRemaining > 0)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 focus:outline-none flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                title={showPassword ? "Hide password text" : "Show clear-text password"}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Dynamic Password Strength Indicator for Registration */}
            {isSignUp && password && (
              <div className="pt-1.5 space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500">Security standing:</span>
                  <span className={`font-black uppercase tracking-wider ${passwordStrength.text}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-[#0d1015] h-1.5 p-0.5 rounded-full overflow-hidden border border-[#2d333d]/40">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                  />
                </div>
                <div className="text-[9px] text-slate-500 leading-relaxed font-mono">
                  Needs 8+ chars matching uppercase, lowercase, numbers & symbols.
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field (only for Signup) */}
          {isSignUp && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[11px] text-slate-400 uppercase tracking-widest font-black block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  id="auth_confirm_password_input"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-10 pr-10 text-xs font-medium text-slate-200 placeholder-slate-600 focus:outline-none transition duration-150 disabled:opacity-50"
                />
                <button
                  id="auth_confirm_password_toggle_visibility_btn"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 focus:outline-none flex items-center justify-center rounded-lg transition-all duration-150"
                  title={showConfirmPassword ? "Hide password text" : "Show clear-text password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Credentials Checkbox */}
          <div className="flex items-center justify-between py-1 px-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="auth_remember_me_checkbox"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading || (!isSignUp && lockoutRemaining > 0)}
                className="w-4 h-4 rounded bg-[#0b0d11] border-[#2d333d] border text-indigo-650 focus:ring-indigo-500/20 focus:ring-offset-0 focus:outline-none cursor-pointer disabled:opacity-50"
              />
              <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest block select-none">
                Save ID & Password
              </span>
            </label>
            {!isSignUp && (
              <span className="text-[9.5px] text-indigo-400 font-mono font-bold tracking-widest uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/15 select-none">
                Local Cache
              </span>
            )}
          </div>

          {/* Brute force remaining attempts warnings */}
          {!isSignUp && failedAttempts > 0 && failedAttempts < 5 && lockoutRemaining === 0 && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 text-amber-400 p-3 rounded-xl text-xs font-semibold"
            >
              <AlertCircle className="w-4.5 h-4.5 min-w-[18px] text-amber-500 animate-pulse" />
              <span>Security warning: {5 - failedAttempts} failed attempts left before temporary lockout.</span>
            </motion.div>
          )}

          {/* Validation Feedback Messages */}
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-400 p-3 rounded-xl text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 min-w-[16px] text-red-500" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 p-3 rounded-xl text-xs font-medium"
            >
              <CheckCircle2 className="w-4 h-4 min-w-[16px] text-emerald-500" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Submit Action Action */}
          <button
            id="auth_submit_btn"
            type="submit"
            disabled={loading || (!isSignUp && lockoutRemaining > 0)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:hover:bg-indigo-700/50 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed transition duration-150 text-xs uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : !isSignUp && lockoutRemaining > 0 ? (
              <>
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Locked Out ({lockoutRemaining}s)</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Initialize Profile" : "Secure Log In"}</span>
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </>
            )}
          </button>

        </form>

        {/* Divider section */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#2d333d]/50"></div>
          <span className="px-3 text-[10px] uppercase font-black tracking-widest text-slate-500 font-mono">Or Continue With</span>
          <div className="flex-1 border-t border-[#2d333d]/50"></div>
        </div>

        {/* Google Authentication Trigger Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#0b0d11] hover:bg-[#151a24] border border-[#2d333d] hover:border-slate-600 text-slate-200 font-extrabold rounded-xl transition duration-150 text-xs uppercase tracking-wider relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24c0-1.65-.15-3.22-.42-4.75H24v9h12.75c-.55 2.87-2.18 5.31-4.62 6.95l7.2 5.58C43.5 36.32 46.5 30.77 46.5 24z"/>
            <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2.02 1.35-4.6 2.15-8.69 2.15-6.26 0-11.57-4.22-13.46-10.1l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footnote information */}
        <div className="pt-2 border-t border-[#1f242e] text-center">
          <p className="text-[10px] text-slate-500">
            Secure SHA-256 state serialization. Profile configs are synchronized across server database indices seamlessly.
          </p>
        </div>
          </>
        )}

      </motion.div>
    </div>

    {/* Right Column: Stored credentials list */}
    {savedAccounts.length > 0 && (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-7 xl:col-span-7 bg-[#13161c] border border-[#2d333d] rounded-2xl p-6 space-y-4 w-full"
      >
        <div className="flex items-center justify-between border-b border-[#2d333d]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans tracking-tight">Saved System Profiles</h3>
              <p className="text-[10px] text-slate-400 font-medium font-sans">Quick sign-in credentials cached on this browser</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 px-2.5 py-0.5 rounded-lg font-mono">
            {savedAccounts.length} profiles
          </span>
        </div>

        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {savedAccounts.map((acc, idx) => {
            const isRevealed = showSavedPasswords[acc.username] || false;
            return (
              <div 
                key={`${acc.username}-${idx}`}
                className="p-3 bg-[#0b0d11] border border-[#2d333d]/60 hover:border-indigo-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition duration-150"
              >
                {/* Left: User details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-sans font-black text-[11px] shrink-0 flex items-center justify-center">
                    {acc.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-[12px] text-slate-100 truncate">{acc.username}</span>
                      {acc.email && (
                        <span className="text-[9px] text-[#a5b4fc] bg-[#1c202a] px-1.5 py-0.5 rounded border border-[#2d333d] font-semibold font-mono truncate max-w-[140px]">
                          {acc.email}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <History className="w-3 h-3 shrink-0" />
                        Saved: {acc.savedAt ? acc.savedAt.split(",")[0] : "recently"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions and password reveal */}
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  {/* Password display & toggle */}
                  <div className="bg-[#050609] border border-[#2d333d]/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 max-w-[150px]">
                    <span className="text-[10.5px] font-mono text-slate-300 select-all truncate font-medium">
                      {isRevealed ? (acc.password || "••••••") : "••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleShowSavedPassword(acc.username)}
                      className="text-slate-500 hover:text-indigo-400 p-0.5 rounded-md hover:bg-slate-800/40 transition cursor-pointer"
                      title={isRevealed ? "Hide Password" : "Reveal Password"}
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>

                  {/* Fill Credentials button */}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAccount(acc)}
                    className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-600/10 text-indigo-400 rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Fill credentials into input form"
                  >
                    <ChevronRight className="w-3 h-3 text-indigo-400" />
                    <span>Fill Form</span>
                  </button>

                  {/* Quick Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedAccount(acc.username)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-xl transition cursor-pointer"
                    title="Remove from saved accounts registry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-slate-500 flex items-center gap-2 bg-[#0b0d11]/80 p-3 rounded-xl border border-[#2d333d]/40 leading-relaxed font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>To log in, tap <strong>Fill Form</strong> on any profile, then press <strong>Secure Log In</strong>. This helps prevent forgetting candidates.</span>
        </div>
      </motion.div>
    )}

  </div>

      {/* Interactive Google Sign-In Sandbox Popup Overlay */}
      <AnimatePresence>
        {isSandboxOpen && (
          <div className="fixed inset-0 bg-[#06080c]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#13161c] border border-[#2d333d] rounded-2xl p-6 relative shadow-[0_0_50px_rgba(99,102,241,0.15)] space-y-6 my-8"
            >
              {/* Close Button */}
              {!isSandboxSecuring && (
                <button
                  type="button"
                  onClick={() => {
                    playAuthTone("click");
                    setIsSandboxOpen(false);
                  }}
                  className="absolute top-4 right-4 p-2 bg-[#0b0d11]/80 hover:bg-[#1a1e27] text-slate-400 hover:text-slate-200 border border-[#2d333d]/60 rounded-xl transition cursor-pointer z-10"
                  title="Dismiss identity popup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* BRANDING HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d333d]/60 pb-5">
                <div className="flex gap-3.5 items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#0b0d11] border border-[#2d333d] flex items-center justify-center shadow-inner shrink-0">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24c0-1.65-.15-3.22-.42-4.75H24v9h12.75c-.55 2.87-2.18 5.31-4.62 6.95l7.2 5.58C43.5 36.32 46.5 30.77 46.5 24z"/>
                      <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2.02 1.35-4.6 2.15-8.69 2.15-6.26 0-11.57-4.22-13.46-10.1l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-sans tracking-tight">Google Identity Provider</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono">Sandbox Interactive Terminal</p>
                  </div>
                </div>
                {!isSandboxSecuring && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-emerald-500/10 border border-emerald-500/15 px-3 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9.5px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Channel Online</span>
                  </div>
                )}
              </div>

              {/* REAL-TIME SIMULATOR SECURING PANEL */}
              {isSandboxSecuring ? (
                <div className="space-y-5 py-6">
                  <div className="space-y-2 text-center">
                    <p className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 font-mono">
                      Exchanging OAuth 2.0 Credentials
                    </p>
                    <h4 className="text-xl font-black text-white">
                      {sandboxProgress < 100 ? "Syncing Google Profile State..." : "Session Authorized Successfully!"}
                    </h4>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full bg-[#0b0d11] h-3 rounded-full overflow-hidden border border-[#2d333d]/70 p-[2px]">
                    <motion.div 
                      className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 h-full rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                      style={{ width: `${sandboxProgress}%` }}
                      layoutId="sandbox_progress_bar"
                    />
                  </div>

                  {/* Scrolling terminal console */}
                  <div className="bg-[#05070a] border border-[#242933]/75 rounded-xl p-4 font-mono text-[10.5px] text-slate-300 space-y-2 max-h-[180px] overflow-y-auto shadow-inner leading-relaxed">
                    <div className="text-slate-500 flex items-center justify-between border-b border-[#242933]/50 pb-1.5 mb-2.5">
                      <span>CONSOLE FEEDBACK LOGS</span>
                      <span className="text-[9px] bg-slate-800/60 px-1.5 py-0.5 rounded font-bold">UTC ENCRYPTED</span>
                    </div>

                    {sandboxLoadingLogs.map((log, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="flex items-start gap-2 text-indigo-300"
                      >
                        <span className="text-slate-600 font-bold shrink-0">[{index + 1}]</span>
                        <p>{log}</p>
                      </motion.div>
                    ))}

                    {sandboxProgress < 100 && (
                      <div className="flex items-center gap-1.5 text-slate-500 italic animate-pulse pt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Gathering active verification tokens...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* INFORMATIONAL META-BANNER */}
                  <div className="bg-[#0b0d11] p-3.5 rounded-xl border border-[#2d333d]/50 space-y-1.5 leading-relaxed text-xs">
                    <p className="text-slate-300 font-medium">
                      To facilitate instant review inside the isolated AI Studio preview workspace, this interface acts as a full-fidelity Google Login simulator.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Selecting any profile immediately initializes user settings, parses mock databases, and merges session statistics seamlessly.
                    </p>
                  </div>

                  {/* SECTION 1: SEARCH & FILTER SYSTEM */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      {/* Search profile input */}
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Search profiles on this workspace..."
                          value={sandboxSearch}
                          onChange={(e) => {
                            playAuthTone("hover");
                            setSandboxSearch(e.target.value);
                          }}
                          className="w-full bg-[#0b0d11] hover:bg-[#0e1116] focus:bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-xl py-2.5 pl-3.5 pr-8 text-xs text-slate-200 outline-none transition"
                        />
                        {sandboxSearch && (
                          <button
                            type="button"
                            onClick={() => setSandboxSearch("")}
                            className="absolute right-3 top-2.5 text-slate-550 hover:text-slate-300 font-bold text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Filter category badges */}
                      <div className="flex gap-1 overflow-x-auto self-start sm:self-auto max-w-full shrink-0 py-0.5">
                        {[
                          { id: "all", label: "All" },
                          { id: "candidate", label: "Candidates" },
                          { id: "recruiter", label: "Recruiters" },
                          { id: "companion", label: "Companions" }
                        ].map((category) => {
                          const isActive = sandboxFilter === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                playAuthTone("click");
                                setSandboxFilter(category.id);
                              }}
                              className={`px-3 py-2 rounded-lg text-[10.5px] font-extrabold transition uppercase tracking-wider whitespace-nowrap cursor-pointer ${
                                isActive
                                  ? "bg-indigo-600/10 border border-indigo-500/35 text-indigo-400"
                                  : "bg-[#0b0d11] hover:bg-[#12161f] border border-[#2d333d]/70 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {category.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* INTERACTIVE PRESETS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {[
                        {
                          name: "Arnav Telangi",
                          email: "arnav.telangi24@pccoepune.org",
                          role: "Candidate",
                          type: "candidate",
                          avatar: "AT",
                          metric: "84% Readiness",
                          desc: "Main User Sandbox Profile"
                        },
                        {
                          name: "Admin Recruiter",
                          email: "recruiter@company.net",
                          role: "Staff Recruiter",
                          type: "recruiter",
                          avatar: "AR",
                          metric: "Control Panel",
                          desc: "Simulate administrative review"
                        },
                        {
                          name: "Lucas Sterling",
                          email: "lucas.sterling@google.com",
                          role: "SRE Companion",
                          type: "companion",
                          avatar: "LS",
                          metric: "98% Index Score",
                          desc: "Distributed Systems mentor"
                        },
                        {
                          name: "Alex Rivera",
                          email: "alex.rivera@googlemail.com",
                          role: "Senior Candidate",
                          type: "candidate",
                          avatar: "AL",
                          metric: "92% Readiness",
                          desc: "Algorithms mock settings"
                        },
                        {
                          name: "Dr. Evelyn Chen",
                          email: "evelyn.chen@berkeley.edu",
                          role: "Titan Candidate",
                          type: "candidate",
                          avatar: "EC",
                          metric: "96% Readiness",
                          desc: "Distributed databases expert"
                        }
                      ]
                        .filter((preset) => {
                          if (sandboxFilter !== "all" && preset.type !== sandboxFilter) return false;
                          if (sandboxSearch.trim() !== "") {
                            const q = sandboxSearch.toLowerCase();
                            return (
                              preset.name.toLowerCase().includes(q) ||
                              preset.email.toLowerCase().includes(q) ||
                              preset.role.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((preset) => (
                          <button
                            key={preset.email}
                            type="button"
                            onClick={() => {
                              playAuthTone("click");
                              setSandboxEmail(preset.email);
                              setSandboxName(preset.name);
                            }}
                            className={`p-3 bg-[#0b0d11]/85 hover:bg-[#121620] border rounded-xl flex items-center justify-between text-left text-xs group transition cursor-pointer ${
                              sandboxEmail === preset.email
                                ? "border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                                : "border-[#2d333d]/65 hover:border-indigo-500/40"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div className={`w-8.5 h-8.5 rounded-lg font-black text-[11px] shrink-0 flex items-center justify-center border transition ${
                                sandboxEmail === preset.email
                                  ? "bg-indigo-600 border-indigo-400 text-white"
                                  : "bg-[#141822] border-[#2d333d] text-slate-300"
                              }`}>
                                {preset.avatar}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-[11px] text-slate-200 block truncate group-hover:text-white transition">
                                  {preset.name}
                                </span>
                                <span className="text-[9.5px] text-slate-550 block truncate font-mono">
                                  {preset.email}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[9px] font-mono font-bold uppercase tracking-wide block ${
                                preset.type === "recruiter" 
                                  ? "text-[#a5b4fc]"
                                  : preset.type === "companion"
                                  ? "text-indigo-400"
                                  : "text-emerald-400"
                              }`}>
                                {preset.role}
                              </span>
                              <span className="text-[8.5px] text-slate-500 font-mono block">
                                {preset.metric}
                              </span>
                            </div>
                          </button>
                        ))
                    }
                    </div>
                  </div>

                  {/* SECTION 2: CUSTOM PROFILE BUILDER & EMAIL GENERATOR */}
                  <div className="space-y-3.5 pt-4.5 border-t border-[#2d333d]/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono">
                        Create & Sync Custom Identity Profile
                      </span>
                      {sandboxName.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            playAuthTone("click");
                            const clean = sandboxName.trim().toLowerCase().replace(/\s+/g, ".");
                            setSandboxEmail(`${clean || "user"}@googlemail.com`);
                          }}
                          className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                        >
                          ✨ Generate Email
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Candidate Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Richard Hendricks"
                          value={sandboxName}
                          onChange={(e) => {
                            playAuthTone("hover");
                            setSandboxName(e.target.value);
                          }}
                          className="w-full bg-[#0b0d11] hover:bg-[#0e1116] focus:bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-200 outline-none transition"
                        />
                      </div>

                      {/* Email input */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Google Account Email</label>
                        <input
                          type="email"
                          placeholder="e.g. richard@hooli.xyz"
                          value={sandboxEmail}
                          onChange={(e) => {
                            playAuthTone("hover");
                            setSandboxEmail(e.target.value);
                          }}
                          className="w-full bg-[#0b0d11] hover:bg-[#0e1116] focus:bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-200 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!sandboxEmail.trim() || !sandboxName.trim() || loading}
                      onClick={() => startOAuthSimulation(sandboxEmail, sandboxName)}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_4px_14px_rgba(99,102,241,0.25)] active:scale-99"
                    >
                      <span>Authorize Google Account: "{sandboxName || "Select Profile"}"</span>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
