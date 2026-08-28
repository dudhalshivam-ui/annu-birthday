import React, { useRef, useEffect, useState } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Music, 
  ListMusic
} from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const { 
    tracks, 
    currentTrackIndex, 
    isPlaying, 
    setIsPlaying, 
    playNextTrack, 
    playPrevTrack,
    setIsMusicManagerOpen
  } = useBirthday();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn('Audio play postponed until user gesture:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, setIsPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div 
      data-testid="music-player-bar"
      className="fixed bottom-4 right-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-96 rounded-2xl glass-panel border border-amber-500/30 p-3 shadow-2xl backdrop-blur-xl animate-fadeIn"
    >
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNextTrack}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 flex-shrink-0">
              <Music className={`w-4 h-4 ${isPlaying ? 'animate-spin text-amber-400' : ''}`} />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-amber-100 truncate block">
                {currentTrack.title}
              </span>
              <span className="text-[10px] text-gray-400 truncate block">
                {currentTrack.artist || 'Romantic Theme'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMusicManagerOpen(true)}
            className="p-1.5 rounded-lg bg-black/40 text-amber-300 hover:text-amber-100 border border-amber-500/20 text-xs flex items-center gap-1 flex-shrink-0"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Tracks</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 text-gray-400 hover:text-amber-200"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playPrevTrack}
              className="p-1.5 rounded-full bg-black/40 text-amber-200 hover:bg-amber-950/60"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-full bg-gradient-to-r from-amber-600 to-rose-700 text-white shadow-md hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              onClick={playNextTrack}
              className="p-1.5 rounded-full bg-black/40 text-amber-200 hover:bg-amber-950/60"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
