import TactileButton from '@/components/ui/tactile-button';

const siteUrl = 'https://preclore.vercel.app';

export const metadata = {
  title: 'Preclore | Student Research Platform',
  description:
    'Preclore is a student research platform where students can share projects, add public links, and stay visible after exhibition day.'
};

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Preclore',
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    description:
      'Preclore is a student research platform where students can share projects, add public links, and stay visible after exhibition day.'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Preclore',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/journal?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[36px] border-2 border-ink bg-white/75 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
          <div className="inline-flex rounded-full border-2 border-ink bg-mint px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-forest">
            Student Research • Public Projects • Safe Contact
          </div>

          <h1 className="mt-5 text-5xl font-black leading-tight text-ink">
            Preclore keeps student projects visible after exhibition day.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink/80">
            Preclore is a student research platform where students can post project summaries,
            add public links, and let teachers, professors, reviewers, and NGOs discover their
            work.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
            Instead of letting good ideas disappear after one event, Preclore helps student work
            stay visible, searchable, and useful.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <TactileButton href="/auth" variant="primary">
              Login
            </TactileButton>
            <TactileButton href="/journal" variant="secondary">
              View Projects
            </TactileButton>
            <TactileButton
              href="https://www.youtube.com/watch?v=XIlHzTBiAEQ"
              target="_blank"
              rel="noreferrer"
              variant="lilac"
            >
              Watch How It Works
            </TactileButton>
          </div>
        </div>

        <div className="rounded-[36px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
            For Teachers, Professors, and NGOs
          </div>

          <h2 className="mt-4 text-3xl font-black text-ink">
            Find student work that should not be lost.
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-ink/80">
            <li>• Browse public student projects in one place.</li>
            <li>• View project summaries and public proof links.</li>
            <li>• Discover useful work even after exhibitions end.</li>
            <li>• Request contact only if the student agrees.</li>
            <li>• Help promising ideas reach the right people.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          [
            '1. Create Account',
            'Students, teachers, professors, and NGOs can join Preclore with a simple account.'
          ],
          [
            '2. Add Project',
            'Students share a project title, short summary, and public links instead of uploading heavy files.'
          ],
          [
            '3. Stay Discoverable',
            'Projects remain visible online so the right people can still find them later.'
          ]
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-[28px] border-2 border-ink bg-white/70 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]"
          >
            <h2 className="text-2xl font-black text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/80">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[34px] border-2 border-ink bg-paper p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
              Why Preclore Matters
            </div>
            <h2 className="mt-3 text-3xl font-black text-ink">
              A student project should be more than one day, one table, or one score.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/80">
              Preclore helps students build a visible record of their ideas. It also helps teachers,
              professors, and NGOs discover work that might actually solve real problems or deserve
              support.
            </p>
          </div>

          <div className="rounded-[28px] border-2 border-ink bg-white/80 p-6">
            <ul className="space-y-3 text-sm leading-6 text-ink/80">
              <li>• Preclore makes student research easier to discover.</li>
              <li>• Preclore keeps projects visible after the exhibition is over.</li>
              <li>• Preclore supports public links, public summaries, and safer contact requests.</li>
              <li>• Preclore is built for students, teachers, professors, and NGOs.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
