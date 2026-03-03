import { useState } from 'react';

interface LobbyScreenProps {
  onCreateRoom: () => Promise<string | null>;
  onJoinRoom: (code: string) => Promise<boolean>;
  onBack: () => void;
  roomCode: string | null;
  waiting: boolean;
  connected: boolean;
}

export default function LobbyScreen({
  onCreateRoom, onJoinRoom, onBack, roomCode, waiting, connected,
}: LobbyScreenProps) {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    const code = await onCreateRoom();
    setLoading(false);
    if (!code) setError('Failed to create room. Try again.');
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 6) {
      setError('Enter a 6-character room code');
      return;
    }
    setError('');
    setLoading(true);
    const ok = await onJoinRoom(joinCode.trim().toUpperCase());
    setLoading(false);
    if (!ok) setError('Room not found or full. Check the code.');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 tavern-grain table-texture board-vignette relative overflow-hidden">
      <div className="text-center relative z-10">
        <h1 className="font-display text-4xl font-bold text-tavern-gold tracking-wide mb-2"
          style={{ textShadow: '0 0 30px rgba(201,168,76,0.3), 0 2px 6px rgba(0,0,0,0.5)' }}>
          Play Online
        </h1>
        <p className="text-tavern-text-dim text-sm tracking-widest uppercase">
          {connected ? 'Connected to server' : 'Connecting...'}
        </p>
      </div>

      {!roomCode && !waiting && (
        <div className="glass rounded-2xl p-6 max-w-sm w-full text-center space-y-5 relative z-10">
          <button
            onClick={handleCreate}
            disabled={loading || !connected}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-tavern-gold to-tavern-amber
              text-tavern-bg font-display font-bold text-lg tracking-wider
              hover:shadow-lg hover:shadow-tavern-gold/30 transition-all
              active:scale-95 disabled:opacity-50"
          >
            Create Room
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-tavern-border/30" />
            <span className="text-[10px] text-tavern-text-dim uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-tavern-border/30" />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter room code"
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-xl bg-tavern-surface border border-tavern-border
                text-tavern-text text-center font-display text-lg tracking-[0.3em] uppercase
                placeholder:text-tavern-text-dim/40 placeholder:tracking-wider placeholder:text-sm
                focus:outline-none focus:border-tavern-gold/40"
            />
            <button
              onClick={handleJoin}
              disabled={loading || !connected || joinCode.length < 6}
              className="w-full px-6 py-2.5 rounded-xl bg-tavern-gold/15 border border-tavern-gold/30
                text-tavern-gold font-display tracking-wider
                hover:bg-tavern-gold/25 transition-colors
                disabled:opacity-50 active:scale-95"
            >
              Join Room
            </button>
          </div>

          {error && (
            <p className="text-xs text-tavern-red">{error}</p>
          )}
        </div>
      )}

      {roomCode && waiting && (
        <div className="glass rounded-2xl p-6 max-w-sm w-full text-center space-y-5 relative z-10">
          <p className="text-tavern-text-dim text-sm">Share this code with your opponent:</p>
          {/* Carved wood room code */}
          <div className="py-4 px-6 rounded-xl bg-gradient-to-b from-tavern-card to-tavern-surface
            border border-tavern-gold/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
            <span className="font-display text-4xl font-bold tracking-[0.4em]"
              style={{
                color: 'var(--color-tavern-gold)',
                textShadow: '0 1px 4px rgba(201,168,76,0.4), 0 0 20px rgba(201,168,76,0.15)',
              }}>
              {roomCode}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-tavern-gold animate-pulse" />
            <p className="text-sm text-tavern-text-dim">Waiting for opponent to join...</p>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="px-4 py-1.5 rounded-lg text-xs text-tavern-text-dim border border-tavern-border
          hover:bg-tavern-surface hover:text-tavern-text transition-colors uppercase tracking-wider
          active:scale-95 relative z-10"
      >
        Back to Menu
      </button>
    </div>
  );
}
