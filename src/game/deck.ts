import { Card, NumberCard, FaceCard, FaceRank, JokerCard, Suit, Rank } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const FACE_RANKS: FaceRank[] = ['jack', 'queen', 'king', 'ace'];

let cardIdCounter = 0;

function makeId(): string {
  return `card-${++cardIdCounter}`;
}

export function resetIdCounter() {
  cardIdCounter = 0;
}

export function createDeck(): Card[] {
  const cards: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const card: NumberCard = { type: 'number', suit, rank, id: makeId() };
      cards.push(card);
    }
    for (const faceRank of FACE_RANKS) {
      const card: FaceCard = { type: 'face', suit, faceRank, id: makeId() };
      cards.push(card);
    }
  }

  // Add 2 Jokers (Weather cards)
  const j1: JokerCard = { type: 'joker', id: makeId() };
  const j2: JokerCard = { type: 'joker', id: makeId() };
  cards.push(j1, j2);

  return cards;
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealHands(deck: Card[]): { humanHand: Card[]; aiHand: Card[]; remaining: Card[] } {
  const shuffled = shuffle(deck);
  return {
    humanHand: shuffled.slice(0, 10),
    aiHand: shuffled.slice(10, 20),
    remaining: shuffled.slice(20),
  };
}

export function getCardDisplayRank(card: Card): string {
  if (card.type === 'joker') return 'W';
  if (card.type === 'face') {
    switch (card.faceRank) {
      case 'jack': return 'J';
      case 'queen': return 'Q';
      case 'king': return 'K';
      case 'ace': return 'A';
    }
  }
  return String(card.rank);
}

export function getCardDisplaySuit(card: Card): string {
  if (card.type === 'joker') return '\u2601'; // cloud
  const suitSymbols: Record<Suit, string> = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
  };
  return suitSymbols[card.suit];
}

export function getCardNumericValue(card: Card): number {
  if (card.type === 'joker') return 0;
  if (card.type === 'number') return card.rank;
  switch (card.faceRank) {
    case 'jack': return 11;
    case 'queen': return 12;
    case 'king': return 13;
    case 'ace': return 14;
  }
}

export function getSuitColor(card: Card): string {
  if (card.type === 'joker') return 'text-tavern-amber';
  if (card.suit === 'hearts' || card.suit === 'diamonds') return 'text-suit-hearts';
  return 'text-suit-spades';
}
