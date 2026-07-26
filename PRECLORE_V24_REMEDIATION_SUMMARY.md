# Preclore v2.4 Remediation Summary

All issues from the prior red-team audit were remediated in the repo.

## Fixed
- Upgraded `next` to `16.2.12`
- Overrode vulnerable transitive `postcss` and `sharp` versions
- `npm audit --omit=dev` now returns **0 vulnerabilities**
- Added `safeRedirectPath()` to block auth open redirects
- Removed all email-local-part public identity fallbacks
- Added birth-year age gate + read-only / mentor-mode submission blocking
- Added `/project/new` guard and redirect behavior
- Enforced `confirmPublicGood` server-side
- Hardened JSON parsing in API routes
- Added safe VQ handling for `undefined` / `null`
- Implemented **1.1x Academic Multiplier** and **0.5x AI Penalty**
- Added UPI format validation
- Restricted protected support access to **mentor/admin** roles only
- Reworked project public reads to sanitized SQL RPCs
- Tightened `users` RLS to self-read only
- Added `/src` compatibility helper files requested by audit scope
- Removed old commercial leftovers from app copy
- Added a route-level error boundary recovery UI (`app/error.jsx`)
- Added client-side email / birth-year / UPI validation guards
- Added local draft autosave to the 8-step quest using `localStorage`
- Re-checked import graph: **0 circular dependencies found**
- Re-checked static asset usage: **no broken local asset references found**

## Verification
- `npm run review` ✅
- `npm run build` ✅
- `npm audit --omit=dev` ✅
