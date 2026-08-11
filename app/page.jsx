import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';
import { deriveAccessProfile } from '@/lib/access';

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

  const canSubmit = Boolean(user && access?.canSubmit);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border-2 border-ink bg-white/75 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
          <div className="inline-flex rounded-full border-2 border-ink bg-mint px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-forest">
            Student Research • Public Projects • Safe Contact
          </div>

          <h1 className="mt-5 text-3xl font-black leading-tight text-ink lg:text-5xl">
            Show your project online, even after the exhibition ends.
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/80 lg:text-lg lg:leading-8">
            Preclore helps students post project summaries, add public links, and let the right people
            discover their work. Teachers, reviewers, and NGOs can request contact — but only if the student agrees.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {canSubmit ? (
              <TactileButton href="/submit" variant="primary" className="px-4 py-2 text-sm">
                Add Project
              </TactileButton>
            ) : user ? (
              <TactileButton href="/profile" variant="primary" className="px-4 py-2 text-sm">
                My Profile
              </TactileButton>
            ) : (
              <TactileButton href="/auth" variant="primary" className="px-4 py-2 text-sm">
                Login
              </TactileButton>
            )}

            <TactileButton href="/journal" variant="secondary" className="px-4 py-2 text-sm">
              View Projects
            </TactileButton>

            <TactileButton href="/support" variant="lilac" className="px-4 py-2 text-sm">
              Support Preclore
            </TactileButton>
          </div>
        </div>

        <div className="rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Why use Preclore?</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
            <li>• Keep your project visible after the exhibition is over.</li>
            <li>• Share a simple public link instead of uploading big files.</li>
            <li>• Let reviewers, teachers, and NGOs discover good work.</li>
            <li>• Approve contact only when you want to.</li>
            <li>• Build a public track record of your ideas.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">How to Join Preclore</div>
        <h2 className="mt-3 text-2xl font-black text-ink lg:text-3xl">
          Watch this quick walkthrough
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/80 lg:text-base">
          New here? This short video explains how students, teachers, reviewers, and NGOs can create an account and start using Preclore.
        </p>

        <div className="mt-6 overflow-hidden rounded-[24px] border-2 border-ink bg-white">
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/XIlHzTBiAEQ"
              title="How to create an account on Preclore"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['1. Create Account', 'Sign up using your email and create a password just for Preclore.'],
          ['2. Build Profile', 'Add your name, school or organization, and basic details so people know who you are.'],
          ['3. Add Project', 'Post your project title, short description, and any public links or proof you want to share.']
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-[24px] border-2 border-ink bg-white/70 p-5 shadow-[0_6px_0_0_rgba(44,43,42,1)]"
          >
            <h2 className="text-xl font-black text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/80">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
