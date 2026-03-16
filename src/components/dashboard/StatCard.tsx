import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  accentColor: "cyan" | "magenta" | "green" | "violet";
  icon: LucideIcon;
}

const accentMap = {
  cyan: {
    border: "accent-border-cyan",
    icon: "text-neon-cyan",
    bg: "bg-neon-cyan/10",
    delta: "text-neon-cyan",
  },
  magenta: {
    border: "accent-border-magenta",
    icon: "text-neon-magenta",
    bg: "bg-neon-magenta/10",
    delta: "text-neon-magenta",
  },
  green: {
    border: "accent-border-green",
    icon: "text-neon-green",
    bg: "bg-neon-green/10",
    delta: "text-neon-green",
  },
  violet: {
    border: "accent-border-violet",
    icon: "text-violet",
    bg: "bg-violet/10",
    delta: "text-violet",
  },
};

export function StatCard({ label, value, delta, accentColor, icon: Icon }: StatCardProps) {
  const styles = accentMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass rounded-lg p-4", styles.border)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", styles.bg)}>
          <Icon className={cn("w-4 h-4", styles.icon)} />
        </div>
        {delta && (
          <span className={cn("text-xs font-mono", styles.delta)}>{delta}</span>
        )}
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
    </motion.div>
  );
}
