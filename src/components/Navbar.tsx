import React, { useState } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import type { ActiveSection } from '../types';
import { 
  Heart, 
  Compass, 
  BookOpen, 
  Image as ImageIcon, 
  PlusCircle, 
  Music, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeSection, 
    setActiveSection, 
    setIsMediaManagerOpen, 
    setIsMusicManagerOpen,
    isPlaying,
    setIsPlaying
  } = useBirthday();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'HOME', icon: <Heart className="w-4 h-4 text-pink-400" /> },
    { id: 'journey', label: 'JOURNEY', icon: <Compass className="w-4 h-4 text-amber-400" /> },
    { id: 'letter', label: 'LETTER', icon: <BookOpen className="w-4 h-4 text-rose-300" /> },
    { id: 'memories', label: 'OUR MEMORIES', icon: <ImageIcon className="w-4 h-4 text-amber-300" /> }
  ];

  const handleNavClick = (section: ActiveSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070709]/80 border-b border-amber-500/15 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 via-rose-900/40 to-amber-700/30 border border-amber-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <span className="font-cinzel text-lg tracking-wider text-gold-shimmer font-semibold block leading-none">
              ANNU ❤️
            </span>
            <span className="text-[10px] tracking-widest text-amber-200/60 uppercase font-sans mt-0.5 block">
              Birthday Experience
            </span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-amber-500/10">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-950/80 via-rose-950/80 to-amber-900/60 text-amber-200 border border-amber-400/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setIsMediaManagerOpen(true)}
            data-testid="nav-add-photos-btn"
            className="px-4 py-2 rounded-full text-xs font-medium tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-900/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>ADD PHOTOS</span>
          </button>

          <button
            onClick={() => setIsMusicManagerOpen(true)}
            data-testid="nav-add-music-btn"
            className="px-4 py-2 rounded-full text-xs font-medium tracking-wider text-rose-300 bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-900/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all flex items-center gap-2"
          >
            <Music className={`w-4 h-4 ${isPlaying ? 'text-amber-400 animate-spin' : 'text-rose-400'}`} />
            <span>ADD MUSIC</span>
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300"
          >
            <Music className={`w-4 h-4 ${isPlaying ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-black/60 border border-amber-500/20 text-amber-300 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a090e]/95 border-b border-amber-500/20 px-4 py-6 space-y-3 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium tracking-widest flex items-center gap-3 transition-colors ${
                activeSection === item.id
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-400/30'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMediaManagerOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider text-amber-300 bg-amber-950/60 border border-amber-500/30 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>ADD PHOTOS (MEDIA MANAGER)</span>
            </button>

            <button
              onClick={() => {
                setIsMusicManagerOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium tracking-wider text-rose-300 bg-rose-950/60 border border-rose-500/30 flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4 text-rose-400" />
              <span>ADD MUSIC</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
