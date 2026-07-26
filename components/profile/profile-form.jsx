'use client';

import { useMemo, useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';
import { deriveAccessProfile } from '@/lib/access';
import { isValidUpiId, normalizeText } from '@/lib/utils';

export default function ProfileForm({ initialProfile }) {
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
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const access = useMemo(
    () => deriveAccessProfile({ role: profile.role, birth_year: profile.birth_year ? Number(profile.birth_year) : null }),
    [profile.role, profile.birth_year]
  );

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

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="space-y-4 rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]" onSubmit={handleSubmit}>
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Researcher Profile</div>
        <h2 className="mt-2 text-2xl font-black text-ink">Set your public card + parental buffer</h2>
        <p className="mt-2 text-sm text-ink/75">
          Public display names are required for publishing. Email-derived names are never exposed.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-ink/30 bg-paper p-4 text-sm text-ink/80">
        <div className="font-black text-ink">Account mode</div>
        <p className="mt-1">
          Role: <strong>{profile.role}</strong>
          {access.age !== null ? <> • Age: <strong>{access.age}</strong></> : null}
          {' '}• Access: <strong>{access.canSubmit ? 'Can submit quests' : access.canRequestProtectedSupport ? 'Mentor support access only' : 'Read-only portfolio mode'}</strong>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input className="field" placeholder="Display name" value={profile.display_name} onChange={(e) => update('display_name', e.target.value)} />
        <input className="field" placeholder="Username" value={profile.username} onChange={(e) => update('username', e.target.value)} />
        <input className="field" placeholder="School / Org" value={profile.school_name} onChange={(e) => update('school_name', e.target.value)} />
        <input className="field" placeholder="Grade / Role" value={profile.grade_level} onChange={(e) => update('grade_level', e.target.value)} />
        <input className="field" placeholder="Birth year (for age gate)" value={profile.birth_year} onChange={(e) => update('birth_year', e.target.value)} inputMode="numeric" />
        <input className="field" placeholder="System role" value={profile.role} disabled readOnly />
      </div>
      <textarea className="field min-h-28" placeholder="Bio" value={profile.bio} onChange={(e) => update('bio', e.target.value)} />
      <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-4">
        <div className="text-sm font-black text-ink">Parent UPI ID (private until an accepted mentor request)</div>
        <p className="mt-1 text-sm text-ink/75">Only you can read this directly. Protected researcher support is unlocked only for accepted mentor/admin access.</p>
        <input className="field mt-3" placeholder="parentname@upi" value={profile.parent_upi_id} onChange={(e) => update('parent_upi_id', e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <TactileButton type="submit" disabled={saving || Boolean(clientError)} variant="primary">{saving ? 'Saving...' : 'Save Profile'}</TactileButton>
        {message ? <span className="text-sm text-ink/75">{message}</span> : null}
      </div>
    </form>
  );
}
