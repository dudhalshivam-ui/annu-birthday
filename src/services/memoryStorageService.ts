import { get, set, del, keys } from "idb-keyval";
import type { MemoryItem } from "../types";

const MEMORY_KEY_PREFIX = "memory_";

/**
 * Sentinel key that records whether the default memories have ever been seeded.
 * Once set, defaults are NEVER re-seeded — even if the user deletes them.
 */
const SEEDED_SENTINEL_KEY = "memories_seeded_v1";

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve all persisted memories from IndexedDB.
 * Returns them sorted newest-first by createdAt timestamp.
 */
export const getAllMemories = async (): Promise<MemoryItem[]> => {
  try {
    const allKeys = await keys();
    const memKeys = allKeys.filter(
      (k): k is string => typeof k === "string" && k.startsWith(MEMORY_KEY_PREFIX)
    );
    const results = await Promise.all(memKeys.map((k) => get<MemoryItem>(k)));
    const mems = results.filter((m): m is MemoryItem => !!m);
    return mems.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("[memoryStorage] Failed to load memories from IndexedDB:", error);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a new memory to IndexedDB.
 * ID is collision-safe: crypto.randomUUID() prevents any millisecond collisions.
 */
export const persistAddMemory = async (
  newMem: Omit<MemoryItem, "id" | "createdAt">
): Promise<MemoryItem> => {
  const now = Date.now();
  const id = `mem-${now}-${crypto.randomUUID()}`;
  const mem: MemoryItem = { ...newMem, id, createdAt: now };
  await set(`${MEMORY_KEY_PREFIX}${id}`, mem);
  return mem;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete a single memory by its unique ID from IndexedDB.
 *
 * THROWS if deletion fails — the caller MUST NOT update React state when this throws,
 * so the memory stays visible and a UI error is shown instead.
 */
export const persistDeleteMemory = async (id: string): Promise<void> => {
  await del(`${MEMORY_KEY_PREFIX}${id}`);
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seed default memories EXACTLY ONCE — on the very first launch of the app.
 *
 * Uses a sentinel key ("memories_seeded_v1") to track whether seeding has
 * already happened.  If the sentinel exists, this function does NOTHING and
 * simply returns the currently persisted memories.
 *
 * This means:
 *   - Deleted default memories STAY deleted across reloads.
 *   - New default memories added to INITIAL_MEMORIES in code won't appear
 *     for existing users (intentional — use a new sentinel key like
 *     "memories_seeded_v2" if you need a migration).
 */
export const seedDefaultMemoriesOnce = async (
  defaults: Array<Omit<MemoryItem, "createdAt">>
): Promise<void> => {
  // Check the sentinel — if already seeded, bail out immediately
  const alreadySeeded = await get<boolean>(SEEDED_SENTINEL_KEY);
  if (alreadySeeded) {
    return;
  }

  // First launch: write every default with a stable, descending createdAt
  for (let i = 0; i < defaults.length; i++) {
    const mem = defaults[i];
    const key = `${MEMORY_KEY_PREFIX}${mem.id}`;
    const withTimestamp: MemoryItem = {
      ...mem,
      createdAt: 1700000000000 + i * 1000, // fixed timestamps so sort is stable
    };
    await set(key, withTimestamp);
  }

  // Mark as seeded — never run defaults again
  await set(SEEDED_SENTINEL_KEY, true);
};
