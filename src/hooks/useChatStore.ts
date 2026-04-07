import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string | null;
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

// Helper to create a deterministic room_id from two user IDs
function getRoomId(userA: string, userB: string): string {
  return [userA, userB].sort().join("_");
}

// Parse content to extract image URLs and clean text
function parseContent(content: string): { text?: string; image_url?: string } {
  const imageMatch = content.match(/\[image:(.*?)\]/);
  const image_url = imageMatch ? imageMatch[1] : undefined;
  const text = content.replace(/\[image:.*?\]/g, "").trim() || undefined;
  return { text, image_url };
}

interface ChatState {
  messages: Message[];
  contacts: ChatUser[];
  selectedUser: ChatUser | null;
  isMessagesLoading: boolean;
  isUsersLoading: boolean;
  onlineUsers: string[];
  currentUserId: string | null;
  messageChannel: RealtimeChannel | null;
  presenceChannel: RealtimeChannel | null;
  
  getCurrentUser: () => Promise<void>;
  getContacts: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image_url?: string; file?: File }) => Promise<void>;
  setSelectedUser: (user: ChatUser | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setupPresenceSubscription: () => void;
  setOnlineUsers: (userIds: string[]) => void;
  addMessage: (message: Message) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
  addContactByEmail: (user: ChatUser) => Promise<void>;
  cleanup: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  contacts: [],
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,
  onlineUsers: [],
  currentUserId: null,
  messageChannel: null,
  presenceChannel: null,

  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        set({ currentUserId: user.id });
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  },

  getContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, avatar_url")
        .neq("user_id", user.id);

      if (error) throw error;
      
      set({ 
        contacts: (data || []).map(profile => ({
          id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || undefined,
          avatar_url: profile.avatar_url || undefined,
          is_online: get().onlineUsers.includes(profile.user_id),
        }))
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const roomId = getRoomId(user.id, userId);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      set({ 
        messages: (data || []).map(msg => {
          const parsed = parseContent(msg.content);
          return {
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            text: parsed.text,
            image_url: parsed.image_url,
            created_at: msg.created_at || new Date().toISOString(),
          };
        })
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData: { text?: string; image_url?: string; file?: File }) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let content = messageData.text || "";

      // Upload image if file is provided
      if (messageData.file) {
        const fileExt = messageData.file.name.split('.').pop();
        const fileName = `${user.id}_${selectedUser.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, messageData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        content = content ? `${content}\n[image:${publicUrl}]` : `[image:${publicUrl}]`;
      }

      if (!content.trim()) return;

      const roomId = getRoomId(user.id, selectedUser.id);

      const { data, error } = await supabase
        .from("messages")
        .insert([{
          sender_id: user.id,
          receiver_id: selectedUser.id,
          user_id: user.id,
          room_id: roomId,
          content: content,
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const parsed = parseContent(data.content);
        const newMsg: Message = {
          id: data.id,
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          text: parsed.text,
          image_url: parsed.image_url,
          created_at: data.created_at || new Date().toISOString(),
        };
        set({ messages: [...get().messages, newMsg] });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, messages: [] });
    
    if (selectedUser) {
      get().getMessages(selectedUser.id);
      setTimeout(() => get().subscribeToMessages(), 100);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, currentUserId, messageChannel } = get();
    if (!selectedUser || !currentUserId) return;

    if (messageChannel) {
      supabase.removeChannel(messageChannel);
    }

    const roomId = getRoomId(currentUserId, selectedUser.id);

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const raw = payload.new as any;
          const parsed = parseContent(raw.content);
          const newMessage: Message = {
            id: raw.id,
            sender_id: raw.sender_id,
            receiver_id: raw.receiver_id,
            text: parsed.text,
            image_url: parsed.image_url,
            created_at: raw.created_at || new Date().toISOString(),
          };
          const exists = get().messages.some(m => m.id === newMessage.id);
          if (!exists) {
            set({ messages: [...get().messages, newMessage] });
          }
        }
      )
      .subscribe();

    set({ messageChannel: channel });
  },

  unsubscribeFromMessages: () => {
    const { messageChannel } = get();
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      set({ messageChannel: null });
    }
  },

  setupPresenceSubscription: () => {
    const { presenceChannel } = get();
    if (presenceChannel) {
      supabase.removeChannel(presenceChannel);
    }

    const channel = supabase.channel('presence:chat', {
      config: { presence: { key: 'user_id' } }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUserIds = Object.keys(state);
      set({ onlineUsers: onlineUserIds });
      
      const { contacts } = get();
      set({ contacts: contacts.map(c => ({ ...c, is_online: onlineUserIds.includes(c.id) })) });
    })
    .on('presence', { event: 'join' }, ({ key }) => {
      const { onlineUsers } = get();
      if (!onlineUsers.includes(key)) {
        set({ onlineUsers: [...onlineUsers, key] });
      }
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      set({ onlineUsers: get().onlineUsers.filter(id => id !== key) });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { currentUserId } = get();
        if (currentUserId) {
          await channel.track({ user_id: currentUserId, online: true });
        }
      }
    });

    set({ presenceChannel: channel });
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  addMessage: (message: Message) => {
    if (!get().messages.some(m => m.id === message.id)) {
      set({ messages: [...get().messages, message] });
    }
  },

  updateUserOnlineStatus: (userId: string, isOnline: boolean) => {
    const { contacts, onlineUsers } = get();
    const newOnlineUsers = isOnline 
      ? [...new Set([...onlineUsers, userId])]
      : onlineUsers.filter(id => id !== userId);
    
    set({ 
      onlineUsers: newOnlineUsers,
      contacts: contacts.map(c => c.id === userId ? { ...c, is_online: isOnline } : c)
    });
  },

  addContactByEmail: async (user: ChatUser) => {
    const { contacts } = get();
    if (!contacts.some(c => c.id === user.id)) {
      set({ contacts: [...contacts, user] });
    }
    await get().getContacts();
  },

  cleanup: () => {
    const { messageChannel, presenceChannel } = get();
    if (messageChannel) supabase.removeChannel(messageChannel);
    if (presenceChannel) supabase.removeChannel(presenceChannel);
    set({ messageChannel: null, presenceChannel: null });
  },
}));
