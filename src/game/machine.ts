// ── XState Game State Machine ──
// Governs the strict turn flow of Tavern Tactics.

import { assign, setup } from 'xstate';
import type {
  GameState, Row, BettingAction,
} from './types';
import {
  createInitialState, playCard, processBet, payAnte,
  evaluateRound, applyRoundResult, isRoundOver,
} from './engine';
import { getAIDecision, getAIBetDecision } from './ai';

export type GameEvent =
  | { type: 'START_MATCH' }
  | { type: 'PLAY_CARD'; cardId: string; targetRow: Row; useAbility?: boolean }
  | { type: 'BET'; action: BettingAction; amount: number }
  | { type: 'AI_TURN' }
  | { type: 'AI_BET' }
  | { type: 'RESOLVE_ROUND' }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESTART' };

export interface MachineContext {
  game: GameState;
  phase: 'menu' | 'playing' | 'round_result' | 'match_over';
  message: string;
  animatingCard: string | null;
}

export const gameMachine = setup({
  types: {
    context: {} as MachineContext,
    events: {} as GameEvent,
  },
}).createMachine({
  id: 'tavernTactics',
  initial: 'menu',
  context: {
    game: createInitialState(),
    phase: 'menu',
    message: '',
    animatingCard: null,
  },

  states: {
    menu: {
      on: {
        START_MATCH: {
          target: 'roundStart',
          actions: assign({
            game: () => createInitialState(),
            phase: 'playing',
            message: 'A new match begins. Ante up!',
          }),
        },
      },
    },

    roundStart: {
      entry: assign({
        game: ({ context }) => payAnte(context.game),
        message: ({ context }) => {
          const ante = 10 + (context.game.currentRound - 1) * 5;
          const drawNote = context.game.currentRound > 1 ? ' +2 cards drawn.' : '';
          return `Round ${context.game.currentRound} — Ante ${ante} chips.${drawNote} Your turn.`;
        },
      }),
      always: { target: 'playerTurn' },
    },

    playerTurn: {
      on: {
        PLAY_CARD: {
          target: 'bettingPhase',
          guard: ({ context, event }) => {
            if (context.game.currentBet > 0) return false; // must respond to bet first
            const card = context.game.human.hand.find(c => c.id === event.cardId);
            if (!card) return false;
            if (context.game.human.board[event.targetRow].cards.length >= 5) return false;
            return true;
          },
          actions: assign({
            game: ({ context, event }) =>
              playCard(context.game, 'human', event.cardId, event.targetRow, event.useAbility ?? true),
            message: 'Card played. Betting phase.',
          }),
        },
        BET: [
          {
            target: 'checkRound',
            guard: ({ event }) => event.action === 'fold',
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: 'You fold this round, preserving your hand.',
            }),
          },
          {
            target: 'aiTurn',
            guard: ({ event }) => event.action === 'call',
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: 'You call.',
            }),
          },
          {
            target: 'aiBetResponse',
            guard: ({ event }) => event.action === 'raise',
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: ({ event }) => `You raise to ${event.amount}.`,
            }),
          },
        ],
      },
    },

    bettingPhase: {
      on: {
        BET: [
          {
            target: 'checkRound',
            guard: ({ context, event }) =>
              event.action === 'fold' && context.game.turnNumber > 1,
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: 'You fold this round.',
            }),
          },
          {
            target: 'aiTurn',
            guard: ({ event }) => event.action === 'check',
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: 'You check.',
            }),
          },
          {
            target: 'aiBetResponse',
            guard: ({ event }) => event.action === 'bet' || event.action === 'raise',
            actions: assign({
              game: ({ context, event }) =>
                processBet(context.game, 'human', event.action, event.amount),
              message: ({ event }) => `You bet ${event.amount} chips.`,
            }),
          },
        ],
      },
    },

    aiBetResponse: {
      entry: assign(({ context }) => {
        const { action, amount } = getAIBetDecision(context.game);
        const newGame = processBet(context.game, 'ai', action, amount);
        let msg = '';
        switch (action) {
          case 'call': msg = 'Opponent calls.'; break;
          case 'raise': msg = `Opponent raises to ${amount}!`; break;
          case 'fold': msg = 'Opponent folds this round.'; break;
          default: msg = 'Opponent checks.';
        }
        return { game: newGame, message: msg };
      }),
      always: [
        { target: 'checkRound', guard: ({ context }) => context.game.ai.hasPassed },
        { target: 'aiTurn' },
      ],
    },

    aiTurn: {
      entry: assign(({ context }) => {
        const decision = getAIDecision(context.game);

        if (decision.action === 'fold') {
          const newGame = processBet(context.game, 'ai', 'fold', 0);
          return { game: newGame, message: 'Opponent passes this round.' };
        }

        if (decision.action === 'play' && decision.cardId && decision.targetRow) {
          const newGame = playCard(context.game, 'ai', decision.cardId, decision.targetRow, decision.useAbility ?? true);

          // AI bets after playing
          const { action: betAction, amount } = getAIBetDecision(newGame);
          if (betAction === 'bet' && amount > 0) {
            const afterBet = processBet(newGame, 'ai', betAction, amount);
            return {
              game: afterBet,
              message: `Opponent plays a card and bets ${amount} chips.`,
              animatingCard: decision.cardId,
            };
          }

          return {
            game: newGame,
            message: 'Opponent plays a card.',
            animatingCard: decision.cardId,
          };
        }

        return { game: context.game, message: 'Opponent thinks...' };
      }),
      always: [
        { target: 'checkRound' },
      ],
    },

    checkRound: {
      always: [
        {
          target: 'roundResult',
          guard: ({ context }) => isRoundOver(context.game),
        },
        {
          target: 'playerTurn',
          guard: ({ context }) => !context.game.human.hasPassed,
        },
        {
          target: 'aiTurn',
          guard: ({ context }) => !context.game.ai.hasPassed,
        },
        {
          target: 'roundResult',
        },
      ],
    },

    roundResult: {
      entry: assign(({ context }) => {
        const result = evaluateRound(context.game);
        const newGame = applyRoundResult(context.game, result);

        let msg = '';
        if (result.roundWinner === 'human') msg = `You win Round ${context.game.currentRound}!`;
        else if (result.roundWinner === 'ai') msg = `Opponent wins Round ${context.game.currentRound}.`;
        else msg = `Round ${context.game.currentRound} is a tie. Pot carries over.`;

        return {
          game: newGame,
          phase: newGame.matchWinner ? 'match_over' as const : 'round_result' as const,
          message: msg,
        };
      }),
      on: {
        NEXT_ROUND: [
          {
            target: 'matchOver',
            guard: ({ context }) => context.game.matchWinner !== null,
          },
          {
            target: 'roundStart',
          },
        ],
      },
    },

    matchOver: {
      entry: assign(({ context }) => ({
        phase: 'match_over' as const,
        message: context.game.matchWinner === 'human'
          ? 'Victory! You have conquered the tavern!'
          : 'Defeat. The tavern claims your purse.',
      })),
      on: {
        RESTART: {
          target: 'menu',
          actions: assign({
            game: () => createInitialState(),
            phase: 'menu' as const,
            message: '',
            animatingCard: null,
          }),
        },
      },
    },
  },
});
