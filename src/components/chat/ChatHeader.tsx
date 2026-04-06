import { X } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { useAuth } from "@/contexts/AuthContext";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { user } = useAuth();

  if (!selectedUser) return null;

  return (
    <div className="p-4 border-b border-border/30 glass-strong flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border-glow-cyan flex items-center justify-center">
          <span className="text-sm font-semibold text-neon-cyan">
            {(selectedUser.full_name || selectedUser.email)[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-medium text-foreground">{selectedUser.full_name || selectedUser.email}</h3>
          <p className="text-xs text-muted-foreground">Encrypted Channel</p>
        </div>
      </div>
      <button 
        onClick={() => setSelectedUser(null)}
        className="p-2 hover:bg-muted/40 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default ChatHeader;
