import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  UserCheck, 
  Code, 
  Terminal, 
  Layers, 
  Database, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Send, 
  Award, 
  Sparkles, 
  LogOut, 
  ChevronRight, 
  Share2, 
  BookOpen, 
  HelpCircle,
  Clock,
  ThumbsUp,
  Cpu,
  CheckCircle,
  FileCheck,
  Calendar,
  Check,
  Link,
  Video,
  Mic,
  Square
} from "lucide-react";
import AudioPlayerWidget from "./AudioPlayerWidget";

interface CoPracticeRoomProps {
  currentUsername: string;
}

const MODULE_PALETTE = [
  { type: "LB", name: "Load Balancer" },
  { type: "CDN", name: "CDN / Edge Cache" },
  { type: "GW", name: "API Gateway" },
  { type: "WS", name: "Web App Server" },
  { type: "CACHE", name: "Redis Cache Store" },
  { type: "SQL", name: "PostgreSQL Database" },
  { type: "MQ", name: "Kafka Event Broker" },
];

const PRESET_ROOMS = [
  { id: "google_algo_room", name: "Google DS & Hard Algorithms", target: "Google", desc: "For practicing high-complexity, LeetCode Hard graph and dynamic programming challenges." },
  { id: "amazon_system_room", name: "Amazon High-Scale Architecture", target: "Amazon", desc: "Focused on global database replication, DynamoDB checks, and Leadership Principles." },
  { id: "microsoft_dev_room", name: "Microsoft Systems & Multi-Threading", target: "Microsoft", desc: "For practicing clean concurrency, concurrency handlings, and CPU task scheduling." },
];

const COMPANY_QUESTIONS: Record<string, any[]> = {
  Google: [
    {
      id: "g1",
      title: "Longest Increasing Path in a 2D Matrix",
      question: "Given a 2D grid matrix of size M x N, find the length of the longest path where each step increases strictly. You can move up, down, left, dynamic right. Optimize for O(MN) using DFS + Memoization.",
      type: "coding",
      codeStub: `/**\n * @param {number[][]} matrix\n * @return {number}\n */\nfunction longestIncreasingPath(matrix) {\n  // Write your code here\n  return 0;\n}`,
      hints: ["Model the cells as logical nodes in a DAG.", "Store answers of sub-coordinate traversals inside static cache arrays."]
    },
    {
      id: "g2",
      title: "Global Distributed Crawler PageRank",
      question: "Design a web crawling service that operates across thousands of servers, parses URL links, and recalculates PageRank vector metrics at global scales. Outline sharding and transition matrices storage mappings.",
      type: "system-design",
      hints: ["How do you handle spiders traps and cyclic redirect pages?", "Detail MapReduce matrix multiplication for probability vectors."]
    }
  ],
  Amazon: [
    {
      id: "a1",
      title: "Amazon Warehouse Shortest Unsorted Sub-Package Chain",
      question: "Under Amazon's fulfillment line, find the shortest continuous block of packages in a log list that must be sorted to make the entire shipping row ordered. Optimize for O(N) time and O(1) space.",
      type: "coding",
      codeStub: `/**\n * @param {number[]} packages\n * @return {number}\n */\nfunction findShortestUnsortedSubarray(packages) {\n  // Write your code here\n  return 0;\n}`,
      hints: ["Find elements that violate chronological ordering on left vs right sides.", "Compare peak values seen with index boundaries."]
    },
    {
      id: "a2",
      title: "Fault-Tolerant Checkout and Inventory Ledger",
      question: "Design the high-throughput Amazon Checkout processing system. The architecture must preserve inventory ledger integrity, scale with zero customer cart drops during massive traffic spikes (10M requests/min), and employ strict idempotency checks.",
      type: "system-design",
      hints: ["Use SQS for decoupled ordering queues.", "Where will you check cart duplicates to enforce transactional once-only ledger operations?"]
    }
  ],
  Microsoft: [
    {
      id: "m1",
      title: "Merge Overlapping Processor Thread Allocations",
      question: "Given a list of non-overlapping thread interval slices task-scheduled, merge all overlapping bounds to maximize processor efficiency. Optimize for O(N log N) time complexity.",
      type: "coding",
      codeStub: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction mergeThreadIntervals(intervals) {\n  // Write your code here\n  return [];\n}`,
      hints: ["Sort all thread intervals by start offsets.", "Check if start of current interval overlaps preceding merged end limits."]
    },
    {
      id: "m2",
      title: "MS Teams Real-time Document Whiteboard Engine",
      question: "Design a synchronized collaborative document editor like MS Word Online or MS Teams Whiteboard. Explain write synchronization, conflict resolution strategies, and minimizing latency between multiple concurrent typers.",
      type: "system-design",
      hints: ["Contrast Operational Transformation (OT) with Conflict-free Replicated Data Types (CRDT).", "Describe central server sequencing and local edits replay."]
    }
  ],
  Meta: [
    {
      id: "meta1",
      title: "K Closest Posts inside News Feed proximity mapping",
      question: "Given a 2D coordinates map of millions of media stories and a location origin, identify the K closest posts relative to the origin coordinates. Optimize for O(N log K) average time.",
      type: "coding",
      codeStub: `/**\n * @param {number[][]} posts\n * @param {number} k\n * @return {number[][]}\n */\nfunction kClosestPosts(posts, k) {\n  // Implement O(N log K) min/max heap or quickselect\n  return [];\n}`,
      hints: ["Calculate distance coordinates from (0,0) as x^2 + y^2.", "Utilize custom Max Priority Heap arrays of size K."]
    },
    {
      id: "meta2",
      title: "Instagram Distributed Feed Cache and Real-Time Push Messaging",
      question: "Design Meta's real-time feed update delivery system (TAO or custom Redis/Cassandra stacks). The architecture demands active updates push, delivery guarantees for WhatsApp read/unread receipts, and offline queues.",
      type: "system-design",
      hints: ["Deploy Master-Follower Region Caching with Write-through memory stores.", "Review Graph TAO association shards for supernode queries optimization."]
    }
  ]
};

export default function CoPracticeRoom({ currentUsername }: CoPracticeRoomProps) {
  const [username, setUsername] = useState(currentUsername || "Candidate");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  
  // Screen sharing & peer reviews states
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [screenSharerName, setScreenSharerName] = useState<string | null>(null);
  const [isScreenSharePanelOpen, setIsScreenSharePanelOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inlineReviews, setInlineReviews] = useState<{ id: string; author: string; comment: string; timestamp: string }[]>([]);
  const [reviewInput, setReviewInput] = useState("");

  // Connection state
  const [peers, setPeers] = useState<{ id: string; name: string }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Audio recording states
  const [roomRecordings, setRoomRecordings] = useState<any[]>([]);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Room features state synced dynamically
  const [activeTab, setActiveTab] = useState<"coding" | "system-design">("coding");
  
  // Roles
  const [roles, setRoles] = useState({ candidate: "", proctor: "" });
  
  // Collaborative content states (coding)
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  
  // Collaborative content states (system design)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [apiSchema, setApiSchema] = useState("");
  const [cachingSpecs, setCachingSpecs] = useState("");
  const [bottlenecksSpecs, setBottlenecksSpecs] = useState("");
  
  // Question sync
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  
  // Feedback and grades state
  const [sharedEvaluations, setSharedEvaluations] = useState<any[]>([]);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [scoreInput, setScoreInput] = useState(80);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Collaborative Scheduler state
  const [scheduledSessions, setScheduledSessions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("prepai_scheduled_sessions");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: "sched_1", topic: "Google Graph Traversal & DFS Deep Dive", datetime: "2026-06-10T15:00", companion: "Lucas Sterling", target: "Google", role: "Interviewer", roomId: "google_algo_room", status: "Open" },
      { id: "sched_2", topic: "Amazon High-Scale Distributed Checkout Pricing", datetime: "2026-06-12T10:00", companion: "Deepika R.", target: "Amazon", role: "Candidate", roomId: "amazon_system_room", status: "Confirmed" },
      { id: "sched_3", topic: "MS Teams Real-time Whiteboard Engine Study", datetime: "2026-06-15T14:30", companion: "Sarah Jenkins", target: "Microsoft", role: "Candidate", roomId: "microsoft_dev_room", status: "Open" }
    ];
  });
  
  const [schedTopic, setSchedTopic] = useState("");
  const [schedDateTime, setSchedDateTime] = useState("");
  const [schedTarget, setSchedTarget] = useState("Google");
  const [schedRole, setSchedRole] = useState("Candidate");
  const [schedRoomId, setSchedRoomId] = useState("");
  const [schedCompanion, setSchedCompanion] = useState("");
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [lobbyTab, setLobbyTab] = useState<"scheduler" | "quick-rooms" | "peer-reviews">("scheduler");

  // Past Peer Reviews scorecard folio
  const [pastPeerReviews, setPastPeerReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("prepai_past_peer_reviews");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: "past_1", score: 85, feedback: "Awesome logic flow on graph DFS. Code compiles cleanly and handles empty matrix boundary constraints.", evaluator: "Lucas Sterling", room: "google_algo_room", date: "2026-06-08" },
      { id: "past_2", score: 92, feedback: "Excellent architectural breakdown for consistent hashing with virtual nodes. Very clear caching discussion.", evaluator: "Sarah Jenkins", room: "microsoft_dev_room", date: "2026-06-07" }
    ];
  });

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTopic.trim() || !schedDateTime) {
      alert("Please fill in a topic and scheduled date/time.");
      return;
    }
    const targetRoomId = schedRoomId.trim() || `room_${Math.random().toString(36).substring(2, 8)}`;
    const newSched = {
      id: `sched_${Date.now()}`,
      topic: schedTopic.trim(),
      datetime: schedDateTime,
      companion: schedCompanion.trim() || "Open Matchmaking",
      target: schedTarget,
      role: schedRole,
      roomId: targetRoomId,
      status: schedCompanion.trim() ? "Confirmed" : "Open"
    };

    const updated = [newSched, ...scheduledSessions];
    setScheduledSessions(updated);
    localStorage.setItem("prepai_scheduled_sessions", JSON.stringify(updated));
    
    // reset form
    setSchedTopic("");
    setSchedDateTime("");
    setSchedCompanion("");
    setSchedRoomId("");
    setIsSchedModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = scheduledSessions.filter(s => s.id !== id);
    setScheduledSessions(updated);
    localStorage.setItem("prepai_scheduled_sessions", JSON.stringify(updated));
  };

  const handleClaimScheduleSlot = (id: string) => {
    const updated = scheduledSessions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          companion: username,
          status: "Confirmed"
        };
      }
      return s;
    });
    setScheduledSessions(updated);
    localStorage.setItem("prepai_scheduled_sessions", JSON.stringify(updated));
  };
  
  const wsRef = useRef<WebSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && screenShareStream) {
      videoRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream]);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const autoRoom = sessionStorage.getItem("prepai_auto_join_room");
    if (autoRoom) {
      sessionStorage.removeItem("prepai_auto_join_room");
      setRoomIdInput(autoRoom);
      // Wait slightly for layout stability before joining
      setTimeout(() => {
        handleJoinOrCreate(autoRoom);
      }, 300);
    }
  }, []);

  // Clean room state on exit
  const handleExitRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setInRoom(false);
    setRoomId("");
    setPeers([]);
    setRoles({ candidate: "", proctor: "" });
    setCode("");
    setSelectedNodes([]);
    setApiSchema("");
    setCachingSpecs("");
    setBottlenecksSpecs("");
    setActiveQuestion(null);
    setChatMessages([]);
    setSharedEvaluations([]);
    setRoomRecordings([]);
    setIsRecordingAudio(false);
  };

  // Connect & Join
  const handleJoinOrCreate = (targetRoomId: string) => {
    if (!username.trim()) {
      alert("Please enter your display name to join.");
      return;
    }
    const cleanId = (targetRoomId || `room_${Math.random().toString(36).substring(2, 8)}`).trim();
    setRoomId(cleanId);
    setInRoom(true);
    setConnectionStatus("connecting");

    // Initialize WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      // Send join message
      const joinMsg = {
        type: "join_room",
        roomId: cleanId,
        userName: username
      };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "sync_state":
            // Full room initialization
            if (msg.state) {
              setPeers(msg.state.users || []);
              setRoles(msg.state.roles || { candidate: "", proctor: "" });
              setCode(msg.state.code || "");
              setSelectedLanguage(msg.state.language || "javascript");
              setSelectedNodes(msg.state.canvasNodes || []);
              setApiSchema(msg.state.apiSpecs || "");
              setCachingSpecs(msg.state.cachingSpecs || "");
              setBottlenecksSpecs(msg.state.bottlenecksSpecs || "");
              setActiveQuestion(msg.state.activeQuestion || null);
              setChatMessages(msg.state.chatMessages || []);
              setSharedEvaluations(msg.state.sharedEvaluations || []);
              setScreenSharerName(msg.state.screenSharer || null);
              setInlineReviews(msg.state.inlineReviews || []);
              setRoomRecordings(msg.state.recordings || []);
            }
            break;

          case "user_joined":
            // Add peer elegantly
            setPeers((prev) => {
              if (prev.find((p) => p.id === msg.userId)) return prev;
              return [...prev, { id: msg.userId, name: msg.userName }];
            });
            setChatMessages((prev) => [
              ...prev,
              { id: `sys_${Date.now()}`, sender: "System", text: `Peer '${msg.userName}' joined the practice room.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            break;

          case "user_left":
            setPeers((prev) => prev.filter((p) => p.id !== msg.userId));
            setChatMessages((prev) => [
              ...prev,
              { id: `sys_${Date.now()}`, sender: "System", text: `Peer '${msg.userName}' left the practice room.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            break;

          case "role_update":
            setRoles(msg.roles);
            break;

          case "code_update":
            setCode(msg.code);
            break;

          case "lang_update":
            setSelectedLanguage(msg.language);
            break;

          case "canvas_update":
            setSelectedNodes(msg.nodes);
            break;

          case "specs_update":
            if (msg.apiSpecs !== undefined) setApiSchema(msg.apiSpecs);
            if (msg.cachingSpecs !== undefined) setCachingSpecs(msg.cachingSpecs);
            if (msg.bottlenecksSpecs !== undefined) setBottlenecksSpecs(msg.bottlenecksSpecs);
            break;

          case "chat_message_received":
            setChatMessages((prev) => [...prev, msg.message]);
            break;

          case "score_received": {
            setSharedEvaluations(msg.evaluations);
            try {
              const currentPast = localStorage.getItem("prepai_past_peer_reviews");
              const parsedPast = currentPast ? JSON.parse(currentPast) : [];
              msg.evaluations.forEach((ev: any) => {
                if (!parsedPast.some((p: any) => p.id === ev.id)) {
                  parsedPast.push({
                    id: ev.id,
                    score: ev.score,
                    feedback: ev.feedback,
                    evaluator: ev.evaluator,
                    room: roomIdInput || "General",
                    date: new Date().toLocaleDateString()
                  });
                }
              });
              localStorage.setItem("prepai_past_peer_reviews", JSON.stringify(parsedPast));
              setPastPeerReviews(parsedPast);
            } catch (e) {
              console.error("Local portfolio sync error:", e);
            }
            break;
          }

          case "question_update":
            setActiveQuestion(msg.question);
            // Auto swap tab matching challenge type
            if (msg.question) {
              setActiveTab(msg.question.type === "coding" ? "coding" : "system-design");
              if (msg.question.type === "coding" && msg.question.codeStub) {
                setCode(msg.question.codeStub);
              }
            }
            break;

          case "screen_share_update":
            setScreenSharerName(msg.active ? msg.userName : null);
            if (!msg.active) {
              setScreenShareStream(null);
            }
            break;

          case "inline_review_received":
            setInlineReviews(msg.reviews || []);
            break;

          case "audio_recording_received":
            setRoomRecordings(msg.recordings || []);
            break;
        }
      } catch (err) {
        console.error("Error parsing socket frame:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      setConnectionStatus("error");
    };
  };

  // Broadcast handlers
  const handleClaimRole = (role: "candidate" | "proctor") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "role_claim",
      role,
      name: username
    }));
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "code_change",
      code: newCode
    }));
  };

  const handleToggleScreenShare = async () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
      setScreenSharerName(null);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "screen_share_change",
          active: false,
          userName: username
        }));
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setScreenShareStream(stream);
        setScreenSharerName(username);
        setIsScreenSharePanelOpen(true);

        stream.getVideoTracks()[0].onended = () => {
          setScreenShareStream(null);
          setScreenSharerName(null);
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "screen_share_change",
              active: false,
              userName: username
            }));
          }
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "screen_share_change",
            active: true,
            userName: username
          }));
        }
      } catch (e) {
        console.error("Screen sharing denied or not supported in frame context:", e);
      }
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm text/plain" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "audio_recording_submit",
              questionId: activeQuestion?.id || "general",
              audioDataUrl: base64data,
              sender: username,
              textTranscript: `Vocal solution narration for: ${activeQuestion?.title || "practice problem"}`
            }));
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release indicators
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Accessing mic failed:", err);
      alert("Microphone capture failed. Ensure frame permissions are granted in preview settings.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const handleAddInlineReview = () => {
    if (!reviewInput.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("No active session to broadcast feedback comments.");
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: "inline_review_add",
      author: username,
      comment: reviewInput
    }));

    setReviewInput("");
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "lang_change",
      language: lang
    }));
  };

  const handleAddNode = (type: string) => {
    if (selectedNodes.length >= 12) return;
    const nextLocalNodes = [...selectedNodes, type];
    setSelectedNodes(nextLocalNodes);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "canvas_change",
      nodes: nextLocalNodes
    }));
  };

  const handleRemoveNode = (idx: number) => {
    const nextLocalNodes = selectedNodes.filter((_, i) => i !== idx);
    setSelectedNodes(nextLocalNodes);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "canvas_change",
      nodes: nextLocalNodes
    }));
  };

  const handleSpecsChange = (field: "api" | "caching" | "bottlenecks", value: string) => {
    const payload: any = { type: "specs_change" };
    if (field === "api") {
      setApiSchema(value);
      payload.apiSpecs = value;
    } else if (field === "caching") {
      setCachingSpecs(value);
      payload.cachingSpecs = value;
    } else if (field === "bottlenecks") {
      setBottlenecksSpecs(value);
      payload.bottlenecksSpecs = value;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(payload));
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "chat_message",
      text: chatInput.trim(),
      sender: username
    }));
    setChatInput("");
  };

  const handleShareScorecard = () => {
    if (!feedbackInput.trim()) {
      alert("Please provide feedback notes before compiling peer grades review.");
      return;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "submit_score",
      score: scoreInput,
      feedback: feedbackInput.trim(),
      evaluator: username
    }));
    setFeedbackInput("");
  };

  const handleSyncQuestion = (q: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "change_question",
      question: q
    }));
  };

  if (!inRoom) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
        {/* Entrance banner */}
        <div className="bg-[#171b22]/70 p-6 rounded-2xl border border-[#2d333d] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <Users className="w-7 h-7 text-indigo-400" />
              Collaborative Practice Rooms
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
              Conduct peer real-time mocks, share pair-programming environments, or whiteboard system schemas together. Complete with presence, proctor grading indicators, and shared channels.
            </p>
          </div>
          <div className="p-2 py-1.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-[10px] uppercase tracking-widest font-extrabold rounded-full animate-pulse">
            Real time sync enabled
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Join Panel Card */}
          <div className="lg:col-span-1 bg-[#171b22]/85 p-6 rounded-2xl border border-[#2d333d] space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block border-b border-[#2d333d] pb-2.5">
              Enter Sandbox Lobby
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">My Interviewer / Peer Name</label>
                <input
                  id="co_username_input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs p-3 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Room ID (Leave empty to create new)</label>
                <div className="flex gap-2">
                  <input
                    id="room_id_input"
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="e.g. room_9a2f"
                    className="flex-1 text-xs p-3 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                id="join_co_room_btn"
                onClick={() => handleJoinOrCreate(roomIdInput)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Initialize or Join Room</span>
              </button>
            </div>
          </div>

          {/* Preset Active Practice Arenas & Interactive Scheduler */}
          <div className="lg:col-span-2 space-y-5">
            {/* Lobby Navigation Tabs */}
            <div className="flex bg-[#13161c]/60 p-1 rounded-xl border border-[#2d333d] gap-1 text-[11px]">
              <button
                id="lobby_tab_scheduler"
                onClick={() => setLobbyTab("scheduler")}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  lobbyTab === "scheduler"
                    ? "bg-indigo-650 text-white shadow-md border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Interviews Scheduler</span>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 rounded-full font-mono">
                  {scheduledSessions.length}
                </span>
              </button>

              <button
                id="lobby_tab_quick_rooms"
                onClick={() => setLobbyTab("quick-rooms")}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  lobbyTab === "quick-rooms"
                    ? "bg-indigo-650 text-white shadow-md border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quick Rooms</span>
              </button>

              <button
                id="lobby_tab_peer_reviews"
                onClick={() => setLobbyTab("peer-reviews")}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  lobbyTab === "peer-reviews"
                    ? "bg-indigo-650 text-white shadow-md border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Peer Portfolio</span>
                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 rounded-full font-mono">
                  {pastPeerReviews.length}
                </span>
              </button>
            </div>

            {lobbyTab === "scheduler" && (
              <div className="space-y-4 animate-fade-in">
                {/* Header and schedule trigger */}
                <div className="flex justify-between items-center bg-[#171b22]/70 p-4 rounded-xl border border-[#2d333d]/70">
                  <div>
                    <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Collaborative Matches</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">Schedule a slot to meet and practice algorithms or system design with other engineers.</p>
                  </div>
                  <button
                    id="toggle_schedule_form"
                    onClick={() => setIsSchedModalOpen(!isSchedModalOpen)}
                    className="p-1.5 px-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSchedModalOpen ? "Close Panel" : "Schedule Interview"}</span>
                  </button>
                </div>

                {isSchedModalOpen && (
                  <form onSubmit={handleCreateSchedule} className="bg-[#171b22]/95 p-5 rounded-2xl border border-[#2d333d] space-y-4 animate-slide-down shadow-xl">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider block border-b border-slate-800 pb-2">Formulate Planned SDE Mock</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Mock Topic / Target Challenge</label>
                        <input
                          type="text"
                          value={schedTopic}
                          onChange={(e) => setSchedTopic(e.target.value)}
                          placeholder="e.g. Graph topological sorting analysis"
                          className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Date & Clock Time</label>
                        <input
                          type="datetime-local"
                          value={schedDateTime}
                          onChange={(e) => setSchedDateTime(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-white outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Target Company</label>
                        <select
                          value={schedTarget}
                          onChange={(e) => setSchedTarget(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="Google">Google Focus</option>
                          <option value="Amazon">Amazon Focus</option>
                          <option value="Microsoft">Microsoft Focus</option>
                          <option value="General Tech">General SDE Focus</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">My Role Preference</label>
                        <select
                          value={schedRole}
                          onChange={(e) => setSchedRole(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="Candidate">I am Candidate</option>
                          <option value="Interviewer">I am Mock Proctor</option>
                          <option value="Alternate">Alternate Both Roles</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Partner name / Matchmaking</label>
                        <input
                          type="text"
                          value={schedCompanion}
                          onChange={(e) => setSchedCompanion(e.target.value)}
                          placeholder="Leave empty for open matchmaking"
                          className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Assigned Room ID (optional)</label>
                      <input
                        type="text"
                        value={schedRoomId}
                        onChange={(e) => setSchedRoomId(e.target.value)}
                        placeholder="e.g. system_sharding_ring"
                        className="w-full text-xs p-2.5 bg-[#13161c] rounded-lg border border-[#2d333d] text-white outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
                    >
                      Publish Planned Interview Target
                    </button>
                  </form>
                )}

                {/* Scheduled list feed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scheduledSessions.map((session) => {
                    const parsedDate = new Date(session.datetime);
                    const formattedDate = !isNaN(parsedDate.getTime()) 
                      ? parsedDate.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : session.datetime;
                    
                    return (
                      <div key={session.id} className="bg-[#171b22]/70 p-4 rounded-xl border border-[#2d333d] hover:border-indigo-500/30 transition flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[9px] bg-[#111318]/90 text-indigo-300 border border-indigo-500/20 font-black px-2 py-0.5 rounded tracking-widest uppercase">
                              {session.target} Style
                            </span>
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase ${
                              session.status === "Open" 
                                ? "bg-amber-400/10 text-amber-400 border border-amber-400/25" 
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            }`}>
                              {session.status}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-100 text-xs line-clamp-2 leading-snug">{session.topic}</h4>
                          
                          <div className="space-y-1.5 text-[10px] text-slate-400 font-semibold border-t border-slate-800/40 pt-2">
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{formattedDate}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-sky-400" />
                              <span>Partner: <strong className="text-slate-350">{session.companion}</strong></span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span>Expected Role: <strong className="text-slate-200">{session.role}</strong></span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#2d333d]/50">
                          {session.status === "Open" && session.companion !== username && (
                            <button
                              onClick={() => handleClaimScheduleSlot(session.id)}
                              className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-650 hover:text-white border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg transition"
                            >
                              CLAIM SLOT
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setRoomIdInput(session.roomId);
                              handleJoinOrCreate(session.roomId);
                            }}
                            className="flex-1 py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] rounded-lg transition text-center flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/15"
                          >
                            <Sparkles className="w-3 h-3 text-white" />
                            <span>LAUNCH SESSION</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSchedule(session.id)}
                            className="p-1.5 px-2 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg transition border border-transparent hover:border-rose-500/20"
                            title="Cancel Scheduled slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {lobbyTab === "quick-rooms" && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRESET_ROOMS.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => handleJoinOrCreate(room.id)}
                      className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.06)] cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between space-y-4 group animate-fade-in"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded tracking-wide uppercase border border-indigo-500/20">
                          {room.target} style
                        </span>
                        <h4 className="font-extrabold text-slate-100 group-hover:text-indigo-400 transition text-xs line-clamp-1">{room.name}</h4>
                        <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-3">{room.desc}</p>
                      </div>

                      <div className="text-[10px] text-indigo-400 font-bold flex items-center pt-2">
                        Enter Instantly <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lobbyTab === "peer-reviews" && (
              <div className="space-y-4 animate-fade-in">
                {pastPeerReviews.length === 0 ? (
                  <div className="p-8 text-center bg-[#13161c]/40 rounded-xl border border-[#2d333d]/55 italic text-slate-500 text-xs">
                    No peer mock scorecards have been recorded yet. Share assessments inside an active room with other users to compile a scorecard review!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastPeerReviews.map((item, index) => (
                      <div key={item.id || index} className="p-4 bg-[#171b22]/70 border border-[#2d333d]/80 rounded-xl flex justify-between gap-4 animate-fade-in">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-200 text-xs">Review by {item.evaluator}</h4>
                            <span className="text-[9px] bg-[#1a1f29] font-black text-slate-500 border border-slate-800 p-0.5 px-2 rounded-md">{item.date}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed font-semibold">"{item.feedback}"</p>
                          <span className="text-[9px] text-[#38bdf8] block font-mono">Synced Room ID: {item.room}</span>
                        </div>

                        <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-center min-w-[65px] flex flex-col justify-center h-15 max-h-15 shadow-md self-center">
                          <span className="text-[7.5px] uppercase font-bold text-slate-505 block">Score</span>
                          <span className="text-sm font-black font-mono leading-none mt-1">{item.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick explanation guide */}
            <div className="p-4 bg-[#13161c]/40 rounded-xl border border-[#2d333d] text-slate-500 text-[11px] leading-relaxed leading-normal">
              <strong>How peer rooms function:</strong> When you enter or create a Room ID, other candidates or interviewers can navigate to the "Co-Practice Rooms" tab, type in the same Room ID, and connect instantly. All editor keypresses, whiteboard elements, and chats are instantly synced!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active collaborative room layout
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Session Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#171b22]/70 p-4 px-6 rounded-2xl border border-[#2d333d]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-md">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">Interactive SDE Mock Room</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 border border-emerald-500/30 rounded-full font-bold">
                {connectionStatus === "connected" ? "Sync Active" : "Connecting..."}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Room ID: <span className="text-indigo-400 font-bold select-all">{roomId}</span> (Share this with peers)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Peer listing presence */}
          <div className="flex items-center gap-1.5 text-xs bg-[#13161c]/60 p-2 px-3 rounded-xl border border-[#2d333d]">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-bold">Peers: </span>
            <div className="flex items-center gap-1">
              <span className="text-white font-black">{peers.length || 1}</span>
              <span className="text-slate-600 max-w-[120px] truncate">({peers.map(p => p.name).join(", ") || username})</span>
            </div>
          </div>

          {/* Real-time Web Invite Link copier */}
          <button
            id="invite_friend_btn"
            onClick={() => {
              const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
              navigator.clipboard.writeText(inviteUrl);
              setInviteCopied(true);
              setTimeout(() => setInviteCopied(false), 2000);
            }}
            className="p-2 px-3.5 bg-indigo-950/20 hover:bg-indigo-900/10 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
            title="Copy magic invite link. When clicked, peers instantly auto-join this workspace code."
          >
            {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5" />}
            <span>{inviteCopied ? "Link Copied!" : "Invite Friend"}</span>
          </button>

          {/* Real-time Local/Remote Screen Share Initiator */}
          <button
            id="toggle_screen_share_btn"
            onClick={handleToggleScreenShare}
            className={`p-2 px-3.5 rounded-xl border transition text-xs font-bold flex items-center gap-1.5 ${
              screenShareStream || screenSharerName
                ? "bg-emerald-950/25 hover:bg-emerald-900/15 text-emerald-400 border-emerald-500/30"
                : "bg-indigo-950/20 hover:bg-indigo-900/10 text-indigo-400 hover:text-indigo-305 border border-indigo-500/20"
            }`}
            title="Starts live browser screen capturing pipeline to pair program with candidates."
          >
            <Video className="w-3.5 h-3.5" />
            <span>
              {screenSharerName ? (
                <span>Streaming: {screenSharerName === username ? "You" : screenSharerName}</span>
              ) : (
                "Share Screen"
              )}
            </span>
          </button>

          <button
            id="exit_room_btn"
            onClick={handleExitRoom}
            className="p-2 px-3.5 bg-rose-950/20 hover:bg-rose-900/10 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Role Assignment & Interviewer Questions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Main Workspaces */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Role mapping details bar */}
          <div className="bg-[#171b22]/70 p-4 rounded-xl border border-[#2d333d] flex flex-wrap justify-between items-center gap-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              Role Management
            </span>

            <div className="flex gap-4 text-xs">
              <button
                id="claim_candidate_btn"
                onClick={() => handleClaimRole("candidate")}
                className={`p-2 px-4 rounded-lg font-bold border transition flex items-center gap-2 ${
                  roles.candidate === username
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : roles.candidate
                    ? "bg-[#13161c] border-[#2d333d] text-slate-200 cursor-not-allowed"
                    : "bg-[#13161c] hover:bg-slate-800 border-[#2d333d] text-slate-400"
                }`}
              >
                <span>Candidate: {roles.candidate || "Unclaimed (Click)"}</span>
              </button>

              <button
                id="claim_proctor_btn"
                onClick={() => handleClaimRole("proctor")}
                className={`p-2 px-4 rounded-lg font-bold border transition flex items-center gap-2 ${
                  roles.proctor === username
                    ? "bg-violet-600 border-violet-500 text-white"
                    : roles.proctor
                    ? "bg-[#13161c] border-[#2d333d] text-slate-200 cursor-not-allowed"
                    : "bg-[#13161c] hover:bg-slate-800 border-[#2d333d] text-slate-400"
                }`}
              >
                <span>Mock Interviewer: {roles.proctor || "Unclaimed (Click)"}</span>
              </button>
            </div>
          </div>

          <div className="bg-[#171b22]/70 border border-[#2d333d] rounded-2xl overflow-hidden flex flex-col min-h-[480px]">
            {/* Tab selector */}
            <div className="bg-[#13161c]/55 p-3 border-b border-[#2d333d]/80 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  id="tab_interactive_coding"
                  onClick={() => setActiveTab("coding")}
                  className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "coding"
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Shared Development IDE</span>
                </button>

                <button
                  id="tab_interactive_whiteboard"
                  onClick={() => setActiveTab("system-design")}
                  className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "system-design"
                      ? "bg-violet-600/15 text-violet-400 border border-violet-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Shared Whiteboard</span>
                </button>
              </div>

              {activeTab === "coding" && (
                <select
                  id="co_lang_selector"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#13161c] text-indigo-400 text-[10px] uppercase font-extrabold tracking-widest border border-[#2d333d] rounded-md p-1 px-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="ruby">Ruby</option>
                  <option value="swift">Swift</option>
                </select>
              )}
            </div>

            {/* Active Sandbox Output Workspace */}
            <div className="flex-1 flex flex-col">
              {activeTab === "coding" ? (
                <div className="flex-1 flex flex-col bg-[#13161c]/10 p-4 h-full">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-extrabold uppercase tracking-widest px-1 mb-2">
                    <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-indigo-400" /> Collaborative Script Sandbox</span>
                    <span>Real-time typing synced</span>
                  </div>
                  <textarea
                    id="co_code_editor"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="// Start typing algorithm solution or pair program here..."
                    rows={16}
                    className="flex-1 w-full bg-[#13161c]/80 text-[#38bdf8] p-4 rounded-xl border border-[#2d333d] text-xs font-mono outline-none resize-none leading-relaxed leading-normal"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4 bg-[#13161c]/10 space-y-4">
                  {/* Grid system nodes */}
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Web Whiteboard Canvas (Dynamic Sync)
                  </span>
                  
                  <div className="h-44 bg-[#13161c]/80 rounded-xl border border-[#2d333d] p-4 flex flex-wrap gap-2.5 items-center justify-center relative overflow-y-auto">
                    {selectedNodes.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">The system design drawing board is currently empty. Click component blocks from the modular palette below to construct your architecture.</p>
                    ) : (
                      selectedNodes.map((nType, idx) => {
                        const cell = MODULE_PALETTE.find(item => item.type === nType);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="relative group p-3 px-4 bg-indigo-500/10 border border-indigo-500/30 text-slate-200 text-xs font-black rounded-xl shadow-lg">
                              <span>{cell?.name || nType}</span>
                              <button
                                onClick={() => handleRemoveNode(idx)}
                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-[#13161c] border border-[#2d333d] text-slate-500 hover:text-rose-400 rounded-full transition opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {idx < selectedNodes.length - 1 && (
                              <div className="w-5 h-0.5 bg-[#2d333d]" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Nodes palette list */}
                  <div className="bg-[#13161c]/60 p-3 rounded-lg border border-[#2d333d]">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Palette Components Drawer</span>
                    <div className="flex flex-wrap gap-2">
                      {MODULE_PALETTE.map((pal) => (
                        <button
                          key={pal.type}
                          onClick={() => handleAddNode(pal.type)}
                          className="p-1.5 px-3 bg-[#13161c] hover:bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px] border border-[#2d333d]"
                        >
                          <span>+ {pal.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specs written fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wide">APIs Routing & Partitioning keys</label>
                      <textarea
                        value={apiSchema}
                        onChange={(e) => handleSpecsChange("api", e.target.value)}
                        placeholder="e.g. POST /checkout { cartId, payToken }..."
                        rows={3}
                        className="w-full text-xs p-2 bg-[#13161c]/80 rounded-xl border border-[#2d333d] text-slate-200 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wide">Caching & Replication Policies</label>
                      <textarea
                        value={cachingSpecs}
                        onChange={(e) => handleSpecsChange("caching", e.target.value)}
                        placeholder="e.g. Write-through Redis, Master-Slave Postgres replication..."
                        rows={3}
                        className="w-full text-xs p-2 bg-[#13161c]/80 rounded-xl border border-[#2d333d] text-slate-200 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-wide">Bottlenecks & Availability Triages</label>
                      <textarea
                        value={bottlenecksSpecs}
                        onChange={(e) => handleSpecsChange("bottlenecks", e.target.value)}
                        placeholder="e.g. Rate limters on gateway, message queuing SQS retries..."
                        rows={3}
                        className="w-full text-xs p-2 bg-[#13161c]/80 rounded-xl border border-[#2d333d] text-slate-200 outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Verbal Answers & Reciprocal Recording Hub */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-indigo-500/20 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#2d333d]/40 pb-2">
              <Mic className="w-4 h-4 text-rose-450 text-rose-400" />
              Verbal Answers & Recording Bench
            </h3>

            <p className="text-slate-400 text-xs leading-relaxed">
              Synthesize and share verbal answer narrations with peers during live mock trials. Proctors, partners, and candidates can access playbacks in real-time.
            </p>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#13161c]/60 rounded-xl border border-[#2d333d]">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Active Role Mic Controller</span>
                {roles.candidate === username ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    You are the Candidate (Recording Privileging Allowed)
                  </span>
                ) : roles.candidate ? (
                  <span className="text-xs text-slate-400">
                    Candidate <strong className="text-indigo-400">{roles.candidate}</strong> holds voice privileges.
                  </span>
                ) : (
                  <span className="text-xs text-amber-400/80 italic">
                    No speaker has claimed the Candidate role to record yet.
                  </span>
                )}
              </div>

              {roles.candidate === username ? (
                <div>
                  {isRecordingAudio ? (
                    <button
                      id="co_stop_recording_audio"
                      onClick={stopVoiceRecording}
                      className="px-4 py-2.5 bg-rose-650 hover:bg-rose-550 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition flex items-center gap-2 animate-pulse cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" /> Stop & Sync Answer
                    </button>
                  ) : (
                    <button
                      id="co_start_recording_audio"
                      onClick={startVoiceRecording}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5" /> Start Recording Speech
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 max-w-xs italic text-right">
                  {roles.candidate ? "Listen to candidate recordings in the panel below." : "Claim the 'Candidate' role above to enable the oral answer capture bay."}
                </p>
              )}
            </div>

            {/* List current session uploads */}
            <div className="space-y-3.5 pt-2">
              <span className="text-[9px] text-[#38bdf8] font-extrabold uppercase tracking-widest block font-mono">
                Room Practice Session Playbacks ({roomRecordings.length})
              </span>

              {roomRecordings.length === 0 ? (
                <div className="p-4 bg-[#13161c]/40 text-center text-slate-500 text-[10px] italic rounded-xl border border-dashed border-[#2d333d]">
                  No speech answer recordings synced yet in this room session.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {roomRecordings.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 bg-[#13161c] border border-indigo-500/10 rounded-xl space-y-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-300">
                            {rec.sender.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-200 block">{rec.sender} Verbal Submission</span>
                            <span className="text-[9px] text-slate-500 font-mono block leading-none mt-0.5">{rec.timestamp}</span>
                          </div>
                        </div>
                        <span className="text-[8.5px] bg-slate-800 text-slate-400 p-1 px-2 border border-slate-700/50 rounded-md font-mono">
                          {activeQuestion ? "Targeted Task Code Response" : "Verbal Solution Briefing"}
                        </span>
                      </div>

                      <div className="bg-[#181d28]/40 p-2.5 rounded-lg border border-[#2d333d]/70 text-[11px] text-slate-400">
                        <strong className="text-indigo-300">Description:</strong> {rec.textTranscript}
                      </div>

                      {/* Render AudioPlayerWidget */}
                      <AudioPlayerWidget src={rec.audioDataUrl} title={`${rec.sender}'s Voice Practice answer`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Side: Peer grading assessment workspace */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#2d333d]/40 pb-2">
              <Award className="w-4 h-4 text-violet-400" />
              Peer Evaluation & Scoreboard Sharing
            </h3>

            {/* Submit grades form */}
            {roles.proctor === username ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[9px] text-slate-400 font-extrabold uppercase">Technical Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-white font-bold"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-400 font-extrabold">Constructive Feedback Notes</label>
                  <input
                    type="text"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="e.g. Robust algorithmic structures, excellent pacing, answer handles edge cases well."
                    className="w-full text-xs p-2.5 bg-[#13161c] rounded-xl border border-[#2d333d] text-slate-300 outline-none"
                  />
                </div>

                <button
                  id="co_share_score_btn"
                  onClick={handleShareScorecard}
                  className="md:col-span-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                >
                  <Share2 className="w-4 h-4" /> Share Scorecard
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Only the designated Mock Interviewer / Proctor may fill out and log assessment scorecards in this room. Claim the "Mock Interviewer" role to submit candidate evaluations.
              </p>
            )}

            {/* Score logs list */}
            <div className="space-y-2 mt-4">
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block">Published Scorecards Log</span>
              {sharedEvaluations.length === 0 ? (
                <p className="text-slate-500 text-[10px] italic">No scoreboard assessments have been published yet.</p>
              ) : (
                sharedEvaluations.map((evalItem, idx) => (
                  <div key={idx} className="p-3 bg-[#13161c]/60 rounded-xl border border-[#2d333d] flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-200">Review by {evalItem.evaluator}</span>
                        <span className="text-[9px] text-slate-500">{evalItem.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{evalItem.feedback}</p>
                    </div>

                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl text-center min-w-[70px]">
                      <span className="text-[8px] uppercase font-bold text-slate-500 block">Grade</span>
                      <span className="text-base font-black font-mono">{evalItem.score}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Right Panel: Prompts / Question selection & Chat discussion */}
        <div className="space-y-6">
          
          {/* Company interview questions selector */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-[#2d333d] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#2d333d]/40 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Target Company Focus Pack
            </h3>

            <div className="space-y-3.5">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Choose typical question focuses from top firms to load challenging mock problems for team assessment.
              </p>

              {/* Collapsible company choices */}
              {Object.keys(COMPANY_QUESTIONS).map((companyName) => (
                <div key={companyName} className="space-y-1.5 pt-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38bdf8]">{companyName} Focus Question Sets</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COMPANY_QUESTIONS[companyName].map((q) => (
                      <button
                        key={q.id}
                        id={`co_q_${q.id}`}
                        onClick={() => handleSyncQuestion(q)}
                        className={`text-left p-2.5 px-3 bg-[#13161c] hover:bg-slate-800 border border-[#2d333d] hover:border-slate-500 rounded-xl text-[10px] font-bold transition flex items-center justify-between ${
                          activeQuestion?.id === q.id ? "bg-indigo-950/20 border-indigo-500" : ""
                        }`}
                      >
                        <span className="line-clamp-1">{q.title}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 p-0.5 px-2 rounded-md capitalize font-mono shrink-0 font-normal">
                          {q.type || "design"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Display active synchronized question details */}
            {activeQuestion ? (
              <div className="p-4 bg-indigo-950/10 border border-indigo-500/20 rounded-xl space-y-2 mt-4 animate-fade-in text-xs">
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded uppercase border border-indigo-500/30">Active synchronized prompt</span>
                <h4 className="font-extrabold text-slate-100">{activeQuestion.title}</h4>
                <p className="text-slate-400 leading-relaxed leading-normal text-[11px] font-medium">{activeQuestion.question}</p>
                {activeQuestion.hints && activeQuestion.hints.length > 0 && (
                  <div className="space-y-1 pt-1 ml-1 border-l-2 border-[#2d333d] pl-2">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase">Hints:</span>
                    <ul className="list-disc list-inside text-[10px] text-slate-500 space-y-0.5">
                      {activeQuestion.hints.map((hint: string, i: number) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#13161c] text-center italic text-slate-500 text-[10px] rounded-xl border border-[#2d333d]">
                No task loaded to room workspace yet. Click a company focus sets item above to sync standard prompts.
              </div>
            )}
          </div>

          {/* Simultaneous Live Peer & Mentor Comments */}
          <div className="bg-[#171b22]/70 p-5 rounded-2xl border border-indigo-500/20 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#2d333d]/40 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Simultaneous Mentor Notes
            </h3>

            <p className="text-slate-500 text-[11px] leading-relaxed leading-normal">
              Mentors and friends can type simultaneous, live structural feedback or STAR reviews here to sync annotations instantly without disrupting active voice lines.
            </p>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 bg-[#13161c]/35 rounded-xl p-2.5 border border-[#2d333d]/50">
              {inlineReviews.length === 0 ? (
                <div className="text-center italic text-[10px] py-4 text-slate-500">
                  No simultaneous annotations logged yet. Input peer notes below!
                </div>
              ) : (
                inlineReviews.map((rev) => (
                  <div key={rev.id} className="text-[11px] leading-relaxed border-b border-dashed border-[#2d333d]/55 pb-2 last:border-none animate-fade-in">
                    <div className="flex justify-between items-center text-slate-400 gap-1 mb-1">
                      <span className="font-extrabold text-[#38bdf8]">{rev.author}</span>
                      <span className="text-[8px] text-slate-500 font-mono">{rev.timestamp}</span>
                    </div>
                    <p className="text-slate-300 font-medium pl-1.5 border-l border-indigo-500/40">
                      {rev.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-1.5">
              <input
                id="inline_review_comment_input"
                type="text"
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddInlineReview()}
                placeholder="Log a STAR action note or tip..."
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#13161c] border border-[#2d333d] rounded-lg text-slate-200 outline-none focus:border-indigo-500"
              />
              <button
                id="submit_inline_review_btn"
                onClick={handleAddInlineReview}
                className="p-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wide rounded-lg transition"
              >
                Log
              </button>
            </div>
          </div>

          {/* Live Room Chat Box */}
          <div className="bg-[#171b22]/70 border border-[#2d333d] rounded-2xl flex flex-col h-[380px] overflow-hidden shadow-md">
            
            <div className="bg-[#13161c]/55 p-3.5 border-b border-[#2d333d]/80 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Room Peer Discussion
              </span>
              <span className="text-[8px] bg-indigo-500/20 text-indigo-400 p-0.5 px-2 rounded font-extrabold tracking-widest uppercase">Live Chat</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#13161c]/25 min-h-0 text-xs">
              {chatMessages.length === 0 ? (
                <p className="text-slate-500 italic text-[10px] text-center pt-16">No comments recorded. Type below to converse with active peers.</p>
              ) : (
                chatMessages.map((msg, index) => {
                  const isSelf = msg.sender === username;
                  const isSys = msg.sender === "System";

                  if (isSys) {
                    return (
                      <div key={index} className="text-center">
                        <span className="text-[9px] font-bold text-slate-500 bg-[#13161c] px-3 py-1 rounded-full border border-[#2d333d]">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-500 font-extrabold mb-1 px-1">{msg.sender} <span className="font-normal text-[8px]">{msg.timestamp}</span></span>
                      <div className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                        isSelf 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-[#13161c] border border-[#2d333d] text-slate-200 rounded-tl-none"
                      }`}>
                        <p className="text-[11px] whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Send bar */}
            <div className="p-3 bg-[#13161c]/55 border-t border-[#2d333d] flex gap-2">
              <input
                id="co_chat_input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type a peer message..."
                className="flex-1 text-xs px-3 py-2 bg-[#13161c] border border-[#2d333d] rounded-xl text-slate-200 outline-none focus:border-indigo-500"
              />
              <button
                id="co_send_chat_btn"
                onClick={handleSendChat}
                className="p-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Screen Share PIP widget */}
      {(screenShareStream || screenSharerName) && isScreenSharePanelOpen && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#13161c] border border-indigo-500/35 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-80 animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wide">
                {screenSharerName === username ? "Your Screen Share Live" : `${screenSharerName} is sharing`}
              </span>
            </div>
            <button 
              onClick={() => setIsScreenSharePanelOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-black p-1 px-1.5 hover:bg-[#1e2330] rounded-lg transition"
            >
              Minimize
            </button>
          </div>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-850 border-slate-800">
            {screenShareStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-4 space-y-1">
                <Video className="w-6 h-6 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400">Stream feed synced in Room</span>
                <span className="text-[9px] text-slate-550 text-slate-500">Screen updates synchronize on changes</span>
              </div>
            )}
          </div>
          {screenShareStream && (
            <button
              onClick={handleToggleScreenShare}
              className="w-full py-1.5 bg-rose-950/20 hover:bg-rose-900/10 text-rose-400 border border-rose-500/20 rounded-xl transition text-[10px] font-extrabold tracking-wide uppercase"
            >
              Stop Screen Share
            </button>
          )}
        </div>
      )}

      {/* Float Stream Restore Button */}
      {(screenShareStream || screenSharerName) && !isScreenSharePanelOpen && (
        <button
          onClick={() => setIsScreenSharePanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white rounded-full shadow-lg flex items-center gap-2 animate-bounce cursor-pointer font-bold text-xs"
        >
          <Video className="w-4 h-4 animate-pulse" />
          <span>Maximize Stream</span>
        </button>
      )}

    </div>
  );
}
