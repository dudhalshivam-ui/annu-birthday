import React, { useState } from 'react';
import { Sparkles, Mail, Gift, Feather } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LetterSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const handleOpenLetter = () => {
    setIsOpen(true);
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#D4AF37', '#F3E5AB', '#9F1239', '#FDA4AF', '#E11D48']
    });
  };

  return (
    <section 
      data-testid="letter-section"
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-200 text-xs font-semibold tracking-widest uppercase">
          <Feather className="w-3.5 h-3.5 text-amber-400" />
          <span>FROM THE HEART</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif text-gold-gradient font-bold tracking-tight">
          A Letter For You
        </h2>
        
        <p className="text-sm text-rose-100/80 font-light">
          Words can barely capture what you mean to me, but here is a piece of my heart written just for your birthday.
        </p>
      </div>

      {!isOpen ? (
        <div className="max-w-md mx-auto my-12 text-center">
          <div 
            onClick={handleOpenLetter}
            className="group relative cursor-pointer p-8 rounded-3xl glass-panel border border-amber-500/30 hover:border-amber-400/60 transition-all duration-500 shadow-2xl flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-900 via-amber-800 to-rose-950 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-10 h-10 text-amber-300" />
            </div>

            <div className="space-y-2">
              <span className="font-serif text-xl text-amber-200 font-semibold block">
                To My Dearest Annu ❤️
              </span>
              <span className="text-xs text-amber-300/80 tracking-widest uppercase block font-mono">
                Click Wax Seal To Open Letter
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl p-6 sm:p-12 glass-panel-burgundy border border-amber-500/30 shadow-2xl space-y-8 animate-fadeIn">
          
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-6 text-xs text-amber-300 font-mono tracking-widest uppercase">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> For Annu
            </span>
            <span>Birthday Edition ✨</span>
          </div>

          <div className="space-y-6 text-gray-100 font-serif text-base sm:text-xl leading-relaxed sm:leading-loose">
            <p className="font-bold text-amber-200 text-2xl">
              Dearest Annu ❤️,
            </p>

            <p>
              Happy Birthday! Today is a day to celebrate the most incredible, beautiful, and warm-hearted person in my life. Having you by my side has turned ordinary days into unforgettable memories.
            </p>

            <p>
              When I look back at our journey — from the very beginning to every quiet laugh and shared secret — I realize how blessed I am. Your smile is my daily source of happiness, and your kindness inspires me to be a better person every day.
            </p>

            <p>
              As you step into another magnificent year, my only wish is for your life to be overflowing with boundless joy, peace, success, and all the love you so richly deserve.
            </p>

            <p>
              Thank you for being my favorite chapter, my home, and my forever. Here is to celebrating you today and for all the years ahead.
            </p>
          </div>

          <div className="pt-8 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs text-amber-300/70 font-mono uppercase tracking-widest block">
                With All My Love & Devotion,
              </span>
              <span className="font-handwriting text-4xl text-gold-gradient block mt-1">
                Forever Yours ❤️
              </span>
            </div>

            <button
              onClick={() => {
                confetti({
                  particleCount: 70,
                  spread: 80,
                  origin: { y: 0.7 }
                });
              }}
              className="px-6 py-3 rounded-full text-xs font-semibold tracking-wider text-amber-200 bg-black/40 border border-amber-500/30 hover:bg-amber-950/60 hover:border-amber-400 transition-all flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-rose-400" />
              <span>Send Birthday Love 🎉</span>
            </button>
          </div>

        </div>
      )}
    </section>
  );
};
