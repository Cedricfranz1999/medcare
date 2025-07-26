import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(file: File) {
  const filePath = `images/${uuidv4()}`;
  const bucketName = "medcare";

  // Upload the file with explicit content type
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type, // Add this line
    });

  if (uploadError) {
    console.error("Error uploading file:", uploadError.message);
    throw uploadError;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  if (!publicUrl) {
    console.error("Error generating public URL");
    throw new Error("Failed to generate public URL");
  }

  return publicUrl;
}
