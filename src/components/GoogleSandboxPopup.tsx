import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, Mail, User, Sparkles } from "lucide-react";

export default function GoogleSandboxPopup() {
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  const presets = [
    {
      name: "Arnav Telangi",
      email: "arnav.telangi24@pccoepune.org",
      role: "Candidate",
      avatar: "AT",
      desc: "Main User Sandbox Profile"
    },
    {
      name: "Admin Recruiter",
      email: "recruiter@company.net",
      role: "Staff Recruiter",
      avatar: "AR",
      desc: "Simulate administrative review"
    },
    {
      name: "Lucas Sterling",
      email: "lucas.sterling@google.com",
      role: "SRE Companion",
      avatar: "LS",
      desc: "Distributed Systems mentor"
    },
    {
      name: "Alex Rivera",
      email: "alex.rivera@googlemail.com",
      role: "Senior Candidate",
      avatar: "AL",
      desc: "Algorithms mock settings"
    }
  ];

  const handleSelect = (email: string, name: string) => {
    setSelectedEmail(email);
    setSelectedName(name);
    setLoading(true);
  };

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Complete and send message to opener window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "GOOGLE_SANDBOX_SUCCESS",
                email: selectedEmail,
                name: selectedName
              },
              window.location.origin
            );
            setTimeout(() => {
              window.close();
            }, 300);
          } else {
            // Fallback if opened outside a popup
            alert("Success! You can now close this window.");
          }
          return 100;
        }
        return prev + 20;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [loading, selectedEmail, selectedName]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim() && customName.trim()) {
      handleSelect(customEmail.trim(), customName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-indigo-505/30">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#13161c] border border-[#2d333d] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Real-time simulation loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            {/* Google-like colorful loading rings */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 absolute" />
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-red-500 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">Signing in with Google</h3>
              <p className="text-xs text-slate-400 font-mono tracking-tight max-w-xs mx-auto">
                {progress < 40 && "🔒 Establishing secure Identity Handshake..."}
                {progress >= 40 && progress < 80 && "📡 Synchronizing profile metadata with server indices..."}
                {progress >= 80 && "✨ Authenticating session token..."}
              </p>
            </div>

            {/* Custom styled progress indicator bar */}
            <div className="w-full max-w-xs bg-[#0b0d11] h-2.5 p-[2px] rounded-full overflow-hidden border border-[#2d333d]">
              <div 
                className="bg-indigo-550 h-full rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* GOOGLE HEADER */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-1.5 justify-center">
                <svg className="w-7 h-7" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24c0-1.65-.15-3.22-.42-4.75H24v9h12.75c-.55 2.87-2.18 5.31-4.62 6.95l7.2 5.58C43.5 36.32 46.5 30.77 46.5 24z"/>
                  <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2.02 1.35-4.6 2.15-8.69 2.15-6.26 0-11.57-4.22-13.46-10.1l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span className="text-lg font-semibold tracking-tight text-white select-none">Google Accounts</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">Sign in with Google</h2>
                <p className="text-xs text-slate-400">
                  Choose an authorized sandbox profile to continue to prep.ai
                </p>
              </div>
            </div>

            {/* PRESETS LIST */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {presets.map((preset) => (
                <button
                  key={preset.email}
                  type="button"
                  onClick={() => handleSelect(preset.email, preset.name)}
                  className="w-full p-3 bg-[#0b0d11]/80 hover:bg-[#151923] border border-[#2d333d]/70 hover:border-indigo-500/40 rounded-xl flex items-center justify-between text-left text-xs transition duration-150 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8.5 h-8.5 rounded-lg bg-indigo-600 border border-indigo-400 text-white font-black text-[11px] shrink-0 flex items-center justify-center transition group-hover:scale-105">
                      {preset.avatar}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-[12.5px] text-slate-200 block truncate group-hover:text-white transition">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate font-mono">
                        {preset.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9.5px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded uppercase tracking-wider block">
                      {preset.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* DIVIDER */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-[#2d333d]/50"></div>
              <span className="px-3 text-[10px] uppercase font-black tracking-widest text-[#4b5563] font-mono">Or Use Custom Identity</span>
              <div className="flex-1 border-t border-[#2d333d]/50"></div>
            </div>

            {/* CUSTOM IDENTITY FORM */}
            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-[#0b0d11] hover:bg-[#0e1116] focus:bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-200 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Google Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="email"
                      placeholder="jane@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full bg-[#0b0d11] hover:bg-[#0e1116] focus:bg-[#0b0d11] border border-[#2d333d] focus:border-indigo-500 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-200 outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!customName.trim() || !customEmail.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
              >
                <span>Authorize Custom Google Account</span>
                <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              </button>
            </form>

            {/* SECURE SUBTEXT */}
            <div className="pt-2.5 border-t border-[#1f242e] flex items-center justify-center gap-1.5 text-slate-500 text-[10px] select-none text-center leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Isolated preview sandbox context. Full SHA-256 local token binding active.
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
