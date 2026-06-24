import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Database, RefreshCw } from "lucide-react";

export interface ToastItem {
  id: string;
  title: string;
  description: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number; // In milliseconds, default of 4000
}

interface ToastProps {
  key?: string;
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, title, description, type, duration = 4000 } = toast;

  // Automatically dismiss the toast when the timer expires
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  // Determine Icon based on title/description context and type
  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();

    if (lowerTitle.includes("export") || lowerDesc.includes("export") || lowerDesc.includes("backup")) {
      return <Database className="w-5 h-5 text-emerald-400 shrink-0" />;
    }
    if (lowerTitle.includes("node") || lowerDesc.includes("node") || lowerDesc.includes("system")) {
      return <RefreshCw className="w-5 h-5 text-violet-400 shrink-0" />;
    }

    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
    }
  };

  // Border and Shadow Glow colors matching the types
  const getThemeClasses = () => {
    switch (type) {
      case "success":
        return {
          border: "border-emerald-500/30",
          bg: "bg-[#10141d]/95",
          glow: "shadow-[0_8px_30px_rgb(16,185,129,0.06)]",
          barColor: "bg-emerald-500",
        };
      case "warning":
        return {
          border: "border-amber-500/30",
          bg: "bg-[#151310]/95",
          glow: "shadow-[0_8px_30px_rgb(245,158,11,0.06)]",
          barColor: "bg-amber-500",
        };
      case "error":
        return {
          border: "border-rose-500/30",
          bg: "bg-[#181113]/95",
          glow: "shadow-[0_8px_30px_rgb(244,63,94,0.06)]",
          barColor: "bg-rose-500",
        };
      default:
        return {
          border: "border-indigo-500/30",
          bg: "bg-[#12131a]/95",
          glow: "shadow-[0_8px_30px_rgb(99,102,241,0.06)]",
          barColor: "bg-indigo-500",
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.93, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -15, scale: 0.95, filter: "blur(2px)" }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={`relative w-80 sm:w-96 rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} p-4 flex gap-3.5 backdrop-blur-md overflow-hidden`}
    >
      {/* Icon Area */}
      <div className="flex items-start">
        <div className="p-1.5 rounded-xl bg-slate-950/40 border border-[#2d333d]/50 flex items-center justify-center">
          {getIcon()}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-0.5 pr-2">
        <h4 className="text-[11.5px] font-black text-slate-100 tracking-tight leading-snug">
          {title}
        </h4>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {/* Close Action */}
      <div className="flex items-start">
        <button
          onClick={() => onDismiss(id)}
          className="text-slate-500 hover:text-slate-200 transition p-1 hover:bg-slate-800/40 rounded-lg"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* God level feedback: Dynamic progress countdown line */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${theme.barColor}/70`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-full pointer-events-none px-4 sm:px-0">
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
