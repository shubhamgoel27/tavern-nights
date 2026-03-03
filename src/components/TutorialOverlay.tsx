export type TutorialHighlight = 'hand' | 'rows' | 'betting' | 'none';
export type TutorialPosition = 'top' | 'bottom' | 'center' | 'right';

export interface TutorialStepDef {
  message: string;
  subtext?: string;
  highlight: TutorialHighlight;
  position: TutorialPosition;
  showSkip?: boolean;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    message: "Welcome to Tavern Tactics!",
    subtext: "You'll play a real round with guided strategy tips along the way.",
    highlight: 'none',
    position: 'center',
    showSkip: true,
  },
  {
    message: 'Your goal: win BOTH rows to win the round.',
    subtext: 'Win 2 rounds to win the match. You start with 10 cards and draw 2 more each round — but spend wisely, every card counts.',
    highlight: 'none',
    position: 'right',
  },
  {
    message: 'Select a card from your hand.',
    subtext: 'Number cards (2-10) build poker hands. Face cards (J, Q, K, A) have abilities but don\'t count toward hand rankings.',
    highlight: 'hand',
    position: 'right',
  },
  {
    message: 'Place your card on Frontline or Backline.',
    subtext: 'Keep both rows balanced! A strong Frontline is wasted if your Backline is empty. Each row holds up to 5 cards.',
    highlight: 'rows',
    position: 'right',
  },
  {
    message: 'Now decide: Bet or Check.',
    subtext: "Check = skip betting, keep chips safe. Bet = risk chips for a bigger pot. A well-timed bet can force your opponent to fold — even with a decent hand.",
    highlight: 'betting',
    position: 'right',
  },
  {
    message: 'Your opponent is playing...',
    subtext: "You can see their board cards — watch what they place to read their strategy. If they bet, weigh the risk: Call to stay in, or Fold to save your chips for a better round.",
    highlight: 'none',
    position: 'right',
  },
  {
    message: 'Your turn again! Build toward a hand.',
    subtext: 'Pairs are reliable. Flushes (5 same suit) are powerful but risky. Think 2-3 moves ahead — what will your row look like with 4-5 cards?',
    highlight: 'hand',
    position: 'right',
  },
  {
    message: 'Try betting this time!',
    subtext: 'Match your bet size to your confidence. Small bets probe; big bets pressure. Over-betting weak hands is expensive — under-betting strong ones leaves chips on the table.',
    highlight: 'betting',
    position: 'right',
  },
  {
    message: 'Face cards are game-changers!',
    subtext: 'Save Queens for rounds 2-3 (graveyard fills up). Aces destroy key threats. Kings add chip penalties. Jacks give card advantage. Timing is everything.',
    highlight: 'hand',
    position: 'right',
  },
  {
    message: "Think long-term — you've got this!",
    subtext: "Don't play all cards in round 1! You'll draw 2 fresh cards next round, but save 3-4 anyway. If you're winning a small pot, consider folding to conserve. Press ? anytime for a quick reference.",
    highlight: 'none',
    position: 'center',
  },
];

interface TutorialOverlayProps {
  step: TutorialStepDef;
  stepIndex: number;
  totalSteps: number;
  onSkip: () => void;
}

export default function TutorialOverlay({ step, stepIndex, totalSteps, onSkip }: TutorialOverlayProps) {
  const positionClasses: Record<TutorialPosition, string> = {
    top: 'top-16 left-1/2 -translate-x-1/2',
    bottom: 'bottom-52 left-1/2 -translate-x-1/2',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'top-1/2 right-4 -translate-y-1/2',
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {step.position === 'center' && (
        <div className="absolute inset-0 bg-tavern-bg/50 pointer-events-auto" />
      )}

      <div
        className={`absolute ${positionClasses[step.position]} pointer-events-auto
          glass rounded-2xl p-4 max-w-xs w-72 text-center space-y-2 animate-slide-up z-50`}
      >
        <div className="text-[9px] text-tavern-text-dim tracking-widest uppercase font-display">
          Step {stepIndex + 1} of {totalSteps}
        </div>

        <p className="text-sm text-tavern-text leading-relaxed">{step.message}</p>

        {step.subtext && (
          <p className="text-xs text-tavern-text-dim leading-relaxed">{step.subtext}</p>
        )}

        {step.showSkip && (
          <div className="pt-1">
            <button
              onClick={onSkip}
              className="px-3 py-1 rounded-lg text-[10px] text-tavern-text-dim border border-tavern-border
                hover:bg-tavern-surface hover:text-tavern-text transition-colors uppercase tracking-wider"
            >
              Skip Tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
