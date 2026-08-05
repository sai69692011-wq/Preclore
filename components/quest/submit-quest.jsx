'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShimmerProgress from '@/components/ui/shimmer-progress';
import TactileButton from '@/components/ui/tactile-button';
import { PROJECT_TAGS, QUEST_STEPS } from '@/lib/constants';

const STORAGE_KEY = 'preclore-v24-submit-quest-draft';

const initialForm = {
  title: '',
  regionLabel: '',
  summary: '',
  projectDocumentUrl: '',
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

export default function SubmitQuest({ isAuthenticated }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const progress = useMemo(() => ((stepIndex + 1) / QUEST_STEPS.length) * 100, [stepIndex]);

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
    if (stepIndex === 0) {
      if (String(form.title).trim().length < 8) {
        setError('Please enter a project title with at least 8 characters.');
        return false;
      }

      if (!String(form.projectTag).trim()) {
        setError('Please choose a project type.');
        return false;
      }
    }

    if (stepIndex === 1) {
      if (String(form.summary).trim().length < 40) {
        setError('Please add a short description of at least 40 characters.');
        return false;
      }
    }

    if (stepIndex === 2 && String(form.projectDocumentUrl || '').trim()) {
      if (!isHttpUrl(form.projectDocumentUrl)) {
        setError('Please enter a valid public file/link URL.');
        return false;
      }
    }

    if (stepIndex === 3) {
      const evidenceUrls = parseEvidenceUrls(form.evidenceUrls);
      const invalidUrl = evidenceUrls.find((url) => !isHttpUrl(url));
      if (invalidUrl) {
        setError(`This evidence link is not valid: ${invalidUrl}`);
        return false;
      }
    }

    if (stepIndex === 5 && form.confirmPublicGood !== true) {
      setError('Please confirm before publishing.');
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
      <div className="space-y-4">
        <input
          className="field"
          placeholder="Project title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />

        <input
          className="field"
          placeholder="City / Region (optional)"
          value={form.regionLabel}
          onChange={(e) => update('regionLabel', e.target.value)}
        />

        <div>
          <div className="mb-2 text-sm font-black text-ink">Project type</div>
          <div className="grid gap-3 md:grid-cols-2">
            {PROJECT_TAGS.map((tag) => (
              <label
                key={tag}
                className={`rounded-2xl border-2 p-4 text-sm font-semibold transition ${
                  form.projectTag === tag ? 'border-ink bg-mint' : 'border-ink/30 bg-white/70'
                }`}
              >
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

    summary: (
      <textarea
        className="field min-h-40"
        placeholder="Write a short description of your project. What is it about, what did you study, or what did you observe?"
        value={form.summary}
        onChange={(e) => update('summary', e.target.value)}
      />
    ),

    document: (
      <div className="space-y-4">
        <div className="rounded-[24px] border-2 border-ink bg-paper p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-forest">Project file or link (optional)</div>
          <p className="mt-3 text-sm leading-6 text-ink/80">
            You can add a Google Drive, Google Docs, Dropbox, OneDrive, or public PDF link here.
            Make sure anyone with the link can view it.
          </p>
        </div>

        <input
          className="field"
          placeholder="Paste your Google Drive / Docs / Dropbox / OneDrive / PDF link"
          value={form.projectDocumentUrl}
          onChange={(e) => update('projectDocumentUrl', e.target.value)}
        />
      </div>
    ),

    evidence: (
      <div className="space-y-4">
        <div className="rounded-[24px] border-2 border-ink bg-paper p-5 text-sm leading-6 text-ink/80">
          This section is optional. Add links, references, or proof only if you want to strengthen your project.
        </div>

        <textarea
          className="field min-h-24"
          placeholder="Evidence links (optional) — one per line or comma separated"
          value={form.evidenceUrls}
          onChange={(e) => update('evidenceUrls', e.target.value)}
        />

        <textarea
          className="field min-h-24"
          placeholder="References or citations (optional)"
          value={form.citations}
          onChange={(e) => update('citations', e.target.value)}
        />

        <textarea
          className="field min-h-24"
          placeholder="How someone else could repeat this work (optional)"
          value={form.reproducibilityNote}
          onChange={(e) => update('reproducibilityNote', e.target.value)}
        />
      </div>
    ),

    impact: (
      <div className="space-y-4">
        <div className="rounded-[24px] border-2 border-ink bg-paper p-5 text-sm leading-6 text-ink/80">
          This section is optional. Add it if you want to explain why the project matters more deeply.
        </div>

        <textarea
          className="field min-h-28"
          placeholder="What bigger issue or system does this project connect to? (optional)"
          value={form.systemsImpact}
          onChange={(e) => update('systemsImpact', e.target.value)}
        />

        <textarea
          className="field min-h-28"
          placeholder="Why is this useful for the public good? (optional)"
          value={form.publicGoodCase}
          onChange={(e) => update('publicGoodCase', e.target.value)}
        />
      </div>
    ),

    publish: (
      <div className="space-y-5">
        <div className="rounded-[24px] border-2 border-ink bg-paper p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-forest">Ready to publish</div>
          <p className="mt-3 text-sm leading-6 text-ink/80">
            Your title, description, and project type are enough to publish. Optional links and proof can improve trust and VQ score.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border-2 border-ink/30 bg-white/70 p-4 text-sm text-ink/80">
          <input
            checked={form.confirmPublicGood}
            onChange={(e) => update('confirmPublicGood', e.target.checked)}
            type="checkbox"
          />
          <span>I confirm this is a public-good registry submission and can be published instantly.</span>
        </label>
      </div>
    )
  };

  return (
    <div className="space-y-6 rounded-[34px] border-2 border-ink bg-white/70 p-6 shadow-[0_8px_0_0_rgba(44,43,42,1)] lg:p-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">6-Step Project Form</div>
            <h2 className="text-3xl font-black text-ink">
              Step {stepIndex + 1}: {step.label}
            </h2>
          </div>

          <div className="rounded-full border-2 border-ink bg-butter px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-ink">
            Instant publish
          </div>
        </div>

        <ShimmerProgress value={progress} label={`Progress ${Math.round(progress)}%`} />

        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
          {draftLoaded ? 'Draft autosave active' : 'Loading draft...'}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-[24px] border-2 border-ink bg-peach p-5 text-sm font-semibold text-ink">
          Please sign in first so your submission can be linked to your profile.
        </div>
      ) : null}

      <div className="space-y-5">
        {panels[step.id]}
        {error ? (
          <div className="rounded-2xl border-2 border-ink bg-peach p-3 text-sm font-semibold text-ink">
            {error}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <TactileButton onClick={prevStep} variant="ghost" disabled={stepIndex === 0}>
          Back
        </TactileButton>

        {stepIndex < QUEST_STEPS.length - 1 ? (
          <TactileButton onClick={nextStep} variant="primary">
            Next Step
          </TactileButton>
        ) : (
          <TactileButton onClick={handleSubmit} variant="primary" disabled={!isAuthenticated || submitting}>
            {submitting ? 'Publishing...' : 'Publish Project'}
          </TactileButton>
        )}
      </div>
    </div>
  );
}
