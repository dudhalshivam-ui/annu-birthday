import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { MemoryItem, MemoryCategory } from "../types";

export const MEMORY_STORAGE_BUCKET = "birthday-memories";
export const MEMORIES_TABLE = "memories";

export interface DbMemory {
  id: string;
  title: string;
  date: string;
  category: string;
  image_path: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
}

const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/** Validates image file format and size. */
export const validateMemoryImage = (
  file: File | Blob
): { valid: boolean; error?: string } => {
  if (file.type && !ALLOWED_IMAGE_MIME.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported format. Please upload a JPG, PNG, WEBP, or GIF image.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: "Image is too large. Maximum allowed size is 15 MB." };
  }
  return { valid: true };
};

/** Generates a unique storage path for a memory image. */
const getUniqueMemoryPath = (originalFilename?: string): string => {
  const ext = originalFilename
    ? originalFilename.split(".").pop()?.toLowerCase() || "jpg"
    : "jpg";
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `uploads/memory_${timestamp}_${rand}.${ext}`;
};

/**
 * Converts a DbMemory row from Supabase into a MemoryItem used by React state.
 */
export const dbRowToMemoryItem = (row: DbMemory): MemoryItem => ({
  id: row.id,
  title: row.title,
  date: row.date,
  category: row.category as MemoryCategory,
  imageUrl: row.image_url,
  caption: row.caption ?? undefined,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

// ────────────────────────────────────────────────────────────────────────────
// Fetch all memories from Supabase
// ────────────────────────────────────────────────────────────────────────────

export const fetchAllMemories = async (): Promise<MemoryItem[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from(MEMORIES_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase Memories] Failed to fetch memories:", error);
      return [];
    }

    return ((data as DbMemory[]) || []).map(dbRowToMemoryItem);
  } catch (err) {
    console.error("[Supabase Memories] Unexpected error in fetchAllMemories:", err);
    return [];
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Add a memory (with optional image upload)
// ────────────────────────────────────────────────────────────────────────────

export interface AddMemoryInput {
  title: string;
  date: string;
  category: MemoryCategory;
  caption?: string;
  /** Supply file when the user picked a local image. */
  imageFile?: File | Blob;
  /** Supply imageUrl when user pasted an external URL (no file). */
  imageUrl?: string;
}

export const addMemoryToSupabase = async (
  input: AddMemoryInput
): Promise<MemoryItem> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  let publicUrl = input.imageUrl ?? "";
  let filePath: string | null = null;

  // 1. Upload image file if provided
  if (input.imageFile) {
    const validation = validateMemoryImage(input.imageFile);
    if (!validation.valid) throw new Error(validation.error);

    const filename =
      input.imageFile instanceof File ? input.imageFile.name : "memory.jpg";
    filePath = getUniqueMemoryPath(filename);

    const { error: uploadError } = await supabase.storage
      .from(MEMORY_STORAGE_BUCKET)
      .upload(filePath, input.imageFile, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      console.error("[Supabase Memories Storage] Upload error:", uploadError);
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(MEMORY_STORAGE_BUCKET)
      .getPublicUrl(filePath);
    publicUrl = urlData.publicUrl;
  }

  if (!publicUrl) throw new Error("Please provide an image file or URL.");

  // 2. Insert record into memories table
  const { data: inserted, error: dbError } = await supabase
    .from(MEMORIES_TABLE)
    .insert({
      title: input.title.trim(),
      date: (input.date || "Special Day").trim(),
      category: input.category,
      image_path: filePath,
      image_url: publicUrl,
      caption: input.caption?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    console.error("[Supabase Memories DB] Insert error:", dbError);
    throw new Error(`Failed to save memory: ${dbError.message}`);
  }

  return dbRowToMemoryItem(inserted as DbMemory);
};

// ────────────────────────────────────────────────────────────────────────────
// Delete a memory (Database + Storage)
// ────────────────────────────────────────────────────────────────────────────

export const deleteMemoryFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    // 1. Find the image_path for this record so we can clean up Storage
    const { data } = await supabase
      .from(MEMORIES_TABLE)
      .select("image_path")
      .eq("id", id)
      .maybeSingle();

    if (data?.image_path) {
      await supabase.storage
        .from(MEMORY_STORAGE_BUCKET)
        .remove([data.image_path]);
    }

    // 2. Delete the database record
    const { error: dbError } = await supabase
      .from(MEMORIES_TABLE)
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("[Supabase Memories DB] Delete error:", dbError);
      throw new Error(`Failed to delete memory: ${dbError.message}`);
    }
  } catch (err) {
    console.error("[Supabase Memories] Delete error:", err);
    throw err;
  }
};
