import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  currentUserId: string | null;
  messageChannel: RealtimeChannel | null;
  presenceChannel: RealtimeChannel | null;
  
  // Actions
  getCurrentUser: () => Promise<void>;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image_url?: string; file?: File }) => Promise<void>;
  setSelectedUser: (user: ChatUser | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setupPresenceSubscription: () => void;
  setOnlineUsers: (userIds: string[]) => void;
  addMessage: (message: Message) => void;
  updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
  cleanup: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
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

  sendMessage: async (messageData: { text?: string; image_url?: string; file?: File }) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = messageData.image_url;

      // Upload image if file is provided
      if (messageData.file) {
        const fileExt = messageData.file.name.split('.').pop();
        const fileName = `${user.id}_${selectedUser.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, messageData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Insert message to database
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          text: messageData.text,
          image_url: imageUrl,
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
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, messages: [] });
    
    // Load messages for selected user
    if (selectedUser) {
      get().getMessages(selectedUser.id);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, currentUserId, messageChannel } = get();
    if (!selectedUser || !currentUserId) return;

    // Unsubscribe from previous channel
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${currentUserId}:${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId}))`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if not already in list
          const exists = get().messages.some(m => m.id === newMessage.id);
          if (!exists) {
            set({ messages: [...get().messages, newMessage] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to messages channel');
        }
      });

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
      config: {
        presence: {
          key: 'user_id'
        }
      }
    })
    .on('system', { event: '*' }, (payload) => {
      console.log('System event:', payload);
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUserIds = Object.keys(state);
      set({ onlineUsers: onlineUserIds });
      
      // Update users with online status
      const { users } = get();
      const updatedUsers = users.map(user => ({
        ...user,
        is_online: onlineUserIds.includes(user.id)
      }));
      set({ users: updatedUsers });
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
      const { onlineUsers } = get();
      if (!onlineUsers.includes(key)) {
        set({ onlineUsers: [...onlineUsers, key] });
      }
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
      const { onlineUsers } = get();
      set({ onlineUsers: onlineUsers.filter(id => id !== key) });
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

  cleanup: () => {
    const { messageChannel, presenceChannel } = get();
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
    }
    if (presenceChannel) {
      supabase.removeChannel(presenceChannel);
    }
    set({ messageChannel: null, presenceChannel: null });
  },
}));
