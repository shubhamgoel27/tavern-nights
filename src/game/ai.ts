// ── AI Opponent ──
// Heuristic-based decision making with positional awareness,
// strategic passing, and round-aware betting.

import type {
  GameState, Card, Row, BettingAction, FaceCard,
} from './types';
import { evaluateHand, compareHands } from './evaluator';
import { getCardNumericValue } from './deck';

interface AIDecision {
  action: 'play' | 'bet' | 'fold';
  cardId?: string;
  targetRow?: Row;
  useAbility?: boolean;
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

function countKingsOnRow(cards: Card[]): number {
  return cards.filter(c => c.type === 'face' && c.faceRank === 'king').length;
}

// Estimate win probability for a row — wider range, considers remaining cards
function estimateRowWinProb(
  myCards: Card[],
  oppCards: Card[],
  weather: boolean,
  myHandSize: number = 0,
  oppHandSize: number = 0,
): number {
  if (myCards.length === 0 && oppCards.length === 0) return 0.5;
  if (myCards.length === 0) return 0.12;
  if (oppCards.length === 0) return 0.88;

  const myEval = evaluateHand(myCards, weather);
  const oppEval = evaluateHand(oppCards, weather);
  const cmp = compareHands(myEval, oppEval);
  const rankDiff = myEval.rankValue - oppEval.rankValue;

  let prob: number;
  if (cmp > 0) {
    prob = rankDiff > 0
      ? 0.72 + Math.min(rankDiff * 0.05, 0.18)
      : 0.60 + Math.min(cmp * 0.02, 0.15);
  } else if (cmp < 0) {
    prob = rankDiff < 0
      ? 0.28 - Math.min(-rankDiff * 0.05, 0.18)
      : 0.40 + Math.max(cmp * 0.02, -0.15);
  } else {
    prob = 0.5;
  }

  // Remaining improvement potential
  const myRoom = Math.min(5 - myCards.length, myHandSize);
  const oppRoom = Math.min(5 - oppCards.length, oppHandSize);
  prob += (myRoom - oppRoom) * 0.03;

  return Math.max(0.05, Math.min(0.95, prob));
}

// ── Hand Synergy Analysis ──

function countSuitMatches(cards: Card[], card: Card): number {
  if (card.type === 'joker' || !('suit' in card)) return 0;
  return cards.filter(c => c.type !== 'joker' && 'suit' in c && c.suit === (card as { suit: string }).suit).length;
}

function countRankMatches(cards: Card[], card: Card): number {
  const rank = getCardNumericValue(card);
  return cards.filter(c => getCardNumericValue(c) === rank).length;
}

function hasConsecutivePotential(cards: Card[], card: Card): boolean {
  const values = [...cards, card]
    .filter(c => c.type === 'number')
    .map(getCardNumericValue)
    .sort((a, b) => a - b);
  if (values.length < 3) return false;
  let maxRun = 1, run = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] === 1) { run++; maxRun = Math.max(maxRun, run); }
    else if (values[i] !== values[i - 1]) { run = 1; }
  }
  return maxRun >= 3;
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
  const oppRowCards = state.human.board[row].cards;

  if (rowCards.length >= 5) return -Infinity;

  const newRowCards = [...rowCards, card];
  const currentStrength = rowStrength(rowCards, state.weatherActive);
  const newStrength = rowStrength(newRowCards, state.weatherActive);
  const improvement = newStrength - Math.max(currentStrength, 0);

  // Synergy bonuses
  let synergyBonus = 0;
  const rankMatches = countRankMatches(rowCards, card);
  if (rankMatches >= 2) synergyBonus += 40;       // forming triple
  else if (rankMatches >= 1) synergyBonus += 22;   // forming pair

  if (!state.weatherActive) {
    const suitMatches = countSuitMatches(rowCards, card);
    if (suitMatches >= 3) synergyBonus += 25;      // 4 toward flush
    else if (suitMatches >= 2) synergyBonus += 12;  // 3 toward flush
  }

  if (hasConsecutivePotential(rowCards, card)) synergyBonus += 15;

  // Balance: don't neglect the other row
  let balancePenalty = 0;
  if (otherCards.length === 0 && rowCards.length >= 2) balancePenalty = 35;
  else if (otherCards.length === 0 && rowCards.length >= 1) balancePenalty = 12;

  // Defensive awareness: consider opponent's row
  const oppStrength = rowStrength(oppRowCards, state.weatherActive);
  let defensiveBonus = 0;
  if (oppStrength > 100 && newStrength > oppStrength) defensiveBonus = 12;
  if (oppStrength > 200 && newStrength < oppStrength * 0.7) defensiveBonus = -8;

  // High card value (prefer placing high cards where they'll count)
  const valueBonus = getCardNumericValue(card) >= 8 ? 5 : 0;

  return improvement + synergyBonus - balancePenalty + defensiveBonus + valueBonus;
}

function scoreFaceCardPlay(
  state: GameState,
  card: FaceCard,
  row: Row,
): number {
  const round = state.currentRound;
  const rowCards = state.ai.board[row].cards;
  const oppRowCards = state.human.board[row].cards;
  const otherRow: Row = row === 'frontline' ? 'backline' : 'frontline';

  switch (card.faceRank) {
    case 'jack': {
      // Spy: play on opponent's row + draw 2 cards
      const ca = cardAdvantage(state);
      let score = 45;
      if (ca < 0) score += 35;
      else if (ca < 2) score += 15;

      // Place on opponent's stronger row to dilute
      const oppOtherRow = state.human.board[otherRow].cards;
      const thisStrength = rowStrength(oppRowCards, state.weatherActive);
      const otherStrength = rowStrength(oppOtherRow, state.weatherActive);
      if (thisStrength > otherStrength) score += 20;

      // Bonus for early restocking
      if (round === 1 && state.ai.hand.length >= 6) score += 15;

      // Penalize if opponent's row is already nearly full
      if (oppRowCards.length >= 4) score -= 30;

      return score;
    }

    case 'queen': {
      // Medic: revive from graveyard
      const numberCardsInGrave = state.graveyard.filter(c => c.type === 'number');
      if (numberCardsInGrave.length === 0) return -60;

      const bestGrave = numberCardsInGrave.sort(
        (a, b) => getCardNumericValue(b) - getCardNumericValue(a)
      )[0];
      const bestGraveValue = getCardNumericValue(bestGrave);
      let score = bestGraveValue * 4;

      if (round >= 2) score += 30;
      if (round >= 3) score += 20;

      // Extra value if revived card completes a hand
      const withRevived = [...rowCards, bestGrave];
      const withEval = evaluateHand(withRevived, state.weatherActive);
      if (withEval.rankValue >= 1) score += withEval.rankValue * 12;

      // Penalize if row is nearly full (queen + revived card = 2 slots)
      if (rowCards.length >= 4) score -= 40;

      return score;
    }

    case 'king': {
      // Commander: 5-chip penalty per King when winning this row
      const winProb = estimateRowWinProb(
        rowCards, oppRowCards, state.weatherActive,
        state.ai.hand.length, state.human.hand.length,
      );
      const existingKings = countKingsOnRow(rowCards);
      const totalPenalty = (existingKings + 1) * 5;

      let score = winProb > 0.5
        ? 30 + winProb * 25 + totalPenalty * 2
        : -15;

      // More valuable when chip advantage exists (compounds pressure)
      if (state.ai.chips > state.human.chips * 1.2) score += 10;

      return score;
    }

    case 'ace': {
      // Scorcher: destroy opponent's highest number card
      const oppNumbers = oppRowCards.filter(c => c.type === 'number');
      if (oppNumbers.length === 0) return -25;

      const highest = oppNumbers.reduce((a, b) =>
        getCardNumericValue(a) > getCardNumericValue(b) ? a : b
      );
      let score = getCardNumericValue(highest) * 5 + 15;

      // Huge bonus for breaking a pair/triple
      const targetRank = getCardNumericValue(highest);
      const sameRankCount = oppNumbers.filter(c => getCardNumericValue(c) === targetRank).length;
      if (sameRankCount >= 2) score += 30;

      // Bonus if opponent has a strong hand here
      const oppEval = evaluateHand(oppRowCards, state.weatherActive);
      if (oppEval.rankValue >= 2) score += 20;

      // Better when we're behind on this row
      const myStrength = rowStrength(rowCards, state.weatherActive);
      const oppStrength = rowStrength(oppRowCards, state.weatherActive);
      if (oppStrength > myStrength) score += 15;

      return score;
    }
  }
}

// ── Betting Logic ──

function decideBet(state: GameState): { action: BettingAction; amount: number } {
  const frontProb = estimateRowWinProb(
    state.ai.board.frontline.cards,
    state.human.board.frontline.cards,
    state.weatherActive,
    state.ai.hand.length,
    state.human.hand.length,
  );
  const backProb = estimateRowWinProb(
    state.ai.board.backline.cards,
    state.human.board.backline.cards,
    state.weatherActive,
    state.ai.hand.length,
    state.human.hand.length,
  );

  // Geometric mean is less pessimistic than straight multiplication
  const overallWinProb = Math.sqrt(frontProb * backProb);

  // Factor in King penalties for expected value
  const aiKings = countKingsOnRow(state.ai.board.frontline.cards)
    + countKingsOnRow(state.ai.board.backline.cards);
  const humanKings = countKingsOnRow(state.human.board.frontline.cards)
    + countKingsOnRow(state.human.board.backline.cards);
  const kingBonus = (aiKings - humanKings) * 5;
  const effectivePot = state.pot + kingBonus;

  const ca = cardAdvantage(state);
  const round = state.currentRound;
  const roundMul = round >= 3 ? 1.4 : round >= 2 ? 1.15 : 1.0;

  // ── Responding to opponent's bet ──
  if (state.currentBet > 0 && state.bettor === 'human') {
    const potOdds = state.currentBet / (state.pot + state.currentBet);

    if (overallWinProb < 0.25 && effectivePot <= 20) {
      return { action: 'fold', amount: 0 };
    }

    // Raise with strong hand
    if (overallWinProb > 0.65) {
      const raiseAmt = Math.min(
        Math.round(state.currentBet * 2 * roundMul),
        state.ai.chips,
      );
      return { action: 'raise', amount: Math.max(raiseAmt, state.currentBet + 5) };
    }

    // Call if odds are favorable
    if (overallWinProb > potOdds) {
      return { action: 'call', amount: state.currentBet };
    }

    // Bluff raise with card advantage and mid-strength hand
    if (ca >= 1 && overallWinProb > 0.35 && Math.random() < 0.25) {
      const bluffAmt = Math.min(Math.round(state.currentBet * 1.5), state.ai.chips);
      return { action: 'raise', amount: bluffAmt };
    }

    // Marginal call
    if (overallWinProb > potOdds * 0.8) {
      return { action: 'call', amount: state.currentBet };
    }

    return { action: 'fold', amount: 0 };
  }

  // ── Initiating a bet ──
  if (overallWinProb > 0.55) {
    const betSize = Math.min(
      Math.round((effectivePot * 0.6 + overallWinProb * 15) * roundMul),
      state.ai.chips,
    );
    return { action: 'bet', amount: Math.max(betSize, 5) };
  }

  // Semi-bluff with card advantage
  if (overallWinProb > 0.4 && ca >= 1 && Math.random() < 0.2) {
    const bluffSize = Math.min(Math.round(effectivePot * 0.4), state.ai.chips, 15);
    return { action: 'bet', amount: Math.max(bluffSize, 5) };
  }

  // Late-round bluff with large pot
  if (round >= 2 && effectivePot >= 20 && ca >= 0 && Math.random() < 0.15) {
    return { action: 'bet', amount: Math.min(10, state.ai.chips) };
  }

  return { action: 'check', amount: 0 };
}

// ── Strategic Passing ──

function shouldPass(state: GameState): boolean {
  const ai = state.ai;
  const totalBoardCards = ai.board.frontline.cards.length + ai.board.backline.cards.length;

  if (totalBoardCards < 2) return false;

  const frontProb = estimateRowWinProb(
    ai.board.frontline.cards,
    state.human.board.frontline.cards,
    state.weatherActive,
    ai.hand.length,
    state.human.hand.length,
  );
  const backProb = estimateRowWinProb(
    ai.board.backline.cards,
    state.human.board.backline.cards,
    state.weatherActive,
    ai.hand.length,
    state.human.hand.length,
  );
  const overallProb = Math.sqrt(frontProb * backProb);

  // Winning comfortably + not last round → conserve cards
  if (frontProb > 0.65 && backProb > 0.65 && state.currentRound < 3) {
    if (state.pot <= 15 && ai.hand.length >= 4) return true;
  }

  // Losing badly with small pot → cut losses
  if (overallProb < 0.25 && state.pot <= 15 && totalBoardCards >= 3) {
    return true;
  }

  // Ahead on rounds + low on cards → protect lead
  if (ai.roundsWon > state.human.roundsWon && state.currentRound < 3 && ai.hand.length <= 3) {
    return true;
  }

  return false;
}

// ── Main AI Decision ──

export function getAIDecision(state: GameState): AIDecision {
  const ai = state.ai;

  // Respond to opponent's bet first
  if (state.currentBet > 0 && state.bettor === 'human') {
    const { action, amount } = decideBet(state);
    return { action: action === 'fold' ? 'fold' : 'bet', betAction: action, betAmount: amount };
  }

  // No cards or already passed
  if (ai.hand.length === 0 || ai.hasPassed) {
    return { action: 'fold', betAction: 'fold', betAmount: 0 };
  }

  // Strategic pass
  if (shouldPass(state)) {
    return { action: 'fold', betAction: 'fold', betAmount: 0 };
  }

  // Evaluate all possible card placements
  let bestScore = -Infinity;
  let bestCard: Card | null = null;
  let bestRow: Row = 'frontline';
  let bestUseAbility = true;

  for (const card of ai.hand) {
    for (const row of ['frontline', 'backline'] as Row[]) {
      if (ai.board[row].cards.length >= 5) continue;

      let score: number;
      let useAbilityForThis = true;
      if (card.type === 'face') {
        // Compare ability score vs value-card score
        const abilityScore = scoreFaceCardPlay(state, card, row);
        const valueScore = evaluateCardPlacement(state, card, row);

        if (valueScore > abilityScore) {
          score = valueScore;
          useAbilityForThis = false;
        } else {
          score = abilityScore;
        }
      } else if (card.type === 'joker') {
        // Weather: play if opponent has flush potential but we don't
        const suitCounts = (cards: Card[]) => {
          const suits = cards.filter(c => c.type !== 'joker' && 'suit' in c)
            .map(c => (c as { suit: string }).suit);
          if (suits.length < 3) return false;
          return new Set(suits).size === 1;
        };
        const oppFlush = suitCounts(state.human.board.frontline.cards)
          || suitCounts(state.human.board.backline.cards);
        const myFlush = suitCounts(ai.board.frontline.cards)
          || suitCounts(ai.board.backline.cards);

        if (oppFlush && !myFlush) score = 70;
        else if (oppFlush) score = 25;
        else score = -40;
      } else {
        score = evaluateCardPlacement(state, card, row);
      }

      // Balance: prefer emptier row
      const rowLen = ai.board[row].cards.length;
      const otherRow: Row = row === 'frontline' ? 'backline' : 'frontline';
      const otherLen = ai.board[otherRow].cards.length;
      if (rowLen === 0 && otherLen >= 2) score += 30;

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
        bestRow = row;
        bestUseAbility = useAbilityForThis;
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
    useAbility: bestUseAbility,
  };
}

export function getAIBetDecision(state: GameState): { action: BettingAction; amount: number } {
  return decideBet(state);
}
