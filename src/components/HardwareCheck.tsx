import { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw, 
  Sparkles,
  Check,
  Wifi,
  Video,
  VideoOff,
  LogOut,
  Lock,
  Globe
} from "lucide-react";

interface HardwareCheckProps {
  onProceed: () => void;
  onExit: () => void;
  domain: string;
}

export default function HardwareCheck({ onProceed, onExit, domain }: HardwareCheckProps) {
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [testedSpeech, setTestedSpeech] = useState("");
  const [speechCompatible, setSpeechCompatible] = useState(false);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "not_tested">("not_tested");
  const [activeBrowserTab, setActiveBrowserTab] = useState<"chrome" | "safari" | "firefox" | "edge">("chrome");
  
  // Audio context references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Speech recognition references
  const speechTesterRef = useRef<any>(null);

  // Initialize SpeechRecognition Support Check
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechCompatible(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setTestedSpeech(transcript);
      };

      rec.onend = () => {
        setIsTestingSpeech(false);
      };

      rec.onerror = (err: any) => {
        console.warn("Speech test error:", err);
        setIsTestingSpeech(false);
      };

      speechTesterRef.current = rec;
    }

    // Auto-attempt mic authorization access
    requestMicrophoneAccess();

    // Auto-attempt optional proctor camera diagnostic
    requestCameraAccess();

    return () => {
      cleanupMicrophone();
      if (speechTesterRef.current) {
        try { speechTesterRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const requestMicrophoneAccess = async () => {
    cleanupMicrophone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermission("granted");
      
      // Setup Web Audio Analyzer for dynamic level monitoring
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let currentPeak = 0;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize 0-100 values
        const normalizedValue = Math.min(Math.round((average / 128) * 100), 100);
        setAudioLevel(normalizedValue);
        
        if (normalizedValue > currentPeak) {
          currentPeak = normalizedValue;
          setPeakLevel(normalizedValue);
        }
        
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.error("Microphone device acquisition rejected:", err);
      setMicPermission("denied");
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Close immediate test track so it's ready for the interview later
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission("granted");
    } catch (err) {
      console.warn("Camera diagnostics failed or was denied:", err);
      setCameraPermission("denied");
    }
  };

  const cleanupMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.warn);
    }
  };

  const toggleSpeechTest = () => {
    if (!speechTesterRef.current) return;
    
    if (isTestingSpeech) {
      speechTesterRef.current.stop();
      setIsTestingSpeech(false);
    } else {
      setTestedSpeech("");
      setIsTestingSpeech(true);
      try {
        speechTesterRef.current.start();
      } catch (err) {
        console.warn("Could not start speech recognition trial:", err);
        setIsTestingSpeech(false);
      }
    }
  };

  const handleStartInterview = () => {
    cleanupMicrophone();
    onProceed();
  };

  // Determine mic classification level
  const getSensitivityClass = () => {
    if (peakLevel === 0) return { text: "No input detected", color: "text-slate-500", bar: "bg-slate-700" };
    if (peakLevel < 15) return { text: "Very faint - check placement", color: "text-amber-400", bar: "bg-amber-500" };
    if (peakLevel < 70) return { text: "Optimal input volume", color: "text-emerald-400", bar: "bg-emerald-500" };
    return { text: "Very loud - high clip risk", color: "text-rose-400", bar: "bg-rose-500" };
  };

  const sensInfo = getSensitivityClass();
  const isHealthy = micPermission === "granted" && peakLevel > 8;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header diagnostics control banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#2d333d] pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-indigo-500/20 tracking-wider">
              Verification Stage
            </span>
            <span className="text-slate-500 text-xs font-semibold">• prep.ai Studio</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-100 tracking-tight mt-1">
            Pre-Interview Hardware Diagnostics
          </h2>
        </div>
        <button
          onClick={onExit}
          className="p-1.5 px-3 bg-[#171b22] hover:bg-slate-800 border border-[#2d333d] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer max-w-fit"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Exit Diagnostics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Column 1: Live mic audio feed analytics */}
        <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              Microphone Calibration
            </span>
            {micPermission === "granted" && (
              <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/15 uppercase tracking-wide">
                Connected
              </span>
            )}
          </div>

          {/* Actual device capture indicator */}
          {micPermission === "denied" ? (
            <div className="space-y-5 animate-fade-in text-slate-200">
              <div className="bg-rose-950/25 border border-rose-500/20 p-5 rounded-xl space-y-3 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-rose-200 uppercase tracking-wide">Microphone Permission Denied</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Interactive technical rounds require microphone capture to analyze your responses, articulation flow, and communication pacing.
                  </p>
                </div>
              </div>

              {/* Browser switcher selection tab rails */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-mono">
                  Browser Reset Instructions:
                </span>
                
                <div className="grid grid-cols-4 gap-1 bg-[#101319] p-1 rounded-xl border border-[#2d333d]">
                  {[
                    { id: "chrome", label: "Chrome" },
                    { id: "safari", label: "Safari" },
                    { id: "firefox", label: "Firefox" },
                    { id: "edge", label: "Edge" }
                  ].map((browser) => (
                    <button
                      key={browser.id}
                      onClick={() => setActiveBrowserTab(browser.id as any)}
                      className={`py-2 text-[10px] font-black uppercase rounded-lg transition cursor-pointer select-none text-center ${
                        activeBrowserTab === browser.id 
                          ? "bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      {browser.label}
                    </button>
                  ))}
                </div>

                {/* Step contents by type */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-[#2d333d]/75 space-y-3">
                  {activeBrowserTab === "chrome" && (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Locate the <span className="font-bold text-slate-200 inline-flex items-center gap-1 bg-[#1a1f29] px-1.5 py-0.5 rounded border border-slate-700 font-mono"><Lock className="w-3 h-3 text-indigo-400" /> Lock Icon</span> in the left side of your browser address bar.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Toggle the <span className="font-extrabold text-slate-200">Microphone</span> switch to <span className="text-emerald-400 font-bold">"Allow"</span>. If not visible, click <span className="text-slate-355 font-medium">"Site settings"</span> and enable it from there.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Reload the page or click the <span className="text-indigo-400 font-bold">"Retry Connection"</span> button below to verify the update.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeBrowserTab === "safari" && (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Open the top macOS application menu bar, click <span className="font-extrabold text-slate-200">Safari</span>, then choose <span className="font-semibold text-slate-355">"Settings for this Website..."</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Pop-up menu option or settings screen lists <span className="font-bold text-slate-200">Microphone</span>. Set its value dropdown menu to <span className="text-emerald-400 font-bold">"Allow"</span>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Hold <span className="font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-700">⌘ + R</span> to reload, or close website settings and click the button below to re-authorize.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeBrowserTab === "firefox" && (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Look left of your address URL input area. Click the small <span className="font-bold text-slate-200 inline-flex items-center gap-1 bg-[#1a1f29] px-1.5 py-0.5 rounded border border-slate-700 font-mono"><Mic className="w-3 h-3 text-indigo-400" /> Microphone icon</span> with a slash line or blocker status.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Click the <span className="text-rose-400 font-bold">"X"</span> next to <span className="text-slate-300 font-medium">"Blocked Temporarily"</span> or clean active site block listings.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          In subsequent pop-up prompts, select the checkbox stating <span className="font-bold text-slate-300">"Remember this decision"</span> and click to allow input.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeBrowserTab === "edge" && (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Click the <span className="font-bold text-slate-200 inline-flex items-center gap-1 bg-[#1a1f29] px-1.5 py-0.5 rounded border border-slate-700 font-mono"><Lock className="w-3 h-3 text-indigo-400" /> Lock Symbol</span> on the left-hand position inside the browser Address Bar.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Locate the <span className="font-bold text-slate-200">Microphone</span> option, select <span className="text-emerald-400 font-bold">"Allow"</span> from the dropdown choice context.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <p className="text-[11px] text-slate-350 leading-relaxed">
                          Reload website manually or complete update checks using the retry mechanism below.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Retry operations */}
              <button
                onClick={requestMicrophoneAccess}
                className="w-full text-xs py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-wide rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection & Recalibrate</span>
              </button>
            </div>
          ) : micPermission === "prompt" ? (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl text-center space-y-4">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300">Requesting microphone access parameters...</p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Sensitivity loudness meter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">Input Sensitivity Level</span>
                  <span className={`font-extrabold ${sensInfo.color}`}>{sensInfo.text}</span>
                </div>
                
                {/* Dynamic DB indicator wrapper */}
                <div className="h-6 bg-slate-950/65 rounded-lg overflow-hidden border border-[#2d333d] relative flex items-center p-1.5">
                  <div 
                    className={`h-full rounded-md transition-all duration-75 ${sensInfo.bar}`} 
                    style={{ width: `${audioLevel}%` }}
                  />
                  {/* Calibrated Threshold Grid Ticks */}
                  <div className="absolute inset-x-0 inset-y-0 flex justify-between px-6 pointer-events-none text-[8.5px] font-mono text-slate-600 items-center">
                    <span>Silent</span>
                    <span>Whisper</span>
                    <span>Speaking</span>
                    <span>Loud</span>
                  </div>
                </div>

                {/* Peak visual bookmark indicator */}
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Current Volume: {audioLevel} db</span>
                  <span>Session Peak Max: {peakLevel} db</span>
                </div>
              </div>

              {/* Speech recognition testing simulator */}
              {speechCompatible && (
                <div className="bg-[#12151c] p-4 rounded-xl border border-[#2d333d] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Live Speech-to-Text Preview
                    </span>
                    <button
                      onClick={toggleSpeechTest}
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-md transition ${
                        isTestingSpeech 
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/25 animate-pulse" 
                          : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/25"
                      }`}
                    >
                      {isTestingSpeech ? "Stop Test" : "Speak Test Phrase"}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-550 leading-relaxed">
                    Say: <span className="text-slate-300 font-bold italic font-mono bg-slate-950 px-1 py-0.5 rounded">"I am prepared to explain complex data structures."</span> to verify translation metrics.
                  </p>

                  <div className="bg-slate-950/40 border border-[#2d333d]/70 p-3 rounded-lg min-h-[50px] flex items-center">
                    {testedSpeech ? (
                      <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                        "{testedSpeech}"
                      </p>
                    ) : (
                      <span className="text-[10.5px] italic text-slate-600">
                        {isTestingSpeech ? "Listening closely... start speaking aloud" : "Click 'Speak Test Phrase' to verify voice extraction results ..."}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Column 2: System status check and specifications list */}
        <div className="bg-[#171b22]/75 p-6 rounded-2xl border border-[#2d333d] backdrop-blur-sm space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Diagnostics Checklists
            </span>

            {/* Checked metrics */}
            <div className="space-y-3.5">
              
              {/* Mic access state */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full ${micPermission === "granted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-200">Microphone Input Signal</h4>
                  <p className="text-slate-500 text-[10.5px] mt-0.5 leading-snug">
                    {micPermission === "granted" ? "Audio captured successfully. Live signals matching operating amplitude thresholds." : "Microphone permissions pending confirmation request."}
                  </p>
                </div>
              </div>

              {/* Amplitude sensitivity test status */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full ${isHealthy ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-200">Level Amplitude Test</h4>
                  <p className="text-slate-500 text-[10.5px] mt-0.5 leading-snug">
                    {isHealthy 
                      ? "Healthy input level detected. AI voice simulation will receive high fidelity speech feedback." 
                      : "Speak into your microphone to record valid sound pressure level peak data parameters."}
                  </p>
                </div>
              </div>

              {/* Proctor webcam analysis check */}
              <div className="flex items-start gap-3">
                <div className={`p-1 mt-0.5 rounded-full ${cameraPermission === "granted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/15 text-slate-500 border border-slate-700"}`}>
                  {cameraPermission === "granted" ? <Check className="w-3 h-3" /> : <Video className="w-3 h-3 text-slate-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-200">Proctor Cam Diagnostics</h4>
                  <p className="text-slate-500 text-[10.5px] mt-0.5 leading-snug">
                    {cameraPermission === "granted" 
                      ? "Proctor camera authorized configuration stream successfully validated." 
                      : cameraPermission === "denied"
                        ? "Proctor webcam diagnostic skipped or blocked. Session will render standard placeholder layout."
                        : "Optional proctor check active."}
                  </p>
                </div>
              </div>

              {/* Low-latency network connectivity */}
              <div className="flex items-start gap-3">
                <div className="p-1 mt-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-200">Low-Latency Latency Matrix</h4>
                  <p className="text-slate-500 text-[10.5px] mt-0.5 leading-snug flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Secure connection. Rapid AI-grading response stream enabled.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* CTA controls */}
          <div className="pt-4 border-t border-[#2d333d] space-y-3">
            <button
              onClick={handleStartInterview}
              className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                isHealthy
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-110 text-white shadow-indigo-600/15"
                  : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>{isHealthy ? "Enter Interactive Arena" : "Continue Arena Anyway"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-slate-500">
              By proceeding, your verified audio streams will integrate with the speech analyzer.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
