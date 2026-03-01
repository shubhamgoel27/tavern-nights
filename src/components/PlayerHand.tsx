import type { Card } from '../game/types';
import PlayingCard from './PlayingCard';

interface PlayerHandProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  disabled?: boolean;
}

export default function PlayerHand({ cards, selectedCardId, onSelectCard, disabled }: PlayerHandProps) {
  return (
    <div className="flex gap-1.5 justify-center flex-wrap">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className={`
            transition-transform duration-200
            ${selectedCardId === card.id ? '-translate-y-3' : ''}
            ${!disabled ? 'hover:-translate-y-1' : ''}
          `}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <PlayingCard
            card={card}
            selectable={!disabled}
            onClick={() => !disabled && onSelectCard(card.id)}
            dimmed={disabled}
          />
        </div>
      ))}
    </div>
  );
}
