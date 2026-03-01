import { useState } from 'react';
import type { BettingAction } from '../game/types';

interface BettingPanelProps {
  onBet: (action: BettingAction, amount: number) => void;
  currentBet: number;
  playerChips: number;
  canCheck: boolean;
  minBet: number;
  hasBettor: boolean;
}

export default function BettingPanel({
  onBet, currentBet, playerChips, canCheck, minBet, hasBettor,
}: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState(minBet);

  return (
    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2 animate-fade-in">
      {!hasBettor && canCheck && (
        <button
          onClick={() => onBet('check', 0)}
          className="px-4 py-1.5 rounded-lg bg-tavern-surface border border-tavern-border
            text-tavern-text text-sm font-medium hover:border-tavern-gold/40 transition-colors"
        >
          Check
        </button>
      )}

      {hasBettor && (
        <button
          onClick={() => onBet('call', currentBet)}
          className="px-4 py-1.5 rounded-lg bg-tavern-green/20 border border-tavern-green/40
            text-tavern-green text-sm font-medium hover:bg-tavern-green/30 transition-colors"
        >
          Call {currentBet}
        </button>
      )}

      <div className="flex items-center gap-1.5">
        <input
          type="range"
          min={minBet}
          max={Math.min(playerChips, 50)}
          step={5}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-20 accent-tavern-gold"
        />
        <button
          onClick={() => onBet(hasBettor ? 'raise' : 'bet', betAmount)}
          disabled={betAmount > playerChips}
          className="px-4 py-1.5 rounded-lg bg-tavern-gold/20 border border-tavern-gold/40
            text-tavern-gold text-sm font-medium hover:bg-tavern-gold/30 transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {hasBettor ? 'Raise' : 'Bet'} {betAmount}
        </button>
      </div>

      <button
        onClick={() => onBet('fold', 0)}
        className="px-4 py-1.5 rounded-lg bg-tavern-red/15 border border-tavern-red/30
          text-tavern-red text-sm font-medium hover:bg-tavern-red/25 transition-colors ml-auto"
      >
        Fold
      </button>
    </div>
  );
}
