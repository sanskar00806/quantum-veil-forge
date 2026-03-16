import { useState } from "react";
import { Shield, Zap, FileImage, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { SteganographyConsole } from "@/components/dashboard/SteganographyConsole";
import { TransmitPanel } from "@/components/dashboard/TransmitPanel";
import { EncryptedInbox } from "@/components/dashboard/EncryptedInbox";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [encodedFile, setEncodedFile] = useState<File | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg scan-lines">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground tracking-wide">
              COMMAND CENTER
            </h1>
            <p className="text-xs font-mono text-muted-foreground">
              STEGACRYPT // QUANTUM ENCRYPTION SUITE v2.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-[10px] font-mono text-neon-green">SYSTEMS ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard label="Operations" value="128" delta="+12%" accentColor="cyan" icon={Zap} />
            <StatCard label="Files Encoded" value="47" delta="+5" accentColor="magenta" icon={FileImage} />
            <StatCard label="Security Level" value="MAX" accentColor="green" icon={Shield} />
            <StatCard label="Active Sessions" value="3" accentColor="violet" icon={Activity} />
          </motion.div>

          {/* Console + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Console */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SteganographyConsole onEncodedFile={setEncodedFile} />
            </motion.div>

            {/* Right Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <TransmitPanel encodedFile={encodedFile} />
              <EncryptedInbox />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
