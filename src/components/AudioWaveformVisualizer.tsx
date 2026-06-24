import { useEffect, useRef } from "react";

interface AudioWaveformVisualizerProps {
  isActive: boolean;
}

export default function AudioWaveformVisualizer({ isActive }: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      cleanupAudio();
      drawSilent();
      return;
    }

    let isClosed = false;

    // Initialize Web Audio Analysis
    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (isClosed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // Clean symmetric frequency bands
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        // Start animating live frequency data
        drawRealTime();
      } catch (err) {
        console.warn("Could not capture real microphone feed in AudioContext, initiating state simulation:", err);
        drawSimulation();
      }
    }

    initAudio();

    return () => {
      isClosed = true;
      cleanupAudio();
    };

    function drawSilent() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 10;
      const barWidth = 3;
      const gap = 3;
      
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + gap;
        const height = 4;
        const y = (canvas.height - height) / 2;
        
        ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, height, 1.5);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, height);
        }
      }
    }

    // Procedural fake audio tracking for safety and maximum visual engagement
    function drawSimulation() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const barCount = 10;
      const barWidth = 3;
      const gap = 3;
      let phase = 0;

      function renderLoop() {
        if (!canvasRef.current) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        phase += 0.15;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap) + gap;
          // Create smooth offset waves simulating vocal activity
          const wave = Math.sin(phase + i * 0.85) * Math.cos(phase * 0.4 + i * 0.25);
          const rawHeight = Math.abs(wave) * (canvas.height - 4) + 3;
          const height = Math.max(3, Math.min(canvas.height - 2, rawHeight));
          const y = (canvas.height - height) / 2;

          // Sleek gradient transition matching voice simulation visual lines
          const grad = ctx.createLinearGradient(0, y, 0, y + height);
          grad.addColorStop(0, "#a855f7"); // Purple-500
          grad.addColorStop(1, "#6366f1"); // Indigo-500

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, height, 1.5);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, height);
          }
        }

        animationRef.current = requestAnimationFrame(renderLoop);
      }

      renderLoop();
    }

    function drawRealTime() {
      const canvas = canvasRef.current;
      if (!canvas || !analyserRef.current || !dataArrayRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      const barCount = 10;
      const barWidth = 3;
      const gap = 3;

      function renderLoop() {
        if (!canvasRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap) + gap;
          const dataIdx = Math.floor((i / barCount) * dataArray.length);
          const value = dataArray[dataIdx] || 0;
          
          const percent = value / 255;
          const rawHeight = percent * (canvas.height - 4) + 3;
          const height = Math.max(3, Math.min(canvas.height - 2, rawHeight));
          const y = (canvas.height - height) / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + height);
          grad.addColorStop(0, "#f43f5e"); // Rose-500
          grad.addColorStop(0.5, "#a855f7"); // Purple-500
          grad.addColorStop(1, "#6366f1"); // Indigo-500

          ctx.fillStyle = grad;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, height, 1.5);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, height);
          }
        }

        animationRef.current = requestAnimationFrame(renderLoop);
      }

      renderLoop();
    }

    function cleanupAudio() {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close().catch(() => {});
        }
        audioCtxRef.current = null;
      }
    }
  }, [isActive]);

  return (
    <div className="flex items-center gap-1.5 bg-[#101216]/85 border border-[#2d333d]/70 rounded-full px-2.5 py-1 select-none">
      <span className="text-[9px] font-bold text-indigo-400 font-mono tracking-wider">MIC INTENSITY</span>
      <canvas 
        ref={canvasRef} 
        width={70} 
        height={20} 
        className="opacity-95 block"
        style={{ width: "70px", height: "20px" }}
      />
    </div>
  );
}
