import type { Card } from '../game/types';
import PlayingCard from './PlayingCard';

interface PlayerHandProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  disabled?: boolean;
  isPlayerTurn?: boolean;
}

export default function PlayerHand({ cards, selectedCardId, onSelectCard, disabled, isPlayerTurn }: PlayerHandProps) {
  const count = cards.length;

  return (
    <div className="flex justify-center items-end" style={{ minHeight: '100px' }}>
      {cards.map((card, i) => {
        const isSelected = selectedCardId === card.id;
        // Normalize offset: -1 to 1 range centered on middle
        const normalizedOffset = count > 1 ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0;
        const rotation = normalizedOffset * 12; // ±12 degrees max
        const verticalOffset = Math.abs(normalizedOffset) * 10; // arc curve in px

        return (
          <div
            key={card.id}
            className={`
              transition-all duration-200
              ${!disabled && !isSelected ? 'hover:-translate-y-2' : ''}
              ${isPlayerTurn && !isSelected ? 'card-playable' : ''}
            `}
            style={{
              transform: isSelected
                ? 'translateY(-16px) scale(1.08) rotate(0deg)'
                : `translateY(${verticalOffset}px) rotate(${rotation}deg)`,
              marginLeft: i === 0 ? '0px' : '-4px',
              zIndex: isSelected ? 50 : i,
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Selection glow ring */}
            <div className={`
              rounded-lg transition-shadow duration-200
              ${isSelected ? 'shadow-[0_0_16px_rgba(201,168,76,0.4)]' : ''}
            `}>
              <PlayingCard
                card={card}
                selectable={!disabled}
                onClick={() => !disabled && onSelectCard(card.id)}
                dimmed={disabled}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
