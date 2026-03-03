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
    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2 animate-fade-in
      border border-tavern-border/40">
      {!hasBettor && canCheck && (
        <button
          onClick={() => onBet('check', 0)}
          className="px-4 py-1.5 rounded-lg bg-tavern-surface border border-tavern-border
            text-tavern-text text-sm font-medium hover:border-tavern-green/40 hover:text-tavern-green
            transition-colors active:scale-95 flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-tavern-green">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Check
        </button>
      )}

      {hasBettor && (
        <button
          onClick={() => onBet('call', currentBet)}
          className="px-4 py-1.5 rounded-lg bg-tavern-green/20 border border-tavern-green/40
            text-tavern-green text-sm font-medium hover:bg-tavern-green/30
            transition-colors active:scale-95 flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-tavern-green">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
            text-tavern-gold text-sm font-medium hover:bg-tavern-gold/30
            transition-colors active:scale-95 flex items-center gap-1.5
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-tavern-gold">
            <path d="M6 10V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hasBettor ? 'Raise' : 'Bet'} {betAmount}
        </button>
      </div>

      <button
        onClick={() => onBet('fold', 0)}
        className="px-4 py-1.5 rounded-lg bg-tavern-red/15 border border-tavern-red/30
          text-tavern-red text-sm font-medium hover:bg-tavern-red/25 hover:shadow-[0_0_8px_rgba(180,64,64,0.2)]
          transition-all active:scale-95 ml-auto flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-tavern-red">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Fold
      </button>
    </div>
  );
}
