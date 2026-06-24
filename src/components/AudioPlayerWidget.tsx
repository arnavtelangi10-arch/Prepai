import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Sparkles, Sliders } from "lucide-react";

interface AudioPlayerWidgetProps {
  src: string;
  title?: string;
}

export default function AudioPlayerWidget({ src, title }: AudioPlayerWidgetProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    // Reset player state when source changes
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
    if (audioRef.current) {
      audioRef.current.playbackRate = 1;
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Playback prevented:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const changeSpeed = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    audioRef.current.playbackRate = nextRate;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#121620] border border-indigo-500/25 p-4 rounded-2xl space-y-3.5 shadow-xl transition hover:border-indigo-500/45 w-full">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {title && (
        <div className="flex items-center gap-1.5 border-b border-[#2d333d]/50 pb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-black tracking-wide text-slate-300 uppercase truncate">
            {title}
          </span>
        </div>
      )}

      {/* Main play controllers */}
      <div className="flex items-center gap-4">
        {/* Play/Pause CTA Circular button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/15 cursor-pointer active:scale-95"
          title={isPlaying ? "Pause audio playback" : "Play vocal capture"}
        >
          {isPlaying ? (
            <Pause className="w-4.5 h-4.5 text-white" fill="white" />
          ) : (
            <Play className="w-4.5 h-4.5 text-white translate-x-0.5" fill="white" />
          )}
        </button>

        {/* Restart/Reset Button */}
        <button
          onClick={restartAudio}
          className="p-2 bg-[#1a1e27] hover:bg-[#252b36] border border-[#2d333d] text-slate-400 hover:text-slate-200 rounded-xl transition cursor-pointer"
          title="Restart audio playback"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Dynamic Seeker Tracker */}
        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1b212f] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Speed Adjustment Widget */}
        <button
          onClick={changeSpeed}
          className="p-1 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase font-mono tracking-widest font-black rounded-lg transition"
          title="Playback pacing controller (Speed multiplier)"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Voice diagnostic feedback tag */}
      <div className="flex items-center justify-between text-[9px] text-slate-650 text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-slate-400" />
          <span>Fidelity: Standard High Definition Loop</span>
        </span>
        <span className="bg-[#1b212f] text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
          {playbackRate > 1.2 ? "Fast Pacing Review" : "Natural Tone Mode"}
        </span>
      </div>
    </div>
  );
}
