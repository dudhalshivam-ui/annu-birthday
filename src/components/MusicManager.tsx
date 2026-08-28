import React, { useState, useRef } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { X, Music, Plus, Trash2, Loader2, CloudUpload, Link } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const MusicManager: React.FC = () => {
  const {
    isMusicManagerOpen,
    setIsMusicManagerOpen,
    tracks,
    currentTrackIndex,
    addTrack,
    deleteTrack,
    isMusicLoading,
  } = useBirthday();

  const [newTitle, setNewTitle]         = useState('');
  const [newArtist, setNewArtist]       = useState('');
  const [newAudioUrl, setNewAudioUrl]   = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isMusicManagerOpen) return null;

  const cloudEnabled = isSupabaseConfigured();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewAudioUrl(''); // clear URL field when file is chosen
      setUploadError(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!newTitle.trim()) {
      setUploadError('Please provide a song title.');
      return;
    }
    if (!selectedFile && !newAudioUrl.trim()) {
      setUploadError('Please select an audio file or paste an audio URL.');
      return;
    }

    setIsUploading(true);
    try {
      await addTrack({
        title:    newTitle,
        artist:   newArtist,
        file:     selectedFile ?? undefined,
        audioUrl: selectedFile ? undefined : newAudioUrl.trim(),
      });

      // Reset form
      setNewTitle('');
      setNewArtist('');
      setNewAudioUrl('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTrack(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel border border-amber-500/30 p-6 space-y-6 shadow-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-gold-gradient">
                Music Manager
              </h2>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                {cloudEnabled
                  ? <><CloudUpload className="w-3 h-3 text-emerald-400" /> Cloud sync active — songs available on all devices</>
                  : 'Manage background songs for Annu\'s birthday experience.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMusicManagerOpen(false)}
            className="p-2 rounded-full bg-black/40 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist */}
        <div className="space-y-3">
          <h3 className="text-xs font-cinzel text-amber-300 font-semibold uppercase tracking-wider">
            Current Playlist ({isMusicLoading ? '…' : `${tracks.length} Songs`})
          </h3>

          {isMusicLoading ? (
            <div className="flex items-center gap-2 text-amber-400/70 text-xs py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading songs from cloud…
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {tracks.map((track, idx) => {
                const isCurrent = idx === currentTrackIndex;
                const isDeleting = deletingId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-amber-950/80 border-amber-400/50 text-amber-200'
                        : 'bg-black/40 border-amber-500/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Music className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-amber-400 animate-bounce' : 'text-gray-500'}`} />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold block truncate">{track.title}</span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {track.artist}
                          {track.filePath && (
                            <span className="ml-1 text-emerald-500/70">☁</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tracks.length > 1 && (
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 disabled:opacity-40"
                        >
                          {isDeleting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Song Form */}
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-4 border-t border-amber-500/20">
          <h3 className="text-xs font-cinzel text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" /> Add New Song Track
          </h3>

          {/* Error banner */}
          {uploadError && (
            <div className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">Song Title *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Perfect (Acoustic)"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none disabled:opacity-50"
                disabled={isUploading}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">Artist / Note</label>
              <input
                type="text"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                placeholder="e.g. Ed Sheeran"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none disabled:opacity-50"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Audio URL input */}
          <div>
            <label className="text-xs font-semibold text-amber-300 block mb-1 flex items-center gap-1">
              <Link className="w-3 h-3" /> Audio URL
              {selectedFile && <span className="text-gray-500 ml-1">(cleared when file is selected)</span>}
            </label>
            <input
              type="text"
              value={selectedFile ? '' : newAudioUrl}
              onChange={(e) => {
                setNewAudioUrl(e.target.value);
                if (e.target.value) {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
              placeholder="Paste an MP3 / audio URL here"
              disabled={isUploading || !!selectedFile}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none mb-2 disabled:opacity-50"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="text-xs font-semibold text-amber-300 block mb-1 flex items-center gap-1">
              <CloudUpload className="w-3 h-3" />
              {cloudEnabled ? 'Upload Audio File (saved to cloud)' : 'Browse Audio File'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac,audio/webm,audio/flac,audio/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="text-xs text-amber-300 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-950 file:text-amber-200 disabled:opacity-50"
            />
            {selectedFile && (
              <p className="mt-1 text-[10px] text-emerald-400">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB) — ready to upload
              </p>
            )}
            <p className="mt-1 text-[10px] text-gray-500">
              Supported: MP3, M4A, WAV, OGG · Max 25 MB
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMusicManagerOpen(false)}
              disabled={isUploading}
              className="px-4 py-2 rounded-full bg-black/40 text-gray-400 text-xs font-semibold disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white text-xs font-semibold tracking-wider shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {isUploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
              ) : (
                'Add Song'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
