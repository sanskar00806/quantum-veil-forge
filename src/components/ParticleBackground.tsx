import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  color: string;
  speedX: number;
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
      "hsl(185, 100%, 70%)",   // bright cyan
    ];

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 0.5,
      speedY: Math.random() * 0.8 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color.replace(")", `, ${particle.opacity})`));
        gradient.addColorStop(1, particle.color.replace(")", ", 0)"));
        
        ctx.fillStyle = gradient;
        ctx.fill();

        particle.y -= particle.speedY;
        particle.x += particle.speedX + Math.sin(time + index) * 0.2;
        particle.opacity -= 0.0015;

        // Add twinkle effect
        particle.size = Math.max(0.1, particle.size + Math.sin(time * 5 + index) * 0.05);

        if (particle.y < -10 || particle.opacity <= 0) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
          particle.opacity = Math.random() * 0.6 + 0.1;
          particle.size = Math.random() * 4 + 0.5;
          particle.speedX = (Math.random() - 0.5) * 0.3;
        }
      });

      // Draw connecting lines between nearby particles
      ctx.strokeStyle = "hsl(185, 100%, 55%, 0.05)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.globalAlpha = (1 - distance / 100) * 0.3;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

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
      style={{ opacity: 0.7 }}
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
