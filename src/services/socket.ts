// Socket-like real-time communication using Supabase Realtime
// This module wraps Supabase channels to provide a socket-like API
import { supabase } from "@/integrations/supabase/client";

let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

export const initSocket = async () => {
  if (presenceChannel) return presenceChannel;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  presenceChannel = supabase.channel('global-presence', {
    config: { presence: { key: session.user.id } }
  });

  presenceChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel!.track({ user_id: session.user.id, online: true });
      console.log("Realtime presence connected");
    }
  });

  return presenceChannel;
};

export const getSocket = () => presenceChannel;

export const disconnectSocket = () => {
  if (presenceChannel) {
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
};

// Chat-specific functions using Supabase Realtime
export const joinChatRoom = (roomId: string) => {
  return supabase.channel(`room:${roomId}`).subscribe();
};

export const leaveChatRoom = (roomId: string) => {
  const channel = supabase.channel(`room:${roomId}`);
  supabase.removeChannel(channel);
};

export const updateUserStatus = (status: "online" | "offline") => {
  if (!presenceChannel) return;
  presenceChannel.track({ online: status === "online" });
};

export const onUserStatusChange = (callback: (data: { userId: string; status: string }) => void) => {
  if (!presenceChannel) return;
  presenceChannel.on('presence', { event: 'sync' }, () => {
    const state = presenceChannel!.presenceState();
    Object.keys(state).forEach(userId => {
      callback({ userId, status: 'online' });
    });
  });
};

export const offUserStatusChange = (_callback: (data: { userId: string; status: string }) => void) => {
  // Supabase handles cleanup via removeChannel
};
