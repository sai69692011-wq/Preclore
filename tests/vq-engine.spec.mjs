import assert from 'node:assert/strict';
import { scoreProject, tierFromScore } from '../lib/vq-engine.js';

const sample = {
  title: 'Ward-level water leakage registry',
  regionLabel: 'Bengaluru',
  summary: 'Students documented repeated water leakage across a residential block and noted frequency, response delays, and public inconvenience through repeated observations.',
  problemStatement: 'Leakage persists because complaints, repairs, and accountability loops are not stitched into a visible system for local actors.',
  hypothesis: 'If we create a lightweight public registry with evidence and timing patterns, maintenance incentives and responsiveness improve.',
  methodology: 'Mapped locations, captured timestamped photos and videos, logged municipal complaint cycles, and compared visible repair completion patterns.',
  evidenceUrls: 'https://example.com/video1, https://example.com/gps1',
  citations: 'Ward office note, state water board handbook, local observation logs.',
  reproducibilityNote: 'Any school team can repeat this by logging coordinates, timestamps, and complaint numbers over two weeks.',
  systemsImpact: 'This creates a feedback loop between residents, maintenance teams, and ward-level governance with public visibility.',
  publicGoodCase: 'Water reliability, time savings, and reduced waste directly improve a shared public system.',
  projectTag: 'Field Verified'
};

const first = scoreProject(sample);
const second = scoreProject(sample);

assert.deepEqual(first, second, 'VQ engine must be deterministic for the same input');
assert.equal(first.publishable, true, 'Projects should publish instantly');
assert.ok(first.total >= 0 && first.total <= 100, 'Score should remain in 0-100 range');
assert.equal(tierFromScore(85).name, 'Platinum');
assert.equal(tierFromScore(70).name, 'Gold');
assert.equal(tierFromScore(45).name, 'Silver');
assert.equal(tierFromScore(10).name, 'Bronze');

const lowSignal = scoreProject({
  title: 'Idea',
  summary: 'Short',
  problemStatement: 'Short',
  hypothesis: 'Short',
  methodology: 'Short',
  systemsImpact: '',
  publicGoodCase: '',
  evidenceUrls: '',
  citations: '',
  reproducibilityNote: '',
  projectTag: 'Idea Only'
});
assert.ok(lowSignal.total < first.total, 'Richer submissions should outscore thin ones');

const nullSafe = scoreProject(undefined);
const nullSafeTwo = scoreProject(null);
assert.equal(typeof nullSafe.total, 'number');
assert.equal(typeof nullSafeTwo.total, 'number');
assert.equal(Number.isNaN(nullSafe.total), false, 'Undefined input must not produce NaN');
assert.equal(Number.isNaN(nullSafeTwo.total), false, 'Null input must not produce NaN');

const baseline = scoreProject({ ...sample, projectTag: 'Project: Needs Funding' });
const academic = scoreProject({ ...sample, projectTag: 'Academic Theory' });
assert.equal(
  academic.total,
  Math.min(100, Math.round(baseline.total * 1.1)),
  'Academic Theory should apply a 1.1x multiplier over the same baseline signal'
);
assert.equal(academic.modifiers.academicMultiplier, 1.1);

const penalized = scoreProject({ ...sample, projectTag: 'Project: Needs Funding', aiRiskFlag: true });
assert.equal(
  penalized.total,
  Math.round(baseline.total * 0.5),
  'AI risk flag should apply a 0.5x penalty'
);
assert.equal(penalized.modifiers.aiPenalty, 0.5);

console.log('VQ engine review passed:', first);
