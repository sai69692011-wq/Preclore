'use client';

import { useMemo, useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';
import { deriveAccessProfile } from '@/lib/access';
import { PROJECT_SLOT_LIMIT } from '@/lib/constants';
import { isValidUpiId, normalizeText } from '@/lib/utils';

const ROLE_LABELS = {
  student: 'Student',
  mentor: 'Teacher / Reviewer / NGO',
  admin: 'Admin',
  alumni_readonly: 'Read-only'
};

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    const aTime = a?.published_at ? new Date(a.published_at).getTime() : 0;
    const bTime = b?.published_at ? new Date(b.published_at).getTime() : 0;
    return bTime - aTime;
  });
}

export default function ProfileForm({ initialProfile, initialProjects = [] }) {
  const [profile, setProfile] = useState({
    display_name: initialProfile?.display_name || '',
    username: initialProfile?.username || '',
    school_name: initialProfile?.school_name || '',
    grade_level: initialProfile?.grade_level || '',
    bio: initialProfile?.bio || '',
    parent_upi_id: initialProfile?.parent_upi_id || '',
    birth_year: initialProfile?.birth_year ? String(initialProfile.birth_year) : '',
    role: initialProfile?.role || 'student'
  });
  const [projects, setProjects] = useState(sortProjects(initialProjects));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState('');

  const access = useMemo(
    () => deriveAccessProfile({ role: profile.role, birth_year: profile.birth_year ? Number(profile.birth_year) : null }),
    [profile.role, profile.birth_year]
  );

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === 'published'),
    [projects]
  );

  const archivedProjects = useMemo(
    () => projects.filter((project) => project.status === 'archived'),
    [projects]
  );

  const slotsLeft = Math.max(PROJECT_SLOT_LIMIT - activeProjects.length, 0);

  const clientError = useMemo(() => {
    const birthYear = profile.birth_year ? Number(profile.birth_year) : null;
    const currentYear = new Date().getFullYear();

    if (profile.birth_year && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear)) {
      return 'Birth year must be a valid year.';
    }

    if (normalizeText(profile.parent_upi_id) && !isValidUpiId(profile.parent_upi_id)) {
      return 'Parent UPI ID must look like parentname@bank.';
    }

    if (profile.display_name && normalizeText(profile.display_name).length < 2) {
      return 'Display name must be at least 2 characters.';
    }

    return '';
  }, [profile.birth_year, profile.display_name, profile.parent_upi_id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (clientError) {
      setMessage(clientError);
      return;
    }

    setSaving(true);
    setMessage('');

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    const result = await response.json();
    setSaving(false);
    setMessage(result.error || result.message || 'Saved.');
  }

  async function handleProjectAction(projectId, action) {
    setBusyProjectId(projectId);
    setMessage('');

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    const result = await response.json();
    setBusyProjectId('');

    if (!response.ok) {
      setMessage(result.error || 'Could not update project.');
      return;
    }

    setProjects((current) =>
      sortProjects(
        current.map((project) => (project.id === projectId ? { ...project, ...result.project } : project))
      )
    );
    setMessage(result.message || 'Project updated.');
  }

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4 rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]" onSubmit={handleSubmit}>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">My Profile</div>
          <h2 className="mt-2 text-2xl font-black text-ink">Set your public details</h2>
          <p className="mt-2 text-sm text-ink/75">
            Add the basic details people should see before they view your work.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-ink/30 bg-paper p-4 text-sm text-ink/80">
          <div className="font-black text-ink">Account type</div>
          <p className="mt-1">
            <strong>{ROLE_LABELS[profile.role] || 'Student'}</strong>
            {access.age !== null ? (
              <>
                {' '}
                • Age: <strong>{access.age}</strong>
              </>
            ) : null}{' '}
            • Access:{' '}
            <strong>
              {access.canSubmit
                ? 'Can add projects'
                : access.canRequestProtectedSupport
                  ? 'Can review and request contact'
                  : 'Read-only'}
            </strong>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Your name" value={profile.display_name} onChange={(e) => update('display_name', e.target.value)} />
          <input className="field" placeholder="Username" value={profile.username} onChange={(e) => update('username', e.target.value)} />
          <input className="field" placeholder="School / Organization" value={profile.school_name} onChange={(e) => update('school_name', e.target.value)} />
          <input className="field" placeholder="Class / Role" value={profile.grade_level} onChange={(e) => update('grade_level', e.target.value)} />
          <input className="field" placeholder="Birth year" value={profile.birth_year} onChange={(e) => update('birth_year', e.target.value)} inputMode="numeric" />
          <input className="field" placeholder="Account type" value={ROLE_LABELS[profile.role] || 'Student'} disabled readOnly />
        </div>

        <textarea className="field min-h-28" placeholder="Short bio" value={profile.bio} onChange={(e) => update('bio', e.target.value)} />

        <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-4">
          <div className="text-sm font-black text-ink">Parent UPI ID</div>
          <p className="mt-1 text-sm text-ink/75">
            Keep this private here. It is only shown after an approved mentor or reviewer request.
          </p>
          <input className="field mt-3" placeholder="parentname@upi" value={profile.parent_upi_id} onChange={(e) => update('parent_upi_id', e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <TactileButton type="submit" disabled={saving || Boolean(clientError)} variant="primary">
            {saving ? 'Saving...' : 'Save Profile'}
          </TactileButton>
          {message ? <span className="text-sm text-ink/75">{message}</span> : null}
        </div>
      </form>

      {access.canSubmit ? (
        <section className="space-y-4 rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Project Slots</div>
              <h2 className="mt-2 text-2xl font-black text-ink">
                {activeProjects.length} of {PROJECT_SLOT_LIMIT} live projects used
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/80">
                Keep up to {PROJECT_SLOT_LIMIT} projects live at a time. Archive one old project if you want to add a new one.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-ink bg-butter px-4 py-3 text-sm font-black text-ink">
              {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left` : 'No free slots'}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <TactileButton href="/submit" variant="primary" aria-disabled={slotsLeft === 0} className={slotsLeft === 0 ? 'pointer-events-none opacity-60' : ''}>
              Add Project
            </TactileButton>
            {slotsLeft === 0 ? (
              <div className="rounded-2xl border-2 border-ink bg-peach px-4 py-3 text-sm font-semibold text-ink">
                Archive one live project first.
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-ink">Live Projects</h3>
              {activeProjects.length ? (
                <div className="mt-3 grid gap-4">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="rounded-[24px] border-2 border-ink/20 bg-paper p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="rounded-full border border-ink/20 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-forest">
                            {project.project_tag}
                          </div>
                          <h4 className="mt-3 text-xl font-black text-ink">{project.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-ink/80">{project.summary}</p>
                        </div>
                        <div className="rounded-full border-2 border-ink bg-mint px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-ink">
                          Live
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <TactileButton href={`/project/${project.slug}`} variant="secondary">Open</TactileButton>
                        <TactileButton
                          type="button"
                          variant="ghost"
                          disabled={busyProjectId === project.id}
                          onClick={() => handleProjectAction(project.id, 'archive')}
                        >
                          {busyProjectId === project.id ? 'Saving...' : 'Archive'}
                        </TactileButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[24px] border-2 border-dashed border-ink/30 bg-white/70 p-5 text-sm text-ink/75">
                  No live projects yet.
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-ink">Archived Projects</h3>
              {archivedProjects.length ? (
                <div className="mt-3 grid gap-4">
                  {archivedProjects.map((project) => (
                    <div key={project.id} className="rounded-[24px] border-2 border-ink/20 bg-white/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-forest">
                            {project.project_tag}
                          </div>
                          <h4 className="mt-3 text-xl font-black text-ink">{project.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-ink/80">{project.summary}</p>
                        </div>
                        <div className="rounded-full border-2 border-ink bg-lilac px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-ink">
                          Archived
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <TactileButton
                          type="button"
                          variant="secondary"
                          disabled={busyProjectId === project.id || slotsLeft === 0}
                          onClick={() => handleProjectAction(project.id, 'restore')}
                        >
                          {busyProjectId === project.id ? 'Saving...' : 'Restore'}
                        </TactileButton>
                        {slotsLeft === 0 ? (
                          <div className="rounded-2xl border-2 border-ink bg-peach px-4 py-3 text-sm font-semibold text-ink">
                            No free slot to restore this project.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[24px] border-2 border-dashed border-ink/30 bg-white/70 p-5 text-sm text-ink/75">
                  No archived projects.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Reviewer Access</div>
          <h2 className="mt-2 text-2xl font-black text-ink">Project posting is student-only</h2>
          <p className="mt-3 text-sm leading-7 text-ink/80">
            Teacher, reviewer, NGO, and other read-only accounts can browse projects, request contact,
            and support good work. They do not get project slots or posting tools.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <TactileButton href="/journal" variant="primary">Browse Projects</TactileButton>
            <TactileButton href="/connections" variant="secondary">Open Requests</TactileButton>
          </div>
        </section>
      )}
    </div>
  );
}
