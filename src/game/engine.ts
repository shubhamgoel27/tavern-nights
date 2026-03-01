// ── Game Engine ──
// Pure functions that produce new game states from actions.

import {
  DEFAULT_CONFIG,
} from './types';
import type {
  GameState, GameConfig, Card, FaceCard, PlayerSide, Row,
  BettingAction, RoundResult, Player,
} from './types';
import { createDeck, dealHands, resetIdCounter, getCardNumericValue } from './deck';
import { evaluateHand, compareHands } from './evaluator';

export function createInitialState(config: GameConfig = DEFAULT_CONFIG): GameState {
  resetIdCounter();
  const deck = createDeck();
  const { humanHand, aiHand, remaining } = dealHands(deck);

  return {
    human: {
      side: 'human',
      hand: humanHand,
      chips: config.startingChips,
      board: { frontline: { cards: [] }, backline: { cards: [] } },
      hasPassed: false,
      roundsWon: 0,
    },
    ai: {
      side: 'ai',
      hand: aiHand,
      chips: config.startingChips,
      board: { frontline: { cards: [] }, backline: { cards: [] } },
      hasPassed: false,
      roundsWon: 0,
    },
    deck: remaining,
    graveyard: [],
    pot: 0,
    currentRound: 1,
    currentTurn: 'human',
    turnNumber: 0,
    weatherActive: false,
    lastRoundResult: null,
    currentBet: 0,
    roundHistory: [],
    matchWinner: null,
    pendingAbility: null,
    bettor: null,
  };
}

function getPlayer(state: GameState, side: PlayerSide): Player {
  return side === 'human' ? state.human : state.ai;
}

function getOpponent(side: PlayerSide): PlayerSide {
  return side === 'human' ? 'ai' : 'human';
}

export function canPlayCard(state: GameState, side: PlayerSide): boolean {
  const player = getPlayer(state, side);
  return !player.hasPassed && player.hand.length > 0;
}

export function playCard(
  state: GameState,
  side: PlayerSide,
  cardId: string,
  targetRow: Row,
  useAbility: boolean = true,
): GameState {
  const player = { ...getPlayer(state, side) };
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  const newHand = player.hand.filter((_, i) => i !== cardIndex);
  player.hand = newHand;

  // Check row capacity (max 5)
  if (player.board[targetRow].cards.length >= 5) return state;

  // Handle Joker (Weather) — always activates, no value-only option
  if (card.type === 'joker') {
    player.hand = newHand;
    const next: GameState = {
      ...state,
      [side]: player,
      weatherActive: true,
      turnNumber: state.turnNumber + 1,
    };
    return next;
  }

  // Handle Face Cards
  if (card.type === 'face') {
    if (useAbility) {
      // Activate ability — card is marked exhausted (excluded from hand eval)
      return handleFaceCard(state, side, { ...card, abilityUsed: true }, targetRow, newHand);
    }
    // Play as value card — no ability, counts in hand evaluation
    const valueCard: FaceCard = { ...card, abilityUsed: false };
    const newBoard = {
      ...player.board,
      [targetRow]: { cards: [...player.board[targetRow].cards, valueCard] },
    };
    player.board = newBoard;
    return {
      ...state,
      [side]: player,
      turnNumber: state.turnNumber + 1,
    };
  }

  // Number card: place on row
  const newBoard = {
    ...player.board,
    [targetRow]: { cards: [...player.board[targetRow].cards, card] },
  };
  player.board = newBoard;

  return {
    ...state,
    [side]: player,
    turnNumber: state.turnNumber + 1,
  };
}

function handleFaceCard(
  state: GameState,
  side: PlayerSide,
  card: FaceCard,
  targetRow: Row,
  newHand: Card[],
): GameState {
  const player = { ...getPlayer(state, side) };
  const opponentSide = getOpponent(side);
  const opponent = { ...getPlayer(state, opponentSide) };
  player.hand = newHand;

  switch (card.faceRank) {
    case 'jack': {
      // Spy: Played on OPPONENT's board (exhausted), player draws 2 cards
      const oppBoard = {
        ...opponent.board,
        [targetRow]: { cards: [...opponent.board[targetRow].cards, { ...card, abilityUsed: true }] },
      };
      opponent.board = oppBoard;

      // Draw 2 cards from deck
      const drawn = state.deck.slice(0, 2);
      const remainingDeck = state.deck.slice(2);
      player.hand = [...player.hand, ...drawn];

      return {
        ...state,
        [side]: player,
        [opponentSide]: opponent,
        deck: remainingDeck,
        turnNumber: state.turnNumber + 1,
      };
    }

    case 'queen': {
      // Medic: Retrieve one number card from graveyard and play it
      // If graveyard is empty, just place the queen on the board
      const numberCardsInGrave = state.graveyard.filter(c => c.type === 'number');
      if (numberCardsInGrave.length === 0) {
        const newBoard = {
          ...player.board,
          [targetRow]: { cards: [...player.board[targetRow].cards, card] },
        };
        player.board = newBoard;
        return {
          ...state,
          [side]: player,
          turnNumber: state.turnNumber + 1,
        };
      }

      // Auto-pick the highest value number card from graveyard
      const sorted = [...numberCardsInGrave].sort(
        (a, b) => getCardNumericValue(b) - getCardNumericValue(a)
      );
      const revived = sorted[0];
      const newGraveyard = state.graveyard.filter(c => c.id !== revived.id);

      const newBoard = {
        ...player.board,
        [targetRow]: {
          cards: [...player.board[targetRow].cards, card, revived],
        },
      };
      player.board = newBoard;

      return {
        ...state,
        [side]: player,
        graveyard: newGraveyard,
        turnNumber: state.turnNumber + 1,
      };
    }

    case 'king': {
      // Commander: Place on row, winning this row costs opponent 5 chips
      const newBoard = {
        ...player.board,
        [targetRow]: { cards: [...player.board[targetRow].cards, card] },
      };
      player.board = newBoard;
      return {
        ...state,
        [side]: player,
        turnNumber: state.turnNumber + 1,
      };
    }

    case 'ace': {
      // Scorcher: Place on row, destroy highest number card in opposing row
      const newBoard = {
        ...player.board,
        [targetRow]: { cards: [...player.board[targetRow].cards, card] },
      };
      player.board = newBoard;

      // Destroy opponent's highest number card in same row
      const oppRowCards = opponent.board[targetRow].cards;
      const oppNumbers = oppRowCards.filter(c => c.type === 'number');
      if (oppNumbers.length > 0) {
        const highest = oppNumbers.reduce((a, b) =>
          getCardNumericValue(a) > getCardNumericValue(b) ? a : b
        );
        const filteredRow = oppRowCards.filter(c => c.id !== highest.id);
        const oppBoard = {
          ...opponent.board,
          [targetRow]: { cards: filteredRow },
        };
        opponent.board = oppBoard;

        return {
          ...state,
          [side]: player,
          [opponentSide]: opponent,
          graveyard: [...state.graveyard, highest],
          turnNumber: state.turnNumber + 1,
        };
      }

      return {
        ...state,
        [side]: player,
        turnNumber: state.turnNumber + 1,
      };
    }
  }
}

export function processBet(
  state: GameState,
  side: PlayerSide,
  action: BettingAction,
  amount: number = 0,
): GameState {
  const player = { ...getPlayer(state, side) };
  switch (action) {
    case 'check':
      return { ...state, [side]: player };

    case 'bet': {
      const betAmt = Math.max(0, Math.min(amount, player.chips));
      player.chips -= betAmt;
      return {
        ...state,
        [side]: player,
        pot: state.pot + betAmt,
        currentBet: betAmt,
        bettor: side,
      };
    }

    case 'call': {
      const callAmt = Math.max(0, Math.min(state.currentBet, player.chips));
      player.chips -= callAmt;
      return {
        ...state,
        [side]: player,
        pot: state.pot + callAmt,
        currentBet: 0,
        bettor: null,
      };
    }

    case 'raise': {
      const raiseAmt = Math.max(0, Math.min(amount, player.chips));
      player.chips -= raiseAmt;
      return {
        ...state,
        [side]: player,
        pot: state.pot + raiseAmt,
        currentBet: raiseAmt,
        bettor: side,
      };
    }

    case 'fold': {
      player.hasPassed = true;
      return { ...state, [side]: player, currentBet: 0, bettor: null };
    }
  }
}

export function payAnte(state: GameState, config: GameConfig = DEFAULT_CONFIG): GameState {
  // Ante escalates: base + 5 per round (Round 1: 10, Round 2: 15, Round 3: 20)
  const scaledAnte = config.anteAmount + (state.currentRound - 1) * 5;
  const humanAnte = Math.min(scaledAnte, state.human.chips);
  const aiAnte = Math.min(scaledAnte, state.ai.chips);
  const human = { ...state.human, chips: state.human.chips - humanAnte };
  const ai = { ...state.ai, chips: state.ai.chips - aiAnte };
  return {
    ...state,
    human,
    ai,
    pot: state.pot + humanAnte + aiAnte,
  };
}

export function evaluateRound(state: GameState): RoundResult {
  const w = state.weatherActive;

  const humanFront = evaluateHand(state.human.board.frontline.cards, w);
  const aiFront = evaluateHand(state.ai.board.frontline.cards, w);
  const humanBack = evaluateHand(state.human.board.backline.cards, w);
  const aiBack = evaluateHand(state.ai.board.backline.cards, w);

  const frontCmp = compareHands(humanFront, aiFront);
  const backCmp = compareHands(humanBack, aiBack);

  const frontlineWinner: PlayerSide | 'tie' = frontCmp > 0 ? 'human' : frontCmp < 0 ? 'ai' : 'tie';
  const backlineWinner: PlayerSide | 'tie' = backCmp > 0 ? 'human' : backCmp < 0 ? 'ai' : 'tie';

  let roundWinner: PlayerSide | 'tie';
  if (frontlineWinner === backlineWinner && frontlineWinner !== 'tie') {
    roundWinner = frontlineWinner;
  } else {
    // Count wins
    const humanWins = (frontlineWinner === 'human' ? 1 : 0) + (backlineWinner === 'human' ? 1 : 0);
    const aiWins = (frontlineWinner === 'ai' ? 1 : 0) + (backlineWinner === 'ai' ? 1 : 0);
    if (humanWins > aiWins) roundWinner = 'human';
    else if (aiWins > humanWins) roundWinner = 'ai';
    else roundWinner = 'tie';
  }

  return {
    frontlineWinner,
    backlineWinner,
    roundWinner,
    potAwarded: state.pot,
    humanFrontlineEval: humanFront,
    humanBacklineEval: humanBack,
    aiFrontlineEval: aiFront,
    aiBacklineEval: aiBack,
  };
}

export function applyRoundResult(state: GameState, result: RoundResult): GameState {
  let human = { ...state.human };
  let ai = { ...state.ai };

  // Award pot
  if (result.roundWinner === 'human') {
    human.chips += result.potAwarded;
    human.roundsWon += 1;
  } else if (result.roundWinner === 'ai') {
    ai.chips += result.potAwarded;
    ai.roundsWon += 1;
  }
  // Tie: pot carries over

  // King penalties — transfer from loser to winner, clamped so chips never go negative
  const applyKingPenalty = (winner: PlayerSide | 'tie', row: 'frontline' | 'backline') => {
    if (winner === 'tie') return;
    const winnerPlayer = winner === 'human' ? human : ai;
    const loserPlayer = winner === 'human' ? ai : human;
    const kings = winnerPlayer.board[row].cards.filter(
      c => c.type === 'face' && c.faceRank === 'king'
    ).length;
    const penalty = Math.min(kings * 5, loserPlayer.chips);
    loserPlayer.chips -= penalty;
    winnerPlayer.chips += penalty;
  };
  applyKingPenalty(result.frontlineWinner, 'frontline');
  applyKingPenalty(result.backlineWinner, 'backline');

  // Move board cards to graveyard
  const boardCards = [
    ...human.board.frontline.cards,
    ...human.board.backline.cards,
    ...ai.board.frontline.cards,
    ...ai.board.backline.cards,
  ];

  // Clear boards
  human.board = { frontline: { cards: [] }, backline: { cards: [] } };
  ai.board = { frontline: { cards: [] }, backline: { cards: [] } };
  human.hasPassed = false;
  ai.hasPassed = false;

  // Check for match win
  let matchWinner: PlayerSide | null = null;
  if (human.roundsWon >= 2) matchWinner = 'human';
  else if (ai.roundsWon >= 2) matchWinner = 'ai';
  else if (human.chips <= 0) matchWinner = 'ai';
  else if (ai.chips <= 0) matchWinner = 'human';

  return {
    ...state,
    human,
    ai,
    graveyard: [...state.graveyard, ...boardCards],
    pot: result.roundWinner === 'tie' ? state.pot : 0, // carry pot on tie
    currentRound: state.currentRound + 1,
    weatherActive: false,
    lastRoundResult: result,
    roundHistory: [...state.roundHistory, result],
    matchWinner,
    currentBet: 0,
    bettor: null,
    turnNumber: 0,
  };
}

export function bothPlayersPassed(state: GameState): boolean {
  return state.human.hasPassed && state.ai.hasPassed;
}

export function isRoundOver(state: GameState): boolean {
  if (bothPlayersPassed(state)) return true;

  // Check if both players have placed max cards or have no cards left
  const humanFull = state.human.board.frontline.cards.length + state.human.board.backline.cards.length;
  const aiFull = state.ai.board.frontline.cards.length + state.ai.board.backline.cards.length;
  const humanDone = state.human.hasPassed || state.human.hand.length === 0 || humanFull >= 10;
  const aiDone = state.ai.hasPassed || state.ai.hand.length === 0 || aiFull >= 10;

  return humanDone && aiDone;
}
