export const metadata = {
  title: 'Terms of Service'
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        Legal
      </div>
      <h1 className="mt-3 text-4xl font-black text-ink">Terms of Service</h1>

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink/80">
        <section>
          <h2 className="text-xl font-black text-ink">1. Nature of the Platform</h2>
          <p className="mt-2">
            Preclore is a public-interest academic research registry and facilitation platform.
            We provide deterministic educational signals, including the Verification Quotient (VQ)
            Score and Tier Badge, based on submitted inputs and platform logic.
            These signals are educational indicators only and do not constitute certification,
            endorsement, funding approval, admissions preference, academic guarantee, or legal verification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">2. Submission Standards</h2>
          <p className="mt-2">
            Users must submit original work or work they are authorized to publish and ensure appropriate
            participant consent where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">3. Financial Facilitation</h2>
          <p className="mt-2">
            Preclore is a registry platform and does not hold, process, or disburse funds directly.
            Any support transfer is conducted independently outside Preclore.
          </p>
        </section>
      </div>
    </div>
  );
}
