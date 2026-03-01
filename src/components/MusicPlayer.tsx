import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'tavern-music-muted';
const VOLUME_KEY = 'tavern-music-volume';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem(VOLUME_KEY);
    return stored ? parseFloat(stored) : 0.3;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    const audio = new Audio('/audio/tavern-bg.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
    localStorage.setItem(STORAGE_KEY, String(isMuted));
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(() => {
        // Autoplay blocked
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0 && isMuted) setIsMuted(false);
    if (v === 0) setIsMuted(true);
  }, [isMuted]);

  return (
    <div
      className="relative"
      onMouseEnter={() => isPlaying && setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <button
        onClick={isPlaying ? toggleMute : togglePlay}
        className="w-8 h-8 rounded-full glass border border-tavern-gold/30
          text-tavern-gold hover:border-tavern-gold/60 hover:bg-tavern-gold/10
          transition-colors flex items-center justify-center"
        title={isPlaying ? (isMuted ? 'Unmute' : 'Mute') : 'Play Music'}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          {isPlaying && !isMuted ? (
            <>
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </>
          ) : isPlaying && isMuted ? (
            <>
              <path d="M3 9v6h4l5 5V4L7 9H3z" />
              <line x1="18" y1="9" x2="24" y2="15" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="24" y1="9" x2="18" y2="15" stroke="currentColor" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <path d="M3 9v6h4l5 5V4L7 9H3z" opacity="0.5" />
              <line x1="18" y1="9" x2="24" y2="15" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
              <line x1="24" y1="9" x2="18" y2="15" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
            </>
          )}
        </svg>
      </button>

      {showVolume && isPlaying && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass rounded-xl p-3 animate-fade-in">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      )}
    </div>
  );
}
