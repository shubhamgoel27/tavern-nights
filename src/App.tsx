import GameBoard from './components/GameBoard';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  return (
    <div className="h-full relative">
      <GameBoard />
      <div className="fixed top-3 right-3 z-50">
        <MusicPlayer />
      </div>
    </div>
  );
}
