'use client';

import { useMemo, useState } from 'react';
import TactileButton from '@/components/ui/tactile-button';
import { deriveAccessProfile } from '@/lib/access';
import { isValidUpiId, normalizeText } from '@/lib/utils';

function verificationLabel(role, status) {
  if (status === 'verified') {
    if (role === 'student') return 'Verified Student';
    if (role === 'mentor') return 'Verified Mentor';
    return 'Verified Reviewer';
  }

  if (status === 'auto_checked') {
    if (role === 'student') return 'Auto-Checked Student';
    if (role === 'mentor') return 'Auto-Checked Mentor';
    return 'Auto-Checked Reviewer';
  }

  if (status === 'needs_review') return 'Needs Review';
  if (status === 'pending') return 'Pending';
  if (status === 'rejected') return 'Rejected';
  if (status === 'expired') return 'Expired';
  if (status === 'revoked') return 'Revoked';
  return 'Unverified';
}

function verificationTone(status) {
  if (status === 'verified') return 'bg-mint border-ink text-ink';
  if (status === 'auto_checked') return 'bg-sky border-ink text-ink';
  if (status === 'pending' || status === 'needs_review') return 'bg-butter border-ink text-ink';
  if (status === 'rejected' || status === 'revoked') return 'bg-peach border-ink text-ink';
  if (status === 'expired') return 'bg-lilac border-ink text-ink';
  return 'bg-white/70 border-ink/30 text-ink/70';
}

export default function ProfileForm({ initialProfile }) {
  const role = initialProfile?.role || 'student';

  const [profile, setProfile] = useState({
    display_name: initialProfile?.display_name || '',
    username: initialProfile?.username || '',
    school_name: initialProfile?.school_name || '',
    grade_level: initialProfile?.grade_level || '',
    bio: initialProfile?.bio || '',
    parent_upi_id: initialProfile?.parent_upi_id || '',
    birth_year: initialProfile?.birth_year ? String(initialProfile.birth_year) : '',
    institution_id_ref: initialProfile?.institution_id_ref || '',
    verification_status: initialProfile?.verification_status || 'unverified'
  });

  const [verificationFile, setVerificationFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const access = useMemo(
    () => deriveAccessProfile({ role, birth_year: profile.birth_year ? Number(profile.birth_year) : null }),
    [role, profile.birth_year]
  );

  const isStudent = role === 'student';
  const isMentor = role === 'mentor';
  const isReviewerLike = role === 'alumni_readonly' || role === 'admin';

  const clientError = useMemo(() => {
    const birthYear = profile.birth_year ? Number(profile.birth_year) : null;
    const currentYear = new Date().getFullYear();

    if (profile.display_name && normalizeText(profile.display_name).length < 2) {
      return 'Display name must be at least 2 characters.';
    }

    if (profile.birth_year && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear)) {
      return 'Birth year must be a valid year.';
    }

    if (isStudent && normalizeText(profile.parent_upi_id) && !isValidUpiId(profile.parent_upi_id)) {
      return 'Parent UPI ID must look like parentname@bank.';
    }

    return '';
  }, [profile.birth_year, profile.display_name, profile.parent_upi_id, isStudent]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (clientError) {
      setMessage(clientError);
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = new FormData();
    payload.append('display_name', profile.display_name);
    payload.append('username', profile.username);
    payload.append('school_name', profile.school_name);
    payload.append('grade_level', profile.grade_level);
    payload.append('bio', profile.bio);
    payload.append('birth_year', isStudent ? profile.birth_year : '');
    payload.append('parent_upi_id', isStudent ? profile.parent_upi_id : '');
    payload.append('institution_id_ref', profile.institution_id_ref);

    if (verificationFile) {
      payload.append('verification_doc', verificationFile);
    }

    const response = await fetch('/api/profile', {
      method: 'POST',
      body: payload
    });

    const result = await response.json();
    setSaving(false);

    if (result.verificationStatus) {
      setProfile((current) => ({
        ...current,
        verification_status: result.verificationStatus
      }));
    }

    setMessage(result.error || result.message || 'Saved.');
  }

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleVerificationFileChange(event) {
    const file = event.target.files?.[0] || null;
    setVerificationFile(file);
  }

  return (
    <form
      className="space-y-4 rounded-[30px] border-2 border-ink bg-white/80 p-6 shadow-[0_6px_0_0_rgba(44,43,42,1)]"
      onSubmit={handleSubmit}
    >
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Profile</div>
        <h2 className="mt-2 text-2xl font-black text-ink">Set your public details</h2>
        <p className="mt-2 text-sm text-ink/75">
          Your public name helps people recognize your work. Private support and ID details stay protected.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-ink/30 bg-paper p-4 text-sm text-ink/80">
        <div className="font-black text-ink">Account mode</div>
        <p className="mt-1">
          Role: <strong>{role}</strong>
          {access.age !== null ? <> • Age: <strong>{access.age}</strong></> : null}
          {' '}• Access:{' '}
          <strong>
            {access.canSubmit
              ? 'Can submit projects'
              : access.canRequestProtectedSupport
                ? 'Mentor support access only'
                : 'Read-only portfolio mode'}
          </strong>
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-4">
        <div className="text-sm font-black text-ink">Verification (optional)</div>
        <div
          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${verificationTone(
            profile.verification_status
          )}`}
        >
          {verificationLabel(role, profile.verification_status)}
        </div>

        <p className="mt-3 text-sm text-ink/75">
          {isStudent
            ? 'If you want a verification badge, enter your school or college name, your student ID or roll number, and upload a clear photo of your institution ID.'
            : isMentor
              ? 'If you want a verification badge, enter your institution name, your work or staff ID, and upload a clear institution ID.'
              : isReviewerLike
                ? 'If you want a verification badge, enter your institution or organization name, your ID reference, and upload a clear institution ID.'
                : 'If you want a verification badge, add your institution name, ID reference, and a clear institution ID image.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="field"
          placeholder="Display name"
          value={profile.display_name}
          onChange={(e) => update('display_name', e.target.value)}
        />
        <input
          className="field"
          placeholder="Username"
          value={profile.username}
          onChange={(e) => update('username', e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="field"
          placeholder={isStudent ? 'School / College name' : 'Institution / Organization'}
          value={profile.school_name}
          onChange={(e) => update('school_name', e.target.value)}
        />
        <input
          className="field"
          placeholder={isStudent ? 'Grade / Year' : 'Department / Role'}
          value={profile.grade_level}
          onChange={(e) => update('grade_level', e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="field"
          placeholder={isStudent ? 'Student ID / Roll Number (optional)' : 'Institution / Work ID (optional)'}
          value={profile.institution_id_ref}
          onChange={(e) => update('institution_id_ref', e.target.value)}
        />
        <input
          className="field"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={handleVerificationFileChange}
        />
      </div>

      {isStudent ? (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="field"
            placeholder="Birth year"
            value={profile.birth_year}
            onChange={(e) => update('birth_year', e.target.value)}
            inputMode="numeric"
          />
          <input
            className="field"
            placeholder="Parent UPI ID (optional)"
            value={profile.parent_upi_id}
            onChange={(e) => update('parent_upi_id', e.target.value)}
          />
        </div>
      ) : null}

      <textarea
        className="field min-h-28"
        placeholder="Bio / research focus"
        value={profile.bio}
        onChange={(e) => update('bio', e.target.value)}
      />

      <div className="flex items-center gap-3">
        <TactileButton type="submit" disabled={saving || Boolean(clientError)} variant="primary">
          {saving ? 'Saving...' : 'Save Profile'}
        </TactileButton>
        {message ? <span className="text-sm text-ink/75">{message}</span> : null}
      </div>
    </form>
  );
}
