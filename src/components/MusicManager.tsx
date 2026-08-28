import React, { useState } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { X, Music, Plus, Trash2 } from 'lucide-react';

export const MusicManager: React.FC = () => {
  const { 
    isMusicManagerOpen, 
    setIsMusicManagerOpen, 
    tracks, 
    currentTrackIndex, 
    addTrack, 
    deleteTrack
  } = useBirthday();

  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');

  if (!isMusicManagerOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAudioUrl) {
      alert('Please provide a title and audio URL or file');
      return;
    }

    addTrack({
      title: newTitle,
      artist: newArtist || 'Romantic Melody',
      audioUrl: newAudioUrl
    });

    setNewTitle('');
    setNewArtist('');
    setNewAudioUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewAudioUrl(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel border border-amber-500/30 p-6 space-y-6 shadow-2xl my-8">
        
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-gold-gradient">
                Music Manager
              </h2>
              <p className="text-xs text-gray-400">
                Manage background songs for Annu's birthday experience.
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

        <div className="space-y-3">
          <h3 className="text-xs font-cinzel text-amber-300 font-semibold uppercase tracking-wider">
            Current Playlist ({tracks.length} Songs)
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {tracks.map((track, idx) => {
              const isCurrent = idx === currentTrackIndex;
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
                    <Music className={`w-4 h-4 ${isCurrent ? 'text-amber-400 animate-bounce' : 'text-gray-500'}`} />
                    <div className="overflow-hidden">
                      <span className="text-xs font-semibold block truncate">{track.title}</span>
                      <span className="text-[10px] text-gray-400 block truncate">{track.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tracks.length > 1 && (
                      <button
                        onClick={() => deleteTrack(track.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="space-y-4 pt-4 border-t border-amber-500/20">
          <h3 className="text-xs font-cinzel text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" /> Add New Song Track
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">Song Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Perfect (Acoustic)"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-amber-300 block mb-1">Audio File or URL</label>
            <input
              type="text"
              value={newAudioUrl}
              onChange={(e) => setNewAudioUrl(e.target.value)}
              placeholder="Paste MP3 URL or select audio file below"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/20 text-white text-xs focus:border-amber-400 focus:outline-none mb-2"
            />
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="text-xs text-amber-300 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-950 file:text-amber-200"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMusicManagerOpen(false)}
              className="px-4 py-2 rounded-full bg-black/40 text-gray-400 text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white text-xs font-semibold tracking-wider shadow-md hover:scale-105 transition-transform"
            >
              Add Song
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
