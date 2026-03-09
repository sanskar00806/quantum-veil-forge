import { Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

const Decode = () => {

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const handleDecode = async () => {

  if (!file || !password) {
    alert("Upload image and enter password");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  try {

    const res = await fetch("http://127.0.0.1:8000/decode", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    setResult(data.message);   // FIX HERE

  } catch (err) {

    console.error(err);
    alert("Decoding failed");

  }
};

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">

      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Decode</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Extract hidden messages from steganographic images
          </p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-12 text-center max-w-md space-y-4"
        >

          <div className="w-16 h-16 rounded-2xl glass border-glow-cyan flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-accent" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            Decode Mode
          </h3>

          <p className="text-sm text-muted-foreground">
            Upload an encoded image to extract the hidden message.
          </p>

          {/* Upload image */}

          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs"
          />

          {/* Password */}

          <input
            type="password"
            placeholder="Enter password"
            className="w-full px-3 py-2 rounded bg-background border text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Decode button */}

          <Button
            variant="glass-accent"
            className="gap-2 font-mono text-xs"
            onClick={handleDecode}
          >
            <Upload className="w-4 h-4" />
            Decode Image
          </Button>

          {/* Result */}

          {result && (
            <div className="mt-4 p-3 rounded bg-background border text-sm font-mono break-all">
              <b>Decoded Message:</b>
              <br />
              {result}
            </div>
          )}

        </motion.div>

      </div>
    </div>
  );
};

export default Decode;