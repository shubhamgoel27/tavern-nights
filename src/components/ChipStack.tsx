import { useRef, useEffect, useState } from 'react';

interface ChipStackProps {
  amount: number;
  label: string;
  highlight?: boolean;
}

export default function ChipStack({ amount, label, highlight }: ChipStackProps) {
  const prevAmount = useRef(amount);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    if (prevAmount.current !== amount) {
      prevAmount.current = amount;
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 300);
      return () => clearTimeout(t);
    }
  }, [amount]);

  // 1-3 stacked chip discs based on amount
  const discCount = Math.min(3, Math.max(1, Math.ceil(amount / 30)));

  return (
    <div className={`
      glass rounded-xl px-4 py-2 flex flex-col items-center gap-1
      ${highlight ? 'ring-1 ring-tavern-gold/40' : ''}
    `}>
      <span className="text-[10px] font-display uppercase tracking-widest text-tavern-text-dim">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {/* Stacked chip discs */}
        <div className="relative w-5 h-5">
          {Array.from({ length: discCount }).map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-5 h-5 rounded-full border-2
                ${highlight
                  ? 'border-tavern-gold bg-gradient-to-br from-tavern-gold to-tavern-amber'
                  : 'border-tavern-gold-dim bg-gradient-to-br from-tavern-gold-dim to-tavern-amber/50'}
                shadow-inner
              `}
              style={{
                bottom: `${i * 2}px`,
                zIndex: i,
              }}
            />
          ))}
          {/* "$" on top disc */}
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ bottom: `${(discCount - 1) * 2}px` }}>
            <span className="text-[7px] font-bold text-tavern-bg">$</span>
          </div>
        </div>
        <span className={`
          text-lg font-bold tabular-nums
          ${highlight ? 'text-tavern-gold' : 'text-tavern-text'}
          ${popping ? 'chip-pop' : ''}
        `}>
          {amount}
        </span>
      </div>
    </div>
  );
}
