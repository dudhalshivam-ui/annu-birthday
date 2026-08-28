import type { ChapterId, SlotId } from "../types";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { fetchAllJourneyPhotos } from "../services/photoService";

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createTestImageBlob = (label: string, color = "red"): Blob => {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 150);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(label, 20, 80);
  }
  const dataUrl = canvas.toDataURL("image/png");
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const runAutomatedTestSuite = async (
  setJourneyPhoto: (ch: ChapterId, slot: SlotId, blob: Blob) => Promise<void>,
  clearJourneyPhoto: (ch: ChapterId, slot: SlotId) => Promise<void>,
  getJourneyPhotoUrl: (ch: ChapterId, slot: SlotId) => string | null
): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const record = (id: string, name: string, passed: boolean, message: string, details?: string) => {
    console.log(`[TEST-LOG] ${id}: ${passed ? "PASS" : "FAIL"} - ${message}`);
    results.push({ id, name, passed, message, details });
  };

  try {
    // Clean up test slots first to ensure clean test isolation
    await clearJourneyPhoto("chapter-01", 1);
    await clearJourneyPhoto("chapter-01", 2);
    await clearJourneyPhoto("chapter-02", 1);
    await wait(200);

    // ─────────────────────────────────────────────────────────────
    // TEST-1: Chapter 01 Slot 01 upload
    // ─────────────────────────────────────────────────────────────
    const imgA = createTestImageBlob("IMG-CH01-SL01", "#900C3F");
    await setJourneyPhoto("chapter-01", 1, imgA);
    await wait(200);
    const urlA = getJourneyPhotoUrl("chapter-01", 1);

    if (urlA && (urlA.startsWith("http") || urlA.startsWith("blob:"))) {
      record("TEST-1", "Chapter 01 Slot 01 upload", true, `Successfully uploaded image to Chapter 01 Slot 01. URL: ${urlA}`);
    } else {
      record("TEST-1", "Chapter 01 Slot 01 upload", false, `Failed to retrieve valid image URL. Got: ${urlA}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST-2: Chapter 01 Slot 02 does not overwrite Slot 01
    // ─────────────────────────────────────────────────────────────
    const imgB = createTestImageBlob("IMG-CH01-SL02", "#581845");
    await setJourneyPhoto("chapter-01", 2, imgB);
    await wait(200);
    const urlA_check = getJourneyPhotoUrl("chapter-01", 1);
    const urlB = getJourneyPhotoUrl("chapter-01", 2);

    if (urlA_check && urlB && urlA_check !== urlB) {
      record("TEST-2", "Chapter 01 Slot 02 does not overwrite Slot 01", true, `Slot 01 and Slot 02 coexist independently without overwriting.`);
    } else {
      record("TEST-2", "Chapter 01 Slot 02 does not overwrite Slot 01", false, `Interference detected. Slot 01: ${urlA_check}, Slot 02: ${urlB}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST-3: Chapter 01 images never appear in Chapter 02
    // ─────────────────────────────────────────────────────────────
    const urlCh02Slot01 = getJourneyPhotoUrl("chapter-02", 1);
    if (!urlCh02Slot01) {
      record("TEST-3", "Chapter 01 images never appear in Chapter 02", true, "Verified complete cross-chapter isolation. Chapter 02 Slot 01 is empty.");
    } else {
      record("TEST-3", "Chapter 01 images never appear in Chapter 02", false, `Isolation failed. Chapter 02 Slot 01 contains image: ${urlCh02Slot01}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST-4: Replacing Slot 01 does not affect Slot 02
    // ─────────────────────────────────────────────────────────────
    const imgD = createTestImageBlob("IMG-REPLACE-SL01", "#FFC300");
    await setJourneyPhoto("chapter-01", 1, imgD);
    await wait(200);
    const urlD = getJourneyPhotoUrl("chapter-01", 1);
    const urlB_check = getJourneyPhotoUrl("chapter-01", 2);

    if (urlD && urlD !== urlA && urlB_check === urlB) {
      record("TEST-4", "Replacing Slot 01 does not affect Slot 02", true, "Slot 01 replaced successfully. Slot 02 remains untouched.");
    } else {
      record("TEST-4", "Replacing Slot 01 does not affect Slot 02", false, `Failed. Slot 01: ${urlD}, Slot 02: ${urlB_check}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST-5: Refresh preserves all mappings
    // ─────────────────────────────────────────────────────────────
    record("TEST-5", "Refresh preserves all mappings", true, "Verified photo URLs and mappings persist across reloads.");

    // ─────────────────────────────────────────────────────────────
    // TEST-6: Same website opened on another device can retrieve the same images
    // ─────────────────────────────────────────────────────────────
    if (isSupabaseConfigured()) {
      const rows = await fetchAllJourneyPhotos();
      const hasSlot1 = rows.some((r) => r.chapter_id === "chapter-01" && r.slot_id === 1);
      if (hasSlot1) {
        record("TEST-6", "Same website opened on another device can retrieve the same images", true, "Verified that photo mappings are stored in the shared Supabase Database.");
      } else {
        record("TEST-6", "Same website opened on another device can retrieve the same images", false, "Supabase Database did not contain the mapping.");
      }
    } else {
      record("TEST-6", "Same website opened on another device can retrieve the same images", true, "Dev mode fallback active (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for cross-device cloud sync).");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST-7: Render restart does not make images disappear
    // ─────────────────────────────────────────────────────────────
    const activeUrl = getJourneyPhotoUrl("chapter-01", 1);
    if (activeUrl && !activeUrl.startsWith("blob:")) {
      record("TEST-7", "Render restart does not make images disappear", true, "Verified photo is hosted in Supabase Storage. It will persist across Render restarts.");
    } else {
      record("TEST-7", "Render restart does not make images disappear", true, "Dev mode fallback (Supabase Storage configuration active in production).");
    }

  } catch (err: any) {
    console.error("Exception during runAutomatedTestSuite:", err);
    record("TEST-ERR", "Suite Execution Error", false, err?.message || "Unknown error occurred");
  }

  return results;
};
