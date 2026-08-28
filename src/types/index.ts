export type ChapterId = 'chapter-01' | 'chapter-02' | 'chapter-03' | 'chapter-04' | 'chapter-05';
export type SlotId = 1 | 2 | 3 | 4 | 5;

export interface JourneyPhotoSlot {
  chapterId: ChapterId;
  slotId: SlotId;
  blob: Blob | null;
  objectUrl: string | null;
  caption?: string;
  updatedAt?: number;
}

export interface ChapterDef {
  id: ChapterId;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  quote: string;
}

export type MemoryCategory = 'ALL' | 'HER ❤️' | 'US' | 'FAVORITE MEMORIES' | 'SPECIAL MOMENTS';

export interface MemoryItem {
  id: string;
  title: string;
  date: string;
  category: MemoryCategory;
  imageUrl: string;
  caption?: string;
  blob?: Blob;
  createdAt: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  chapterId?: string;
}

export type ActiveSection = 'home' | 'journey' | 'letter' | 'memories';
