import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type {
  ChapterId,
  SlotId,
  ChapterDef,
  MemoryItem,
  Track,
  ActiveSection,
  JourneyPhotoSlot,
} from "../types";
import { CHAPTER_IDS, SLOT_IDS, getStoragePhoto } from "../services/storageService";
import {
  uploadJourneyPhoto,
  fetchAllJourneyPhotos,
  deleteJourneyPhoto,
} from "../services/photoService";
import {
  fetchAllMusicTracks,
  uploadAudioTrack,
  addExternalTrack,
  deleteMusicTrack,
} from "../services/musicService";
import { isSupabaseConfigured } from "../services/supabaseClient";
import {
  getAllMemories,
  persistAddMemory,
  persistDeleteMemory,
  seedDefaultMemoriesOnce,
} from "../services/memoryStorageService";
import {
  fetchAllMemories,
  addMemoryToSupabase,
  deleteMemoryFromSupabase,
} from "../services/memoryService";
import type { AddMemoryInput } from "../services/memoryService";

// ────────────────────────────────────────────────────────────────────────────
// Static data
// ────────────────────────────────────────────────────────────────────────────
export const CHAPTER_DEFINITIONS: ChapterDef[] = [
  { id: "chapter-01", badge: "CHAPTER 01", title: "The Beginning",    subtitle: "Where our story started",     description: "Every grand love story has a quiet first chapter. Looking back at how our worlds collided and changed forever.", quote: "\"The best thing to hold onto in life is each other.\"" },
  { id: "chapter-02", badge: "CHAPTER 02", title: "Little Moments",   subtitle: "The magic in everyday life",  description: "It is the quiet coffee mornings, late night conversations, shared laughs, and silly faces that mean the world.", quote: "\"You are my favorite place to go to when my mind searches for peace.\"" },
  { id: "chapter-03", badge: "CHAPTER 03", title: "Your Smile",       subtitle: "Light in every room",         description: "Your laughter is my favorite sound, and your smile lights up even the darkest days of my life.", quote: "\"I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more.\"" },
  { id: "chapter-04", badge: "CHAPTER 04", title: "Us",               subtitle: "Side by side, through it all", description: "We built our own little world full of inside jokes, warm warmth, unwavering support, and endless affection.", quote: "\"In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.\"" },
  { id: "chapter-05", badge: "CHAPTER 05", title: "Forever",          subtitle: "Our endless adventure",       description: "Looking into tomorrow with excitement. Here is to celebrating your birthday today, tomorrow, and every year forever.", quote: "\"Whatever our souls are made of, yours and mine are the same.\"" },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  { id: "mem-1", title: "Sunsets & Soft Whispers",  date: "Summer Days",     category: "FAVORITE MEMORIES", imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1000&auto=format&fit=crop", caption: "A golden evening where time stood completely still.", createdAt: 1700000001000 },
  { id: "mem-2", title: "Your Radiant Laughter",    date: "Pure Joy",        category: "HER \u2764\uFE0F",           imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop", caption: "That unforgettable smile that brightens my whole universe.", createdAt: 1700000002000 },
  { id: "mem-3", title: "Our Favorite Escapes",     date: "Weekend Gateway", category: "US",                imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop", caption: "Hand in hand, exploring new horizons together.", createdAt: 1700000003000 },
  { id: "mem-4", title: "Starlit Evening",           date: "Celebration",     category: "SPECIAL MOMENTS",   imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop", caption: "Making a wish under the midnight sky.", createdAt: 1700000004000 },
];

export const INITIAL_TRACKS: Track[] = [
  { id: "track-1", title: "A Thousand Years (Acoustic Piano)", artist: "Love Theme",      audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112185.mp3" },
  { id: "track-2", title: "Cinematic Romance",                 artist: "Ambient Strings", audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=soft-piano-romantic-10874.mp3" },
];

// ────────────────────────────────────────────────────────────────────────────
// Context type
// ────────────────────────────────────────────────────────────────────────────
export interface AddTrackParams {
  title: string;
  artist: string;
  audioUrl?: string;
  file?: File | Blob;
}

interface BirthdayContextType {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  isMediaManagerOpen: boolean;
  setIsMediaManagerOpen: (open: boolean) => void;
  isMusicManagerOpen: boolean;
  setIsMusicManagerOpen: (open: boolean) => void;

  activeChapterId: ChapterId;
  setActiveChapterId: (id: ChapterId) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number | ((prev: number) => number)) => void;

  journeyPhotos: Record<string, JourneyPhotoSlot>;
  getJourneyPhoto:    (chapterId: ChapterId, slotId: SlotId) => JourneyPhotoSlot | undefined;
  getJourneyPhotoUrl: (chapterId: ChapterId, slotId: SlotId) => string | null;
  setJourneyPhoto:    (chapterId: ChapterId, slotId: SlotId, blob: Blob) => Promise<void>;
  clearJourneyPhoto:  (chapterId: ChapterId, slotId: SlotId) => Promise<void>;

  memories: MemoryItem[];
  addMemory:    (input: AddMemoryInput) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  isMemoriesLoading: boolean;

  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  addTrack:    (params: AddTrackParams) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;

  isStorageLoaded: boolean;
  isPhotosLoading: boolean;
  isMusicLoading: boolean;
}

const BirthdayContext = createContext<BirthdayContextType | undefined>(undefined);

// ────────────────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────────────────
export const BirthdayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection]       = useState<ActiveSection>("home");
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState<boolean>(false);
  const [isMusicManagerOpen, setIsMusicManagerOpen] = useState<boolean>(false);
  const [activeChapterId, setActiveChapterIdState]  = useState<ChapterId>("chapter-01");
  const [activeSlideIndex, setActiveSlideIndex]     = useState<number>(0);

  // Build empty initial state (no blobs, no objectUrls)
  const [journeyPhotos, setJourneyPhotos] = useState<Record<string, JourneyPhotoSlot>>(() => {
    const init: Record<string, JourneyPhotoSlot> = {};
    for (const chapterId of CHAPTER_IDS) {
      for (const slotId of SLOT_IDS) {
        init[`${chapterId}_${slotId}`] = { chapterId, slotId, imageUrl: null, publicId: null };
      }
    }
    return init;
  });

  const journeyPhotosRef = useRef<Record<string, JourneyPhotoSlot>>(journeyPhotos);
  useEffect(() => { journeyPhotosRef.current = journeyPhotos; }, [journeyPhotos]);

  // Kept for dev-mode blob URL cleanup only
  const objectUrlMapRef = useRef<Map<string, string>>(new Map());

  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);
  const [isPhotosLoading, setIsPhotosLoading] = useState<boolean>(true);
  const [isMusicLoading, setIsMusicLoading]   = useState<boolean>(true);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState<boolean>(true);
  const [memories, setMemories]               = useState<MemoryItem[]>([]);
  const [tracks, setTracks]                   = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying]             = useState<boolean>(false);

  const setActiveChapterId = useCallback((id: ChapterId) => {
    setActiveChapterIdState(id);
    setActiveSlideIndex(0);
  }, []);

  // ── Initialization: Load Photos & Music from Supabase (or local fallback) ──
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsPhotosLoading(true);
      setIsMusicLoading(true);
      const loadedPhotos: Record<string, JourneyPhotoSlot> = {};

      // Initialize all 25 slots as empty by default
      for (const chapterId of CHAPTER_IDS) {
        for (const slotId of SLOT_IDS) {
          loadedPhotos[`${chapterId}_${slotId}`] = {
            chapterId,
            slotId,
            imageUrl: null,
            publicId: null,
          };
        }
      }

      // 1. Photos from Supabase
      if (isSupabaseConfigured()) {
        const photoRecords = await fetchAllJourneyPhotos();
        for (const record of photoRecords) {
          const key = `${record.chapter_id}_${record.slot_id}`;
          loadedPhotos[key] = {
            chapterId: record.chapter_id as ChapterId,
            slotId: record.slot_id as SlotId,
            imageUrl: record.file_url,
            publicId: record.file_path,
            updatedAt: record.created_at ? new Date(record.created_at).getTime() : Date.now(),
          };
        }
      } else {
        // DEV FALLBACK: IndexedDB + blob URLs
        for (const chapterId of CHAPTER_IDS) {
          for (const slotId of SLOT_IDS) {
            const ck = `${chapterId}_${slotId}`;
            const blob = await getStoragePhoto(chapterId, slotId);
            if (blob) {
              const url = URL.createObjectURL(blob);
              objectUrlMapRef.current.set(ck, url);
              loadedPhotos[ck] = {
                chapterId,
                slotId,
                imageUrl: url,
                publicId: null,
                updatedAt: Date.now(),
              };
            }
          }
        }
      }

      // 2. Music from Supabase
      let loadedTracks: Track[] = INITIAL_TRACKS;
      if (isSupabaseConfigured()) {
        const dbTracks = await fetchAllMusicTracks();
        if (dbTracks.length > 0) {
          loadedTracks = dbTracks;
        }
      }

      // 3. Memories: Supabase (cross-device) or IndexedDB fallback (local dev)
      let loadedMemories: MemoryItem[] = [];
      if (isSupabaseConfigured()) {
        loadedMemories = await fetchAllMemories();
        // If Supabase is empty on first visit, seed the defaults into Supabase
        if (loadedMemories.length === 0) {
          // Seed silently — don't block the UI
          const seedPromises = INITIAL_MEMORIES.map((m) =>
            addMemoryToSupabase({
              title: m.title,
              date: m.date,
              category: m.category,
              caption: m.caption,
              imageUrl: m.imageUrl,
            }).catch(() => null) // ignore seed failures
          );
          const seeded = (await Promise.all(seedPromises)).filter(Boolean) as MemoryItem[];
          if (seeded.length > 0) loadedMemories = seeded.reverse();
        }
      } else {
        // DEV FALLBACK: IndexedDB
        await seedDefaultMemoriesOnce(INITIAL_MEMORIES);
        loadedMemories = await getAllMemories();
      }

      if (isMounted) {
        journeyPhotosRef.current = loadedPhotos;
        setJourneyPhotos(loadedPhotos);
        setTracks(loadedTracks);
        setMemories(loadedMemories);
        setIsStorageLoaded(true);
        setIsPhotosLoading(false);
        setIsMusicLoading(false);
        setIsMemoriesLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      objectUrlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlMapRef.current.clear();
    };
  }, []);

  // ── Journey photo accessors ───────────────────────────────────────────────
  const getJourneyPhoto = useCallback(
    (chapterId: ChapterId, slotId: SlotId): JourneyPhotoSlot | undefined => {
      const ck = `${chapterId}_${slotId}`;
      return journeyPhotosRef.current[ck] ?? journeyPhotos[ck];
    },
    [journeyPhotos]
  );

  const getJourneyPhotoUrl = useCallback(
    (chapterId: ChapterId, slotId: SlotId): string | null => {
      const ck = `${chapterId}_${slotId}`;
      return journeyPhotosRef.current[ck]?.imageUrl ?? journeyPhotos[ck]?.imageUrl ?? null;
    },
    [journeyPhotos]
  );

  // ── Upload Photo: Supabase Storage -> Supabase Database -> State ────────────
  const setJourneyPhoto = useCallback(
    async (chapterId: ChapterId, slotId: SlotId, blob: Blob): Promise<void> => {
      const ck = `${chapterId}_${slotId}`;
      const { imageUrl, filePath } = await uploadJourneyPhoto(chapterId, slotId, blob);

      const slot: JourneyPhotoSlot = {
        chapterId,
        slotId,
        imageUrl,
        publicId: filePath,
        updatedAt: Date.now(),
      };

      journeyPhotosRef.current = { ...journeyPhotosRef.current, [ck]: slot };
      setJourneyPhotos((prev) => ({ ...prev, [ck]: slot }));
    },
    []
  );

  // ── Clear slot: Supabase Storage + Database deletion ───────────────────────
  const clearJourneyPhoto = useCallback(
    async (chapterId: ChapterId, slotId: SlotId): Promise<void> => {
      const ck = `${chapterId}_${slotId}`;
      await deleteJourneyPhoto(chapterId, slotId);

      // Revoke blob URL if any (dev fallback)
      const oldUrl = objectUrlMapRef.current.get(ck);
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
        objectUrlMapRef.current.delete(ck);
      }

      const slot: JourneyPhotoSlot = {
        chapterId,
        slotId,
        imageUrl: null,
        publicId: null,
        updatedAt: Date.now(),
      };

      journeyPhotosRef.current = { ...journeyPhotosRef.current, [ck]: slot };
      setJourneyPhotos((prev) => ({ ...prev, [ck]: slot }));
    },
    []
  );

  // ── Memories (Supabase cross-device or IndexedDB fallback) ───────────────
  const addMemory = useCallback(async (input: AddMemoryInput): Promise<void> => {
    let mem: MemoryItem;
    if (isSupabaseConfigured()) {
      mem = await addMemoryToSupabase(input);
    } else {
      // DEV fallback: use blob URL if a file was given, else use imageUrl
      const imageUrl = input.imageFile
        ? URL.createObjectURL(input.imageFile)
        : (input.imageUrl ?? "");
      mem = await persistAddMemory({
        title:    input.title,
        date:     input.date,
        category: input.category,
        caption:  input.caption,
        imageUrl,
      });
    }
    setMemories((prev) => [mem, ...prev]);
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    if (isSupabaseConfigured()) {
      await deleteMemoryFromSupabase(id);
    } else {
      await persistDeleteMemory(id);
    }
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── Music (Supabase Storage + Database) ───────────────────────────────────
  const playNextTrack = useCallback(() => setCurrentTrackIndex((p) => (p + 1) % tracks.length), [tracks.length]);
  const playPrevTrack = useCallback(() => setCurrentTrackIndex((p) => (p - 1 + tracks.length) % tracks.length), [tracks.length]);

  const addTrack = useCallback(
    async (params: AddTrackParams): Promise<void> => {
      let newTrack: Track;
      if (params.file) {
        newTrack = await uploadAudioTrack(params.file, params.title, params.artist);
      } else if (params.audioUrl) {
        newTrack = await addExternalTrack(params.title, params.artist, params.audioUrl);
      } else {
        throw new Error("Please provide either an audio file or an audio URL.");
      }

      setTracks((prev) => [...prev, newTrack]);
    },
    []
  );

  const deleteTrack = useCallback(
    async (id: string): Promise<void> => {
      const trackToDelete = tracks.find((t) => t.id === id);
      await deleteMusicTrack(id, trackToDelete?.filePath);

      setTracks((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return filtered.length > 0 ? filtered : INITIAL_TRACKS;
      });
    },
    [tracks]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <BirthdayContext.Provider
      value={{
        activeSection, setActiveSection,
        isMediaManagerOpen, setIsMediaManagerOpen,
        isMusicManagerOpen, setIsMusicManagerOpen,
        activeChapterId, setActiveChapterId,
        activeSlideIndex, setActiveSlideIndex,
        journeyPhotos,
        getJourneyPhoto, getJourneyPhotoUrl,
        setJourneyPhoto, clearJourneyPhoto,
        memories, addMemory, deleteMemory,
        isMemoriesLoading,
        tracks, currentTrackIndex, isPlaying, setIsPlaying,
        playNextTrack, playPrevTrack, addTrack, deleteTrack,
        isStorageLoaded,
        isPhotosLoading,
        isMusicLoading,
      }}
    >
      {children}
    </BirthdayContext.Provider>
  );
};

export const useBirthday = () => {
  const context = useContext(BirthdayContext);
  if (!context) throw new Error("useBirthday must be used within a BirthdayProvider");
  return context;
};
