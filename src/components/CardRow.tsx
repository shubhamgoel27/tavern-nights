import { Card, Row, HandEvaluation } from '../game/types';
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
}

export default function CardRow({
  cards, row, isPlayer, onDropCard, evaluation, isActive, won, lost,
}: CardRowProps) {
  const label = row === 'frontline' ? 'Frontline' : 'Backline';
  const emptySlots = 5 - cards.length;

  return (
    <div
      className={`
        relative rounded-xl p-2 min-h-[110px] transition-all duration-300
        ${isActive ? 'ring-1 ring-tavern-gold/40' : ''}
        ${won ? 'ring-1 ring-tavern-green/50 bg-tavern-green/5' : ''}
        ${lost ? 'ring-1 ring-tavern-red/30 bg-tavern-red/5' : ''}
        ${!won && !lost ? 'bg-tavern-surface/30' : ''}
      `}
      onClick={() => isPlayer && onDropCard?.(row)}
    >
      {/* Row label */}
      <div className="absolute -top-2.5 left-3">
        <span className={`
          text-[9px] font-display uppercase tracking-widest px-2 py-0.5 rounded
          ${row === 'frontline'
            ? 'text-tavern-red bg-tavern-red/10 border border-tavern-red/20'
            : 'text-tavern-gold bg-tavern-gold/10 border border-tavern-gold/20'}
        `}>
          {label}
        </span>
      </div>

      {/* Evaluation display */}
      {evaluation && cards.length > 0 && (
        <div className="absolute -top-2.5 right-3">
          <span className="text-[9px] font-medium text-tavern-text-dim glass px-2 py-0.5 rounded">
            {evaluation.description}
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-1.5 items-center justify-center mt-2">
        {cards.map((card) => (
          <div key={card.id} className="animate-slide-up">
            <PlayingCard card={card} small />
          </div>
        ))}
        {isPlayer && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={`
              w-12 h-17 rounded-lg border border-dashed
              ${isActive ? 'border-tavern-gold/30 bg-tavern-gold/5' : 'border-tavern-border/30'}
              flex items-center justify-center
              ${isActive ? 'cursor-pointer hover:border-tavern-gold/50 hover:bg-tavern-gold/10' : ''}
              transition-colors
            `}
            onClick={(e) => {
              e.stopPropagation();
              if (isActive) onDropCard?.(row);
            }}
          >
            {isActive && (
              <span className="text-tavern-gold/30 text-lg">+</span>
            )}
          </div>
        ))}
        {!isPlayer && Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-opp-${i}`}
            className="w-12 h-17 rounded-lg border border-dashed border-tavern-border/20"
          />
        ))}
      </div>
    </div>
  );
}
