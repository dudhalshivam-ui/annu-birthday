import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { 
  ChapterId, 
  SlotId, 
  ChapterDef, 
  MemoryItem, 
  Track, 
  ActiveSection, 
  JourneyPhotoSlot 
} from '../types';
import { 
  CHAPTER_IDS, 
  SLOT_IDS, 
  getStoragePhoto, 
  setStoragePhoto, 
  deleteStoragePhoto
} from '../services/storageService';
import {
  getAllMemories,
  persistAddMemory,
  persistDeleteMemory,
  seedDefaultMemoriesOnce
} from '../services/memoryStorageService';

export const CHAPTER_DEFINITIONS: ChapterDef[] = [
  {
    id: 'chapter-01',
    badge: 'CHAPTER 01',
    title: 'The Beginning',
    subtitle: 'Where our story started',
    description: 'Every grand love story has a quiet first chapter. Looking back at how our worlds collided and changed forever.',
    quote: '"The best thing to hold onto in life is each other."'
  },
  {
    id: 'chapter-02',
    badge: 'CHAPTER 02',
    title: 'Little Moments',
    subtitle: 'The magic in everyday life',
    description: 'It is the quiet coffee mornings, late night conversations, shared laughs, and silly faces that mean the world.',
    quote: '"You are my favorite place to go to when my mind searches for peace."'
  },
  {
    id: 'chapter-03',
    badge: 'CHAPTER 03',
    title: 'Your Smile',
    subtitle: 'Light in every room',
    description: 'Your laughter is my favorite sound, and your smile lights up even the darkest days of my life.',
    quote: '"I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more."'
  },
  {
    id: 'chapter-04',
    badge: 'CHAPTER 04',
    title: 'Us',
    subtitle: 'Side by side, through it all',
    description: 'We built our own little world full of inside jokes, warm warmth, unwavering support, and endless affection.',
    quote: '"In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine."'
  },
  {
    id: 'chapter-05',
    badge: 'CHAPTER 05',
    title: 'Forever',
    subtitle: 'Our endless adventure',
    description: 'Looking into tomorrow with excitement. Here is to celebrating your birthday today, tomorrow, and every year forever.',
    quote: '"Whatever our souls are made of, yours and mine are the same."'
  }
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Sunsets & Soft Whispers',
    date: 'Summer Days',
    category: 'FAVORITE MEMORIES',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1000&auto=format&fit=crop',
    caption: 'A golden evening where time stood completely still.',
    createdAt: 1700000001000
  },
  {
    id: 'mem-2',
    title: 'Your Radiant Laughter',
    date: 'Pure Joy',
    category: 'HER ❤️',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
    caption: 'That unforgettable smile that brightens my whole universe.',
    createdAt: 1700000002000
  },
  {
    id: 'mem-3',
    title: 'Our Favorite Escapes',
    date: 'Weekend Gateway',
    category: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
    caption: 'Hand in hand, exploring new horizons together.',
    createdAt: 1700000003000
  },
  {
    id: 'mem-4',
    title: 'Starlit Evening',
    date: 'Celebration',
    category: 'SPECIAL MOMENTS',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop',
    caption: 'Making a wish under the midnight sky.',
    createdAt: 1700000004000
  }
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'A Thousand Years (Acoustic Piano)',
    artist: 'Love Theme',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112185.mp3'
  },
  {
    id: 'track-2',
    title: 'Cinematic Romance',
    artist: 'Ambient Strings',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=soft-piano-romantic-10874.mp3'
  }
];

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
  getJourneyPhoto: (chapterId: ChapterId, slotId: SlotId) => JourneyPhotoSlot | undefined;
  getJourneyPhotoUrl: (chapterId: ChapterId, slotId: SlotId) => string | null;
  setJourneyPhoto: (chapterId: ChapterId, slotId: SlotId, blob: Blob) => Promise<void>;
  clearJourneyPhoto: (chapterId: ChapterId, slotId: SlotId) => Promise<void>;

  memories: MemoryItem[];
  addMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  addTrack: (track: Omit<Track, 'id'>) => void;
  deleteTrack: (id: string) => void;
  
  isStorageLoaded: boolean;
}

const BirthdayContext = createContext<BirthdayContextType | undefined>(undefined);

export const BirthdayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState<boolean>(false);
  const [isMusicManagerOpen, setIsMusicManagerOpen] = useState<boolean>(false);

  const [activeChapterId, setActiveChapterIdState] = useState<ChapterId>('chapter-01');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  const [journeyPhotos, setJourneyPhotos] = useState<Record<string, JourneyPhotoSlot>>(() => {
    const initial: Record<string, JourneyPhotoSlot> = {};
    for (const chapterId of CHAPTER_IDS) {
      for (const slotId of SLOT_IDS) {
        const key = `${chapterId}_${slotId}`;
        initial[key] = {
          chapterId,
          slotId,
          blob: null,
          objectUrl: null
        };
      }
    }
    return initial;
  });

  // Always fresh ref for journey photos to prevent stale closure reads
  const journeyPhotosRef = useRef<Record<string, JourneyPhotoSlot>>(journeyPhotos);
  useEffect(() => {
    journeyPhotosRef.current = journeyPhotos;
  }, [journeyPhotos]);

  const objectUrlMapRef = useRef<Map<string, string>>(new Map());
  const [isStorageLoaded, setIsStorageLoaded] = useState<boolean>(false);

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const setActiveChapterId = useCallback((id: ChapterId) => {
    setActiveChapterIdState(id);
    setActiveSlideIndex(0);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      // ── 1. Journey photos (untouched) ─────────────────────────────────
      const loadedPhotos: Record<string, JourneyPhotoSlot> = {};

      for (const chapterId of CHAPTER_IDS) {
        for (const slotId of SLOT_IDS) {
          const key = `${chapterId}_${slotId}`;
          const blob = await getStoragePhoto(chapterId, slotId);
          
          if (blob) {
            const url = URL.createObjectURL(blob);
            objectUrlMapRef.current.set(key, url);
            loadedPhotos[key] = {
              chapterId,
              slotId,
              blob,
              objectUrl: url,
              updatedAt: Date.now()
            };
          } else {
            loadedPhotos[key] = {
              chapterId,
              slotId,
              blob: null,
              objectUrl: null
            };
          }
        }
      }

      // ── 2. Memories: seed defaults on FIRST LAUNCH ONLY (sentinel-guarded) ──
      // seedDefaultMemoriesOnce checks a sentinel key in IndexedDB.
      // If already seeded, it does nothing — deleted memories STAY deleted.
      await seedDefaultMemoriesOnce(INITIAL_MEMORIES);
      const loadedMemories = await getAllMemories();

      if (isMounted) {
        journeyPhotosRef.current = loadedPhotos;
        setJourneyPhotos(loadedPhotos);
        setMemories(loadedMemories);
        setIsStorageLoaded(true);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      objectUrlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlMapRef.current.clear();
    };
  }, []);

  const getJourneyPhoto = useCallback((chapterId: ChapterId, slotId: SlotId): JourneyPhotoSlot | undefined => {
    const key = `${chapterId}_${slotId}`;
    return journeyPhotosRef.current[key] || journeyPhotos[key];
  }, [journeyPhotos]);

  const getJourneyPhotoUrl = useCallback((chapterId: ChapterId, slotId: SlotId): string | null => {
    const key = `${chapterId}_${slotId}`;
    return journeyPhotosRef.current[key]?.objectUrl || journeyPhotos[key]?.objectUrl || null;
  }, [journeyPhotos]);

  const setJourneyPhoto = useCallback(async (chapterId: ChapterId, slotId: SlotId, blob: Blob): Promise<void> => {
    const key = `${chapterId}_${slotId}`;

    await setStoragePhoto(chapterId, slotId, blob);

    const oldUrl = objectUrlMapRef.current.get(key);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
    }

    const newUrl = URL.createObjectURL(blob);
    objectUrlMapRef.current.set(key, newUrl);

    const updatedSlot: JourneyPhotoSlot = {
      chapterId,
      slotId,
      blob,
      objectUrl: newUrl,
      updatedAt: Date.now()
    };

    // Update ref immediately for real-time reads
    journeyPhotosRef.current = {
      ...journeyPhotosRef.current,
      [key]: updatedSlot
    };

    setJourneyPhotos((prev) => ({
      ...prev,
      [key]: updatedSlot
    }));
  }, []);

  const clearJourneyPhoto = useCallback(async (chapterId: ChapterId, slotId: SlotId): Promise<void> => {
    const key = `${chapterId}_${slotId}`;

    await deleteStoragePhoto(chapterId, slotId);

    const oldUrl = objectUrlMapRef.current.get(key);
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl);
      objectUrlMapRef.current.delete(key);
    }

    const clearedSlot: JourneyPhotoSlot = {
      chapterId,
      slotId,
      blob: null,
      objectUrl: null,
      updatedAt: Date.now()
    };

    journeyPhotosRef.current = {
      ...journeyPhotosRef.current,
      [key]: clearedSlot
    };

    setJourneyPhotos((prev) => ({
      ...prev,
      [key]: clearedSlot
    }));
  }, []);

  const addMemory = useCallback(async (newMem: Omit<MemoryItem, 'id' | 'createdAt'>): Promise<void> => {
    // persistAddMemory generates collision-safe ID via crypto.randomUUID()
    const mem = await persistAddMemory(newMem);
    setMemories((prev) => [mem, ...prev]);
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    // CRITICAL: IndexedDB deletion must succeed BEFORE React state is updated.
    // If persistDeleteMemory throws, the error propagates to the caller and state is NOT changed.
    await persistDeleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const playNextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  }, [tracks.length]);

  const playPrevTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const addTrack = useCallback((track: Omit<Track, 'id'>) => {
    const newTrack: Track = {
      ...track,
      id: `track-${Date.now()}`
    };
    setTracks((prev) => [...prev, newTrack]);
  }, []);

  const deleteTrack = useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <BirthdayContext.Provider
      value={{
        activeSection,
        setActiveSection,
        isMediaManagerOpen,
        setIsMediaManagerOpen,
        isMusicManagerOpen,
        setIsMusicManagerOpen,
        activeChapterId,
        setActiveChapterId,
        activeSlideIndex,
        setActiveSlideIndex,
        journeyPhotos,
        getJourneyPhoto,
        getJourneyPhotoUrl,
        setJourneyPhoto,
        clearJourneyPhoto,
        memories,
        addMemory,
        deleteMemory,
        tracks,
        currentTrackIndex,
        isPlaying,
        setIsPlaying,
        playNextTrack,
        playPrevTrack,
        addTrack,
        deleteTrack,
        isStorageLoaded
      }}
    >
      {children}
    </BirthdayContext.Provider>
  );
};

export const useBirthday = () => {
  const context = useContext(BirthdayContext);
  if (!context) {
    throw new Error('useBirthday must be used within a BirthdayProvider');
  }
  return context;
};
