import { notFound } from 'next/navigation';
import { deriveAccessProfile } from '@/lib/access';
import FollowRequestButton from '@/components/support/follow-request-button';
import UpiSupportCard from '@/components/support/upi-support-card';
import TierBadge from '@/components/ui/tier-badge';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';

function verificationLabel(role, status) {
  if (status !== 'verified') return null;
  if (role === 'student') return 'Verified Student';
  if (role === 'mentor') return 'Verified Mentor';
  return 'Verified Reviewer';
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: projectRows } = await supabase.rpc('get_public_project_detail', {
    project_slug: slug
  });

  const project = projectRows?.[0] || null;

  if (!project) {
    notFound();
  }

  const needsFunding = ['Project: Needs Funding', 'Needs Funding'].includes(project.project_tag);
  const verificationBadge = verificationLabel(
    project.researcher_role,
    project.researcher_verification_status
  );

  let connectedParentUpi = null;
  let viewerAccess = null;

  if (user) {
    const { data: viewerProfile } = await supabase
      .from('users')
      .select('role, birth_year')
      .eq('id', user.id)
      .maybeSingle();

    viewerAccess = deriveAccessProfile(viewerProfile || {});
  }

  if (needsFunding && user) {
    const { data } = await supabase.rpc('get_connected_parent_upi', {
      target_researcher_id: project.researcher_id
    });
    connectedParentUpi = data;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="cream-paper rounded-[36px] border-2 border-ink p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-ink/30 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-forest">
            {project.project_tag}
          </div>
          <TierBadge tier={project.tier} />
        </div>

        <div className="mt-5">
          <h1 className="text-4xl font-black text-ink">{project.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-ink/70">
            <span>{project.researcher_name}</span>
            {project.researcher_institution_name ? (
              <>
                <span>•</span>
                <span>{project.researcher_institution_name}</span>
              </>
            ) : null}
            {project.region_label ? (
              <>
                <span>•</span>
                <span>{project.region_label}</span>
              </>
            ) : null}
            <span>•</span>
            <span>VQ {project.vq_score}</span>
          </div>

          {verificationBadge ? (
            <div className="mt-2">
              <span className="rounded-full border border-ink bg-mint px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                {verificationBadge}
              </span>
            </div>
          ) : null}
        </div>

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-ink">Short Description</h2>
            <p className="mt-2 text-sm leading-7 text-ink/80">{project.summary}</p>
          </div>

          {project.pdf_url ? (
            <div>
              <h2 className="text-xl font-black text-ink">Project File / Link</h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">
                This project includes an external file or document link.
              </p>
              <div className="mt-3">
                <TactileButton href={project.pdf_url} variant="primary" target="_blank">
                  Open Project File / Link
                </TactileButton>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-black text-ink">Project File / Link</h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">
                No external file or link was added for this project.
              </p>
            </div>
          )}

          {project.systems_impact ? (
            <div>
              <h2 className="text-xl font-black text-ink">Extra Context</h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">{project.systems_impact}</p>
            </div>
          ) : null}

          {project.public_good_case ? (
            <div>
              <h2 className="text-xl font-black text-ink">Why It Matters</h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">{project.public_good_case}</p>
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-black text-ink">Proof & References</h2>
            <div className="mt-3 space-y-2 text-sm leading-7 text-ink/80">
              {(project.evidence_urls || []).length ? (
                <ul className="list-disc pl-5">
                  {project.evidence_urls.map((url) => (
                    <li key={url}>
                      <a className="underline" href={url} rel="noreferrer" target="_blank">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No extra proof links were added.</p>
              )}

              <p><strong>Citations:</strong> {project.citations || 'Not provided'}</p>
              <p><strong>Reproducibility:</strong> {project.reproducibility_note || 'Not provided'}</p>
            </div>
          </div>
        </section>
      </article>

      <aside className="space-y-5">
        <div className="rounded-[30px] border-2 border-ink bg-white/75 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Registry Notes</div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/80">
            <li>• Projects publish instantly after submission.</li>
            <li>• Extra proof and extra details are optional.</li>
            <li>• Verified badges are identity trust indicators, not certification.</li>
          </ul>
        </div>

        {needsFunding ? (
          connectedParentUpi ? (
            <UpiSupportCard
              upiId={connectedParentUpi}
              payeeName={project.researcher_name}
              note={`Support ${project.title}`}
              title="Support this Researcher"
              subtitle="This direct UPI flow routes support to the student’s parental buffer. Preclore never touches the money."
            />
          ) : (
            <div className="rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Support Locked</div>
              <h2 className="mt-2 text-2xl font-black text-ink">Support this Researcher</h2>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                Parent UPI IDs stay protected until a mentor/admin access request is accepted by the researcher.
              </p>
              {user ? (
                user.id === project.researcher_id ? (
                  <div className="mt-4 text-sm font-semibold text-ink/75">
                    Add your parent UPI ID on the Profile page to enable direct support.
                  </div>
                ) : viewerAccess?.canRequestProtectedSupport ? (
                  <div className="mt-4">
                    <FollowRequestButton researcherId={project.researcher_id} />
                  </div>
                ) : (
                  <div className="mt-4 text-sm font-semibold text-ink/75">
                    Only mentor/admin accounts can request protected support access.
                  </div>
                )
              ) : (
                <div className="mt-4">
                  <TactileButton href={`/auth?next=/project/${project.slug}`} variant="primary">
                    Sign in to request access
                  </TactileButton>
                </div>
              )}
            </div>
          )
        ) : null}
      </aside>
    </div>
  );
}
