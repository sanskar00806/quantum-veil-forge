import { useState, useRef } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { useChatStore } from "@/hooks/useChatStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      // Upload image to storage if present
      let imageUrl: string | undefined = undefined;
      
      if (imagePreview) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const file = await fetch(imagePreview).then(r => r.blob());
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      await sendMessage({
        text: text.trim(),
        image_url: imageUrl,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 border-t border-border/30 glass-strong">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20 transition-colors"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-lg transition-colors ${
            imagePreview ? "text-neon-cyan bg-neon-cyan/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          className="flex-1 bg-muted/40 border border-border/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-glow-cyan/50 transition-colors"
          placeholder="Type a secure message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
