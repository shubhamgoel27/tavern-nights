// ── Poker Hand Evaluator ──
// Evaluates 1-5 card poker hands for row comparison.
// Uses direct algorithmic evaluation (no external library needed).

import type { Card, HandEvaluation, HandRank } from './types';

function getNumericValues(cards: Card[]): number[] {
  return cards.map(c => {
    if (c.type === 'joker') return 0;
    if (c.type === 'number') return c.rank;
    switch (c.faceRank) {
      case 'jack': return 11;
      case 'queen': return 12;
      case 'king': return 13;
      case 'ace': return 14;
    }
  }).filter(v => v > 0).sort((a, b) => b - a);
}

function getSuits(cards: Card[]): string[] {
  return cards
    .filter(c => c.type !== 'joker')
    .map(c => c.type === 'number' ? c.suit : c.suit);
}

function isFlush(cards: Card[], weatherActive: boolean): boolean {
  if (weatherActive) return false;
  const suits = getSuits(cards);
  if (suits.length < 5) return false;
  return suits.every(s => s === suits[0]);
}

function isStraight(values: number[]): boolean {
  if (values.length < 5) return false;
  const sorted = [...new Set(values)].sort((a, b) => b - a);
  if (sorted.length < 5) return false;

  // Check normal straight
  if (sorted[0] - sorted[4] === 4 && sorted.length === 5) return true;

  // Check wheel (A-2-3-4-5)
  if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2) return true;

  return false;
}

function getGroupings(values: number[]): Map<number, number> {
  const groups = new Map<number, number>();
  for (const v of values) {
    groups.set(v, (groups.get(v) || 0) + 1);
  }
  return groups;
}

export function evaluateHand(cards: Card[], weatherActive: boolean = false): HandEvaluation {
  // Filter out jokers and exhausted face cards (ability was used → excluded from scoring)
  const evalCards = cards.filter(c =>
    c.type !== 'joker' && !(c.type === 'face' && c.abilityUsed)
  );

  if (evalCards.length === 0) {
    return { rank: 'high-card', rankValue: 0, highCards: [0], description: 'Empty' };
  }

  const values = getNumericValues(evalCards);
  const groups = getGroupings(values);
  const flush = isFlush(evalCards, weatherActive);
  const straight = isStraight(values);

  // Sort groups by count desc, then by value desc
  const sortedGroups = [...groups.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const counts = sortedGroups.map(g => g[1]);
  const groupValues = sortedGroups.map(g => g[0]);

  let rank: HandRank;
  let description: string;

  if (evalCards.length < 5) {
    // Partial hand — evaluate what we have
    if (counts[0] === 4) {
      rank = 'four-of-a-kind';
      description = `Four ${groupValues[0]}s`;
    } else if (counts[0] === 3 && counts[1] >= 2) {
      rank = 'full-house';
      description = `Full House: ${groupValues[0]}s over ${groupValues[1]}s`;
    } else if (counts[0] === 3) {
      rank = 'three-of-a-kind';
      description = `Three ${groupValues[0]}s`;
    } else if (counts[0] === 2 && counts[1] === 2) {
      rank = 'two-pair';
      description = `Two Pair: ${groupValues[0]}s and ${groupValues[1]}s`;
    } else if (counts[0] === 2) {
      rank = 'pair';
      description = `Pair of ${groupValues[0]}s`;
    } else {
      rank = 'high-card';
      description = `High Card: ${values[0]}`;
    }
  } else if (flush && straight) {
    if (values[0] === 14 && values[1] === 13) {
      rank = 'royal-flush';
      description = 'Royal Flush';
    } else {
      rank = 'straight-flush';
      description = `Straight Flush: ${values[0]} high`;
    }
  } else if (counts[0] === 4) {
    rank = 'four-of-a-kind';
    description = `Four ${groupValues[0]}s`;
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = 'full-house';
    description = `Full House: ${groupValues[0]}s over ${groupValues[1]}s`;
  } else if (flush) {
    rank = 'flush';
    description = `Flush: ${values[0]} high`;
  } else if (straight) {
    rank = 'straight';
    // For wheel, adjust high card
    if (values[0] === 14 && values[4] === 2) {
      description = 'Straight: 5 high';
    } else {
      description = `Straight: ${values[0]} high`;
    }
  } else if (counts[0] === 3) {
    rank = 'three-of-a-kind';
    description = `Three ${groupValues[0]}s`;
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = 'two-pair';
    description = `Two Pair: ${groupValues[0]}s and ${groupValues[1]}s`;
  } else if (counts[0] === 2) {
    rank = 'pair';
    description = `Pair of ${groupValues[0]}s`;
  } else {
    rank = 'high-card';
    description = `High Card: ${values[0]}`;
  }

  const rankValue = {
    'high-card': 0, 'pair': 1, 'two-pair': 2, 'three-of-a-kind': 3,
    'straight': 4, 'flush': 5, 'full-house': 6, 'four-of-a-kind': 7,
    'straight-flush': 8, 'royal-flush': 9,
  }[rank];

  return { rank, rankValue, highCards: values, description };
}

/** Compare two evaluated hands. Returns positive if a wins, negative if b wins, 0 for tie. */
export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;

  // Tiebreak by high cards
  const len = Math.max(a.highCards.length, b.highCards.length);
  for (let i = 0; i < len; i++) {
    const av = a.highCards[i] || 0;
    const bv = b.highCards[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}
