import { get, set, del, keys } from 'idb-keyval';
import type { ChapterId, SlotId } from '../types';

export const CHAPTER_IDS: ChapterId[] = [
  'chapter-01',
  'chapter-02',
  'chapter-03',
  'chapter-04',
  'chapter-05'
];

export const SLOT_IDS: SlotId[] = [1, 2, 3, 4, 5];

export const getStorageKey = (chapterId: ChapterId, slotId: SlotId): string => {
  return `journey_${chapterId}_slot_${slotId}`;
};

export const getStoragePhoto = async (chapterId: ChapterId, slotId: SlotId): Promise<Blob | null> => {
  try {
    const key = getStorageKey(chapterId, slotId);
    const result = await get<Blob | File>(key);
    if (result instanceof Blob) {
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Error loading photo for ${chapterId} slot ${slotId} from IndexedDB:`, error);
    return null;
  }
};

export const setStoragePhoto = async (chapterId: ChapterId, slotId: SlotId, blob: Blob): Promise<void> => {
  try {
    const key = getStorageKey(chapterId, slotId);
    await set(key, blob);
  } catch (error) {
    console.error(`Error saving photo for ${chapterId} slot ${slotId} to IndexedDB:`, error);
    throw error;
  }
};

export const deleteStoragePhoto = async (chapterId: ChapterId, slotId: SlotId): Promise<void> => {
  try {
    const key = getStorageKey(chapterId, slotId);
    await del(key);
  } catch (error) {
    console.error(`Error deleting photo for ${chapterId} slot ${slotId} from IndexedDB:`, error);
    throw error;
  }
};

export const loadAllStoragePhotos = async (): Promise<Record<string, Blob>> => {
  const result: Record<string, Blob> = {};
  try {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith('journey_')) {
        const val = await get<Blob | File>(key);
        if (val instanceof Blob) {
          result[key] = val;
        }
      }
    }
  } catch (error) {
    console.error('Error loading all Journey photos from IndexedDB:', error);
  }
  return result;
};
