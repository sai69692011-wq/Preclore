import UpiSupportCard from '@/components/support/upi-support-card';

export const UPI_ID = 'sadamaan-1@okaxis';
export const PAYEE_NAME = 'Preclore';

export default function PaymentForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border-2 border-ink bg-paper p-5 text-sm font-semibold text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)]">
        Pay to: {UPI_ID} ({PAYEE_NAME})
      </div>
      <UpiSupportCard
        upiId={UPI_ID}
        payeeName={PAYEE_NAME}
        note="Support Preclore mission"
        title="Support Preclore"
        subtitle="Manual UPI / PhonePe payment using the direct Preclore mission UPI ID."
      />
    </div>
  );
}
