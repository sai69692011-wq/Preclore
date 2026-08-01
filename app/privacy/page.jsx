export const metadata = {
  title: 'Privacy Policy'
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
        Legal
      </div>
      <h1 className="mt-3 text-4xl font-black text-ink">Privacy Policy</h1>

      <div className="mt-8 space-y-8 text-sm leading-7 text-ink/80">
        <section>
          <h2 className="text-xl font-black text-ink">1. Data Protection &amp; Access Control</h2>
          <p className="mt-2">
            Preclore treats sensitive account data with restricted access. Email addresses and student support routing details are protected behind access roles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">2. What We Collect</h2>
          <p className="mt-2">
            We collect basic account identity data (email and user ID), profile details (display name, bio), and research submission records.
          </p>
        </section>
      </div>
    </div>
  );
}
