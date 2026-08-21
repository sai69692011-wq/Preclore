import TactileButton from '@/components/ui/tactile-button';
import { deriveAccessProfile } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';

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
    logo: `${siteUrl}/preclore-logo.webp`,
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

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let access = null;

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, birth_year')
      .eq('id', user.id)
      .maybeSingle();

    access = deriveAccessProfile(profile || {});
  }

  const primaryButton = !user
    ? { href: '/auth', label: 'Create Account / Login' }
    : access?.canSubmit
      ? { href: '/submit', label: 'Add Project' }
      : { href: '/journal', label: 'View Projects' };

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
            add public links, and let teachers, professors, reviewers, and NGOs discover their work.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
            Good work should not disappear after one event. Preclore helps ideas stay visible,
            searchable, and useful.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <TactileButton href={primaryButton.href} variant="primary">
              {primaryButton.label}
            </TactileButton>

            <TactileButton href="/journal" variant="secondary">
              Browse Research
            </TactileButton>

            <TactileButton href="/support" variant="lilac">
              Support Preclore
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
            'Students, teachers, professors, reviewers, and NGOs can create an account on Preclore.'
          ],
          [
            '2. Share or Discover',
            'Students can post projects, while teachers and NGOs can discover useful work already online.'
          ],
          [
            '3. Keep Ideas Alive',
            'Projects stay visible after exhibition day so the right people can still find them later.'
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
              professors, and NGOs discover work that might solve real problems or deserve support.
            </p>
          </div>

          <div className="rounded-[28px] border-2 border-ink bg-white/80 p-6">
            <ul className="space-y-3 text-sm leading-6 text-ink/80">
              <li>• Research paper</li>
              <li>• Experiment</li>
              <li>• Prototype</li>
              <li>• Blog or article</li>
              <li>• Idea or concept</li>
              <li>• Community project</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
