/**
 * supabasePhotoService.ts
 *
 * Stores journey photo URL metadata in a Supabase table so the same
 * data is accessible from ANY device — no custom backend required.
 *
 * Required env vars (in .env):
 *   VITE_SUPABASE_URL      — e.g. https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY — your project anon/public key
 *
 * Required Supabase table (run in SQL editor):
 *   CREATE TABLE journey_photos (
 *     chapter_id   TEXT    NOT NULL,
 *     slot_id      INTEGER NOT NULL,
 *     image_url    TEXT    NOT NULL,
 *     public_id    TEXT    NOT NULL,
 *     uploaded_at  BIGINT  NOT NULL DEFAULT 0,
 *     PRIMARY KEY (chapter_id, slot_id)
 *   );
 *   ALTER TABLE journey_photos ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "public_access" ON journey_photos
 *     FOR ALL USING (true) WITH CHECK (true);
 */

const SUPABASE_URL      = (import.meta.env.VITE_SUPABASE_URL       as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY  as string | undefined) ?? '';

export interface PhotoRow {
  chapter_id:  string;
  slot_id:     number;
  image_url:   string;
  public_id:   string;
  uploaded_at: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const headers = () => ({
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type':  'application/json',
});

const endpoint = (path: string) => `${SUPABASE_URL}/rest/v1/${path}`;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Load all rows from journey_photos. Returns [] on error. */
export const loadAllPhotoRows = async (): Promise<PhotoRow[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const res = await fetch(endpoint('journey_photos?select=*'), {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Supabase GET failed: ${res.status}`);
    return (await res.json()) as PhotoRow[];
  } catch (err) {
    console.error('[Supabase] loadAllPhotoRows:', err);
    return [];
  }
};

/**
 * Upsert (insert-or-update) a photo row identified by (chapter_id, slot_id).
 * Uses Supabase "merge-duplicates" resolution so re-uploading the same slot
 * just updates the existing row.
 */
export const upsertPhotoRow = async (row: PhotoRow): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const res = await fetch(endpoint('journey_photos'), {
    method:  'POST',
    headers: { ...headers(), 'Prefer': 'resolution=merge-duplicates' },
    body:    JSON.stringify(row),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[Supabase] upsert failed ${res.status}: ${body}`);
  }
};

/** Delete the row for a specific (chapter_id, slot_id). */
export const deletePhotoRow = async (chapterId: string, slotId: number): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const res = await fetch(
    endpoint(`journey_photos?chapter_id=eq.${chapterId}&slot_id=eq.${slotId}`),
    { method: 'DELETE', headers: headers() }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[Supabase] delete failed ${res.status}: ${body}`);
  }
};
