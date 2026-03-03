import { useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import GameBoard from './components/GameBoard';
import LobbyScreen from './components/LobbyScreen';
import MusicPlayer from './components/MusicPlayer';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import type { ClientEvents, ServerEvents } from '../server/protocol';

type AppMode = 'menu' | 'singleplayer' | 'lobby' | 'multiplayer';

// Wrapper that creates the hook and passes to GameBoard
function MultiplayerGame({
  socket,
  onBackToMenu,
}: {
  socket: Socket<ServerEvents, ClientEvents>;
  onBackToMenu: () => void;
}) {
  const { state, send, opponentHandCount } = useMultiplayerGame(socket);
  return (
    <GameBoard
      mode="multiplayer"
      multiplayerState={state}
      multiplayerSend={send}
      opponentHandCount={opponentHandCount}
      onBackToMenu={onBackToMenu}
    />
  );
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket<ServerEvents, ClientEvents> | null>(null);

  useEffect(() => {
    if (mode !== 'lobby') return;
    if (socketRef.current) return;

    const socket: Socket<ServerEvents, ClientEvents> = io({
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:playerJoined', () => {
      setMode('multiplayer');
    });
  }, [mode]);

  const handleCreateRoom = useCallback(async (): Promise<string | null> => {
    const socket = socketRef.current;
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('room:create', (res) => {
        if (res.ok) {
          setRoomCode(res.roomCode);
          setWaiting(true);
          resolve(res.roomCode);
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const handleJoinRoom = useCallback(async (code: string): Promise<boolean> => {
    const socket = socketRef.current;
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('room:join', code, (res) => {
        if (res.ok) {
          setRoomCode(code);
          setWaiting(false);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }, []);

  const handleBackToMenu = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setMode('menu');
    setRoomCode(null);
    setWaiting(false);
    setConnected(false);
  }, []);

  return (
    <div className="h-full relative">
      {mode === 'menu' && (
        <div className="h-full flex flex-col items-center justify-center gap-8 tavern-grain table-texture board-vignette relative overflow-hidden">
          {/* Radial gold glow behind title */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[400px] h-[400px] rounded-full bg-tavern-gold/8 blur-[100px] pointer-events-none z-0" />

          <div className="text-center relative z-10">
            <h1 className="font-display text-5xl font-bold text-tavern-gold tracking-wide mb-2"
              style={{ textShadow: '0 0 40px rgba(201,168,76,0.3), 0 2px 8px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.15)' }}>
              Tavern Tactics
            </h1>
            <p className="text-tavern-text-dim text-sm tracking-widest uppercase">
              Poker meets Strategy
            </p>
          </div>
          <div className="glass rounded-2xl p-6 max-w-sm text-center space-y-3 relative z-10">
            <p className="text-tavern-text-dim text-sm leading-relaxed">
              Build poker hands across two rows — Frontline and Backline.
              Win both to claim the pot. Manage your cards wisely as antes escalate.
            </p>
            <button
              onClick={() => setMode('singleplayer')}
              className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-tavern-gold to-tavern-amber
                text-tavern-bg font-display font-bold text-lg tracking-wider
                hover:shadow-lg hover:shadow-tavern-gold/30 transition-all active:scale-95"
            >
              Play vs AI
            </button>
            <button
              onClick={() => setMode('lobby')}
              className="w-full px-6 py-2.5 rounded-xl bg-tavern-gold/15 border border-tavern-gold/30
                text-tavern-gold font-display tracking-wider
                hover:bg-tavern-gold/25 transition-colors active:scale-95"
            >
              Play Online
            </button>
          </div>

          {/* Decorative cards with card-back-pattern */}
          <div className="absolute bottom-8 left-8 opacity-20 rotate-[-15deg] z-0">
            <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
          </div>
          <div className="absolute bottom-12 left-16 opacity-15 rotate-[-5deg] z-0">
            <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
          </div>
          <div className="absolute top-8 right-8 opacity-20 rotate-[12deg] z-0">
            <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
          </div>
        </div>
      )}

      {mode === 'singleplayer' && <GameBoard mode="singleplayer" onBackToMenu={() => setMode('menu')} />}

      {mode === 'lobby' && (
        <LobbyScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToMenu}
          roomCode={roomCode}
          waiting={waiting}
          connected={connected}
        />
      )}

      {mode === 'multiplayer' && socketRef.current && (
        <MultiplayerGame socket={socketRef.current} onBackToMenu={handleBackToMenu} />
      )}

      <div className="fixed top-3 right-3 z-50">
        <MusicPlayer />
      </div>
    </div>
  );
}
