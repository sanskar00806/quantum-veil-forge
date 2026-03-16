import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, Lock, Unlock, Archive, Settings, ChevronLeft, ChevronRight, Fingerprint, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Encode", url: "/encode", icon: Lock },
  { title: "Decode", url: "/decode", icon: Unlock },
  { title: "Vault", url: "/vault", icon: Archive },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen flex flex-col glass-strong border-r border-border/50 relative z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-border/30">
        <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border-glow-cyan flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-neon-cyan" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h1 className="text-sm font-bold font-display text-foreground tracking-widest">STEGACRYPT</h1>
            <p className="text-[10px] text-muted-foreground font-mono">v2.0 // QUANTUM</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-neon-cyan/10 text-neon-cyan border-glow-cyan"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-neon-cyan")} />
              {!collapsed && <span className="font-display">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 pb-2">
        {user && !collapsed && (
          <div className="glass rounded-lg p-3 mb-2">
            <p className="text-[10px] font-mono text-neon-cyan truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="font-display">Sign Out</span>}
        </button>
      </div>

      {/* Security badge */}
      <div className="px-3 pb-4">
        <div className={cn("glass rounded-lg p-3 border-glow-cyan", collapsed && "p-2")}>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-neon-cyan flex-shrink-0 animate-pulse-glow" />
            {!collapsed && (
              <div>
                <p className="text-[10px] font-mono text-neon-cyan">SECURE SESSION</p>
                <p className="text-[9px] text-muted-foreground">AES-256 ACTIVE</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors z-30"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  );
}
