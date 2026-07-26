import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function mustContain(relativePath, needle) {
  const file = readFileSync(join(root, relativePath), 'utf8');
  assert.ok(file.includes(needle), `${relativePath} must contain: ${needle}`);
}

function mustNotContain(relativePath, needle) {
  const file = readFileSync(join(root, relativePath), 'utf8');
  assert.equal(file.includes(needle), false, `${relativePath} must not contain: ${needle}`);
}

function mustExist(relativePath) {
  assert.ok(existsSync(join(root, relativePath)), `Missing required file: ${relativePath}`);
}

mustContain('lib/constants.js', 'Project: Needs Funding');
mustContain('components/quest/submit-quest.jsx', '8-Step Quest');
mustContain('components/quest/submit-quest.jsx', 'localStorage');
mustContain('app/support/page.jsx', 'Support the Mission');
mustContain('lib/constants.js', "export const MISSION_UPI_ID = 'sadamaan-1@okaxis'");
mustContain('lib/constants.js', "export const MISSION_PAYEE_NAME = 'Preclore'");
mustContain('app/payment/page.tsx', 'Pay to: {UPI_ID} ({PAYEE_NAME})');
mustContain('src/components/payment-form.tsx', "export const UPI_ID = 'sadamaan-1@okaxis'");
mustContain('src/components/payment-form.tsx', "export const PAYEE_NAME = 'Preclore'");
mustContain('components/support/upi-support-card.jsx', 'PhonePe Manual UPI Flow');
mustContain('lib/vq-engine.js', 'academicMultiplier');
mustContain('lib/vq-engine.js', 'aiPenalty');
mustContain('app/api/projects/route.js', 'confirmPublicGood');
mustContain('app/auth/callback/route.js', 'safeRedirectPath');
mustContain('app/error.jsx', 'Something went wrong in this view');
mustContain('proxy.js', 'blockedSubmissionPaths');
mustContain('proxy.js', '/project/new');
mustContain('supabase/migrations/20260726_preclore_v24_public_good_registry.sql', 'get_connected_parent_upi');
mustContain('supabase/migrations/20260726_preclore_v24_public_good_registry.sql', 'get_public_project_cards');
mustContain('supabase/migrations/20260726_preclore_v24_public_good_registry.sql', 'is_current_user_mentor');
mustContain('app/project/[slug]/page.jsx', 'Support this Researcher');
mustContain('app/journal/page.jsx', 'Global Research Journal');
mustContain('app/api/mentorship-requests/route.js', 'Only mentor or admin accounts');

mustNotContain('app/auth/callback/route.js', "split('@')");
mustNotContain('app/api/projects/route.js', "split('@')");
mustNotContain('app/api/mentorship-requests/route.js', "split('@')");
mustNotContain('app/page.jsx', 'No grants. No entry fees. No platform payouts.');
mustNotContain('app/project/[slug]/page.jsx', 'No Preclore grants, prize pools, or entry fees.');

mustExist('src/lib/constants.ts');
mustExist('src/lib/design-tokens.ts');
mustExist('src/lib/review-pipeline.ts');
mustExist('src/lib/video-metadata.ts');
mustExist('src/app/mentorship/actions.ts');
mustExist('app/project/new/page.jsx');

console.log('Architecture review passed.');
