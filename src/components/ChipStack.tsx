interface ChipStackProps {
  amount: number;
  label: string;
  highlight?: boolean;
}

export default function ChipStack({ amount, label, highlight }: ChipStackProps) {
  return (
    <div className={`
      glass rounded-xl px-4 py-2 flex flex-col items-center gap-1
      ${highlight ? 'ring-1 ring-tavern-gold/40' : ''}
    `}>
      <span className="text-[10px] font-display uppercase tracking-widest text-tavern-text-dim">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <div className={`
          w-5 h-5 rounded-full border-2
          ${highlight
            ? 'border-tavern-gold bg-gradient-to-br from-tavern-gold to-tavern-amber'
            : 'border-tavern-gold-dim bg-gradient-to-br from-tavern-gold-dim to-tavern-amber/50'}
          shadow-inner flex items-center justify-center
        `}>
          <span className="text-[7px] font-bold text-tavern-bg">\u00A4</span>
        </div>
        <span className={`
          text-lg font-bold tabular-nums
          ${highlight ? 'text-tavern-gold' : 'text-tavern-text'}
        `}>
          {amount}
        </span>
      </div>
    </div>
  );
}
