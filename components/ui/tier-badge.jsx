import { cn } from '@/lib/utils';

const tone = {
  Bronze: 'from-[#d58b4b] via-[#f8c48e] to-[#b56836] text-[#4d2a12]',
  Silver: 'from-[#c5cfdf] via-[#eef4ff] to-[#97a5bc] text-[#2e4156]',
  Gold: 'from-[#f5be35] via-[#fff1aa] to-[#d18d00] text-[#5b4200]',
  Platinum: 'from-[#b9b6ff] via-[#ffffff] to-[#84d7ff] text-[#173d62]'
};

export default function TierBadge({ tier, className = '' }) {
  return (
    <div
      className={cn(
        'tier-badge inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-black shadow-[0_4px_0_0_rgba(44,43,42,1)] bg-gradient-to-r',
        tone[tier] || tone.Bronze,
        className
      )}
    >
      <span className="text-lg">✦</span>
      <span>{tier} Tier</span>
    </div>
  );
}
