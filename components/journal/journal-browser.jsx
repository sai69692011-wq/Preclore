'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TierBadge from '@/components/ui/tier-badge';
import { PROJECT_TAGS } from '@/lib/constants';

export default function JournalBrowser({ projects }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchTag = tag === 'All' || project.project_tag === tag || (tag === 'Project: Needs Funding' && project.project_tag === 'Needs Funding');
      const matchText = [
        project.title,
        project.summary,
        project.researcher_name,
        project.region_label
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
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.length ? filtered.map((project) => (
          <Link
            href={`/project/${project.slug}`}
            key={project.id}
            className="cream-paper block rounded-[30px] border-2 border-ink p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)] transition-transform hover:-translate-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-full border border-ink/20 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-forest">
                {project.project_tag}
              </div>
              <TierBadge tier={project.tier} className="scale-90" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-ink">{project.title}</h3>
            <p className="mt-3 text-sm leading-6 text-ink/80">{project.summary}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-ink/70">
              <span>{project.researcher_name}</span>
              <span>•</span>
              <span>{project.region_label}</span>
              <span>•</span>
              <span>VQ {project.vq_score}</span>
            </div>
          </Link>
        )) : <div className="rounded-[24px] border-2 border-dashed border-ink/40 bg-white/70 p-8 text-sm text-ink/75">No projects match your filters yet.</div>}
      </div>
    </div>
  );
}
