'use client';

import { useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';
import { buildUpiLink, normalizeUpiId } from '@/lib/utils';

export default function UpiSupportCard({ upiId, payeeName, note, title, subtitle }) {
  const [copied, setCopied] = useState(false);
  const normalizedUpiId = normalizeUpiId(upiId);
  const upiLink = buildUpiLink({ upiId: normalizedUpiId, payeeName, note });

  async function handleCopy() {
    if (!normalizedUpiId) return;
    try {
      await navigator.clipboard.writeText(normalizedUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[28px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">PhonePe Manual UPI Flow</div>
      <h3 className="mt-2 text-2xl font-black text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink/75">{subtitle}</p>
      <div className="mt-4 rounded-2xl border-2 border-dashed border-ink/40 bg-paper px-4 py-3 font-mono text-sm text-ink">
        {normalizedUpiId || 'UPI ID unavailable'}
      </div>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink/80">
        <li>Tap “Open UPI App” to hand off to PhonePe / your default UPI app.</li>
        <li>If that does not work, copy the UPI ID and paste it manually in PhonePe.</li>
        <li>Preclore never touches the money when supporting a researcher.</li>
      </ol>
      <div className="mt-5 flex flex-wrap gap-3">
        <TactileButton
          onClick={() => {
            if (upiLink) window.location.href = upiLink;
          }}
          variant="primary"
          disabled={!upiLink}
        >
          Open UPI App
        </TactileButton>
        <TactileButton onClick={handleCopy} variant="secondary" disabled={!normalizedUpiId}>
          {copied ? 'Copied!' : 'Copy UPI ID'}
        </TactileButton>
      </div>
    </div>
  );
}
