import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  color: string;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = [
      "hsl(185, 100%, 55%)",   // cyan
      "hsl(300, 100%, 50%)",   // magenta
      "hsl(270, 90%, 65%)",    // violet
      "hsl(150, 100%, 50%)",   // green
    ];

    const particles: Particle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(")", `, ${particle.opacity})`);
        ctx.fill();

        particle.y -= particle.speedY;
        particle.opacity -= 0.002;

        if (particle.y < -10 || particle.opacity <= 0) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
          particle.opacity = Math.random() * 0.5 + 0.2;
          particle.size = Math.random() * 3 + 1;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

export function GlowingOrb({ 
  position = "center",
  color = "cyan",
  size = "medium"
}: { 
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  color?: "cyan" | "magenta" | "violet";
  size?: "small" | "medium" | "large";
}) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const colorClasses = {
    cyan: "bg-neon-cyan/20 shadow-neon-cyan",
    magenta: "bg-neon-magenta/20 shadow-neon-magenta",
    violet: "bg-violet/20 shadow-violet",
  };

  const sizeClasses = {
    small: "w-32 h-32 blur-3xl",
    medium: "w-64 h-64 blur-3xl",
    large: "w-96 h-96 blur-3xl",
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
