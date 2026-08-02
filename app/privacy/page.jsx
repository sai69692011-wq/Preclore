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
            Sensitive identifiers such as email addresses, parent-managed UPI information, and verification proof documents
            are not publicly displayed and are handled through restricted access rules.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">2. Verification Documents</h2>
          <p className="mt-2">
            Verification uploads are private and are used only to review optional identity or institutional verification requests.
            Public viewers do not see raw ID numbers or uploaded proof files.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">3. Evidence &amp; Public Visibility</h2>
          <p className="mt-2">
            Public-facing evidence, document links, and published project summaries may be visible to journal viewers
            to support academic transparency.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">4. Data Retention</h2>
          <p className="mt-2">
            Preclore retains account and submission data for platform integrity, public archive use,
            moderation, and operational continuity, subject to legal and safety constraints.
          </p>
          <p className="mt-2">
            Verification proof may be retained only as needed for review, moderation, or compliance handling.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-ink">5. Contact</h2>
          <p className="mt-2">
            For privacy concerns, takedown requests, or account issues, use your official monitored
            grievance/contact email before public launch.
          </p>
        </section>
      </div>
    </div>
  );
}
