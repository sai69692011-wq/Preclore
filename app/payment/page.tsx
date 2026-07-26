import PaymentForm, { PAYEE_NAME, UPI_ID } from '@/src/components/payment-form';

export const metadata = {
  title: 'Payment — Preclore v2.4'
};

export default function PaymentPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[34px] border-2 border-ink bg-white/75 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Direct Mission UPI</div>
        <h1 className="mt-3 text-4xl font-black text-ink">Payment</h1>
        <p className="mt-4 text-sm leading-7 text-ink/80">
          Pay to: {UPI_ID} ({PAYEE_NAME})
        </p>
      </div>
      <PaymentForm />
    </div>
  );
}
