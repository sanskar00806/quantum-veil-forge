import { useState, useCallback, useEffect } from "react";
import { Zap, Download, RotateCcw, Sparkles, Lock, Image as ImageIcon, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { MessageInput } from "@/components/MessageInput";
import { EncryptionPipeline, type EncryptionStep } from "@/components/EncryptionPipeline";
import { OutputGallery } from "@/components/OutputGallery";
import { motion } from "framer-motion";
import { GlowingOrb } from "@/components/ParticleBackground";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [encodedPreview, setEncodedPreview] = useState<string | null>(null);
  const [encodedBlob, setEncodedBlob] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [currentStep, setCurrentStep] = useState<EncryptionStep>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setOriginalPreview(url);
    } else {
      setOriginalPreview(null);
    }
    setEncodedPreview(null);
    setIsComplete(false);
    setCurrentStep(0);
  }, []);

  const handleExecute = useCallback(async () => {
    if (!file || !message || !password) return;

    setIsProcessing(true);
    try {
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 700));
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 700));
      setCurrentStep(3);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", message);
      formData.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/encode", {
        method: "POST",
        body: formData
      });

      const blob = await res.blob();
      setEncodedBlob(blob);
      const encodedUrl = URL.createObjectURL(blob);
      setEncodedPreview(encodedUrl);
      setIsComplete(true);
    } catch (err) {
      console.error(err);
      alert("Encoding failed");
    }
    setIsProcessing(false);
  }, [file, message, password]);

  const handleExport = () => {
    if (!encodedBlob) return;
    const url = URL.createObjectURL(encodedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encoded-image.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleReset = () => {
    setFile(null);
    setOriginalPreview(null);
    setEncodedPreview(null);
    setEncodedBlob(null);
    setMessage("");
    setPassword("");
    setCurrentStep(0);
    setIsProcessing(false);
    setIsComplete(false);
  };

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (encodedPreview) URL.revokeObjectURL(encodedPreview);
    };
  }, [originalPreview, encodedPreview]);

  const canExecute = file && message.length > 0 && password.length > 0 && !isProcessing;

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg relative">
      {/* Ambient Glow Orbs */}
      <GlowingOrb position="top-right" color="magenta" size="large" />
      <GlowingOrb position="bottom-left" color="cyan" size="medium" />

      {/* HEADER */}
      <header className="px-6 py-4 border-b border-border/30 glass-strong relative z-10">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-neon-cyan" />
              Encode
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Hide messages within images using 3-level quantum encryption
            </p>
          </motion.div>

          <div className="flex items-center gap-2">
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button
                  variant="glass-accent"
                  size="sm"
                  className="gap-1.5 font-mono text-xs border-glow-cyan"
                  onClick={handleExport}
                >
                  <Download className="w-3 h-3" />
                  Export
                </Button>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs hover:bg-muted/40"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* INPUT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass rounded-xl p-5 space-y-6 border-glow-cyan/30">
              {/* File Upload Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono text-neon-cyan">
                  <ImageIcon className="w-4 h-4" />
                  <span>STEP 1 // SELECT COVER IMAGE</span>
                </div>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  file={file}
                  previewUrl={originalPreview}
                />
              </div>

              {/* Message Input Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono text-neon-magenta">
                  <Sparkles className="w-4 h-4" />
                  <span>STEP 2 // ENTER SECRET MESSAGE</span>
                </div>
                <MessageInput
                  value={message}
                  onChange={setMessage}
                />
              </div>

              {/* Password Input Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono text-violet">
                  <Lock className="w-4 h-4" />
                  <span>STEP 3 // SET ENCRYPTION KEY</span>
                </div>
                <input
                  type="password"
                  placeholder="Enter encryption password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border/50 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet/50 transition-colors"
                />
              </div>

              {/* Execute Button */}
              <Button
                variant="execute"
                size="lg"
                className="w-full gap-2 font-mono text-sm h-12 glow-cyan"
                disabled={!canExecute}
                onClick={handleExecute}
              >
                <Zap className="w-4 h-4" />
                {isProcessing
                  ? "EXECUTING PIPELINE..."
                  : isComplete
                  ? "PIPELINE COMPLETE"
                  : "EXECUTE STEGANOGRAPHY"}
              </Button>
            </div>
          </motion.div>

          {/* PIPELINE + OUTPUT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Pipeline Visualization */}
            <div className="glass rounded-xl p-5 border-glow-violet/30">
              <div className="flex items-center gap-2 text-sm font-mono text-violet mb-4">
                <Cpu className="w-4 h-4" />
                <span>ENCRYPTION PIPELINE STATUS</span>
              </div>
              <EncryptionPipeline
                currentStep={currentStep}
                isProcessing={isProcessing}
              />
            </div>

            {/* Output Gallery */}
            <div className="glass rounded-xl p-5 border-glow-green/30">
              <div className="flex items-center gap-2 text-sm font-mono text-neon-green mb-4">
                <Download className="w-4 h-4" />
                <span>OUTPUT PREVIEW</span>
              </div>
              <OutputGallery
                originalUrl={originalPreview}
                resultUrl={encodedPreview}
                isComplete={isComplete}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
