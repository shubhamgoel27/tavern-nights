import type { Card, Row, HandEvaluation } from '../game/types';
import PlayingCard from './PlayingCard';

interface CardRowProps {
  cards: Card[];
  row: Row;
  isPlayer: boolean;
  onDropCard?: (row: Row) => void;
  evaluation?: HandEvaluation | null;
  isActive?: boolean;
  won?: boolean;
  lost?: boolean;
  faceDown?: boolean;
}

/** Small circular SVG emblem for each row type */
function RowIcon({ row }: { row: Row }) {
  if (row === 'frontline') {
    // Sword / triangle
    return (
      <div className="w-5 h-5 rounded-full bg-row-frontline border border-row-frontline-border flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1L9 8H1L5 1Z" fill="rgba(180,64,64,0.8)" stroke="rgba(180,64,64,0.4)" strokeWidth="0.5"/>
        </svg>
      </div>
    );
  }
  // Shield / circle
  return (
    <div className="w-5 h-5 rounded-full bg-row-backline border border-row-backline-border flex items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="3.5" fill="rgba(64,128,192,0.6)" stroke="rgba(64,128,192,0.4)" strokeWidth="0.5"/>
      </svg>
    </div>
  );
}

export default function CardRow({
  cards, row, isPlayer, onDropCard, evaluation, isActive, won, lost, faceDown,
}: CardRowProps) {
  const label = row === 'frontline' ? 'Frontline' : 'Backline';
  const emptySlots = 5 - cards.length;
  const isFront = row === 'frontline';

  return (
    <div
      className={`
        relative rounded-xl p-2 min-h-[110px] transition-all duration-300
        ${isFront ? 'row-pattern-frontline' : 'row-pattern-backline'}
        ${isActive ? 'ring-1 ring-tavern-gold/40' : ''}
        ${won ? 'ring-1 ring-tavern-green/50 row-won' : ''}
        ${lost ? 'ring-1 ring-tavern-red/30 row-lost' : ''}
        ${!won && !lost
          ? isFront
            ? 'bg-row-frontline/30 border border-row-frontline-border/20'
            : 'bg-row-backline/30 border border-row-backline-border/20'
          : won
            ? 'bg-tavern-green/5'
            : 'bg-tavern-red/5'
        }
      `}
      onClick={() => isPlayer && onDropCard?.(row)}
    >
      {/* Row label with icon */}
      <div className="absolute -top-2.5 left-3 flex items-center gap-1.5">
        <RowIcon row={row} />
        <span className={`
          text-[9px] font-display uppercase tracking-widest px-2 py-0.5 rounded
          ${isFront
            ? 'text-tavern-red bg-row-frontline border border-row-frontline-border/40'
            : 'text-suit-clubs-glow bg-row-backline border border-row-backline-border/40'}
        `}>
          {label}
        </span>
      </div>

      {/* Evaluation display — color-coded by win/lose */}
      {evaluation && cards.length > 0 && !faceDown && (
        <div className="absolute -top-2.5 right-3">
          <span className={`
            text-[9px] font-medium px-2 py-0.5 rounded
            ${won ? 'text-tavern-green bg-tavern-green/15 border border-tavern-green/30' :
              lost ? 'text-tavern-red bg-tavern-red/10 border border-tavern-red/20' :
              'text-tavern-text-dim glass'}
          `}>
            {evaluation.description}
          </span>
        </div>
      )}
      {/* Card count when face-down */}
      {faceDown && cards.length > 0 && (
        <div className="absolute -top-2.5 right-3">
          <span className="text-[9px] font-medium text-tavern-text-dim glass px-2 py-0.5 rounded">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-1.5 items-center justify-center mt-2">
        {cards.map((card) => (
          <div key={card.id} className="animate-slide-up">
            <PlayingCard card={card} small faceDown={faceDown} />
          </div>
        ))}
        {isPlayer && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={`
              w-12 h-17 rounded-lg border border-dashed relative
              ${isActive
                ? 'border-tavern-gold/30 bg-tavern-gold/5'
                : isFront
                  ? 'border-row-frontline-border/30'
                  : 'border-row-backline-border/30'}
              flex items-center justify-center
              ${isActive ? 'cursor-pointer hover:border-tavern-gold/50 hover:bg-tavern-gold/10' : ''}
              transition-colors
            `}
            onClick={(e) => {
              e.stopPropagation();
              if (isActive) onDropCard?.(row);
            }}
          >
            {/* Inner border line */}
            <div className={`absolute inset-1 rounded border border-dashed
              ${isActive ? 'border-tavern-gold/15' : isFront ? 'border-row-frontline-border/10' : 'border-row-backline-border/10'}
            `} />
            {isActive && (
              <span className="text-tavern-gold/30 text-lg z-10">+</span>
            )}
          </div>
        ))}
        {!isPlayer && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-opp-${i}`}
            className={`w-12 h-17 rounded-lg border border-dashed
              ${isFront ? 'border-row-frontline-border/15' : 'border-row-backline-border/15'}
            `}
          />
        ))}
      </div>
    </div>
  );
}
