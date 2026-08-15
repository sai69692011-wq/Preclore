'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShimmerProgress from '@/components/ui/shimmer-progress';
import TactileButton from '@/components/ui/tactile-button';
import { PROJECT_SLOT_LIMIT, PROJECT_TAGS, QUEST_STEPS } from '@/lib/constants';

const STORAGE_KEY = 'preclore-v24-submit-quest-draft';

const initialForm = {
  title: '',
  regionLabel: '',
  summary: '',
  problemStatement: '',
  hypothesis: '',
  methodology: '',
  evidenceUrls: '',
  citations: '',
  systemsImpact: '',
  publicGoodCase: '',
  reproducibilityNote: '',
  projectTag: 'Academic Theory',
  confirmPublicGood: false
};

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseEvidenceUrls(value) {
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SubmitQuest({ isAuthenticated, activeProjectCount = 0 }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const progress = useMemo(() => ((stepIndex + 1) / QUEST_STEPS.length) * 100, [stepIndex]);
  const slotsLeft = Math.max(PROJECT_SLOT_LIMIT - activeProjectCount, 0);
  const slotsFull = isAuthenticated && slotsLeft === 0;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setForm((current) => ({ ...current, ...parsed }));
        }
      }
    } catch {
      // Ignore corrupted local draft state.
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage write errors.
    }
  }, [draftLoaded, form]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateCurrentStep() {
    const requiredByStep = [
      ['title', 'regionLabel'],
      ['summary'],
      ['problemStatement'],
      ['hypothesis'],
      ['methodology'],
      [],
      ['systemsImpact', 'publicGoodCase', 'projectTag'],
      ['confirmPublicGood']
    ];

    const requiredFields = requiredByStep[stepIndex];
    const invalid = requiredFields.find((field) => {
      if (field === 'confirmPublicGood') return !form.confirmPublicGood;
      return !String(form[field] || '').trim();
    });

    if (invalid) {
      setError('Please finish this step before moving on.');
      return false;
    }

    if (stepIndex === 0) {
      if (String(form.title).trim().length < 8) {
        setError('Project title should be at least 8 characters.');
        return false;
      }
      if (String(form.regionLabel).trim().length < 2) {
        setError('Add a valid city or region.');
        return false;
      }
    }

    if (stepIndex === 5 || stepIndex === 7) {
      const evidenceUrls = parseEvidenceUrls(form.evidenceUrls);
      const invalidUrl = evidenceUrls.find((url) => !isHttpUrl(url));
      if (invalidUrl) {
        setError(`Invalid link: ${invalidUrl}`);
        return false;
      }
      if (form.projectTag === 'Field Verified' && evidenceUrls.length === 0) {
        setError('Field Verified projects need at least one public link.');
        return false;
      }
    }

    if (stepIndex === 7 && String(form.publicGoodCase || '').trim().length < 20) {
      setError('Explain in at least 20 characters why this helps others.');
      return false;
    }

    setError('');
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStepIndex((current) => Math.min(current + 1, QUEST_STEPS.length - 1));
  }

  function prevStep() {
    setError('');
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (slotsFull) {
      setError(`You already used all ${PROJECT_SLOT_LIMIT} live project slots. Archive one from your profile first.`);
      return;
    }

    if (!validateCurrentStep()) return;

    setSubmitting(true);
    setError('');

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error || 'Unable to publish project.');
      return;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }

    router.push(`/reveal/${result.project.id}`);
  }

  const step = QUEST_STEPS[stepIndex];

  const panels = {
    identity: (
      <div className="grid gap-4 md:grid-cols-2">
        <input className="field" placeholder="Project title" value={form.title} onChange={(e) => update('title', e.target.value)} />
        <input className="field" placeholder="City / Region" value={form.regionLabel} onChange={(e) => update('regionLabel', e.target.value)} />
      </div>
    ),
    summary: (
      <textarea className="field min-h-36" placeholder="What is this project about?" value={form.summary} onChange={(e) => update('summary', e.target.value)} />
    ),
    problem: (
      <textarea className="field min-h-36" placeholder="What exact problem are you trying to solve?" value={form.problemStatement} onChange={(e) => update('problemStatement', e.target.value)} />
    ),
    hypothesis: (
      <textarea className="field min-h-36" placeholder="What is your main idea or expected result?" value={form.hypothesis} onChange={(e) => update('hypothesis', e.target.value)} />
    ),
    method: (
      <textarea className="field min-h-36" placeholder="How did you build, test, or study this?" value={form.methodology} onChange={(e) => update('methodology', e.target.value)} />
    ),
    evidence: (
      <div className="space-y-4">
        <textarea className="field min-h-24" placeholder="Public links (Google Drive, Docs, PDF, video) — one per line or comma separated" value={form.evidenceUrls} onChange={(e) => update('evidenceUrls', e.target.value)} />
        <textarea className="field min-h-24" placeholder="Sources or citations (optional)" value={form.citations} onChange={(e) => update('citations', e.target.value)} />
        <textarea className="field min-h-24" placeholder="How can someone repeat this project? (optional)" value={form.reproducibilityNote} onChange={(e) => update('reproducibilityNote', e.target.value)} />
      </div>
    ),
    impact: (
      <div className="space-y-4">
        <textarea className="field min-h-28" placeholder="Who can this help and how?" value={form.systemsImpact} onChange={(e) => update('systemsImpact', e.target.value)} />
        <textarea className="field min-h-28" placeholder="Why should this be public on Preclore?" value={form.publicGoodCase} onChange={(e) => update('publicGoodCase', e.target.value)} />
        <div>
          <div className="mb-2 text-sm font-black text-ink">Project type</div>
          <div className="grid gap-3 md:grid-cols-2">
            {PROJECT_TAGS.map((tag) => (
              <label key={tag} className={`rounded-2xl border-2 p-4 text-sm font-semibold transition ${form.projectTag === tag ? 'border-ink bg-mint' : 'border-ink/30 bg-white/70'}`}>
                <input
                  checked={form.projectTag === tag}
                  className="mr-2"
                  name="projectTag"
                  onChange={() => update('projectTag', tag)}
                  type="radio"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      </div>
    ),
    publish: (
      <div className="space-y-5">
        <div className="rounded-[24px] border-2 border-ink bg-paper p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-forest">Before you publish</div>
          <p className="mt-3 text-sm leading-6 text-ink/80">
            Your project will be shown publicly on Preclore. Use public links only. Do not add private files or personal details.
          </p>
        </div>
        <label className="flex items-start gap-3 rounded-2xl border-2 border-ink/30 bg-white/70 p-4 text-sm text-ink/80">
          <input checked={form.confirmPublicGood} onChange={(e) => update('confirmPublicGood', e.target.checked)} type="checkbox" />
          <span>I confirm that this project can be shown publicly on Preclore.</span>
        </label>
      </div>
    )
  };

  if (slotsFull) {
    return (
      <div className="space-y-5 rounded-[34px] border-2 border-ink bg-white/70 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
        <div className="rounded-[24px] border-2 border-ink bg-peach p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-forest">Project limit reached</div>
          <h2 className="mt-3 text-3xl font-black text-ink">You already used all {PROJECT_SLOT_LIMIT} live project slots</h2>
          <p className="mt-3 text-sm leading-6 text-ink/80">
            Archive one old project from your profile, then come back here to add a new one.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TactileButton href="/profile" variant="primary">Open My Profile</TactileButton>
          <TactileButton href="/journal" variant="secondary">View Projects</TactileButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-[34px] border-2 border-ink bg-white/70 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Add Project</div>
            <h2 className="text-3xl font-black text-ink">Step {stepIndex + 1}: {step.label}</h2>
          </div>
          <div className="rounded-full border-2 border-ink bg-butter px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-ink">
            {activeProjectCount} / {PROJECT_SLOT_LIMIT} slots used
          </div>
        </div>
        <ShimmerProgress value={progress} label={`Form progress ${Math.round(progress)}%`} />
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
          {draftLoaded ? 'Draft autosave active' : 'Loading draft...'}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-[24px] border-2 border-ink bg-peach p-5 text-sm font-semibold text-ink">
          Login first so this project is linked to your profile.
        </div>
      ) : (
        <div className="rounded-[24px] border-2 border-ink/30 bg-paper p-4 text-sm text-ink/80">
          You have <strong>{slotsLeft}</strong> free slot{slotsLeft === 1 ? '' : 's'} left.
        </div>
      )}

      <div className="space-y-5">
        {panels[step.id]}
        {error ? <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">{error}</div> : null}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <TactileButton onClick={prevStep} variant="ghost" disabled={stepIndex === 0}>Back</TactileButton>
        <div className="flex gap-3">
          {stepIndex < QUEST_STEPS.length - 1 ? (
            <TactileButton onClick={nextStep} variant="primary">Next Step</TactileButton>
          ) : (
            <TactileButton onClick={handleSubmit} variant="primary" disabled={!isAuthenticated || submitting}>
              {submitting ? 'Publishing...' : 'Publish Project'}
            </TactileButton>
          )}
        </div>
      </div>
    </div>
  );
}
