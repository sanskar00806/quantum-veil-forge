import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransmissions } from "@/hooks/useTransmissions";
import { useToast } from "@/hooks/use-toast";

interface TransmitPanelProps {
  encodedFile: File | null;
}

export function TransmitPanel({ encodedFile }: TransmitPanelProps) {
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const { sendImage } = useTransmissions();
  const { toast } = useToast();

  const handleSend = async () => {
    if (!encodedFile || !recipient.trim()) return;
    setSending(true);
    try {
      await sendImage(recipient.trim(), encodedFile);
      toast({ title: "Transmitted", description: `Image sent to ${recipient}` });
      setRecipient("");
    } catch (err: any) {
      toast({ title: "Transmission Failed", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-mono text-neon-cyan uppercase tracking-widest">
        ⟨ Transmit to Agent ⟩
      </h3>
      <input
        type="text"
        placeholder="Recipient username..."
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 transition-colors"
      />
      <Button
        variant="glass-accent"
        size="sm"
        className="w-full font-mono text-xs gap-2"
        disabled={!encodedFile || !recipient.trim() || sending}
        onClick={handleSend}
      >
        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        {sending ? "TRANSMITTING..." : "TRANSMIT"}
      </Button>
      {!encodedFile && (
        <p className="text-[10px] text-muted-foreground font-mono text-center">
          Encode an image first to transmit
        </p>
      )}
    </div>
  );
}
