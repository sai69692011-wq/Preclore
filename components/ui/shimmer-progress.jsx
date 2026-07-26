import { clamp } from '@/lib/utils';

export default function ShimmerProgress({ value, label }) {
  const safeValue = clamp(value, 0, 100);

  return (
    <div className="space-y-2">
      {label ? <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">{label}</div> : null}
      <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white/80">
        <div
          className="progress-shimmer h-full rounded-full bg-[linear-gradient(90deg,#ff8f70_0%,#ffe8a3_35%,#d8f2d0_70%,#d6ebff_100%)] transition-all duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
