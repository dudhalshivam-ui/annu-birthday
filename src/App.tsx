import React from 'react';
import { BirthdayProvider, useBirthday } from './context/BirthdayContext';
import { Navbar } from './components/Navbar';
import { HomeSection } from './components/HomeSection';
import { JourneySection } from './components/JourneySection';
import { LetterSection } from './components/LetterSection';
import { MemoriesSection } from './components/MemoriesSection';
import { MediaManager } from './components/MediaManager';
import { MusicPlayer } from './components/MusicPlayer';
import { MusicManager } from './components/MusicManager';
import { TestRunnerModal } from './components/TestRunnerModal';
import { Heart, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeSection } = useBirthday();

  return (
    <main className="min-h-[calc(100vh-10rem)] pb-24">
      {activeSection === 'home' && <HomeSection />}
      {activeSection === 'journey' && <JourneySection />}
      {activeSection === 'letter' && <LetterSection />}
      {activeSection === 'memories' && <MemoriesSection />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <BirthdayProvider>
      <div className="min-h-screen bg-[#070709] text-gray-100 selection:bg-[#3D101A] selection:text-[#F3E5AB] relative overflow-hidden font-sans">
        
        {/* Subtle Background Radial Lighting */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-600/10 via-rose-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Navbar */}
        <Navbar />

        {/* Active Section Content */}
        <MainContent />

        {/* Modals & Audio Player */}
        <MediaManager />
        <MusicManager />
        <MusicPlayer />
        <TestRunnerModal />

        {/* Luxury Footer */}
        <footer className="border-t border-amber-500/15 py-8 text-center text-xs text-gray-400 space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-cinzel">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ANNU'S BIRTHDAY EXPERIENCE</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-gray-400 font-light flex items-center justify-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Annu's Special Day
          </p>
        </footer>

      </div>
    </BirthdayProvider>
  );
};

export default App;
