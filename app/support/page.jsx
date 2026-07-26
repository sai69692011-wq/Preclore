import UpiSupportCard from '@/components/support/upi-support-card';
import { MISSION_PAYEE_NAME, MISSION_UPI_ID } from '@/lib/constants';

export const metadata = {
  title: 'Support the Mission — Preclore v2.4'
};

export default function SupportPage() {
  const upiId = MISSION_UPI_ID;
  const payeeName = MISSION_PAYEE_NAME;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[34px] border-2 border-ink bg-white/75 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Voluntary Only</div>
        <h1 className="mt-3 text-4xl font-black text-ink">Support the Mission</h1>
        <p className="mt-4 text-sm leading-7 text-ink/80">
          This page keeps Preclore alive as a public-good registry. Donations are optional and manual via UPI / PhonePe.
          No pricing, no subscriptions, no compulsory fees, and no platform-controlled research payouts.
        </p>
        <div className="mt-6 rounded-[24px] border-2 border-ink bg-paper p-5">
          <ul className="space-y-3 text-sm leading-6 text-ink/80">
            <li>• Funds here are only for server continuity.</li>
            <li>• Student project support never routes through Preclore.</li>
            <li>• Researchers with accepted mentor/admin access can expose a parental buffer UPI flow on eligible projects.</li>
            <li>• Pay to: {upiId} ({payeeName})</li>
          </ul>
        </div>
      </div>
      <UpiSupportCard
        upiId={upiId}
        payeeName={payeeName}
        note="Support Preclore mission"
        title="Keep the registry online"
        subtitle={`Use PhonePe or your preferred UPI app to pay directly to ${upiId} (${payeeName}).`}
      />
    </div>
  );
}
