import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  RefreshCw, 
  LogOut, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send, 
  Inbox, 
  ArrowRight, 
  Loader2 
} from "lucide-react";

interface VerificationPendingScreenProps {
  currentUser: {
    username: string;
    email: string;
    isVerified?: boolean;
    verificationToken?: string;
  };
  authToken: string | null;
  onVerifiedSuccess: (updatedUser: any) => void;
  onLogout: () => void;
}

export default function VerificationPendingScreen({
  currentUser,
  authToken,
  onVerifiedSuccess,
  onLogout
}: VerificationPendingScreenProps) {
  const [token, setToken] = useState(currentUser.verificationToken || "");
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  
  // Console logs simulation for local spool agent
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM] Initializing email verification spool client...",
    `[INFO] Target: ${currentUser.email} (${currentUser.username})`,
  ]);

  // Append logs helpers
  const log = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Simulate outbound SMTP routing logs on mount and when token changes
  useEffect(() => {
    if (!token) return;
    
    const messages = [
      `[SMTP] Establishing handshake connection to mail.prep.ai spool...`,
      `[SMTP] HELO prep-ai-spool-server-1a.local`,
      `[SMTP] MAIL FROM: <no-reply@mg.prep.ai>`,
      `[SMTP] RCPT TO: <${currentUser.email}>`,
      `[SMTP] Generating secure 128-bit verification envelope token: ${token.substring(0, 8)}...`,
      `[SMTP] Header DKIM signature verified successfully.`,
      `[SMTP] Message packet queued in outbound mail spool.`,
      `[SYSTEM] Real-time mail intercept: Local sandbox captured outbound link successfully...`
    ];

    let timerSum = 100;
    messages.forEach((msg, idx) => {
      setTimeout(() => {
        log(msg);
      }, timerSum);
      timerSum += 250 + Math.random() * 200;
    });
  }, [token]);

  // Check verification status from backend
  const checkStatus = async (showNotification = false) => {
    setIsChecking(true);
    log(`[POLL] Initializing remote verification query target validation...`);
    
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.isVerified) {
          log(`[SUCCESS] Account verified! Credentials set to TRUE! Elevating permissions...`);
          if (showNotification) {
            setResendSuccess("Your email address is successfully verified! Booting Career Operating System...");
          }
          setTimeout(() => {
            onVerifiedSuccess(data.user);
          }, 1200);
        } else {
          log(`[POLL] Verification pending. Account status is still UNVERIFIED.`);
          if (showNotification) {
            setResendError("Verification still pending. Please ensure you clicked the link in the simulated email below.");
            setTimeout(() => setResendError(null), 4000);
          }
        }
      } else {
        log(`[ERROR] Remote endpoint query yielded response error code: ${response.status}`);
      }
    } catch (err: any) {
      log(`[ERROR] Connection failed: ${err.message || "Network exception"}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-poll status periodically every 4 seconds to provide responsive transition
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus(false);
    }, 4500);
    return () => clearInterval(interval);
  }, [authToken]);

  // Resend Verification Email
  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendSuccess(null);
    setResendError(null);
    log(`[ACTION] User triggered verification resend request. Initializing mail generator...`);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        if (data.verificationToken) {
          setToken(data.verificationToken);
        }
        setResendSuccess("A new secure verification email has been transmission routed successfully!");
        log(`[SUCCESS] Regenerated security envelope. Outbox spool updated!`);
      } else {
        setResendError(data.error || "Failed to resend. Please try again.");
        log(`[ERROR] Server refused resend: ${data.error}`);
      }
    } catch (err: any) {
      setResendError("Network error resetting security payload. Please check connections.");
      log(`[EXCEPTION] Mail dispatch failure: ${err.message}`);
    } finally {
      setIsResending(false);
    }
  };

  const verificationUrl = `${window.location.origin}/api/auth/verify?token=${token}`;

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      
      {/* Left Columns - Spool Notification Area */}
      <div className="md:col-span-7">
        
        {/* Banner Headers */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#13161c] border border-[#2d333d] rounded-2xl p-6 md:p-8 space-y-5 shadow-xl relative overflow-hidden"
        >
          {/* Subtle light background element */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full" />
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 animate-pulse">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Verify Your Account <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">Security Lock</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                We sent a secure verification link to <span className="font-semibold text-slate-200">{currentUser.email}</span>. Click the link to complete authentication and start practicing.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {resendSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 min-w-[18px]" />
                <span>{resendSuccess}</span>
              </motion.div>
            )}

            {resendError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 border border-rose-500/20 bg-rose-500/5 text-rose-400 p-3.5 rounded-xl text-xs font-semibold"
              >
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 min-w-[18px]" />
                <span>{resendError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => checkStatus(true)}
              id="verify_check_status_btn"
              disabled={isChecking}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition duration-150 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-200" />
                  <span>I've Verified (Check Status)</span>
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              id="verify_resend_email_btn"
              disabled={isResending}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b0d11] hover:bg-[#161a22] text-slate-300 border border-[#2d333d] hover:border-slate-500 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Resending spool...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-400" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>

            <button
              onClick={onLogout}
              id="verify_logout_btn"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-rose-500/5 text-rose-400 border border-transparent hover:border-rose-500/15 rounded-xl text-xs font-bold transition duration-150 cursor-pointer ml-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Change Account</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* Right Column - Premium Sandbox Mail Client simulator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="md:col-span-5 bg-[#13161c] border border-[#2d333d] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Mail client Header */}
        <div className="bg-[#1a1f26] px-5 py-3.5 border-b border-[#2d333d] flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider leading-none">
              Mailbox Simulator
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-none">
              Intercepted Outbound Delivery Queue
            </p>
          </div>
        </div>

        {/* Mail envelope container mock */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-5 bg-[#0e1115]/30">
          
          <div className="space-y-4">
            {/* Headers */}
            <div className="bg-[#0b0d11] border border-[#232933] rounded-xl p-3 space-y-2.5 font-mono text-[10.5px]">
              <div className="flex border-b border-[#232933]/50 pb-1.5">
                <span className="text-slate-500 w-12 select-none font-bold">FROM:</span>
                <span className="text-indigo-400">no-reply@mg.prep.ai</span>
              </div>
              <div className="flex border-b border-[#232933]/50 pb-1.5">
                <span className="text-slate-500 w-12 select-none font-bold">TO:</span>
                <span className="text-slate-300 font-semibold">{currentUser.email}</span>
              </div>
              <div className="flex">
                <span className="text-slate-500 w-12 select-none font-bold">SUBJ:</span>
                <span className="text-slate-200 font-bold">🔐 Action Required: Verify prep.ai Credentials</span>
              </div>
            </div>

            {/* Simulated Email Body content */}
            <div className="bg-white text-slate-800 rounded-xl p-5 border border-slate-200 space-y-4 shadow-inner relative">
              <div className="absolute right-3 top-3 select-none flex items-center gap-1 bg-indigo-50 text-[9px] text-[#4f46e5] font-bold py-0.5 px-1.5 rounded-full border border-indigo-100">
                <Sparkles className="w-2.5 h-2.5" />
                <span>sandbox spool</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center text-white text-[9px]">P</div>
                  <span>prep.ai security</span>
                </div>
                <div className="w-12 h-1 bg-indigo-500 rounded mt-1.5" />
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed font-sans">
                <p className="font-semibold text-slate-800">Hello {currentUser.username},</p>
                <p>
                  To activate your prep.ai developer portal and bypass brute-force and spam lockguards, you must verify your electronic mail address ownership claims.
                </p>
                <p>
                  Please perform verification by executing the following action command:
                </p>
              </div>

              {/* Real working link mapped inside fake mail panel */}
              <div className="pt-2 text-center">
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noreferrer"
                  id="sandbox_verify_verification_link"
                  className="inline-flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition duration-150 shadow-md shadow-indigo-600/15"
                >
                  <span>Verify Security Credentials</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-[9.5px] text-slate-400 border-t border-slate-100 pt-3 flex flex-col space-y-1">
                <div>This security link expires in 24 hours.</div>
                <div className="truncate font-mono bg-slate-50 p-1 px-1.5 rounded text-[8px] text-slate-500">
                  {verificationUrl}
                </div>
              </div>
            </div>
          </div>

          {/* Guide helper banner */}
          <div className="flex items-start gap-2 bg-[#1b1f24] border border-indigo-500/15 p-3 rounded-xl text-[10.5px] text-slate-400">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400 min-w-[16px] mt-0.5 animate-pulse" />
            <span>
              <strong className="text-slate-300">How to verify:</strong> Open the link inside the inbox client. Our backend database will be securely updated, and your dashboard active state released instantly.
            </span>
          </div>

        </div>
      </motion.div>

    </div>
  );
}
