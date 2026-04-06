import { useState } from "react";
import { Shield, Zap, FileImage, Activity, Cpu, Network, Database, Lock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SteganographyConsole } from "@/components/dashboard/SteganographyConsole";
import { TransmitPanel } from "@/components/dashboard/TransmitPanel";
import { EncryptedInbox } from "@/components/dashboard/EncryptedInbox";
import { motion } from "framer-motion";
import { GlowingOrb } from "@/components/ParticleBackground";

export default function Dashboard() {
  const [encodedFile, setEncodedFile] = useState<File | null>(null);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg scan-lines relative">
      {/* Ambient Glow Orbs */}
      <GlowingOrb position="top-right" color="violet" size="large" />
      <GlowingOrb position="bottom-left" color="cyan" size="medium" />
      
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 glass-strong relative z-10">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold font-display text-foreground tracking-wide flex items-center gap-3">
              <Shield className="w-6 h-6 text-neon-cyan animate-pulse-glow" />
              COMMAND CENTER
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              STEGACRYPT // QUANTUM ENCRYPTION SUITE v2.0
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border-glow-green"
          >
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[10px] font-mono text-neon-green">SYSTEMS ONLINE</span>
          </motion.div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 p-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Enhanced Stat Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Operations" value="128" delta="+12%" accentColor="cyan" icon={Zap} />
            <StatCard label="Files Encoded" value="47" delta="+5" accentColor="magenta" icon={FileImage} />
            <StatCard label="Security Level" value="MAX" accentColor="green" icon={Shield} />
            <StatCard label="Active Sessions" value="3" accentColor="violet" icon={Activity} />
          </motion.div>

          {/* Feature Highlights */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 border-glow-cyan hover:glow-cyan transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="w-5 h-5 text-neon-cyan" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">AES-256 Encryption</h3>
              </div>
              <p className="text-xs text-muted-foreground">Military-grade encryption for your sensitive data</p>
            </div>
            
            <div className="glass rounded-xl p-4 border-glow-magenta hover:glow-magenta transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-neon-magenta/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Network className="w-5 h-5 text-neon-magenta" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Steganography</h3>
              </div>
              <p className="text-xs text-muted-foreground">Hide messages within images invisibly</p>
            </div>
            
            <div className="glass rounded-xl p-4 border-glow-violet hover:glow-violet transition-all duration-300 group cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5 text-violet" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Secure Vault</h3>
              </div>
              <p className="text-xs text-muted-foreground">Store and manage encrypted files securely</p>
            </div>
          </motion.div>

          {/* Console + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Console */}
            <motion.div variants={itemVariants}>
              <SteganographyConsole onEncodedFile={setEncodedFile} />
            </motion.div>

            {/* Right Sidebar */}
            <motion.div variants={itemVariants} className="space-y-4">
              <TransmitPanel encodedFile={encodedFile} />
              <EncryptedInbox />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
