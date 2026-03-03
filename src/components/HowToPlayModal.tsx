import { useState, useEffect } from 'react';
import { SPECIAL_CARDS, HAND_RANKINGS, GAME_RULES, STRATEGY_TIPS } from '../game/helpContent';

interface HowToPlayModalProps {
  onClose: () => void;
}

type Tab = 'rules' | 'cards' | 'hands' | 'strategy';

const TAB_LABELS: Record<Tab, string> = {
  rules: 'Rules',
  cards: 'Special Cards',
  hands: 'Hands',
  strategy: 'Strategy',
};

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('rules');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-tavern-bg/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-tavern-gold tracking-wider">
            How to Play
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-tavern-surface border border-tavern-border
              text-tavern-text-dim hover:text-tavern-text hover:border-tavern-gold/40
              transition-colors flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-tavern-border/30 pb-2">
          {(['rules', 'cards', 'hands', 'strategy'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider transition-colors
                ${activeTab === tab
                  ? 'bg-tavern-gold/20 text-tavern-gold border border-tavern-gold/30'
                  : 'text-tavern-text-dim hover:text-tavern-text border border-transparent'}`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Rules tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4 animate-fade-in">
            {GAME_RULES.map((rule) => (
              <div key={rule.label}>
                <h4 className="font-display text-sm text-tavern-gold tracking-wider uppercase mb-1">
                  {rule.label}
                </h4>
                <p className="text-tavern-text-dim text-sm leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Special Cards tab */}
        {activeTab === 'cards' && (
          <div className="space-y-3 animate-fade-in">
            {SPECIAL_CARDS.map((card) => (
              <div
                key={card.rank}
                className="flex items-start gap-3 p-3 rounded-xl bg-tavern-surface/40 border border-tavern-border/20"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{card.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-tavern-gold tracking-wider">{card.rank}</span>
                    <span className="text-xs text-tavern-text-dim">— {card.title}</span>
                  </div>
                  <p className="text-tavern-text-dim text-sm leading-relaxed mt-0.5">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hand Rankings tab */}
        {activeTab === 'hands' && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-tavern-text-dim text-xs mb-3">Strongest to weakest:</p>
            {HAND_RANKINGS.map((hand, i) => (
              <div key={hand.name} className="flex items-center gap-3 p-2 rounded-lg">
                <span
                  className="w-6 h-6 rounded-full bg-tavern-gold/20 border border-tavern-gold/30
                    flex items-center justify-center text-xs font-bold text-tavern-gold flex-shrink-0"
                >
                  {i + 1}
                </span>
                <span className="text-sm text-tavern-text font-medium">{hand.name}</span>
                <span className="text-xs text-tavern-text-dim ml-auto">{hand.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Strategy tab */}
        {activeTab === 'strategy' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-tavern-text-dim text-xs mb-1">
              Tips to gain an edge over your opponent:
            </p>
            {STRATEGY_TIPS.map((tip) => (
              <div key={tip.label}>
                <h4 className="font-display text-sm text-tavern-gold tracking-wider uppercase mb-1">
                  {tip.label}
                </h4>
                <p className="text-tavern-text-dim text-sm leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-6 pt-4 border-t border-tavern-border/20 text-center">
          <p className="text-[11px] text-tavern-text-dim tracking-wider">
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-tavern-surface border border-tavern-border text-tavern-gold text-[10px]">
              ?
            </kbd>{' '}
            during a game for a quick reference
          </p>
        </div>
      </div>
    </div>
  );
}
