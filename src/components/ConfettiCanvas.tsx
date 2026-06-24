import React, { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "circle" | "rect" | "triangle";
}

const CONFETTI_COLORS = [
  "#6366f1", // indigo-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
];

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let pieces: ConfettiPiece[] = [];

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Spawning function - burst of particles from left and right edges or general spread
    const createPiece = (side: "left" | "right" | "random"): ConfettiPiece => {
      const isLeft = side === "left";
      const isRight = side === "right";
      
      let x = Math.random() * canvas.width;
      let y = -20;
      let speedX = (Math.random() - 0.5) * 4;
      let speedY = Math.random() * 5 + 3;

      if (isLeft) {
        x = 0;
        y = canvas.height * 0.75 + (Math.random() - 0.5) * 100;
        speedX = Math.random() * 8 + 6;
        speedY = -(Math.random() * 10 + 10);
      } else if (isRight) {
        x = canvas.width;
        y = canvas.height * 0.75 + (Math.random() - 0.5) * 100;
        speedX = -(Math.random() * 8 + 6);
        speedY = -(Math.random() * 10 + 10);
      }

      const shapes: Array<"circle" | "rect" | "triangle"> = ["circle", "rect", "triangle"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      return {
        x,
        y,
        size: Math.random() * 7 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedX,
        speedY,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
        opacity: 1,
        shape,
      };
    };

    // Initial burst
    for (let i = 0; i < 75; i++) {
      pieces.push(createPiece("left"));
      pieces.push(createPiece("right"));
    }

    // Steady trail
    let remainingSpawns = 60;
    const spawnTimer = setInterval(() => {
      if (remainingSpawns > 0) {
        pieces.push(createPiece("random"));
        remainingSpawns--;
      } else {
        clearInterval(spawnTimer);
      }
    }, 100);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];

        // Apply physics
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22; // Gravity
        p.speedX *= 0.98; // Friction
        p.rotation += p.rotationSpeed;
        
        // Custom drifting wind
        p.x += Math.sin(p.y / 30) * 0.25;

        // Fade out as it goes low or ages
        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.015;
        }

        // Remove dead/offscreen pieces
        if (p.opacity <= 0 || p.x < -20 || p.x > canvas.width + 20 || p.y > canvas.height + 20) {
          pieces.splice(i, 1);
          continue;
        }

        // Render piece
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (pieces.length > 0 || remainingSpawns > 0) {
        animationFrameId = requestAnimationFrame(updateAndDraw);
      }
    };

    updateAndDraw();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(spawnTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
