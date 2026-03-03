import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Card } from '../game/types';
import { getCardDisplaySuit, getSuitColor, getCardNumericValue } from '../game/deck';

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

function getFaceCardTooltip(card: Card): string | null {
  if (card.type === 'joker') return 'Disables all flushes this round for both players';
  if (card.type !== 'face') return null;
  switch (card.faceRank) {
    case 'jack': return 'Played on opponent\'s board. You draw 2 cards.';
    case 'queen': return 'Revives the highest card from the graveyard to this row.';
    case 'king': return 'Win this row = opponent loses 5 extra chips.';
    case 'ace': return 'Destroys opponent\'s highest card in this row.';
  }
}

/** Suit-colored gradient class for the art area background */
function getSuitBgClass(card: Card): string {
  if (card.type === 'joker') return 'bg-joker-bg';
  const suit = card.type === 'face' ? card.suit : card.suit;
  switch (suit) {
    case 'hearts': return 'bg-suit-hearts-bg';
    case 'diamonds': return 'bg-suit-diamonds-bg';
    case 'clubs': return 'bg-suit-clubs-bg';
    case 'spades': return 'bg-suit-spades-bg';
  }
}

/** Suit glow color for radial glow effect */
function getSuitGlowColor(card: Card): string {
  if (card.type === 'joker') return 'rgba(128, 64, 192, 0.3)';
  const suit = card.type === 'face' ? card.suit : card.suit;
  switch (suit) {
    case 'hearts': return 'rgba(192, 64, 64, 0.25)';
    case 'diamonds': return 'rgba(192, 96, 64, 0.25)';
    case 'clubs': return 'rgba(64, 128, 192, 0.25)';
    case 'spades': return 'rgba(96, 112, 160, 0.25)';
  }
}

/** Card power value: 2-14 for number/face, null for joker */
function getCardPower(card: Card): number | null {
  if (card.type === 'joker') return null;
  return getCardNumericValue(card);
}

/** Rank name for stat bar */
function getRankName(card: Card): string {
  if (card.type === 'joker') return 'Weather';
  if (card.type === 'face') {
    switch (card.faceRank) {
      case 'jack': return 'Jack';
      case 'queen': return 'Queen';
      case 'king': return 'King';
      case 'ace': return 'Ace';
    }
  }
  const names: Record<number, string> = {
    2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five',
    6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
  };
  return names[card.rank] || String(card.rank);
}

/** Inline SVG suit symbol */
function SuitSVG({ card, size = 24 }: { card: Card; size?: number }) {
  const s = size;
  if (card.type === 'joker') {
    // Cloud + lightning bolt
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M6 16a4 4 0 0 1-.88-7.9A6 6 0 0 1 17 9a4 4 0 0 1 1 7.9" fill="rgba(128,64,192,0.6)" stroke="rgba(128,64,192,0.8)" strokeWidth="1"/>
        <path d="M13 12l-2 5h3l-2 5" stroke="#d4a043" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  const suit = card.type === 'face' ? card.suit : card.suit;
  switch (suit) {
    case 'hearts':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="text-suit-hearts">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      );
    case 'diamonds':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="text-suit-diamonds">
          <path d="M12 2L4 12l8 10 8-10L12 2z"/>
        </svg>
      );
    case 'clubs':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="text-suit-clubs">
          <circle cx="12" cy="7" r="4"/>
          <circle cx="7" cy="14" r="4"/>
          <circle cx="17" cy="14" r="4"/>
          <path d="M12 11v9M10 20h4"/>
        </svg>
      );
    case 'spades':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" className="text-suit-spades">
          <path d="M12 2C12 2 4 10 4 14a4 4 0 0 0 4 4c1.6 0 3-.9 3.7-2.2L12 22l.3-6.2A4 4 0 0 0 16 18a4 4 0 0 0 4-4C20 10 12 2 12 2z"/>
        </svg>
      );
  }
}

export default function PlayingCard({ card, onClick, selectable, faceDown, small, dimmed }: PlayingCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Face-down card ──
  if (faceDown) {
    return (
      <div className={`
        ${small ? 'w-12 h-17' : 'w-16 h-23'}
        rounded-lg border border-card-frame
        card-back-pattern
        flex items-center justify-center
        shadow-md relative overflow-hidden
      `}>
        {/* Central diamond emblem */}
        <svg width={small ? 16 : 24} height={small ? 20 : 30} viewBox="0 0 24 30" fill="none" className="opacity-30">
          <path d="M12 2L4 15l8 13 8-13L12 2z" stroke="var(--color-tavern-gold)" strokeWidth="1" fill="none"/>
          <path d="M12 6L7 15l5 9 5-9L12 6z" stroke="var(--color-tavern-gold)" strokeWidth="0.5" fill="rgba(201,168,76,0.1)"/>
        </svg>
        {/* Corner accent lines */}
        {!small && (
          <>
            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-tavern-gold/15 rounded-tl" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-tavern-gold/15 rounded-br" />
          </>
        )}
      </div>
    );
  }

  const suit = getCardDisplaySuit(card);
  const color = getSuitColor(card);
  const faceTitle = getFaceCardTitle(card);
  const faceIcon = getFaceCardIcon(card);
  const tooltip = getFaceCardTooltip(card);
  const isSpecial = card.type === 'face' || card.type === 'joker';
  const isExhausted = card.type === 'face' && card.abilityUsed === true;
  const isJoker = card.type === 'joker';
  const isFace = card.type === 'face';
  const power = getCardPower(card);
  const suitBg = getSuitBgClass(card);
  const glowColor = getSuitGlowColor(card);

  const getTooltipStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return { display: 'none' };
    const rect = wrapperRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.top - 6,
      left: rect.left + rect.width / 2,
      transform: 'translate(-50%, -100%)',
    };
  };

  // ── Small card (board display) ──
  if (small) {
    return (
      <div
        ref={wrapperRef}
        className="relative"
        onMouseEnter={() => isSpecial && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          onClick={onClick}
          className={`
            w-12 h-17 rounded-lg relative overflow-hidden
            border ${isJoker ? 'border-joker-glow/40' : isFace ? 'border-tavern-gold/40' : 'border-card-frame'}
            ${selectable ? 'cursor-pointer card-transition hover:border-tavern-gold' : ''}
            ${dimmed ? 'opacity-40' : ''}
            shadow-md flex flex-col select-none
          `}
        >
          {/* Power circle (top-left) */}
          {power !== null && (
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full
              bg-gradient-to-br from-tavern-gold to-tavern-amber
              flex items-center justify-center z-10 shadow-sm">
              <span className="text-[7px] font-bold text-tavern-bg leading-none">{power}</span>
            </div>
          )}

          {/* Art area */}
          <div className={`flex-1 ${suitBg} flex items-center justify-center relative`}>
            <div className="opacity-70">
              <SuitSVG card={card} size={16} />
            </div>
            {isFace && faceIcon && (
              <span className="absolute text-sm">{faceIcon}</span>
            )}
          </div>

          {/* Exhausted overlay */}
          {isExhausted && (
            <div className="absolute inset-0 rounded-lg border border-tavern-red/20 bg-tavern-bg/30 pointer-events-none
              flex items-end justify-center pb-0.5">
              <span className="text-[5px] text-tavern-red/60 uppercase tracking-wider font-display">used</span>
            </div>
          )}
        </div>

        {/* Tooltip */}
        {showTooltip && tooltip && createPortal(
          <div className="z-[9999] pointer-events-none animate-fade-in" style={getTooltipStyle()}>
            <div className="glass rounded-lg px-2.5 py-1.5 text-center">
              <div className="text-[9px] text-tavern-gold font-display tracking-wider uppercase">
                {faceTitle || 'Weather'}
              </div>
              <div className="text-[10px] text-tavern-text-dim leading-snug mt-0.5 whitespace-normal max-w-[180px]">
                {tooltip}
              </div>
            </div>
          </div>,
          document.body,
        )}
      </div>
    );
  }

  // ── Normal card (hand display) ──
  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => isSpecial && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        onClick={onClick}
        className={`
          w-16 h-23 rounded-lg relative overflow-hidden
          border
          ${isJoker ? 'border-joker-glow/40' : isFace && !isExhausted ? 'border-tavern-gold/40' : 'border-card-frame'}
          ${selectable ? 'cursor-pointer card-transition hover:border-tavern-gold' : ''}
          ${dimmed ? 'opacity-40' : ''}
          shadow-md flex flex-col select-none bg-card-inner
        `}
      >
        {/* ── Power circle (top-left) ── */}
        {power !== null && (
          <div className="absolute top-1 left-1 w-5 h-5 rounded-full
            bg-gradient-to-br from-tavern-gold to-tavern-amber
            flex items-center justify-center z-10
            shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] font-bold text-tavern-bg leading-none">{power}</span>
          </div>
        )}

        {/* ── Art area ── */}
        <div
          className={`flex-1 ${suitBg} flex items-center justify-center relative mx-0.5 mt-0.5 rounded-t`}
          style={{ boxShadow: `inset 0 0 20px ${glowColor}` }}
        >
          {/* Suit SVG */}
          <div className={`${isFace || isJoker ? 'opacity-20' : 'opacity-50'}`}>
            <SuitSVG card={card} size={28} />
          </div>

          {/* Face card overlay */}
          {isFace && faceIcon && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl">{faceIcon}</span>
              <span className="text-[6px] text-tavern-gold font-display tracking-wider uppercase mt-0.5">
                {faceTitle}
              </span>
            </div>
          )}

          {/* Joker icon */}
          {isJoker && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <SuitSVG card={card} size={20} />
            </div>
          )}

          {/* Face card shimmer */}
          {isFace && !isExhausted && (
            <div className="absolute inset-0 card-shimmer pointer-events-none" />
          )}

          {/* Face card inner gold glow */}
          {isFace && !isExhausted && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 15px rgba(201, 168, 76, 0.1)' }} />
          )}
        </div>

        {/* ── Stat bar ── */}
        <div className="bg-card-stat-bar flex items-center gap-1 px-1.5 py-0.5 mx-0.5 mb-0.5 rounded-b">
          <span className={`text-[8px] ${color}`}>{suit}</span>
          <span className="text-[7px] text-tavern-text-dim truncate">{getRankName(card)}</span>
        </div>

        {/* Exhausted indicator */}
        {isExhausted && (
          <div className="absolute inset-0 rounded-lg border border-tavern-red/20 bg-tavern-bg/30 pointer-events-none
            flex items-end justify-center pb-3">
            <span className="text-[6px] text-tavern-red/60 uppercase tracking-wider font-display">used</span>
          </div>
        )}
      </div>

      {/* Ability tooltip — portal to escape overflow */}
      {showTooltip && tooltip && createPortal(
        <div
          className="z-[9999] pointer-events-none animate-fade-in"
          style={getTooltipStyle()}
        >
          <div className="glass rounded-lg px-2.5 py-1.5 text-center">
            <div className="text-[9px] text-tavern-gold font-display tracking-wider uppercase">
              {faceTitle || 'Weather'}
            </div>
            <div className="text-[10px] text-tavern-text-dim leading-snug mt-0.5 whitespace-normal max-w-[180px]">
              {tooltip}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
