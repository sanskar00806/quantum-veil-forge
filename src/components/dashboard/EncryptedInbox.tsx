import { useEffect, useState } from "react";
import { Mail, MailOpen, ExternalLink } from "lucide-react";
import { useTransmissions } from "@/hooks/useTransmissions";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Transmission {
  id: string;
  sender_id: string;
  recipient_username: string;
  image_url: string;
  algorithm: string;
  is_read: boolean;
  created_at: string;
}

export function EncryptedInbox() {
  const [messages, setMessages] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { getInbox, markRead } = useTransmissions();

  useEffect(() => {
    getInbox().then((data) => {
      setMessages((data || []) as Transmission[]);
      setLoading(false);
    }).catch(() => setLoading(false));

    const channel = supabase
      .channel("inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transmissions" },
        (payload) => {
          setMessages((prev) => [payload.new as Transmission, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleMarkRead = async (id: string) => {
    await markRead(id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 animate-neon-pulse">
        <p className="text-xs font-mono text-muted-foreground text-center">Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <h3 className="text-xs font-mono text-neon-cyan uppercase tracking-widest">
          ⟨ Encrypted Inbox ⟩
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {messages.filter((m) => !m.is_read).length} unread
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="p-6 text-center">
              <Mail className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-mono">No transmissions yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "px-4 py-3 border-b border-border/20 flex items-center gap-3 cursor-pointer transition-colors hover:bg-muted/20",
                  !msg.is_read && "bg-neon-cyan/5"
                )}
                onClick={() => !msg.is_read && handleMarkRead(msg.id)}
              >
                {msg.is_read ? (
                  <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Mail className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground truncate">
                    From: {msg.sender_id.slice(0, 8)}...
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {msg.algorithm} • {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
                <a href={msg.image_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-neon-cyan transition-colors" />
                </a>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
