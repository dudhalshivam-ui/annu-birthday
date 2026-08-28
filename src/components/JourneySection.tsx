import React, { useEffect, useState } from 'react';
import { useBirthday, CHAPTER_DEFINITIONS } from '../context/BirthdayContext';
import type { ChapterId, SlotId } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Camera, 
  Upload 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const JourneySection: React.FC = () => {
  const {
    activeChapterId,
    setActiveChapterId,
    activeSlideIndex,
    setActiveSlideIndex,
    getJourneyPhotoUrl,
    setIsMediaManagerOpen
  } = useBirthday();

  const currentChapter = CHAPTER_DEFINITIONS.find((c) => c.id === activeChapterId) || CHAPTER_DEFINITIONS[0];

  const currentSlotId = (activeSlideIndex + 1) as SlotId;
  const currentPhotoUrl = getJourneyPhotoUrl(activeChapterId, currentSlotId);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev < 4 ? prev + 1 : 0));
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : 4));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextSlide();
    } else if (isRightSwipe) {
      handlePrevSlide();
    }
  };

  return (
    <section 
      data-testid="journey-section"
      className="max-w-6xl mx-auto px-4 py-8 space-y-10"
    >
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs font-semibold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>OUR 5 CHAPTERS OF MEMORIES</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif text-gold-gradient font-bold tracking-tight">
          The Journey
        </h2>

        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-3 px-2 no-scrollbar">
          {CHAPTER_DEFINITIONS.map((ch) => {
            const isActive = ch.id === activeChapterId;
            return (
              <button
                key={ch.id}
                data-testid={`chapter-tab-${ch.id}`}
                onClick={() => setActiveChapterId(ch.id as ChapterId)}
                className={`px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 flex-shrink-0 flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-950 via-rose-950 to-amber-900 text-amber-200 border border-amber-400/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] scale-105'
                    : 'bg-black/50 text-gray-400 border border-amber-500/10 hover:text-amber-100 hover:border-amber-500/30'
                }`}
              >
                <span className="text-[10px] tracking-widest text-amber-400/70 font-mono uppercase">
                  {ch.badge}
                </span>
                <span>{ch.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="text-xs font-cinzel text-amber-400/80 tracking-widest uppercase">
          {currentChapter.badge} — {currentChapter.subtitle}
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif text-amber-100 font-semibold">
          {currentChapter.title}
        </h3>
        <p className="text-sm text-gray-300/80 font-light leading-relaxed">
          {currentChapter.description}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="relative rounded-3xl p-4 sm:p-6 glass-panel border border-amber-500/20 shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between px-2 text-xs font-medium text-amber-300/80">
            <span className="font-mono tracking-widest uppercase">
              {currentChapter.badge}
            </span>
            <span 
              data-testid="journey-slide-counter"
              className="font-mono px-3 py-1 rounded-full bg-black/60 border border-amber-500/20 text-amber-300 font-bold"
            >
              0{activeSlideIndex + 1} / 05
            </span>
          </div>

          <div 
            data-testid="journey-photo-frame"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/80 border border-amber-500/20 flex items-center justify-center group select-none shadow-inner"
          >
            <AnimatePresence mode="wait">
              {currentPhotoUrl ? (
                <motion.img
                  key={`${activeChapterId}-${currentSlotId}-${currentPhotoUrl}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  data-testid="journey-photo-image"
                  src={currentPhotoUrl}
                  alt={`Chapter ${activeChapterId} Photo ${currentSlotId}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <motion.div
                  key={`placeholder-${activeChapterId}-${currentSlotId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  data-testid="journey-photo-placeholder"
                  className="flex flex-col items-center justify-center p-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                    <Camera className="w-8 h-8 text-amber-400/80" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-base font-serif text-amber-200 font-semibold block">
                      Add a memory for Photo 0{currentSlotId}
                    </span>
                    <span className="text-xs text-gray-400 block max-w-xs">
                      This photo slot is currently empty. Click below to add a photo to {currentChapter.title} — Slot 0{currentSlotId}.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMediaManagerOpen(true)}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider text-amber-200 bg-gradient-to-r from-amber-950 to-rose-950 border border-amber-500/40 hover:border-amber-400 hover:scale-105 transition-all flex items-center gap-2 shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload to Slot 0{currentSlotId}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-wider text-amber-200/90">
              PHOTO 0{currentSlotId} OF 05
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              data-testid="journey-prev-btn"
              onClick={handlePrevSlide}
              aria-label="Previous Photo"
              className="p-3 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-200 hover:bg-amber-900/70 hover:border-amber-400 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4].map((dotIdx) => {
                const isSelected = activeSlideIndex === dotIdx;
                const slotPhoto = getJourneyPhotoUrl(activeChapterId, (dotIdx + 1) as SlotId);
                return (
                  <button
                    key={dotIdx}
                    data-testid={`journey-dot-${dotIdx}`}
                    onClick={() => setActiveSlideIndex(dotIdx)}
                    aria-label={`Go to photo ${dotIdx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'w-8 bg-amber-400 shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                        : slotPhoto
                        ? 'w-2.5 bg-rose-400/60 hover:bg-rose-300'
                        : 'w-2.5 bg-gray-700/60 hover:bg-gray-500'
                    }`}
                  />
                );
              })}
            </div>

            <button
              data-testid="journey-next-btn"
              onClick={handleNextSlide}
              aria-label="Next Photo"
              className="p-3 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-200 hover:bg-amber-900/70 hover:border-amber-400 hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

        </div>

        <div className="text-center p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
          <p className="font-serif italic text-sm text-amber-200/80">
            {currentChapter.quote}
          </p>
        </div>

      </div>
    </section>
  );
};
