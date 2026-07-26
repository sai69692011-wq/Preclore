export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(value) {
  return String(value || '').trim();
}

export function slugify(input) {
  return normalizeText(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72);
}

export function words(input) {
  return normalizeText(input)
    .split(/\s+/)
    .filter(Boolean).length;
}

export function splitEvidence(value) {
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeUpiId(upiId) {
  return normalizeText(upiId);
}

export function isValidUpiId(upiId) {
  const normalized = normalizeUpiId(upiId);
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(normalized);
}

export function buildUpiLink({ upiId, payeeName, note, amount }) {
  const normalizedUpiId = normalizeUpiId(upiId);
  if (!isValidUpiId(normalizedUpiId)) {
    return '';
  }

  const params = new URLSearchParams({
    pa: normalizedUpiId,
    pn: normalizeText(payeeName) || 'Preclore Research Support',
    tn: normalizeText(note) || 'Public good research support'
  });

  if (amount) {
    params.set('am', String(amount));
  }

  params.set('cu', 'INR');
  return `upi://pay?${params.toString()}`;
}
