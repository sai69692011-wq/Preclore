'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TierBadge from '@/components/ui/tier-badge';
import { PROJECT_TAGS } from '@/lib/constants';

function InitialAvatar({ name }) {
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-butter text-sm font-black text-ink">
      {initial}
    </div>
  );
}

function verificationLabel(role, status) {
  if (status !== 'verified') return null;
  if (role === 'student') return 'Verified Student';
  if (role === 'mentor') return 'Verified Mentor';
  return 'Verified Reviewer';
}

export default function JournalBrowser({ projects }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchTag =
        tag === 'All' ||
        project.project_tag === tag ||
        (tag === 'Project: Needs Funding' && project.project_tag === 'Needs Funding');

      const matchText = [
        project.title,
        project.summary,
        project.researcher_name,
        project.region_label,
        project.researcher_institution_name
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchTag && matchText;
    });
  }, [projects, query, tag]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border-2 border-ink bg-white/80 p-5 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <input
            className="rounded-2xl border-2 border-ink bg-paper px-4 py-3 text-sm outline-none"
            placeholder="Search title, researcher, summary, region..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="rounded-2xl border-2 border-ink bg-paper px-4 py-3 text-sm outline-none"
            value={tag}
            onChange={(event) => setTag(event.target.value)}
          >
            <option>All</option>
            {PROJECT_TAGS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.length ? (
          filtered.map((project) => {
            const badge = verificationLabel(
              project.researcher_role,
              project.researcher_verification_status
            );

            return (
              <Link
                href={`/project/${project.slug}`}
                key={project.id}
                className="cream-paper block rounded-[30px] border-2 border-ink p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)] transition-transform hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-full border border-ink/20 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-forest">
                    {project.project_tag}
                  </div>

                  <div className="flex items-center gap-2">
                    {project.pdf_url ? (
                      <span className="rounded-full border border-ink/20 bg-lilac px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-ink">
                        DOC LINK
                      </span>
                    ) : null}
                    <TierBadge tier={project.tier} className="scale-90" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {project.researcher_avatar_url ? (
                    <img
                      src={project.researcher_avatar_url}
                      alt={project.researcher_name}
                      className="h-12 w-12 rounded-full border-2 border-ink object-cover"
                    />
                  ) : (
                    <InitialAvatar name={project.researcher_name} />
                  )}

                  <div>
                    <h3 className="text-2xl font-black text-ink">{project.title}</h3>
                    <div className="mt-1 text-xs font-semibold text-ink/70">
                      {project.researcher_name}
                      {project.region_label ? ` • ${project.region_label}` : ''}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink/65">
                      {project.researcher_institution_name ? (
                        <span>{project.researcher_institution_name}</span>
                      ) : null}
                      {badge ? (
                        <span className="rounded-full border border-ink bg-mint px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-ink">
                          {badge}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-ink/80">{project.summary}</p>

                <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-ink/70">
                  <span>VQ {project.vq_score}</span>
                  {project.pdf_url ? (
                    <>
                      <span>•</span>
                      <span>Open project document on project page</span>
                    </>
                  ) : null}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-[24px] border-2 border-dashed border-ink/40 bg-white/70 p-8 text-sm text-ink/75">
            No projects match your filters yet.
          </div>
        )}
      </div>
    </div>
  );
}
