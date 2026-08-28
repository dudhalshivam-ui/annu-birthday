import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Track } from "../types";

export const MUSIC_STORAGE_BUCKET = "birthday-music";
export const MUSIC_TABLE = "music_tracks";

export interface DbMusicTrack {
  id: string;
  title: string;
  artist: string;
  file_path: string | null;
  audio_url: string;
  created_at: string;
}

const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac", "webm", "flac"];
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Validates audio file type and size.
 */
export const validateAudioFile = (file: File | Blob): { valid: boolean; error?: string } => {
  if (file instanceof File && file.name) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported audio format (.${ext}). Please upload an MP3, M4A, WAV, or OGG file.`,
      };
    }
  } else if (file.type && !file.type.startsWith("audio/")) {
    return {
      valid: false,
      error: "Selected file is not an audio file. Please select a valid audio track.",
    };
  }

  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      valid: false,
      error: "Audio file is too large. Maximum allowed size is 25MB.",
    };
  }

  return { valid: true };
};

/**
 * Generates a unique storage path for an audio track.
 */
export const getUniqueAudioStoragePath = (originalFilename?: string): string => {
  const ext = originalFilename ? originalFilename.split(".").pop()?.toLowerCase() || "mp3" : "mp3";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `tracks/audio_${timestamp}_${randomSuffix}.${ext}`;
};

/**
 * Uploads an audio file to Supabase Storage `birthday-music` and records it in `music_tracks` table.
 */
export const uploadAudioTrack = async (
  file: File | Blob,
  title: string,
  artist: string
): Promise<Track> => {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid audio file");
  }

  if (isSupabaseConfigured() && supabase) {
    const filename = file instanceof File ? file.name : "track.mp3";
    const filePath = getUniqueAudioStoragePath(filename);

    // 1. Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from(MUSIC_STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase Music Storage] Upload error:", uploadError);
      throw new Error(`Music storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from(MUSIC_STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Save track metadata to Supabase Database `music_tracks` table
    const { data: insertedData, error: dbError } = await supabase
      .from(MUSIC_TABLE)
      .insert({
        title: title.trim(),
        artist: (artist || "Romantic Melody").trim(),
        file_path: filePath,
        audio_url: publicUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Supabase Music DB] Database error:", dbError);
      throw new Error(`Failed to save song record: ${dbError.message}`);
    }

    return {
      id: insertedData.id,
      title: insertedData.title,
      artist: insertedData.artist,
      audioUrl: insertedData.audio_url,
      filePath: insertedData.file_path,
      createdAt: new Date(insertedData.created_at).getTime(),
    };
  } else {
    // Fallback when Supabase is not configured (offline / local dev)
    const localUrl = URL.createObjectURL(file);
    return {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      artist: (artist || "Romantic Melody").trim(),
      audioUrl: localUrl,
      createdAt: Date.now(),
    };
  }
};

/**
 * Adds an external audio URL track to Supabase Database `music_tracks` table.
 */
export const addExternalTrack = async (
  title: string,
  artist: string,
  audioUrl: string
): Promise<Track> => {
  if (!audioUrl.trim()) {
    throw new Error("Please provide a valid audio URL.");
  }

  if (isSupabaseConfigured() && supabase) {
    const { data: insertedData, error: dbError } = await supabase
      .from(MUSIC_TABLE)
      .insert({
        title: title.trim(),
        artist: (artist || "Romantic Melody").trim(),
        file_path: null,
        audio_url: audioUrl.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Supabase Music DB] Database insert error:", dbError);
      throw new Error(`Failed to save song: ${dbError.message}`);
    }

    return {
      id: insertedData.id,
      title: insertedData.title,
      artist: insertedData.artist,
      audioUrl: insertedData.audio_url,
      filePath: insertedData.file_path,
      createdAt: new Date(insertedData.created_at).getTime(),
    };
  } else {
    return {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      artist: (artist || "Romantic Melody").trim(),
      audioUrl: audioUrl.trim(),
      createdAt: Date.now(),
    };
  }
};

/**
 * Fetches all music tracks from Supabase Database `music_tracks` table.
 */
export const fetchAllMusicTracks = async (): Promise<Track[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from(MUSIC_TABLE)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Supabase Music DB] Error fetching tracks:", error);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((t: DbMusicTrack) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          audioUrl: t.audio_url,
          filePath: t.file_path || undefined,
          createdAt: t.created_at ? new Date(t.created_at).getTime() : undefined,
        }));
      }
      return [];
    } catch (err) {
      console.error("[Supabase Music DB] Error in fetchAllMusicTracks:", err);
      return [];
    }
  }
  return [];
};

/**
 * Deletes a music track from Supabase Database and Storage bucket if file_path exists.
 */
export const deleteMusicTrack = async (id: string, filePath?: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Delete audio file from Supabase Storage if it was uploaded
      if (filePath) {
        await supabase.storage.from(MUSIC_STORAGE_BUCKET).remove([filePath]);
      } else {
        // Query to check if track had a file_path
        const { data } = await supabase
          .from(MUSIC_TABLE)
          .select("file_path")
          .eq("id", id)
          .maybeSingle();

        if (data?.file_path) {
          await supabase.storage.from(MUSIC_STORAGE_BUCKET).remove([data.file_path]);
        }
      }

      // 2. Delete track record from Database
      const { error: dbError } = await supabase
        .from(MUSIC_TABLE)
        .delete()
        .eq("id", id);

      if (dbError) {
        console.error("[Supabase Music DB] Failed to delete track record:", dbError);
        throw new Error(`Failed to delete song: ${dbError.message}`);
      }
    } catch (err) {
      console.error("[Supabase Music DB] Delete track error:", err);
      throw err;
    }
  }
};
