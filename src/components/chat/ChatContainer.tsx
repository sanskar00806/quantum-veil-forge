import { useEffect, useRef } from "react";
import { useChatStore } from "@/hooks/useChatStore";
import { useAuth } from "@/contexts/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatContainer = () => {
  const { messages, getMessages, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { user } = useAuth();
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?.id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedUser) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwnMessage
                      ? "bg-neon-cyan/20 border-glow-cyan"
                      : "bg-muted/40"
                  }`}
                >
                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Attachment"
                      className="rounded-md mb-2 max-w-full"
                    />
                  )}
                  {message.text && (
                    <p className="text-sm text-foreground">{message.text}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
