import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "@/components/chat/Sidebar";
import NoChatSelected from "@/components/chat/NoChatSelected";
import ChatContainer from "@/components/chat/ChatContainer";
import { useChatStore } from "@/hooks/useChatStore";

const Chat = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="flex-1 flex min-h-screen overflow-hidden grid-bg">
      <header className="absolute top-0 left-0 right-0 px-6 py-4 border-b border-border/30 glass-strong z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border-glow-cyan flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Secure Chat</h2>
            <p className="text-xs text-muted-foreground font-mono">
              End-to-end encrypted messaging
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex pt-20 pb-6 px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-6xl mx-auto bg-secondary/50 rounded-xl border border-border/50 overflow-hidden shadow-2xl h-[calc(100vh-8rem)]"
        >
          <div className="flex h-full">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;
