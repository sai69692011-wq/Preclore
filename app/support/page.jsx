import UpiSupportCard from '@/components/support/upi-support-card';
import { MISSION_PAYEE_NAME, MISSION_UPI_ID } from '@/lib/constants';

export const metadata = {
  title: 'Support Preclore'
};

export default function SupportPage() {
  const upiId = MISSION_UPI_ID;
  const payeeName = MISSION_PAYEE_NAME;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[34px] border-2 border-ink bg-white/75 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Voluntary Only</div>
        <h1 className="mt-3 text-4xl font-black text-ink">Support Preclore</h1>
        <p className="mt-4 text-sm leading-7 text-ink/80">
          This page helps keep Preclore online. Support is optional and manual through any UPI app.
          No pricing, no subscriptions, no compulsory fees, and no platform-controlled student payouts.
        </p>
        <div className="mt-6 rounded-[24px] border-2 border-ink bg-paper p-5">
          <ul className="space-y-3 text-sm leading-6 text-ink/80">
            <li>• Funds here are only for server continuity.</li>
            <li>• Student project support never routes through Preclore.</li>
            <li>• Researchers with accepted mentor/admin access can expose a parental buffer UPI flow on eligible projects.</li>
            <li>• Pay to: {payeeName}</li>
            <li>• UPI ID: {upiId}</li>
          </ul>
        </div>
      </div>
      <UpiSupportCard
        upiId={upiId}
        payeeName={payeeName}
        note="Support Preclore"
        title="Keep Preclore online"
        subtitle={`Use Google Pay, PhonePe, Paytm, or any UPI app to pay ${payeeName}.`}
      />
    </div>
  );
}
