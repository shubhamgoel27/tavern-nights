import { Card } from '../game/types';
import { getCardDisplayRank, getCardDisplaySuit, getSuitColor } from '../game/deck';

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  selectable?: boolean;
  faceDown?: boolean;
  small?: boolean;
  dimmed?: boolean;
}

function getFaceCardTitle(card: Card): string | null {
  if (card.type !== 'face') return null;
  switch (card.faceRank) {
    case 'jack': return 'Spy';
    case 'queen': return 'Medic';
    case 'king': return 'Commander';
    case 'ace': return 'Scorcher';
  }
}

function getFaceCardIcon(card: Card): string | null {
  if (card.type === 'joker') return '\u2601';
  if (card.type !== 'face') return null;
  switch (card.faceRank) {
    case 'jack': return '\uD83D\uDC41';
    case 'queen': return '\u2695';
    case 'king': return '\u2694';
    case 'ace': return '\uD83D\uDD25';
  }
}

export default function PlayingCard({ card, onClick, selectable, faceDown, small, dimmed }: PlayingCardProps) {
  if (faceDown) {
    return (
      <div className={`
        ${small ? 'w-12 h-17' : 'w-16 h-23'}
        rounded-lg border border-tavern-border
        bg-gradient-to-br from-tavern-card to-tavern-surface
        flex items-center justify-center
        shadow-md
      `}>
        <div className="w-8 h-12 rounded border border-tavern-gold-dim opacity-30
          bg-gradient-to-br from-tavern-gold-dim/20 to-transparent" />
      </div>
    );
  }

  const rank = getCardDisplayRank(card);
  const suit = getCardDisplaySuit(card);
  const color = getSuitColor(card);
  const faceTitle = getFaceCardTitle(card);
  const faceIcon = getFaceCardIcon(card);
  const isSpecial = card.type === 'face' || card.type === 'joker';

  return (
    <div
      onClick={onClick}
      className={`
        ${small ? 'w-12 h-17' : 'w-16 h-23'}
        rounded-lg border relative overflow-hidden
        ${isSpecial
          ? 'border-tavern-gold/50 bg-gradient-to-br from-tavern-card via-tavern-surface to-tavern-card'
          : 'border-tavern-border bg-gradient-to-br from-tavern-card to-tavern-surface'}
        ${selectable ? 'cursor-pointer card-transition hover:border-tavern-gold' : ''}
        ${dimmed ? 'opacity-40' : ''}
        shadow-md flex flex-col items-center justify-between
        ${small ? 'p-0.5' : 'p-1'}
        select-none
      `}
    >
      {/* Top-left rank and suit */}
      <div className={`self-start ${small ? 'text-[9px]' : 'text-xs'} font-bold leading-tight ${color}`}>
        <div>{rank}</div>
        <div className={small ? 'text-[8px]' : 'text-[10px]'}>{suit}</div>
      </div>

      {/* Center */}
      <div className={`flex flex-col items-center ${small ? '-my-1' : ''}`}>
        {faceIcon && (
          <span className={`${small ? 'text-sm' : 'text-lg'}`}>{faceIcon}</span>
        )}
        {faceTitle && !small && (
          <span className="text-[7px] text-tavern-gold font-display tracking-wider uppercase mt-0.5">
            {faceTitle}
          </span>
        )}
        {!isSpecial && (
          <span className={`${small ? 'text-lg' : 'text-2xl'} font-bold ${color}`}>{suit}</span>
        )}
      </div>

      {/* Bottom-right rank and suit (rotated) */}
      <div className={`self-end rotate-180 ${small ? 'text-[9px]' : 'text-xs'} font-bold leading-tight ${color}`}>
        <div>{rank}</div>
        <div className={small ? 'text-[8px]' : 'text-[10px]'}>{suit}</div>
      </div>

      {/* Gold border glow for face cards */}
      {isSpecial && (
        <div className="absolute inset-0 rounded-lg border border-tavern-gold/20 pointer-events-none" />
      )}
    </div>
  );
}
