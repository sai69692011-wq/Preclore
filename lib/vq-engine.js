import { PROJECT_TAG_COMPAT, SYSTEMS_KEYWORDS, TIERS } from './constants.js';
import { clamp, splitEvidence, words } from './utils.js';

function normalizeForm(input = {}) {
  return input && typeof input === 'object' && !Array.isArray(input) ? input : {};
}

function presenceScore(fields, pointsEach) {
  return fields.reduce((sum, field) => sum + (String(field || '').trim() ? pointsEach : 0), 0);
}

function lengthScore(text, softMin, softMax, cap) {
  const count = words(text);
  if (!count) return 0;
  if (count <= softMin) return Math.round((count / softMin) * cap * 0.8);
  if (count >= softMax) return cap;
  const ratio = (count - softMin) / (softMax - softMin);
  return Math.round(cap * (0.8 + ratio * 0.2));
}

function keywordScore(text, keywords, cap) {
  const haystack = String(text || '').toLowerCase();
  const hits = keywords.filter((keyword) => haystack.includes(keyword)).length;
  return clamp(hits * 2, 0, cap);
}

function evidenceScore({ projectTag, evidenceUrls, citations, reproducibilityNote }) {
  const urls = splitEvidence(evidenceUrls);
  const hasFieldEvidence = urls.length > 0;
  const fieldVerifiedBonus = projectTag === 'Field Verified' && hasFieldEvidence ? 6 : 0;
  const citationsPoints = lengthScore(citations, 10, 35, 6);
  const reproducibilityPoints = lengthScore(reproducibilityNote, 12, 40, 6);
  return clamp(Math.min(urls.length, 4) * 2 + fieldVerifiedBonus + citationsPoints + reproducibilityPoints, 0, 20);
}

export function tierFromScore(score) {
  return TIERS.find((tier) => score >= tier.min && score <= tier.max) || TIERS[0];
}

export function scoreProject(input = {}) {
  const form = normalizeForm(input);
  const projectTag = PROJECT_TAG_COMPAT.includes(form.projectTag)
    ? form.projectTag
    : 'Academic Theory';

  const foundation = presenceScore(
    [form.title, form.summary, form.problemStatement, form.hypothesis, form.methodology],
    4
  );

  const clarity = clamp(
    lengthScore(form.summary, 25, 80, 7) +
      lengthScore(form.problemStatement, 30, 90, 7) +
      lengthScore(form.hypothesis, 18, 60, 6),
    0,
    20
  );

  const evidence = evidenceScore(form);

  const systems = clamp(
    lengthScore(form.systemsImpact, 20, 80, 10) +
      keywordScore(`${form.systemsImpact || ''} ${form.publicGoodCase || ''}`, SYSTEMS_KEYWORDS, 10),
    0,
    20
  );

  const publicGood = clamp(
    lengthScore(form.publicGoodCase, 20, 75, 10) + (projectTag === 'Field Verified' ? 2 : 0),
    0,
    20
  );

  const baseTotal = clamp(foundation + clarity + evidence + systems + publicGood, 0, 100);
  const academicMultiplier = projectTag === 'Academic Theory' ? 1.1 : 1;
  const aiPenalty = form.aiRiskFlag === true ? 0.5 : 1;
  const total = clamp(Math.round(baseTotal * academicMultiplier * aiPenalty), 0, 100);
  const tier = tierFromScore(total);

  return {
    total,
    tier: tier.name,
    publishable: true,
    breakdown: {
      foundation,
      clarity,
      evidence,
      systems,
      publicGood
    },
    modifiers: {
      academicMultiplier,
      aiPenalty
    }
  };
}
