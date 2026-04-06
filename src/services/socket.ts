import { io, Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";

let socket: Socket | null = null;

export const initSocket = () => {
  if (socket) return socket;

  // Get the current user's token for authentication
  const connectSocket = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    socket = io("http://localhost:8000", {
      auth: {
        token: session?.access_token,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return socket;
  };

  return connectSocket();
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Chat-specific socket functions
export const joinChatRoom = (roomId: string) => {
  if (!socket) return;
  socket.emit("join_room", roomId);
};

export const leaveChatRoom = (roomId: string) => {
  if (!socket) return;
  socket.emit("leave_room", roomId);
};

export const sendSocketMessage = (data: {
  roomId: string;
  sender_id: string;
  receiver_id: string;
  text?: string;
  image_url?: string;
}) => {
  if (!socket) return;
  socket.emit("send_message", data);
};

export const onNewMessage = (callback: (message: any) => void) => {
  if (!socket) return;
  socket.on("new_message", callback);
};

export const offNewMessage = (callback: (message: any) => void) => {
  if (!socket) return;
  socket.off("new_message", callback);
};

// Online status
export const updateUserStatus = (status: "online" | "offline") => {
  if (!socket) return;
  socket.emit("update_status", { status });
};

export const onUserStatusChange = (callback: (data: { userId: string; status: string }) => void) => {
  if (!socket) return;
  socket.on("user_status", callback);
};

export const offUserStatusChange = (callback: (data: { userId: string; status: string }) => void) => {
  if (!socket) return;
  socket.off("user_status", callback);
};
