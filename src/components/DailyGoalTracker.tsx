import React, { useMemo } from "react";
import { Target, Plus, Minus, CheckCircle2, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HistoricalSession } from "../types";

interface DailyGoalTrackerProps {
  sessions: HistoricalSession[];
  dailyGoal: number;
  setDailyGoal: (val: number) => void;
  manualOffset: number;
  setManualOffset: (val: number) => void;
}

export default function DailyGoalTracker({
  sessions,
  dailyGoal,
  setDailyGoal,
  manualOffset,
  setManualOffset,
}: DailyGoalTrackerProps) {
  // Calculate completed exercises today from live technical rounds
  const completedToday = useMemo(() => {
    return sessions.reduce((acc, s) => {
      if (s.timestamp) {
        try {
          const d = new Date(s.timestamp);
          if (d.toDateString() === new Date().toDateString()) {
            return acc + (s.questionsCount || 1);
          }
        } catch (_) {}
      }
      return acc;
    }, 0);
  }, [sessions]);

  const totalCompleted = completedToday + manualOffset;
  const isGoalReached = totalCompleted >= dailyGoal;
  const completionPercent = Math.min(100, Math.round((totalCompleted / dailyGoal) * 100));

  const handleUpdateGoal = (nextGoal: number) => {
    const cleanGoal = Math.max(1, Math.min(30, nextGoal));
    setDailyGoal(cleanGoal);
    localStorage.setItem("prepai_daily_goal_target", String(cleanGoal));
  };

  const handleAddManualOffset = () => {
    const nextOffset = manualOffset + 1;
    setManualOffset(nextOffset);
    localStorage.setItem("prepai_manual_questions", JSON.stringify({
      date: new Date().toDateString(),
      count: nextOffset,
    }));
  };

  const handleResetManualOffset = () => {
    setManualOffset(0);
    localStorage.removeItem("prepai_manual_questions");
  };

  // Preset options for quick calibration
  const PRESETS = [2, 5, 8, 12, 15];

  return (
    <div className="bg-[#171b22]/70 rounded-2xl border border-[#2d333d]/90 backdrop-blur-sm p-6 space-y-6 select-none relative overflow-hidden group">
      {/* Absolute faint background glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-500 ${isGoalReached ? "bg-emerald-500" : "bg-indigo-500"}`} />

      {/* Header section with icons & summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${
            isGoalReached 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-450" 
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }`}>
            <Target className={`w-5 h-5 ${isGoalReached ? "animate-bounce" : ""}`} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1.5 leading-none">
              Daily Target Core Calibration
              {isGoalReached && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-550/20 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Perfect Standing
                </span>
              )}
            </h3>
            <p className="text-slate-400 text-xs mt-1 leading-normal max-w-xl">
              Establish healthy study habits by selecting your desired questions target. Combine interview simulation tests with self-study logs to track dynamic advancement.
            </p>
          </div>
        </div>

        {/* Live percentage ticker */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Metrics:</span>
          <div className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
            isGoalReached 
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
              : "bg-indigo-500/10 border-indigo-550/20 text-indigo-300"
          }`}>
            {completionPercent}% Accomplished
          </div>
        </div>
      </div>

      {/* Progress tracking section with deep visual styling */}
      <div className="bg-[#13161c]/60 p-5 rounded-2xl border border-[#2d333d]/60 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Progress Vector</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black ${isGoalReached ? "text-emerald-400" : "text-white"}`}>{totalCompleted}</span>
            <span className="text-slate-500 text-sm">/</span>
            <span className="text-base font-bold text-indigo-400">{dailyGoal} drills solved</span>
          </div>
        </div>

        {/* Visual Progress Bar with modern look */}
        <div className="w-full bg-[#0d1015] h-4.5 p-0.5 rounded-full overflow-hidden border border-[#2d333d]/40 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            className={`h-full rounded-full relative transition-colors duration-500 ${
              isGoalReached
                ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            }`}
          >
            {/* Fine white specular highlight overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full" />
          </motion.div>
        </div>

        {/* Celebratory caption or progress indicator */}
        <div className="text-xs">
          {isGoalReached ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold animate-pulse">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Target Achieved! Daily calibration metrics unlocked • Your streaks are secured.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 font-medium font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Need {Math.max(1, dailyGoal - totalCompleted)} more question{Math.max(1, dailyGoal - totalCompleted) !== 1 ? "s" : ""} to satisfy daily standing checklist.</span>
            </div>
          )}
        </div>
      </div>

      {/* Control sliders and presets grids (Two Column responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Goal calibration settings */}
        <div className="lg:col-span-4 bg-[#13161c]/30 hover:bg-[#13161c]/50 transition-colors p-4 rounded-xl border border-[#2d333d]/40 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Configure Target Goal</span>
            <span className="text-[9px] text-[#526071] font-mono">Limit 30 max</span>
          </div>

          <div className="flex items-center justify-between bg-[#13161c]/70 p-1 px-2 rounded-lg border border-[#2d333d]/50">
            <button
              onClick={() => handleUpdateGoal(dailyGoal - 1)}
              disabled={dailyGoal <= 1}
              className="p-1.5 px-3 bg-[#171b22] border border-[#2d333d]/80 hover:border-slate-500 text-slate-300 rounded-md text-xs font-black transition-all hover:bg-[#1c212a] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              title="Decrement Daily Goal"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-black text-white font-mono">{dailyGoal} drills</span>
            <button
              onClick={() => handleUpdateGoal(dailyGoal + 1)}
              disabled={dailyGoal >= 30}
              className="p-1.5 px-3 bg-[#171b22] border border-[#2d333d]/80 hover:border-slate-500 text-slate-300 rounded-md text-xs font-black transition-all hover:bg-[#1c212a] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              title="Increment Daily Goal"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Presets layout */}
        <div className="lg:col-span-5 bg-[#13161c]/30 hover:bg-[#13161c]/50 transition-colors p-4 rounded-xl border border-[#2d333d]/40 space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Standard Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const activePreset = dailyGoal === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleUpdateGoal(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    activePreset 
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/10 scale-105" 
                      : "bg-[#171b22] border-[#2d333d]/80 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                  }`}
                >
                  {p} Drills {p === 5 ? "⭐" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Study actions (Log/Reset Offset) */}
        <div className="lg:col-span-3 bg-[#13161c]/35 hover:bg-[#13161c]/50 transition-colors p-4 rounded-xl border border-[#2d333d]/40 flex flex-col justify-between gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Log Offline Self-Study</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddManualOffset}
              className="flex-1 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Add manual practice log for today"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Drills</span>
            </button>
            {manualOffset > 0 && (
              <button
                onClick={handleResetManualOffset}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/15 text-xs font-bold rounded-lg transition-all cursor-pointer"
                title="Clears logged exercises"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
