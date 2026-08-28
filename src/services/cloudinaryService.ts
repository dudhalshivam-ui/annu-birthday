/**
 * cloudinaryService.ts
 *
 * Handles direct browser-to-Cloudinary unsigned uploads.
 * No API secret is exposed — uses an "unsigned upload preset" only.
 *
 * Required env vars (in .env):
 *   VITE_CLOUDINARY_CLOUD_NAME   — your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET — an unsigned upload preset name
 */

const CLOUD_NAME   = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   as string | undefined) ?? '';
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) ?? '';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Make a deterministic, collision-free Cloudinary public_id for a slot. */
export const buildPublicId = (chapterId: string, slotId: number | string): string =>
  `birthday_journey_${chapterId}_slot_${slotId}`;

/** True when Cloudinary env vars are present. */
export const isCloudinaryConfigured = (): boolean =>
  Boolean(CLOUD_NAME && UPLOAD_PRESET);

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Upload a Blob/File directly from the browser to Cloudinary.
 *
 * Uses a DETERMINISTIC public_id so uploading the same slot again
 * overwrites the previous image (no orphaned files accumulate).
 *
 * Throws on network or Cloudinary API errors.
 */
export const uploadToCloudinary = async (
  chapterId: string,
  slotId: number,
  file: File | Blob
): Promise<CloudinaryUploadResult> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      '[Cloudinary] Not configured — set VITE_CLOUDINARY_CLOUD_NAME and ' +
      'VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    );
  }

  const publicId  = buildPublicId(chapterId, slotId);
  const formData  = new FormData();
  formData.append('file',            file);
  formData.append('upload_preset',   UPLOAD_PRESET);
  formData.append('public_id',       publicId);
  // "overwrite" and "invalidate" are normally set on the upload preset,
  // but we send them here as a belt-and-suspenders measure.
  formData.append('overwrite',  'true');
  formData.append('invalidate', 'true');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[Cloudinary] Upload failed ${res.status}: ${body}`);
  }

  const data = await res.json() as { secure_url: string; public_id: string };
  return { secureUrl: data.secure_url, publicId: data.public_id };
};
