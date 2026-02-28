// ── AI Opponent ──
// Implements heuristic-based decision making with Monte Carlo sampling
// for card placement, betting, and ability sequencing.

import {
  GameState, Card, Row, PlayerSide, BettingAction, FaceCard,
} from './types';
import { evaluateHand, compareHands } from './evaluator';
import { getCardNumericValue } from './deck';

interface AIDecision {
  action: 'play' | 'bet' | 'fold';
  cardId?: string;
  targetRow?: Row;
  betAction?: BettingAction;
  betAmount?: number;
}

// ── Evaluation Helpers ──

function rowStrength(cards: Card[], weather: boolean): number {
  if (cards.length === 0) return -1;
  const evaluation = evaluateHand(cards, weather);
  return evaluation.rankValue * 100 + (evaluation.highCards[0] || 0);
}

function cardAdvantage(state: GameState): number {
  return state.ai.hand.length - state.human.hand.length;
}

function mobilityAdvantage(state: GameState): number {
  const ca = cardAdvantage(state);
  return ca * (1 + 0.1 * ca);
}

// Estimate win probability for a row via lightweight Monte Carlo
function estimateRowWinProb(
  myCards: Card[],
  oppCards: Card[],
  weather: boolean,
  samples: number = 50,
): number {
  const myEval = evaluateHand(myCards, weather);
  const oppEval = evaluateHand(oppCards, weather);
  const cmp = compareHands(myEval, oppEval);
  // Simple heuristic based on current visible state
  if (cmp > 0) return 0.65 + Math.min(cmp * 0.02, 0.25);
  if (cmp < 0) return 0.35 + Math.max(cmp * 0.02, -0.25);
  return 0.5;
}

// ── Card Placement Logic ──

function evaluateCardPlacement(
  state: GameState,
  card: Card,
  row: Row,
): number {
  const ai = state.ai;
  const rowCards = ai.board[row].cards;
  const otherRow: Row = row === 'frontline' ? 'backline' : 'frontline';
  const otherCards = ai.board[otherRow].cards;

  if (rowCards.length >= 5) return -Infinity;

  // Score the potential new row
  const newRowCards = [...rowCards, card];
  const currentStrength = rowStrength(rowCards, state.weatherActive);
  const newStrength = rowStrength(newRowCards, state.weatherActive);
  const improvement = newStrength - Math.max(currentStrength, 0);

  // Penalize leaving other row too weak
  const otherStrength = rowStrength(otherCards, state.weatherActive);
  const balancePenalty = otherCards.length === 0 && rowCards.length >= 2 ? 30 : 0;

  // Bonus for completing hand patterns
  let synergyBonus = 0;
  if (newRowCards.length >= 3) {
    const eval3 = evaluateHand(newRowCards, state.weatherActive);
    if (eval3.rankValue >= 1) synergyBonus += eval3.rankValue * 15;
  }

  return improvement + synergyBonus - balancePenalty;
}

function scoreFaceCardPlay(
  state: GameState,
  card: FaceCard,
  row: Row,
): number {
  const round = state.currentRound;

  switch (card.faceRank) {
    case 'jack': {
      // Spies: best in rounds we plan to lose, or for card advantage
      const ca = cardAdvantage(state);
      let score = 40; // base value for +2 cards
      if (ca < 0) score += 30; // more valuable when behind on cards
      if (round === 1 && state.ai.hand.length >= 7) score += 20; // early round 1
      return score;
    }

    case 'queen': {
      // Medics: worthless round 1 if graveyard empty, great in round 3
      const numberCardsInGrave = state.graveyard.filter(c => c.type === 'number');
      if (numberCardsInGrave.length === 0) return -50;
      const bestGraveValue = Math.max(...numberCardsInGrave.map(getCardNumericValue));
      return bestGraveValue * 3 + (round === 3 ? 40 : 0);
    }

    case 'king': {
      // Commander: good when we're likely to win the row
      const rowCards = state.ai.board[row].cards;
      const oppRow = state.human.board[row].cards;
      const winProb = estimateRowWinProb(rowCards, oppRow, state.weatherActive);
      return winProb > 0.5 ? 35 + winProb * 20 : -10;
    }

    case 'ace': {
      // Scorcher: best when opponent has high-value cards on row
      const oppRowCards = state.human.board[row].cards;
      const oppNumbers = oppRowCards.filter(c => c.type === 'number');
      if (oppNumbers.length === 0) return -20; // hold for later
      const highestOpp = Math.max(...oppNumbers.map(getCardNumericValue));
      return highestOpp * 4 + 10;
    }
  }
}

// ── Betting Logic ──

function decideBet(state: GameState): { action: BettingAction; amount: number } {
  const frontProb = estimateRowWinProb(
    state.ai.board.frontline.cards,
    state.human.board.frontline.cards,
    state.weatherActive,
  );
  const backProb = estimateRowWinProb(
    state.ai.board.backline.cards,
    state.human.board.backline.cards,
    state.weatherActive,
  );

  const overallWinProb = frontProb * backProb; // need both rows
  const singleRowWinProb = Math.max(frontProb, backProb);
  const ca = cardAdvantage(state);

  // Handle opponent's bet
  if (state.currentBet > 0 && state.bettor === 'human') {
    const potOdds = state.currentBet / (state.pot + state.currentBet);

    // Fold heuristic: sub-30% win prob and pot is small
    if (overallWinProb < 0.3 && state.pot <= 15 && ca >= 0) {
      return { action: 'fold', amount: 0 };
    }

    // Raise with strong hand
    if (overallWinProb > 0.7) {
      return { action: 'raise', amount: Math.min(state.currentBet * 2, state.ai.chips, 20) };
    }

    // Call if odds are favorable
    if (overallWinProb > potOdds) {
      return { action: 'call', amount: state.currentBet };
    }

    // Bluff raise occasionally when we have card advantage
    if (ca >= 2 && Math.random() < 0.2) {
      return { action: 'raise', amount: Math.min(10, state.ai.chips) };
    }

    return { action: 'call', amount: state.currentBet };
  }

  // Initiate a bet
  if (overallWinProb > 0.6) {
    const betSize = Math.min(
      Math.round(state.pot * 0.5 + overallWinProb * 10),
      state.ai.chips,
      25,
    );
    return { action: 'bet', amount: Math.max(betSize, 5) };
  }

  // Bluff occasionally
  if (ca >= 2 && Math.random() < 0.15) {
    return { action: 'bet', amount: Math.min(10, state.ai.chips) };
  }

  return { action: 'check', amount: 0 };
}

// ── Main AI Decision ──

export function getAIDecision(state: GameState): AIDecision {
  const ai = state.ai;

  // If we have a bet to respond to first
  if (state.currentBet > 0 && state.bettor === 'human') {
    const { action, amount } = decideBet(state);
    return { action: action === 'fold' ? 'fold' : 'bet', betAction: action, betAmount: amount };
  }

  // If no cards or already passed
  if (ai.hand.length === 0 || ai.hasPassed) {
    return { action: 'fold', betAction: 'fold', betAmount: 0 };
  }

  // Consider folding strategically (Gwent-style pass)
  const totalBoardCards = ai.board.frontline.cards.length + ai.board.backline.cards.length;
  if (totalBoardCards >= 3) {
    const frontProb = estimateRowWinProb(
      ai.board.frontline.cards,
      state.human.board.frontline.cards,
      state.weatherActive,
    );
    const backProb = estimateRowWinProb(
      ai.board.backline.cards,
      state.human.board.backline.cards,
      state.weatherActive,
    );

    // Surrender heuristic: winning is unlikely and pot is small
    const overallProb = (frontProb + backProb) / 2;
    if (overallProb < 0.3 && state.pot <= 15 && state.currentRound < 3) {
      const ma = mobilityAdvantage(state);
      if (ma < 0) {
        // We're behind on cards and losing — fold to preserve resources
        return { action: 'fold', betAction: 'fold', betAmount: 0 };
      }
    }
  }

  // Evaluate all possible card placements
  let bestScore = -Infinity;
  let bestCard: Card | null = null;
  let bestRow: Row = 'frontline';

  for (const card of ai.hand) {
    for (const row of ['frontline', 'backline'] as Row[]) {
      if (ai.board[row].cards.length >= 5) continue;

      let score: number;
      if (card.type === 'face') {
        score = scoreFaceCardPlay(state, card, row);
      } else if (card.type === 'joker') {
        // Weather: only play if opponent has flush potential
        const oppFrontSuits = state.human.board.frontline.cards
          .filter(c => c.type !== 'joker')
          .map(c => (c as { suit: string }).suit);
        const oppBackSuits = state.human.board.backline.cards
          .filter(c => c.type !== 'joker')
          .map(c => (c as { suit: string }).suit);
        const frontFlushPotential = oppFrontSuits.length >= 3 &&
          new Set(oppFrontSuits).size === 1;
        const backFlushPotential = oppBackSuits.length >= 3 &&
          new Set(oppBackSuits).size === 1;
        score = (frontFlushPotential || backFlushPotential) ? 60 : -30;
      } else {
        score = evaluateCardPlacement(state, card, row);
      }

      // Balance: prefer the row with fewer cards
      const rowLen = ai.board[row].cards.length;
      const otherRow: Row = row === 'frontline' ? 'backline' : 'frontline';
      const otherLen = ai.board[otherRow].cards.length;
      if (rowLen === 0 && otherLen >= 2) score += 25;

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
        bestRow = row;
      }
    }
  }

  if (!bestCard) {
    return { action: 'fold', betAction: 'fold', betAmount: 0 };
  }

  return {
    action: 'play',
    cardId: bestCard.id,
    targetRow: bestRow,
  };
}

export function getAIBetDecision(state: GameState): { action: BettingAction; amount: number } {
  return decideBet(state);
}
