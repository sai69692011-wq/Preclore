export function parseBirthYear(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
}

export function ageFromBirthYear(value, referenceYear = new Date().getFullYear()) {
  const birthYear = parseBirthYear(value);
  if (!birthYear) return null;
  if (birthYear < 1900 || birthYear > referenceYear) return null;
  return referenceYear - birthYear;
}

export function deriveAccessProfile(profile = {}, referenceYear = new Date().getFullYear()) {
  const role = ['student', 'mentor', 'admin', 'alumni_readonly'].includes(profile?.role)
    ? profile.role
    : 'student';
  const age = ageFromBirthYear(profile?.birth_year, referenceYear);

  if (role === 'mentor' || role === 'admin') {
    return {
      role,
      age,
      accountMode: role,
      isReadOnly: false,
      canSubmit: false,
      canRequestProtectedSupport: true,
      readOnlyReason: null
    };
  }

  const isReadOnly = role === 'alumni_readonly' || (age !== null && age > 20);

  return {
    role: isReadOnly ? 'alumni_readonly' : 'student',
    age,
    accountMode: isReadOnly ? 'alumni_readonly' : 'student',
    isReadOnly,
    canSubmit: !isReadOnly,
    canRequestProtectedSupport: false,
    readOnlyReason: isReadOnly ? 'Age gate: users above 20 are locked to read-only portfolio access.' : null
  };
}

export function isMentorRole(role) {
  return role === 'mentor' || role === 'admin';
}
