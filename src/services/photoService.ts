import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { ChapterId, SlotId } from "../types";
import { setStoragePhoto, deleteStoragePhoto } from "./storageService";

export const STORAGE_BUCKET = "birthday-photos";
export const PHOTOS_TABLE = "photos";

export interface PhotoRecord {
  id?: string;
  chapter_id: string;
  slot_id: number;
  file_path: string;
  file_url: string;
  title?: string;
  caption?: string;
  category?: string;
  created_at?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates file type and size.
 */
export const validateImageFile = (file: File | Blob): { valid: boolean; error?: string } => {
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload a JPG, PNG, or WEBP image.",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File is too large. Maximum allowed size is 10MB.",
    };
  }
  return { valid: true };
};

/**
 * Generates a unique file path for a Journey slot.
 */
export const getUniqueStoragePath = (
  chapterId: string,
  slotId: number,
  originalFilename?: string
): string => {
  const ext = originalFilename ? originalFilename.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `journey/${chapterId}_slot-${slotId}_${timestamp}_${randomSuffix}.${ext}`;
};

/**
 * Uploads a photo to Supabase Storage and records it in the Supabase Database `photos` table.
 * Returns the public image URL.
 */
export const uploadJourneyPhoto = async (
  chapterId: ChapterId,
  slotId: SlotId,
  file: File | Blob
): Promise<{ imageUrl: string; filePath: string }> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file");
  }

  if (isSupabaseConfigured() && supabase) {
    const filename = file instanceof File ? file.name : `photo_${chapterId}_${slotId}.jpg`;
    const filePath = getUniqueStoragePath(chapterId, slotId, filename);

    // 1. Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase Storage] Upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Upsert record in Supabase Database `photos` table
    const { error: dbError } = await supabase
      .from(PHOTOS_TABLE)
      .upsert(
        {
          chapter_id: chapterId,
          slot_id: slotId,
          file_path: filePath,
          file_url: publicUrl,
          created_at: new Date().toISOString(),
        },
        { onConflict: "chapter_id,slot_id" }
      );

    if (dbError) {
      console.error("[Supabase DB] Database error:", dbError);
      throw new Error(`Database record failed: ${dbError.message}`);
    }

    return { imageUrl: publicUrl, filePath };
  } else {
    // DEV FALLBACK: When Supabase credentials are not provided
    await setStoragePhoto(chapterId, slotId, file);
    const fallbackUrl = URL.createObjectURL(file);
    return { imageUrl: fallbackUrl, filePath: `local_${chapterId}_${slotId}` };
  }
};

/**
 * Fetches all photos from Supabase Database `photos` table.
 */
export const fetchAllJourneyPhotos = async (): Promise<PhotoRecord[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from(PHOTOS_TABLE)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Supabase DB] Failed to fetch photos:", error);
        return [];
      }
      return (data as PhotoRecord[]) || [];
    } catch (err) {
      console.error("[Supabase DB] Error in fetchAllJourneyPhotos:", err);
      return [];
    }
  }
  return [];
};

/**
 * Deletes a photo from Supabase Database and Supabase Storage.
 */
export const deleteJourneyPhoto = async (
  chapterId: ChapterId,
  slotId: SlotId
): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Find file_path first
      const { data } = await supabase
        .from(PHOTOS_TABLE)
        .select("file_path")
        .eq("chapter_id", chapterId)
        .eq("slot_id", slotId)
        .maybeSingle();

      if (data?.file_path) {
        // Delete from Storage bucket
        await supabase.storage.from(STORAGE_BUCKET).remove([data.file_path]);
      }

      // Delete from Database
      await supabase
        .from(PHOTOS_TABLE)
        .delete()
        .eq("chapter_id", chapterId)
        .eq("slot_id", slotId);
    } catch (err) {
      console.error("[Supabase DB] Delete photo error:", err);
    }
  }

  // Also clean local fallback if present
  try {
    await deleteStoragePhoto(chapterId, slotId);
  } catch {
    // Ignore fallback deletion error
  }
};
