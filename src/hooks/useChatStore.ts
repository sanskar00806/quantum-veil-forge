import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

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
  
  // Actions
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image_url?: string }) => Promise<void>;
  setSelectedUser: (user: ChatUser | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setOnlineUsers: (userIds: string[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,
  onlineUsers: [],

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
          is_online: false,
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
    } catch (error: any) {
      console.error("Error sending message:", error);
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const channel = supabase
      .channel(`chat:${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${supabase.auth.getUser().then(({ data }) => data?.user?.id)}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          set({ messages: [...get().messages, newMessage] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  unsubscribeFromMessages: () => {
    supabase.removeAllChannels();
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
}));
