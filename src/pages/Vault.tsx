import { useEffect, useState } from "react";
import { Archive, Clock, Shield, Download, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VaultItem {
  id: string;
  file_name: string;
  created_at: string;
  encryption_method: string;
  file_size: number;
  file_url?: string;
}

const Vault = () => {
  const { user } = useAuth();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVaultItems();
  }, [user]);

  const fetchVaultItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("encrypted_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setVaultItems((data || []).map(item => ({
        id: item.id,
        file_name: item.title,
        created_at: item.created_at,
        encryption_method: item.encryption_method || "AES-256+LSB",
        file_size: item.file_size_bytes || 0,
        file_url: item.encrypted_file_url || undefined,
      })));
    } catch (error) {
      console.error("Error fetching vault items:", error);
      toast.error("Failed to load vault items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (item: VaultItem) => {
    if (!item.file_url) {
      toast.error("File not available");
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from("vault-files")
        .createSignedUrl(item.file_url, 60);

      if (error) throw error;

      window.open(data?.signedUrl, "_blank");
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("encrypted_files")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setVaultItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Item deleted from vault");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "Unknown";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-auto grid-bg">
      <header className="px-6 py-4 border-b border-border/30 glass-strong">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vault</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Encrypted history of all steganographic operations
          </p>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading vault...</div>
        ) : vaultItems.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">Vault is Empty</h3>
            <p className="text-sm text-muted-foreground">
              Encode files to store them securely in your vault
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vaultItems.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-lg p-4 flex items-center gap-4 hover:border-glow-violet transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{entry.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-mono text-accent">{entry.encryption_method}</span>
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(entry.file_size)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(entry)}
                    className="p-2 rounded-lg hover:bg-neon-cyan/10 text-muted-foreground hover:text-neon-cyan transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
