import { useState, useEffect } from 'react';
import { SPECIAL_CARDS, HAND_RANKINGS } from '../game/helpContent';

export default function CheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full glass border border-tavern-gold/30
          text-tavern-gold font-display text-sm font-bold
          hover:border-tavern-gold/60 hover:bg-tavern-gold/10
          transition-colors flex items-center justify-center"
        title="Quick Reference (?)"
      >
        ?
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-tavern-bg/60 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="glass rounded-2xl p-4 max-w-sm w-full mx-4 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-tavern-gold tracking-wider">
                Quick Reference
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full bg-tavern-surface border border-tavern-border
                  text-tavern-text-dim hover:text-tavern-text text-xs
                  flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Special Cards */}
            <h4 className="font-display text-xs text-tavern-gold/70 tracking-widest uppercase mb-2">
              Special Cards
            </h4>
            <div className="space-y-1.5 mb-4">
              {SPECIAL_CARDS.map((card) => (
                <div key={card.rank} className="flex items-start gap-2 text-sm">
                  <span className="text-base flex-shrink-0">{card.icon}</span>
                  <div>
                    <span className="text-tavern-gold font-medium text-xs">{card.rank}</span>
                    <span className="text-tavern-text-dim text-xs"> — {card.description}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-tavern-border/30 mb-4" />

            {/* Hand Rankings */}
            <h4 className="font-display text-xs text-tavern-gold/70 tracking-widest uppercase mb-2">
              Hand Rankings
            </h4>
            <div className="space-y-1">
              {HAND_RANKINGS.map((hand, i) => (
                <div key={hand.name} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-tavern-gold/60 font-bold flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-tavern-text">{hand.name}</span>
                  <span className="text-tavern-text-dim ml-auto">{hand.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
