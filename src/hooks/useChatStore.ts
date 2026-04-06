import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { 
  initSocket, 
  getSocket, 
  disconnectSocket,
  joinChatRoom, 
  leaveChatRoom,
  sendSocketMessage,
  onNewMessage,
  offNewMessage,
  updateUserStatus,
  onUserStatusChange,
  offUserStatusChange,
} from "@/services/socket";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text?: string;
  image_url?: string;
  created_at: string;
}

export interface ChatUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface ChatState {
  messages: Message[];
  users: ChatUser[];
  selectedUser: ChatUser | null;
  isMessagesLoading: boolean;
  isUsersLoading: boolean;
  onlineUsers: string[];
  socketInitialized: boolean;
  
  // Actions
  initializeSocket: () => Promise<void>;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image_url?: string }) => Promise<void>;
  sendSocketMessage: (messageData: { text?: string; image_url?: string }) => void;
  setSelectedUser: (user: ChatUser | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setOnlineUsers: (userIds: string[]) => void;
  addMessage: (message: Message) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,
  onlineUsers: [],
  socketInitialized: false,

  initializeSocket: async () => {
    if (get().socketInitialized) return;
    
    try {
      await initSocket();
      const socket = getSocket();
      
      if (socket) {
        set({ socketInitialized: true });
        
        // Listen for new messages via socket
        onNewMessage(async (newMessage: Message) => {
          const { selectedUser } = get();
          const { data: { user } } = await supabase.auth.getUser();
          
          // Only add message if it's part of the current conversation
          if (selectedUser && 
              ((newMessage.sender_id === user?.id && newMessage.receiver_id === selectedUser.id) ||
               (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === user?.id))) {
            set({ messages: [...get().messages, newMessage] });
          }
        });
        
        // Listen for user status changes
        onUserStatusChange(({ userId, status }) => {
          get().updateUserOnlineStatus(userId, status === "online");
        });
        
        // Update own status to online
        updateUserStatus("online");
      }
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .neq("id", user.id);

      if (error) throw error;
      
      set({ 
        users: (data || []).map(profile => ({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          is_online: get().onlineUsers.includes(profile.id),
        }))
      });
    } catch (error: any) {
      console.error("Error fetching users:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      set({ 
        messages: (data || []).map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          text: msg.text,
          image_url: msg.image_url,
          created_at: msg.created_at,
        }))
      });
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: { text?: string; image_url?: string }) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert message to database
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          text: messageData.text,
          image_url: messageData.image_url,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state immediately
      set({ 
        messages: [...get().messages, {
          id: data.id,
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          text: data.text,
          image_url: data.image_url,
          created_at: data.created_at,
        }]
      });

      // Also emit via socket for real-time delivery
      const socket = getSocket();
      if (socket && get().socketInitialized) {
        const roomId = [user.id, selectedUser.id].sort().join("_");
        sendSocketMessage({
          roomId,
          sender_id: user.id,
          receiver_id: selectedUser.id,
          text: messageData.text,
          image_url: messageData.image_url,
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
    }
  },

  sendSocketMessage: (messageData: { text?: string; image_url?: string }) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      const socket = getSocket();
      if (socket && get().socketInitialized) {
        const roomId = [user.id, selectedUser.id].sort().join("_");
        sendSocketMessage({
          roomId,
          sender_id: user.id,
          receiver_id: selectedUser.id,
          text: messageData.text,
          image_url: messageData.image_url,
        });
      }
    });
  },

  setSelectedUser: (selectedUser) => {
    // Leave previous room if exists
    const prevUser = get().selectedUser;
    if (prevUser) {
      const prevRoomId = [prevUser.id, (get() as any).userId].sort().join("_");
      leaveChatRoom(prevRoomId);
    }
    
    set({ selectedUser });
    
    // Join new room
    if (selectedUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        const roomId = [user.id, selectedUser.id].sort().join("_");
        joinChatRoom(roomId);
      });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Supabase realtime subscription as backup
      const channel = supabase
        .channel(`chat:${selectedUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Only add if not already added via socket
            const exists = get().messages.some(m => m.id === newMessage.id);
            if (!exists) {
              set({ messages: [...get().messages, newMessage] });
            }
          }
        )
        .subscribe();
    });
  },

  unsubscribeFromMessages: () => {
    supabase.removeAllChannels();
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  addMessage: (message: Message) => {
    const exists = get().messages.some(m => m.id === message.id);
    if (!exists) {
      set({ messages: [...get().messages, message] });
    }
  },

  updateUserOnlineStatus: (userId: string, isOnline: boolean) => {
    const { users, onlineUsers } = get();
    
    // Update online users list
    const newOnlineUsers = isOnline 
      ? [...new Set([...onlineUsers, userId])]
      : onlineUsers.filter(id => id !== userId);
    
    set({ onlineUsers: newOnlineUsers });
    
    // Update user's online status in users list
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, is_online: isOnline } : user
    );
    
    set({ users: updatedUsers });
  },
}));
