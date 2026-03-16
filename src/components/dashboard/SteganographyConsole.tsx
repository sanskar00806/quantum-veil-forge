import { useState, useCallback } from "react";
import { Zap, Download, Upload, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "encode" | "decode";

interface SteganographyConsoleProps {
  onEncodedFile?: (file: File) => void;
}

export function SteganographyConsole({ onEncodedFile }: SteganographyConsoleProps) {
  const [mode, setMode] = useState<Mode>("encode");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [decodedMessage, setDecodedMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    setResultBlob(null);
    setDecodedMessage("");
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]?.type.startsWith("image/")) handleFile(files[0]);
  }, [handleFile]);

  const handleEncode = async () => {
    if (!file || !message || !password) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", message);
      formData.append("password", password);
      const res = await fetch("http://127.0.0.1:8000/encode", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Encoding failed");
      const blob = await res.blob();
      setResultBlob(blob);
      const encodedFile = new File([blob], "encoded.png", { type: "image/png" });
      onEncodedFile?.(encodedFile);
      toast({ title: "Encode Complete", description: "Message embedded successfully." });
    } catch {
      toast({ title: "Error", description: "Encoding failed. Is the backend running?", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleDecode = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);
      const res = await fetch("http://127.0.0.1:8000/decode", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Decoding failed");
      const data = await res.json();
      setDecodedMessage(data.message);
      toast({ title: "Decode Complete", description: "Hidden message extracted." });
    } catch {
      toast({ title: "Error", description: "Decoding failed.", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleExport = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encoded-image.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("glass-strong rounded-xl overflow-hidden transition-all", isProcessing && "animate-neon-pulse")}>
      {/* Mode Tabs */}
      <div className="flex border-b border-border/30">
        {(["encode", "decode"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResultBlob(null); setDecodedMessage(""); }}
            className={cn(
              "flex-1 py-3 text-sm font-mono uppercase tracking-widest transition-all",
              mode === m
                ? "text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
            )}
          >
            {m === "encode" ? "⟨ ENCODE ⟩" : "⟨ DECODE ⟩"}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Drop Zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden",
            isDragging ? "border-neon-cyan bg-neon-cyan/5 glow-cyan" :
            file ? "border-neon-cyan/30" : "border-border/50 hover:border-muted-foreground/30"
          )}
        >
          <AnimatePresence mode="wait">
            {previewUrl ? (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                <img src={previewUrl} alt="Cover" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <span className="text-xs font-mono text-neon-cyan truncate max-w-[200px]">{file?.name}</span>
                  <button onClick={() => handleFile(null)} className="text-xs font-mono text-destructive hover:underline">REMOVE</button>
                </div>
              </motion.div>
            ) : (
              <label className="flex flex-col items-center justify-center py-10 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm text-foreground">Drop image or <span className="text-neon-cyan">browse</span></p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
              </label>
            )}
          </AnimatePresence>
        </div>

        {/* Message (encode only) */}
        {mode === "encode" && (
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Secret Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to embed..."
              rows={3}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 resize-none transition-colors"
            />
          </div>
        )}

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Lock className="w-3 h-3 inline mr-1" />Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="w-full bg-muted/30 border border-border/50 rounded-lg px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-colors"
          />
        </div>

        {/* Action Button */}
        <Button
          variant="execute"
          className="w-full gap-2 font-mono text-sm h-11"
          disabled={!file || !password || (mode === "encode" && !message) || isProcessing}
          onClick={mode === "encode" ? handleEncode : handleDecode}
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>
          ) : mode === "encode" ? (
            <><Zap className="w-4 h-4" /> EXECUTE ENCODE</>
          ) : (
            <><Lock className="w-4 h-4" /> EXECUTE DECODE</>
          )}
        </Button>

        {/* Results */}
        {resultBlob && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
            <Button variant="glass-accent" size="sm" className="flex-1 font-mono text-xs" onClick={handleExport}>
              <Download className="w-3 h-3 mr-1" /> EXPORT IMAGE
            </Button>
          </motion.div>
        )}
        {decodedMessage && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-4 border-glow-cyan">
            <p className="text-[10px] font-mono text-neon-cyan uppercase mb-2">Decoded Message</p>
            <p className="text-sm font-mono text-foreground break-all">{decodedMessage}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
