// ── Domain Models for Tavern Tactics ──

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FaceRank = 'jack' | 'queen' | 'king' | 'ace';
export type JokerType = 'weather';
export type CardRank = Rank | FaceRank | JokerType;

export type Row = 'frontline' | 'backline';
export type PlayerSide = 'human' | 'ai';

export interface NumberCard {
  type: 'number';
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface FaceCard {
  type: 'face';
  suit: Suit;
  faceRank: FaceRank;
  id: string;
  abilityUsed?: boolean; // true = exhausted (ability fired, excluded from hand eval)
}

export interface JokerCard {
  type: 'joker';
  id: string;
}

export type Card = NumberCard | FaceCard | JokerCard;

export interface BoardRow {
  cards: Card[];
}

export interface PlayerBoard {
  frontline: BoardRow;
  backline: BoardRow;
}

export interface Player {
  side: PlayerSide;
  hand: Card[];
  chips: number;
  board: PlayerBoard;
  hasPassed: boolean;
  roundsWon: number;
}

export type HandRank =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export const HAND_RANK_VALUES: Record<HandRank, number> = {
  'high-card': 0,
  'pair': 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  'straight': 4,
  'flush': 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
  'royal-flush': 9,
};

export interface HandEvaluation {
  rank: HandRank;
  rankValue: number;
  highCards: number[]; // for tiebreaking
  description: string;
}

export type BettingAction = 'check' | 'bet' | 'call' | 'raise' | 'fold';

export interface GameConfig {
  startingChips: number;
  anteAmount: number;
  minBet: number;
  roundsToWin: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  startingChips: 100,
  anteAmount: 10,
  minBet: 5,
  roundsToWin: 2,
};

export interface RoundResult {
  frontlineWinner: PlayerSide | 'tie';
  backlineWinner: PlayerSide | 'tie';
  roundWinner: PlayerSide | 'tie';
  potAwarded: number;
  humanFrontlineEval: HandEvaluation | null;
  humanBacklineEval: HandEvaluation | null;
  aiFrontlineEval: HandEvaluation | null;
  aiBacklineEval: HandEvaluation | null;
}

export interface GameState {
  human: Player;
  ai: Player;
  deck: Card[];
  graveyard: Card[];
  pot: number;
  currentRound: number;
  currentTurn: PlayerSide;
  turnNumber: number;
  weatherActive: boolean;
  lastRoundResult: RoundResult | null;
  currentBet: number;
  roundHistory: RoundResult[];
  matchWinner: PlayerSide | null;
  pendingAbility: { card: FaceCard; source: PlayerSide } | null;
  bettor: PlayerSide | null;
}
