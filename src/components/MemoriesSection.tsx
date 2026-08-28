import React, { useState, useCallback, useRef } from "react";
import { useBirthday } from "../context/BirthdayContext";
import type { MemoryCategory, MemoryItem } from "../types";
import {
  Sparkles,
  Heart,
  Plus,
  X,
  Calendar,
  Trash2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { isSupabaseConfigured } from "../services/supabaseClient";

export const MemoriesSection: React.FC = () => {
  const { memories, addMemory, deleteMemory, isMemoriesLoading } = useBirthday();

  const [activeCategory, setActiveCategory] = useState<MemoryCategory>("ALL");
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Delete state
  const [memoryToDelete, setMemoryToDelete] = useState<MemoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add form state
  const [newTitle, setNewTitle]         = useState("");
  const [newDate, setNewDate]           = useState("");
  const [newCategory, setNewCategory]   = useState<MemoryCategory>("US");
  const [newImageUrl, setNewImageUrl]   = useState("");
  const [newCaption, setNewCaption]     = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cloudEnabled = isSupabaseConfigured();

  const categories: MemoryCategory[] = [
    "ALL",
    "HER ❤️",
    "US",
    "FAVORITE MEMORIES",
    "SPECIAL MOMENTS",
  ];

  const filteredMemories =
    activeCategory === "ALL"
      ? memories
      : memories.filter((m) => m.category === activeCategory);

  // ── Add handler ──────────────────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!newTitle.trim()) {
      setUploadError("Please provide a memory title.");
      return;
    }
    if (!selectedFile && !newImageUrl.trim()) {
      setUploadError("Please select an image file or paste an image URL.");
      return;
    }

    setIsUploading(true);
    try {
      await addMemory({
        title:     newTitle,
        date:      newDate || "Special Day",
        category:  newCategory,
        caption:   newCaption,
        imageFile: selectedFile ?? undefined,
        imageUrl:  selectedFile ? undefined : newImageUrl.trim(),
      });

      // Reset form
      setNewTitle("");
      setNewDate("");
      setNewImageUrl("");
      setNewCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to save memory. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewImageUrl(""); // clear URL when file is picked
      setUploadError(null);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, mem: MemoryItem) => {
      e.stopPropagation();
      setDeleteError(null);
      setMemoryToDelete(mem);
    },
    []
  );

  const handleDeleteCancel = useCallback(() => {
    setMemoryToDelete(null);
    setDeleteError(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!memoryToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMemory(memoryToDelete.id);
      setMemoryToDelete(null);
    } catch (err) {
      console.error("[MemoriesSection] Failed to delete memory:", err);
      setDeleteError(
        "Could not delete this memory. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }, [memoryToDelete, deleteMemory]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <section
      data-testid="memories-section"
      className="max-w-7xl mx-auto px-4 py-8 space-y-10"
    >
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs font-semibold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>OUR LOVED COLLECTION</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif text-gold-gradient font-bold tracking-tight">
          Our Memories
        </h2>

        <p className="text-sm text-gray-300/80 font-light leading-relaxed">
          A timeless gallery of unscripted laughter, special moments, and
          cherished snapshots. Independent of our Journey chapters.
        </p>

        {/* Category filter + Add button */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-4">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-950 via-rose-950 to-amber-900 text-amber-200 border border-amber-400/40 shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-105"
                    : "bg-black/50 text-gray-400 border border-amber-500/10 hover:text-amber-100 hover:border-amber-500/30"
                }`}
              >
                {cat}
              </button>
            );
          })}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:border-amber-400 hover:scale-105 transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ───────────────────────────────────── */}
      {memoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg">
          <div className="bg-black/80 p-6 rounded-2xl border border-amber-500/30 text-amber-200 shadow-2xl max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-center text-lg font-serif font-semibold text-amber-100">
              Delete this memory?
            </h3>
            <p className="text-center text-sm text-gray-400 line-clamp-1">
              &ldquo;{memoryToDelete.title}&rdquo;
            </p>

            {deleteError && (
              <div className="flex items-start gap-2 bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <button
                data-testid="delete-memory-cancel"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full text-sm bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 text-amber-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="delete-memory-confirm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full text-sm bg-rose-900/70 border border-rose-500/40 hover:bg-rose-800/80 hover:border-rose-400 text-rose-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-300 rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Memory grid ─────────────────────────────────────────────────── */}
      {isMemoriesLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-amber-400/70">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-light">Loading memories from cloud…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full text-center py-16 space-y-4">
              <p className="text-amber-200/70 text-base font-light">
                No memories yet
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:border-amber-400 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Add Memory
              </button>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                data-testid="memory-card"
                data-memory-id={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className="group relative rounded-3xl overflow-hidden glass-panel border border-amber-500/20 hover:border-amber-400/50 transition-all duration-500 cursor-pointer flex flex-col justify-between hover:-translate-y-1 shadow-lg"
              >
                {/* Delete button — top-right corner of image */}
                <button
                  data-testid="delete-memory"
                  onClick={(e) => handleDeleteClick(e, mem)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-rose-900/80 border border-transparent hover:border-rose-500/40 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Delete memory: ${mem.title}`}
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </button>

                <div className="aspect-[4/3] overflow-hidden bg-black relative">
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono tracking-wider text-amber-300">
                    {mem.category}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" /> {mem.date}
                    </span>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                  </div>

                  <h3 className="font-serif text-lg text-amber-100 font-semibold group-hover:text-amber-300 transition-colors">
                    {mem.title}
                  </h3>

                  {mem.caption && (
                    <p className="text-xs text-gray-300/80 font-light line-clamp-2">
                      {mem.caption}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Lightbox viewer ─────────────────────────────────────────────── */}
      {selectedMemory && (
        <div
          onClick={() => setSelectedMemory(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl glass-panel border border-amber-500/30 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-xs font-mono text-amber-300">
                {selectedMemory.category}
              </span>
              <button
                onClick={() => setSelectedMemory(null)}
                className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[16/9] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-amber-500/20">
              <img
                src={selectedMemory.imageUrl}
                alt={selectedMemory.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>{selectedMemory.date}</span>
              </div>
              <h3 className="text-2xl font-serif text-amber-100 font-bold">
                {selectedMemory.title}
              </h3>
              {selectedMemory.caption && (
                <p className="text-sm text-gray-300 font-light leading-relaxed">
                  {selectedMemory.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Memory modal ─────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-amber-500/30 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-gold-gradient">
                  Add New Memory Card
                </h3>
                {cloudEnabled && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CloudUpload className="w-3 h-3" /> Saved to cloud — visible on all devices
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isUploading}
                className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">

              {/* Upload error banner */}
              {uploadError && (
                <div className="flex items-start gap-2 bg-rose-950/60 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Moonlight Stroll"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  disabled={isUploading}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-amber-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as MemoryCategory)
                    }
                    disabled={isUploading}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  >
                    {categories
                      .filter((c) => c !== "ALL")
                      .map((c) => (
                        <option key={c} value={c} className="bg-gray-900 text-white">
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-amber-300 block mb-1">
                    Date / Tag
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. Oct 2024"
                    disabled={isUploading}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  Image Source *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={selectedFile ? "" : newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      if (e.target.value) {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                      setUploadError(null);
                    }}
                    placeholder="Paste image URL (or select a file below)"
                    disabled={isUploading || !!selectedFile}
                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {cloudEnabled ? "or upload to cloud:" : "or upload local file:"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="text-xs text-amber-300 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-950 file:text-amber-200 disabled:opacity-50"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-[10px] text-emerald-400">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB) — ready to upload
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500">
                    Supported: JPG, PNG, WEBP, GIF · Max 15 MB
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  Caption / Description
                </label>
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Write a sweet memory caption..."
                  rows={3}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none resize-none disabled:opacity-50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isUploading}
                  className="px-5 py-2 rounded-full bg-black/40 text-gray-400 text-xs font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white text-xs font-semibold tracking-wider shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  {isUploading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  ) : (
                    "Save Memory"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
