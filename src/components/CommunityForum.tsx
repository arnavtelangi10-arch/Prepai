import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  ThumbsUp, 
  Tag, 
  Clock, 
  User, 
  Globe, 
  Building2, 
  X, 
  Send, 
  ChevronRight, 
  Sparkles,
  HelpCircle,
  FileCode2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author: string;
  category: "technical" | "company" | "general";
  categoryExtra: string;
  upvotes: string[];
  replies: Reply[];
  timestamp: string;
}

interface CommunityForumProps {
  currentUsername: string;
}

export default function CommunityForum({ currentUsername }: CommunityForumProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "technical" | "company" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  
  // Create thread form fields
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<"technical" | "company" | "general">("technical");
  const [newCategoryExtra, setNewCategoryExtra] = useState("");
  
  // Reply form field
  const [replyInput, setReplyInput] = useState("");
  
  // Status and feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forum/threads");
      const data = await res.json();
      if (data.threads) {
        setThreads(data.threads);
        // Sync activeThread if it is open
        if (activeThread) {
          const updated = data.threads.find((t: Thread) => t.id === activeThread.id);
          if (updated) setActiveThread(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load forum threads:", err);
      setErrorMessage("Could not sync with the forum database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setErrorMessage("Please complete the title & description fields.");
      return;
    }
    setErrorMessage("");
    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          author: currentUsername || "Anonymous Candidate",
          category: newCategory,
          categoryExtra: newCategoryExtra.trim() || getDefaultExtra(newCategory)
        })
      });
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        setIsCreatingThread(false);
        setNewTitle("");
        setNewContent("");
        setNewCategoryExtra("");
        triggerToast("Thread created successfully! Community notified.");
      } else {
        setErrorMessage(data.error || "Failed to create thread.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to deploy thread. Try again.");
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeThread) return;
    try {
      const res = await fetch(`/api/forum/threads/${activeThread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: currentUsername || "Anonymised Coder",
          content: replyInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        setActiveThread(data.thread);
        setReplyInput("");
        triggerToast("Comment reply synchronized successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUpvote = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening the thread card
    try {
      const res = await fetch(`/api/forum/threads/${threadId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUsername || "Anonymous Candidate"
        })
      });
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        if (activeThread && activeThread.id === threadId) {
          setActiveThread(data.thread);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDefaultExtra = (cat: "technical" | "company" | "general") => {
    if (cat === "technical") return "Algorithms & Systems";
    if (cat === "company") return "FAANG Prep";
    return "General Discussion";
  };

  const getCategoryIcon = (cat: "technical" | "company" | "general") => {
    switch (cat) {
      case "technical": return <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "company": return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
      case "general": return <HelpCircle className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const filteredThreads = threads.filter(t => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === "" || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryExtra.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-55 flex items-center gap-3 bg-indigo-950 border-2 border-indigo-400 px-4 py-3 rounded-xl shadow-2xl text-xs text-slate-100 font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Call to Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13161c]/30 p-6 border border-[#2d333d]/40 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Forum & Lounge</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Live Sync
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">PrepAI Community Board</h1>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Discuss interview tactics, compare distributed database layouts, trace algorithmic complexities, and coordinate solutions with peers and mentors.
          </p>
        </div>

        <button 
          onClick={() => {
            setIsCreatingThread(true);
            setErrorMessage("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-400/30 hover:border-indigo-400/50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer self-stretch md:self-auto justify-center shadow-lg shadow-indigo-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Thread</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Filter menu & Search */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#13161c]/60 p-4 border border-[#2d333d]/70 rounded-xl space-y-4">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">Index Pipeline Navigation</span>
            
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Query threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 placeholder-opacity-70 focus:outline-none"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-col gap-1.5">
              {[
                { id: "all", label: "🌍 All Discussions" },
                { id: "technical", label: "💻 Technical Domains" },
                { id: "company", label: "🏢 Target Company Type" },
                { id: "general", label: "💬 General Lounge" }
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id as any);
                      setActiveThread(null); // close expanded details
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer select-none font-bold ${
                      isActive 
                        ? "bg-indigo-950/60 text-indigo-400 border border-indigo-500/30" 
                        : "text-slate-400 hover:bg-[#1c212b]/40 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/20 p-4 border border-indigo-500/10 rounded-xl space-y-2">
            <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono block">Forum Protocol Checklist</span>
            <ul className="text-[10px] text-slate-400 space-y-1.5 leading-normal">
              <li>• Share real problems, pseudocode, and system design flows.</li>
              <li>• Do not post copyrighted company NDA interview questions.</li>
              <li>• Upvote high-quality code and thorough explanations.</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Threads list or Expanded Thread view */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Create thread modal/block */}
          <AnimatePresence>
            {isCreatingThread && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#13161c]/80 border-2 border-indigo-500/20 rounded-xl overflow-hidden shadow-2xl"
              >
                <form onSubmit={handleCreateThread} className="p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-[#2d333d]/50 pb-3">
                    <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider font-mono">Assemble New Community Thread</span>
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingThread(false)}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-900/40 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Thread Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Designing real-time feed updates with DynamoDB stream limits..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Forum Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="technical">💻 Technical Domains</option>
                        <option value="company">🏢 Company Types</option>
                        <option value="general">💬 General discussions</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Subcategory Label (e.g. AWS, LeetCode, Meta)</label>
                      <input
                        type="text"
                        placeholder="e.g., System Design, Google Coding, Career advice"
                        value={newCategoryExtra}
                        onChange={(e) => setNewCategoryExtra(e.target.value)}
                        className="w-full p-2.5 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <span className="text-[9px] text-slate-500 mt-1 leading-normal">
                        Your post will be submitted from account <strong>{currentUsername || "Arnav Telangi"}</strong>. Feel free to use architectural markdown structures inside.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Core Post Content & Question Detail</label>
                    <textarea
                      rows={5}
                      placeholder="Give as much technical precision, system parameters, or conceptual constraints as possible. We encourage code blocks and concrete scenarios!"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full p-3 bg-[#0e1117] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingThread(false)}
                      className="px-4 py-2 bg-[#1b202a] border border-[#2d333d] text-slate-350 hover:text-white rounded-lg cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer transition uppercase text-[10px] tracking-widest font-mono"
                    >
                      Deploy Thread
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Layout: List of Threads OR Expanded Thread details */}
          {activeThread ? (
            /* EXPANDED THREAD VIEW */
            <div className="space-y-4">
              <button
                onClick={() => setActiveThread(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-905 bg-slate-900 border border-[#2d333d] text-slate-400 hover:text-slate-100 text-[10px] rounded-lg transition uppercase tracking-wider font-extrabold font-mono cursor-pointer"
              >
                ← Back to Index
              </button>

              <div className="bg-[#13161c]/60 border border-[#2d333d]/70 rounded-2xl overflow-hidden p-6 space-y-6">
                
                {/* Thread Body Container */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-slate-400">
                      {getCategoryIcon(activeThread.category)}
                      <span className="capitalize">{activeThread.category} Discussion</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <span className="bg-[#2a1b40]/55 text-indigo-400 border border-indigo-500/15 px-2 py-0.5 rounded uppercase font-bold">
                      {activeThread.categoryExtra}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {activeThread.author}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-450 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(activeThread.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-extrabold text-white leading-tight">
                    {activeThread.title}
                  </h2>

                  <p className="text-slate-300 text-xs md:text-[13px] leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-4 border border-[#2d333d]/50 rounded-xl font-sans">
                    {activeThread.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#2d333d]/50">
                    <button
                      onClick={(e) => handleToggleUpvote(activeThread.id, e)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                        activeThread.upvotes?.includes(currentUsername)
                          ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/40"
                          : "bg-slate-900 text-slate-400 border-[#2d333d] hover:text-white"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="font-bold">Upvoted ({activeThread.upvotes?.length || 0})</span>
                    </button>

                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-black">
                      Index ID: #{activeThread.id}
                    </span>
                  </div>
                </div>

                {/* Replies section */}
                <div className="space-y-4 border-t border-[#2d333d]/60 pt-6">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Responses ({activeThread.replies?.length || 0})</span>
                  </h3>

                  <div className="space-y-3.5">
                    {activeThread.replies && activeThread.replies.length > 0 ? (
                      activeThread.replies.map((reply) => (
                        <div key={reply.id} className="bg-slate-900/40 border border-[#2d333d]/50 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-black text-indigo-400 flex items-center gap-1.5 uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {reply.author}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-600" />
                              {new Date(reply.timestamp).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[12px] leading-relaxed font-sans whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-900/20 border border-dashed border-[#2d333d]/60 py-8 px-4 text-center rounded-xl">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto opacity-50 mb-2" />
                        <p className="text-slate-500 text-xs">No responses yet on this node thread. Be the first to coordinate!</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handlePostReply} className="flex gap-2.5 pt-4 border-t border-[#2d333d]/30">
                    <input
                      type="text"
                      placeholder="Contribute your architectural review or technical insight..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      className="flex-1 px-4 py-3 bg-[#0d1017] border border-[#2d333d] focus:border-indigo-500 rounded-xl text-xs text-slate-200 focus:outline-none placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyInput.trim()}
                      className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* THREADS LISTING */
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-[#13161c]/30 py-16 text-center border border-[#2d333d]/40 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-450 text-xs font-mono uppercase tracking-widest">Traversing forum registers...</p>
                </div>
              ) : filteredThreads.length > 0 ? (
                filteredThreads.map((thread) => {
                  const hasUpvoted = thread.upvotes?.includes(currentUsername);
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThread(thread)}
                      className="bg-[#13161c]/40 hover:bg-[#181d26]/50 border border-[#2d333d]/50 hover:border-[#2d333d] p-5 rounded-2xl transition duration-150 cursor-pointer flex flex-col sm:flex-row justify-between items-start gap-4"
                    >
                      <div className="space-y-3.5 flex-1 w-full">
                        {/* Tags block */}
                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
                          <span className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider">
                            {getCategoryIcon(thread.category)}
                            <span>{thread.category}</span>
                          </span>
                          <span className="text-slate-700">•</span>
                          <span className="bg-[#24173d]/50 text-indigo-400 border border-indigo-500/10 px-2.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {thread.categoryExtra}
                          </span>
                          <span className="text-slate-700">•</span>
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5 text-slate-500" />
                            {thread.author}
                          </span>
                        </div>

                        {/* Title & snippet */}
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-black text-white hover:text-indigo-400 transition leading-snug">
                            {thread.title}
                          </h3>
                          <p className="text-slate-450 text-xs line-clamp-2 leading-relaxed">
                            {thread.content}
                          </p>
                        </div>

                        {/* Metrics bar */}
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <strong>{thread.replies?.length || 0}</strong> replies
                          </span>
                          
                          <span>•</span>
                          
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(thread.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Vote & interactive indicator */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 self-stretch sm:self-auto border-t sm:border-t-0 border-[#2d333d]/40 pt-3 sm:pt-0">
                        <button
                          onClick={(e) => handleToggleUpvote(thread.id, e)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono transition select-none cursor-pointer ${
                            hasUpvoted
                              ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/30"
                              : "bg-slate-950/60 hover:bg-slate-900 border-[#2d333d] text-slate-500 hover:text-slate-200"
                          }`}
                          title={hasUpvoted ? "Remove upvote" : "Upvote helpful content"}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{thread.upvotes?.length || 0}</span>
                        </button>

                        <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block self-center" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-[#13161c]/20 py-16 text-center border border-dashed border-[#2d333d]/60 rounded-2xl space-y-3">
                  <Globe className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-slate-450 text-xs">No active threads resolve for this query tag.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="text-xs text-indigo-400 border border-indigo-500/20 hover:border-indigo-505 bg-indigo-950/20 px-3.5 py-1.5 rounded-xl font-bold transition"
                  >
                    Reset Query Pipeline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
