import React, { useState, useCallback } from "react";
import { useBirthday } from "../context/BirthdayContext";
import type { MemoryCategory, MemoryItem } from "../types";
import { Sparkles, Heart, Plus, X, Calendar, Trash2, AlertCircle } from "lucide-react";

export const MemoriesSection: React.FC = () => {
  const { memories, addMemory, deleteMemory } = useBirthday();

  const [activeCategory, setActiveCategory] = useState<MemoryCategory>("ALL");
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Delete state
  const [memoryToDelete, setMemoryToDelete] = useState<MemoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("US");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");

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
    if (!newTitle || !newImageUrl) {
      alert("Please provide a title and image URL");
      return;
    }
    await addMemory({
      title: newTitle,
      date: newDate || "Special Day",
      category: newCategory,
      imageUrl: newImageUrl,
      caption: newCaption,
    });
    setNewTitle("");
    setNewDate("");
    setNewImageUrl("");
    setNewCaption("");
    setIsAddModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageUrl(URL.createObjectURL(file));
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
      // deleteMemory: IndexedDB delete MUST succeed before UI state changes
      await deleteMemory(memoryToDelete.id);
      setMemoryToDelete(null);
    } catch (err) {
      console.error("[MemoriesSection] Failed to delete memory:", err);
      setDeleteError(
        "Could not delete this memory. Storage error — please try again."
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
              <h3 className="text-xl font-serif font-bold text-gold-gradient">
                Add New Memory Card
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Moonlight Stroll"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-300 block mb-1">
                  Image Source
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (or select file below)"
                    className="w-full px-4 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">or upload local file:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-xs text-amber-300 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-950 file:text-amber-200"
                    />
                  </div>
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
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-white text-sm focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-black/40 text-gray-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white text-xs font-semibold tracking-wider shadow-md hover:scale-105 transition-transform"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
