import React, { useState } from 'react';
import { useBirthday, CHAPTER_DEFINITIONS } from '../context/BirthdayContext';
import type { ChapterId, SlotId } from '../types';
import { X, Upload, RefreshCw, Trash2, Camera, CheckCircle2 } from 'lucide-react';

export const MediaManager: React.FC = () => {
  const { 
    isMediaManagerOpen, 
    setIsMediaManagerOpen, 
    journeyPhotos, 
    setJourneyPhoto, 
    clearJourneyPhoto 
  } = useBirthday();

  const [activeTabChapter, setActiveTabChapter] = useState<ChapterId>('chapter-01');

  if (!isMediaManagerOpen) return null;

  const handleFileUpload = async (chapterId: ChapterId, slotId: SlotId, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await setJourneyPhoto(chapterId, slotId, file);
    } catch (error) {
      console.error(`Failed to upload image for ${chapterId} slot ${slotId}:`, error);
      alert('Error uploading photo. Please try another image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleClear = async (chapterId: ChapterId, slotId: SlotId) => {
    if (window.confirm(`Are you sure you want to clear Chapter ${chapterId.slice(-2)} Photo 0${slotId}?`)) {
      try {
        await clearJourneyPhoto(chapterId, slotId);
      } catch (error) {
        console.error(`Failed to clear photo for ${chapterId} slot ${slotId}:`, error);
      }
    }
  };

  return (
    <div 
      data-testid="media-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl rounded-3xl glass-panel border border-amber-500/30 p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-gold-gradient">
                Media Manager — 25 Journey Slots
              </h2>
              <p className="text-xs text-gray-400">
                Upload photos for each of the 5 Chapters (5 photo slots per chapter).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMediaManagerOpen(false)}
            className="p-2 rounded-full bg-black/40 border border-amber-500/20 text-gray-400 hover:text-amber-200 hover:border-amber-400 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-amber-500/10">
          {CHAPTER_DEFINITIONS.map((ch) => {
            const isActive = activeTabChapter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveTabChapter(ch.id as ChapterId)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-950 text-amber-200 border border-amber-400/40 shadow-lg'
                    : 'bg-black/40 text-gray-400 border border-amber-500/10 hover:text-amber-100'
                }`}
              >
                {ch.badge} — {ch.title}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-cinzel text-amber-300 font-semibold tracking-wider uppercase">
              {CHAPTER_DEFINITIONS.find((c) => c.id === activeTabChapter)?.badge} Photo Slots
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Deterministic Mapping: Chapter + SlotId
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {([1, 2, 3, 4, 5] as SlotId[]).map((slotId) => {
              const photoKey = `${activeTabChapter}_${slotId}`;
              const slotData = journeyPhotos[photoKey];
              const isOccupied = Boolean(slotData?.objectUrl);

              return (
                <div
                  key={slotId}
                  data-testid={`media-slot-${activeTabChapter}-${slotId}`}
                  className="rounded-2xl bg-black/60 border border-amber-500/20 p-3 space-y-3 flex flex-col justify-between hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-300 font-bold">
                      PHOTO 0{slotId}
                    </span>
                    {isOccupied ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Occupied
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-[10px]">
                        Empty
                      </span>
                    )}
                  </div>

                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-950 border border-amber-500/10 relative flex items-center justify-center">
                    {isOccupied && slotData.objectUrl ? (
                      <img 
                        src={slotData.objectUrl} 
                        alt={`Chapter ${activeTabChapter} Photo ${slotId}`}
                        className="w-full h-full object-cover rounded-xl" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center space-y-1 text-gray-500">
                        <Camera className="w-6 h-6 text-gray-600" />
                        <span className="text-[10px]">Empty Slot</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label 
                      data-testid={`media-upload-label-${activeTabChapter}-${slotId}`}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold tracking-wider text-amber-200 bg-amber-950/60 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-900/80 cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        data-testid={`media-upload-${activeTabChapter}-${slotId}`}
                        onChange={(e) => handleFileUpload(activeTabChapter, slotId, e)}
                        className="hidden" 
                      />
                      {isOccupied ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                          <span>Replace</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-amber-300" />
                          <span>Upload</span>
                        </>
                      )}
                    </label>

                    {isOccupied && (
                      <button
                        data-testid={`media-clear-${activeTabChapter}-${slotId}`}
                        onClick={() => handleClear(activeTabChapter, slotId)}
                        className="w-full py-1.5 px-3 rounded-xl text-[11px] font-medium text-rose-400 bg-rose-950/40 border border-rose-500/20 hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-amber-500/15 flex items-center justify-between text-xs text-gray-400">
          <span>All 25 slots persist automatically to IndexedDB.</span>
          <button
            onClick={() => setIsMediaManagerOpen(false)}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 via-rose-700 to-amber-700 text-white font-semibold tracking-wider text-xs shadow-md hover:scale-105 transition-transform"
          >
            Done & View Journey
          </button>
        </div>

      </div>
    </div>
  );
};
