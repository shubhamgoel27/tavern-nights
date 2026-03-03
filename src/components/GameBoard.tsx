import { useState, useCallback, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { gameMachine } from '../game/machine';
import type { Row, BettingAction } from '../game/types';
import type { GameEvent } from '../game/machine';
import { evaluateHand } from '../game/evaluator';
import CardRow from './CardRow';
import PlayerHand from './PlayerHand';
import ChipStack from './ChipStack';
import BettingPanel from './BettingPanel';
import HowToPlayModal from './HowToPlayModal';
import CheatSheet from './CheatSheet';
import TutorialOverlay, { TUTORIAL_STEPS } from './TutorialOverlay';
import type { MultiplayerState, MultiplayerSend } from '../hooks/useMultiplayerGame';

interface GameBoardProps {
  mode?: 'singleplayer' | 'multiplayer';
  multiplayerState?: MultiplayerState;
  multiplayerSend?: MultiplayerSend;
  opponentHandCount?: number;
  onBackToMenu?: () => void;
}

/** Floating ember particles */
function FloatingParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    left: `${10 + i * 11}%`,
    duration: `${8 + (i % 4) * 2}s`,
    delay: `${i * 1.2}s`,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-1 h-1 rounded-full bg-candlelight/40"
          style={{
            left: p.left,
            animation: `float-particle ${p.duration} linear ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Phase indicator badge */
function PhaseBadge({ phase }: { phase: 'play' | 'betting' | 'result' | 'other' }) {
  const config = {
    play: { label: 'Play', color: 'text-tavern-gold bg-tavern-gold/10 border-tavern-gold/30' },
    betting: { label: 'Betting', color: 'text-tavern-amber bg-tavern-amber/10 border-tavern-amber/30' },
    result: { label: 'Result', color: 'text-tavern-green bg-tavern-green/10 border-tavern-green/30' },
    other: { label: '', color: 'text-tavern-text-dim bg-tavern-surface border-tavern-border/30' },
  };
  const c = config[phase];
  if (!c.label) return null;
  return (
    <span className={`text-[8px] font-display uppercase tracking-widest px-1.5 py-0.5 rounded border ${c.color}`}>
      {c.label}
    </span>
  );
}

export default function GameBoard({
  mode = 'singleplayer',
  multiplayerState,
  multiplayerSend,
  opponentHandCount: mpOpponentHandCount,
  onBackToMenu,
}: GameBoardProps) {
  const [spState, spSend] = useMachine(gameMachine);

  // Use multiplayer source if provided, otherwise single-player XState
  const state = mode === 'multiplayer' && multiplayerState ? multiplayerState : spState;
  const send = (mode === 'multiplayer' && multiplayerSend ? multiplayerSend : spSend) as (event: GameEvent) => void;
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showBetting, setShowBetting] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const ctx = state.context;
  const { game, message } = ctx;
  const isPlayerTurn = state.matches('playerTurn');
  const isBettingPhase = state.matches('bettingPhase');
  const isRoundResult = state.matches('roundResult');
  const isMatchOver = state.matches('matchOver');
  const isMenu = state.matches('menu');

  const hasPendingAIBet = isPlayerTurn && game.currentBet > 0 && game.bettor === 'ai';

  // Determine current phase for badge
  const currentPhase: 'play' | 'betting' | 'result' | 'other' =
    isPlayerTurn ? 'play' :
    isBettingPhase ? 'betting' :
    isRoundResult ? 'result' : 'other';

  // Show betting after a short delay when entering betting phase
  useEffect(() => {
    if (isBettingPhase || hasPendingAIBet) {
      const t = setTimeout(() => setShowBetting(true), 300);
      return () => clearTimeout(t);
    }
    setShowBetting(false);
  }, [isBettingPhase, hasPendingAIBet]);

  // Tutorial step advancement (state-based)
  const prevBettingPhase = useRef(isBettingPhase);
  useEffect(() => {
    if (!tutorialActive) {
      prevBettingPhase.current = isBettingPhase;
      return;
    }

    // End tutorial if round result or match over
    if (isRoundResult || isMatchOver) {
      setTutorialActive(false);
      setTutorialStep(0);
      return;
    }

    const enteredBetting = isBettingPhase && !prevBettingPhase.current;
    const leftBetting = !isBettingPhase && prevBettingPhase.current;

    if (tutorialStep === 3 && enteredBetting) setTutorialStep(4);
    if (tutorialStep === 4 && leftBetting) setTutorialStep(5);
    if (tutorialStep === 6 && enteredBetting) setTutorialStep(7);
    if (tutorialStep === 7 && leftBetting) setTutorialStep(8);

    prevBettingPhase.current = isBettingPhase;
  }, [tutorialActive, tutorialStep, isBettingPhase, isRoundResult, isMatchOver]);

  // Card selection advances step 2 → 3
  useEffect(() => {
    if (tutorialActive && tutorialStep === 2 && selectedCard !== null) {
      setTutorialStep(3);
    }
  }, [tutorialActive, tutorialStep, selectedCard]);

  // Timer-based advances
  useEffect(() => {
    if (!tutorialActive) return;
    if (tutorialStep === 0) {
      const t = setTimeout(() => setTutorialStep(1), 2500);
      return () => clearTimeout(t);
    }
    if (tutorialStep === 1) {
      const t = setTimeout(() => setTutorialStep(2), 4000);
      return () => clearTimeout(t);
    }
    if (tutorialStep === 5) {
      const t = setTimeout(() => setTutorialStep(6), 2500);
      return () => clearTimeout(t);
    }
    if (tutorialStep === 8) {
      const t = setTimeout(() => setTutorialStep(9), 3000);
      return () => clearTimeout(t);
    }
    if (tutorialStep === 9) {
      const t = setTimeout(() => {
        setTutorialActive(false);
        setTutorialStep(0);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [tutorialActive, tutorialStep]);

  // Pending face card choice
  const [pendingFacePlay, setPendingFacePlay] = useState<{ cardId: string; row: Row } | null>(null);

  const handlePlayCard = useCallback((row: Row) => {
    if (!selectedCard || !isPlayerTurn) return;
    const card = game.human.hand.find(c => c.id === selectedCard);
    if (card?.type === 'face') {
      setPendingFacePlay({ cardId: selectedCard, row });
      setSelectedCard(null);
      return;
    }
    send({ type: 'PLAY_CARD', cardId: selectedCard, targetRow: row });
    setSelectedCard(null);
  }, [selectedCard, isPlayerTurn, send, game.human.hand]);

  const handleAbilityChoice = useCallback((useAbility: boolean) => {
    if (!pendingFacePlay) return;
    send({ type: 'PLAY_CARD', cardId: pendingFacePlay.cardId, targetRow: pendingFacePlay.row, useAbility });
    setPendingFacePlay(null);
  }, [pendingFacePlay, send]);

  const handleBet = useCallback((action: BettingAction, amount: number) => {
    send({ type: 'BET', action, amount });
    setShowBetting(false);
  }, [send]);

  // Evaluate current rows
  const humanFrontEval = evaluateHand(game.human.board.frontline.cards, game.weatherActive);
  const humanBackEval = evaluateHand(game.human.board.backline.cards, game.weatherActive);
  const aiFrontEval = evaluateHand(game.ai.board.frontline.cards, game.weatherActive);
  const aiBackEval = evaluateHand(game.ai.board.backline.cards, game.weatherActive);

  // ── Menu Screen (single-player only) ──
  if (isMenu && mode === 'singleplayer') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 tavern-grain table-texture board-vignette relative overflow-hidden">
        {/* Radial gold glow behind title */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[400px] h-[400px] rounded-full bg-tavern-gold/8 blur-[100px] pointer-events-none z-0" />

        <div className="text-center relative z-10">
          <h1 className="font-display text-5xl font-bold text-tavern-gold tracking-wide mb-2"
            style={{ textShadow: '0 0 40px rgba(201,168,76,0.3), 0 2px 8px rgba(0,0,0,0.5), 0 0 80px rgba(201,168,76,0.15)' }}>
            Tavern Tactics
          </h1>
          <p className="text-tavern-text-dim text-sm tracking-widest uppercase">
            Poker meets Strategy
          </p>
        </div>

        <div className="glass rounded-2xl p-6 max-w-sm text-center space-y-4 relative z-10">
          <p className="text-tavern-text-dim text-sm leading-relaxed">
            Build poker hands across two rows — Frontline and Backline.
            Win both to claim the pot. Watch your opponent's board to adapt your strategy.
            Draw 2 fresh cards each round. Know when to hold, when to fold.
          </p>
          <button
            onClick={() => send({ type: 'START_MATCH' })}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-tavern-gold to-tavern-amber
              text-tavern-bg font-display font-bold text-lg tracking-wider
              hover:shadow-lg hover:shadow-tavern-gold/30 transition-all
              active:scale-95"
          >
            Enter the Tavern
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-6 py-2 rounded-xl bg-tavern-gold/10 border border-tavern-gold/20
              text-tavern-gold/80 font-display text-sm tracking-wider
              hover:bg-tavern-gold/20 hover:border-tavern-gold/30 transition-colors"
          >
            How to Play
          </button>
          <button
            onClick={() => {
              setTutorialActive(true);
              setTutorialStep(0);
              send({ type: 'START_MATCH' });
            }}
            className="px-6 py-2 rounded-xl bg-tavern-green/10 border border-tavern-green/20
              text-tavern-green/80 font-display text-sm tracking-wider
              hover:bg-tavern-green/20 hover:border-tavern-green/30 transition-colors"
          >
            Play Tutorial
          </button>
        </div>

        {/* Decorative cards with card-back-pattern */}
        <div className="absolute bottom-8 left-8 opacity-20 rotate-[-15deg] z-0">
          <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
        </div>
        <div className="absolute bottom-12 left-16 opacity-15 rotate-[-5deg] z-0">
          <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
        </div>
        <div className="absolute top-8 right-8 opacity-20 rotate-[12deg] z-0">
          <div className="w-16 h-23 rounded-lg card-back-pattern border border-card-frame" />
        </div>

        <FloatingParticles />

        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      </div>
    );
  }

  // ── Match Over Screen ──
  if (isMatchOver) {
    const won = game.matchWinner === 'human';
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 tavern-grain table-texture board-vignette relative overflow-hidden">
        <FloatingParticles />
        <h2 className={`font-display text-4xl font-bold tracking-wide relative z-10 ${won ? 'text-tavern-gold' : 'text-tavern-red'}`}
          style={{ textShadow: won ? '0 0 30px rgba(201,168,76,0.4)' : '0 0 30px rgba(180,64,64,0.3)' }}>
          {won ? 'Victory' : 'Defeat'}
        </h2>
        <p className="text-tavern-text-dim text-sm relative z-10">{message}</p>
        <div className="flex gap-4 relative z-10">
          <ChipStack amount={game.human.chips} label="Your Chips" highlight={won} />
          <ChipStack amount={game.ai.chips} label="Opponent" highlight={!won} />
        </div>
        <div className="text-tavern-text-dim text-xs relative z-10">
          Rounds won: You {game.human.roundsWon} — Opponent {game.ai.roundsWon}
        </div>
        <button
          onClick={() => {
            if (mode === 'multiplayer' && onBackToMenu) {
              onBackToMenu();
            } else {
              send({ type: 'RESTART' });
            }
          }}
          className="px-6 py-2 rounded-xl bg-tavern-gold/20 border border-tavern-gold/40
            text-tavern-gold font-display tracking-wider hover:bg-tavern-gold/30 transition-colors relative z-10"
        >
          {mode === 'multiplayer' ? 'Back to Menu' : 'Play Again'}
        </button>
      </div>
    );
  }

  // ── Game Board ──
  return (
    <div className="h-full flex flex-col tavern-grain table-texture board-vignette relative overflow-hidden">
      <FloatingParticles />

      {/* Top Bar: Round info, phase badge, chips, pot */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-tavern-border/30 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm text-tavern-gold tracking-widest uppercase">
            Round {game.currentRound}
          </span>
          <PhaseBadge phase={currentPhase} />
          <span className="text-tavern-text-dim text-xs">
            Won: {game.human.roundsWon} — {game.ai.roundsWon}
          </span>
        </div>
        <ChipStack amount={game.pot} label="Pot" highlight />
        <div className="flex items-center gap-2">
          <ChipStack amount={game.ai.chips} label="Opponent" />
          <ChipStack amount={game.human.chips} label="You" />
          <CheatSheet />
        </div>
      </div>

      {/* Weather indicator */}
      {game.weatherActive && (
        <div className="text-center py-1 bg-tavern-amber/10 border-b border-tavern-amber/20 relative z-10">
          <span className="text-xs text-tavern-amber font-medium">
            {'\u2601'} Weather Active — Flushes are void this round
          </span>
        </div>
      )}

      {/* Message bar — keyed to re-trigger animation */}
      <div className="text-center py-1.5 min-h-[32px] relative z-10">
        <span key={message} className="text-xs text-tavern-text-dim animate-message inline-block">{message}</span>
      </div>

      {/* Board Area */}
      <div className="flex-1 flex flex-col justify-center gap-2 px-4 py-2 overflow-hidden relative z-10">
        {/* Opponent's side */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-tavern-red/20 border border-tavern-red/30 flex items-center justify-center">
              <span className="text-xs">{mode === 'multiplayer' ? 'P2' : 'AI'}</span>
            </div>
            <span className="text-xs text-tavern-text-dim font-display tracking-wider uppercase">Opponent</span>
            <div className="flex gap-0.5 ml-auto">
              {Array.from({ length: mode === 'multiplayer' ? (mpOpponentHandCount ?? 0) : game.ai.hand.length }).map((_, i) => (
                <div key={i} className="w-3 h-4 rounded-sm card-back-pattern border border-card-frame/50" />
              ))}
            </div>
          </div>
          <CardRow
            cards={game.ai.board.backline.cards}
            row="backline"
            isPlayer={false}
            evaluation={aiBackEval}
          />
          <CardRow
            cards={game.ai.board.frontline.cards}
            row="frontline"
            isPlayer={false}
            evaluation={aiFrontEval}
          />
        </div>

        {/* Central divider with VS emblem */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tavern-gold/30 to-transparent" />
          <div className="w-8 h-8 rounded-full border border-tavern-gold/40 bg-tavern-surface/80
            flex items-center justify-center shadow-[0_0_12px_rgba(201,168,76,0.15)]">
            <span className="text-[9px] font-display text-tavern-gold font-bold tracking-wider">VS</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tavern-gold/30 to-transparent" />
        </div>
        {/* Pot below divider */}
        <div className="text-center -mt-1 mb-1">
          <span className="text-[9px] text-tavern-gold/60 font-display tracking-wider">
            Pot: {game.pot}
          </span>
        </div>

        {/* Player's side */}
        <div className="space-y-1.5" data-tutorial-highlight={tutorialActive && TUTORIAL_STEPS[tutorialStep]?.highlight === 'rows' ? 'true' : undefined}>
          <CardRow
            cards={game.human.board.frontline.cards}
            row="frontline"
            isPlayer={true}
            onDropCard={handlePlayCard}
            evaluation={humanFrontEval}
            isActive={isPlayerTurn && selectedCard !== null}
          />
          <CardRow
            cards={game.human.board.backline.cards}
            row="backline"
            isPlayer={true}
            onDropCard={handlePlayCard}
            evaluation={humanBackEval}
            isActive={isPlayerTurn && selectedCard !== null}
          />
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-7 h-7 rounded-full bg-tavern-gold/20 flex items-center justify-center
              ${isPlayerTurn ? 'border-2 border-tavern-gold turn-active' : 'border border-tavern-gold/30'}`}>
              <span className="text-xs text-tavern-gold">Y</span>
            </div>
            <span className="text-xs text-tavern-gold font-display tracking-wider uppercase">You</span>
            {isPlayerTurn && (
              <span key="your-turn" className="text-[9px] text-tavern-gold/70 ml-1 animate-message">Your turn</span>
            )}
            {game.human.hasPassed && (
              <span className="text-[9px] text-tavern-red ml-2 uppercase tracking-wider">Passed</span>
            )}
          </div>
        </div>
      </div>

      {/* Player's Hand */}
      <div className="border-t border-tavern-border/30 px-4 py-3 bg-tavern-surface/50 relative z-10">
        {/* Betting Panel */}
        {((isBettingPhase || hasPendingAIBet) && showBetting) && (
          <div className="mb-3" data-tutorial-highlight={tutorialActive && TUTORIAL_STEPS[tutorialStep]?.highlight === 'betting' ? 'true' : undefined}>
            <BettingPanel
              onBet={handleBet}
              currentBet={game.currentBet}
              playerChips={game.human.chips}
              canCheck={!hasPendingAIBet}
              minBet={5}
              hasBettor={game.bettor === 'ai'}
            />
          </div>
        )}

        {/* Pass Round button */}
        {isPlayerTurn && !hasPendingAIBet && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => send({ type: 'BET', action: 'fold', amount: 0 })}
              className="px-3 py-1 rounded-lg text-[10px] text-tavern-red/70 border border-tavern-red/20
                hover:bg-tavern-red/10 transition-colors uppercase tracking-wider active:scale-95"
            >
              Pass Round
            </button>
          </div>
        )}

        <div data-tutorial-highlight={tutorialActive && TUTORIAL_STEPS[tutorialStep]?.highlight === 'hand' ? 'true' : undefined}>
          <PlayerHand
            cards={game.human.hand}
            selectedCardId={selectedCard}
            onSelectCard={setSelectedCard}
            disabled={!isPlayerTurn || hasPendingAIBet || isBettingPhase}
            isPlayerTurn={isPlayerTurn && !hasPendingAIBet && !isBettingPhase}
          />
        </div>

        {isPlayerTurn && !hasPendingAIBet && selectedCard && (
          <p className="text-center text-[10px] text-tavern-gold/60 mt-2 tracking-wider">
            Click a row to place your card
          </p>
        )}
        {hasPendingAIBet && (
          <p className="text-center text-[10px] text-tavern-amber/60 mt-2 tracking-wider">
            Opponent bet {game.currentBet} chips — respond above
          </p>
        )}
      </div>

      {/* Tutorial Overlay */}
      {tutorialActive && TUTORIAL_STEPS[tutorialStep] && (
        <TutorialOverlay
          step={TUTORIAL_STEPS[tutorialStep]}
          stepIndex={tutorialStep}
          totalSteps={TUTORIAL_STEPS.length}
          onSkip={() => {
            setTutorialActive(false);
            setTutorialStep(0);
          }}
        />
      )}

      {/* Face Card Ability Choice Modal */}
      {pendingFacePlay && (() => {
        const card = game.human.hand.find(c => c.id === pendingFacePlay.cardId);
        if (!card || card.type !== 'face') return null;
        const abilityNames: Record<string, { title: string; icon: string; desc: string; value: number }> = {
          jack: { title: 'Spy', icon: '\uD83D\uDC41', desc: 'Place on opponent\'s board + draw 2 cards', value: 11 },
          queen: { title: 'Medic', icon: '\u2695', desc: 'Revive highest card from graveyard to this row', value: 12 },
          king: { title: 'Commander', icon: '\u2694', desc: 'Win this row = opponent loses 5 extra chips', value: 13 },
          ace: { title: 'Scorcher', icon: '\uD83D\uDD25', desc: 'Destroy opponent\'s highest card in this row', value: 14 },
        };
        const info = abilityNames[card.faceRank];
        if (!info) return null;
        return (
          <div className="absolute inset-0 bg-tavern-bg/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-2xl p-5 max-w-xs w-full text-center space-y-4 animate-slide-up">
              <div className="text-2xl">{info.icon}</div>
              <h3 className="font-display text-lg text-tavern-gold tracking-wider">
                {card.faceRank.charAt(0).toUpperCase() + card.faceRank.slice(1)} — {info.title}
              </h3>
              <p className="text-xs text-tavern-text-dim">
                Choose how to play this card:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleAbilityChoice(true)}
                  className="w-full px-4 py-2.5 rounded-xl bg-tavern-gold/15 border border-tavern-gold/30
                    text-tavern-gold font-display text-sm tracking-wider
                    hover:bg-tavern-gold/25 transition-colors text-left active:scale-[0.98]"
                >
                  <span className="block font-bold">Activate Ability</span>
                  <span className="block text-[10px] text-tavern-text-dim mt-0.5">{info.desc}</span>
                  <span className="block text-[9px] text-tavern-red/60 mt-0.5">Card won't count toward your poker hand</span>
                </button>
                <button
                  onClick={() => handleAbilityChoice(false)}
                  className="w-full px-4 py-2.5 rounded-xl bg-tavern-surface border border-tavern-border
                    text-tavern-text font-display text-sm tracking-wider
                    hover:bg-tavern-surface/80 hover:border-tavern-gold/20 transition-colors text-left active:scale-[0.98]"
                >
                  <span className="block font-bold">Play as Value Card</span>
                  <span className="block text-[10px] text-tavern-text-dim mt-0.5">
                    Counts as {info.value} in your poker hand (no ability)
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Round Result Overlay */}
      {isRoundResult && game.lastRoundResult && (
        <div className="absolute inset-0 bg-tavern-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 max-w-md text-center space-y-4 animate-slide-up">
            <h3 className="font-display text-xl text-tavern-gold tracking-wider">{message}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-tavern-text-dim text-xs block mb-1">Frontline</span>
                <div className="text-tavern-text">
                  You: {game.lastRoundResult.humanFrontlineEval?.description || 'Empty'}
                </div>
                <div className="text-tavern-text-dim">
                  AI: {game.lastRoundResult.aiFrontlineEval?.description || 'Empty'}
                </div>
                <div className={`text-xs mt-1 ${
                  game.lastRoundResult.frontlineWinner === 'human' ? 'text-tavern-green' :
                  game.lastRoundResult.frontlineWinner === 'ai' ? 'text-tavern-red' :
                  'text-tavern-text-dim'
                }`}>
                  {game.lastRoundResult.frontlineWinner === 'tie' ? 'Tie' :
                   game.lastRoundResult.frontlineWinner === 'human' ? 'You win!' : 'AI wins'}
                </div>
              </div>
              <div>
                <span className="text-tavern-text-dim text-xs block mb-1">Backline</span>
                <div className="text-tavern-text">
                  You: {game.lastRoundResult.humanBacklineEval?.description || 'Empty'}
                </div>
                <div className="text-tavern-text-dim">
                  AI: {game.lastRoundResult.aiBacklineEval?.description || 'Empty'}
                </div>
                <div className={`text-xs mt-1 ${
                  game.lastRoundResult.backlineWinner === 'human' ? 'text-tavern-green' :
                  game.lastRoundResult.backlineWinner === 'ai' ? 'text-tavern-red' :
                  'text-tavern-text-dim'
                }`}>
                  {game.lastRoundResult.backlineWinner === 'tie' ? 'Tie' :
                   game.lastRoundResult.backlineWinner === 'human' ? 'You win!' : 'AI wins'}
                </div>
              </div>
            </div>
            <div className="text-tavern-gold text-sm">
              Pot: {game.lastRoundResult.potAwarded} chips
            </div>
            <button
              onClick={() => send({ type: 'NEXT_ROUND' })}
              className="px-6 py-2 rounded-xl bg-tavern-gold/20 border border-tavern-gold/40
                text-tavern-gold font-display tracking-wider hover:bg-tavern-gold/30 transition-colors active:scale-95"
            >
              {game.matchWinner ? 'See Results' : 'Next Round'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
