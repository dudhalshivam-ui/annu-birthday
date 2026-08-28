import React from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { Sparkles, Heart, Compass, ArrowRight, Stars, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

export const HomeSection: React.FC = () => {
  const { setActiveSection, getJourneyPhotoUrl } = useBirthday();

  const heroImage = getJourneyPhotoUrl('chapter-01', 1);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#F3E5AB', '#9F1239', '#FDA4AF']
    });
  };

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs font-semibold tracking-widest uppercase shadow-[0_0_20px_rgba(212,175,55,0.15)]">
          <Stars className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>A Private Gift of Love & Memories</span>
          <Stars className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-gold-gradient tracking-tight leading-tight">
            Happy Birthday, Annu ❤️
          </h1>
          <p className="text-lg sm:text-xl text-rose-100/80 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to your digital love album — a space crafted with pure devotion, honoring our past, celebrating our present, and stepping into our forever.
          </p>
        </div>

        <div className="relative max-w-md mx-auto my-8 group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/30 via-rose-600/30 to-amber-600/30 blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
          <div className="relative rounded-2xl overflow-hidden glass-panel border border-amber-400/20 p-3 shadow-2xl">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/60 relative flex items-center justify-center">
              {heroImage ? (
                <img 
                  src={heroImage} 
                  alt="Annu's Special Memory" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <Heart className="w-7 h-7 text-rose-400 fill-rose-500/20 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-amber-200 block">Chapter 01 — Photo 01</span>
                    <span className="text-xs text-gray-400 block mt-1">Upload your favorite first photo in the Media Manager to feature here</span>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <span className="text-xs font-cinzel text-amber-200 tracking-widest uppercase">
                  Chapter 01: The Beginning
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-amber-500/15 max-w-2xl mx-auto space-y-4">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
          <p className="font-serif text-lg text-gray-200 leading-relaxed italic">
            "Every second spent with you is a gift I cherish deeply. This website is filled with 5 chapters of our journey together — each photo holding a piece of our story."
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-amber-300/80">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>FOREVER & ALWAYS</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setActiveSection('journey');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            data-testid="home-begin-journey-btn"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm tracking-widest uppercase bg-gradient-to-r from-amber-600 via-rose-700 to-amber-700 text-white shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border border-amber-300/40"
          >
            <Compass className="w-5 h-5 text-amber-200" />
            <span>BEGIN OUR JOURNEY</span>
            <ArrowRight className="w-4 h-4 text-amber-200" />
          </button>

          <button
            onClick={triggerConfetti}
            className="w-full sm:w-auto px-6 py-4 rounded-full font-medium text-sm tracking-wider text-amber-200 bg-black/40 border border-amber-500/30 hover:bg-amber-950/40 hover:border-amber-400 transition-all flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4 text-rose-400" />
            <span>CELEBRATE 🎉</span>
          </button>
        </div>

      </div>
    </section>
  );
};
