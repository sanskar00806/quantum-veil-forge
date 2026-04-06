import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <div className="w-20 h-20 rounded-2xl bg-neon-cyan/10 border-glow-cyan flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-neon-cyan" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Welcome to Secure Chat</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Select a contact from the sidebar to start encrypted messaging
        </p>
      </motion.div>
    </div>
  );
};

export default NoChatSelected;
