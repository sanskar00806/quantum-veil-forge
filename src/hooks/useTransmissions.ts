import { supabase } from "@/integrations/supabase/client";

export function useTransmissions() {
  const sendImage = async (recipientUsername: string, file: File, algorithm: string = "LSB") => {
    const filePath = `transmissions/${Date.now()}_${file.name}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("encoded-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("encoded-images")
      .getPublicUrl(upload.path);

    const { error: insertError } = await supabase.from("transmissions").insert({
      recipient_username: recipientUsername,
      image_url: urlData.publicUrl,
      algorithm,
    } as any);

    if (insertError) throw insertError;
  };

  const getInbox = async () => {
    const { data, error } = await supabase
      .from("transmissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("transmissions")
      .update({ is_read: true } as any)
      .eq("id", id);
    if (error) throw error;
  };

  return { sendImage, getInbox, markRead };
}
