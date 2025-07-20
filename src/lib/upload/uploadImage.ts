import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Use env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(file: File) {
  const filePath = `images/${uuidv4()}`;

  const { data, error } = await supabase.storage
    .from("alvas")
    .upload(filePath, file);
  console.log(data);

  if (error) {
    console.error("Error uploading file:", error.message);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("alvas").getPublicUrl(filePath);

  if (!publicUrl) {
    console.error("Error generating public URL:", "error");
    throw new Error("Error");
  }

  console.log("Public URL:", publicUrl);
  return publicUrl;
}
