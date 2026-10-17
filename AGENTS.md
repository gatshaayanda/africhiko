# Africhiko — Repository Operating Contract

## Role and workflow
The product owner is the final reviewer. Work directly in this repository when authorized. GitHub source and actual code are the source of truth. Follow: UNDERSTAND → INSPECT → IMPLEMENT → VERIFY → CHECKPOINT. For new-app inheritance, The Plug is the mandatory foundation; follow its `CLONING.md`, `AGENTS_REPO_LABELED.md`, `docs/ADMIN-HUB-APP-FACTORY-SOP.md`, and `docs/CLONE-RESET-CHECKLIST.md` from branch [`docs/flagship-repo-audit-2026-10-12`](https://github.com/gatshaayanda/the-plug/tree/docs/flagship-repo-audit-2026-10-12). Do not treat Africhiko as a reusable foundation unless the product owner explicitly chooses that. Do not copy credentials, customer records, brand assets or infrastructure.

## Business brief
Africhiko Proprietary Limited is a Botswana welding and steel fabrication business. Supplied contact details: Plot 17879, Gaborone West Phase 1, Gaborone; P.O. Box 2115, Bontleng, Gaborone; +267 73373085 / +267 74300085; +267 3931412; chiknowledge773@gmail.com. UIN BW00004097727 is owner-supplied and not independently verified. Products include sliding gates, burglar bars/security products, trailers, carports/sheds, double-decker bunk beds, laser-cut metal elements and custom fabrication. Do not invent fixed prices, stock, certifications, reviews, customers, projects, lead times or guarantees.

## Product priorities and scope
Priority order: (1) customer discovery and enquiry journey, (2) PWA/browser reliability that supports that journey, (3) administration after the customer flow is verified. Do not expand admin scope to mask customer-flow defects. No registration should be required before a customer can start an enquiry. The website must remain usable without installation.

Primary journey: DISCOVER → BROWSE → DESCRIBE → REVIEW → SUBMIT → ACKNOWLEDGEMENT → FOLLOW UP. Search/filter services, editable basket, structured project details (intended use, dimensions, quantity, materials/finish, location, notes and optional image/PDF reference), validated contact form, clear status and working phone/WhatsApp/email links. Preserve entered details when navigating or correcting validation errors. Never claim a save unless the relevant backend confirms it. Enquiry, quotation, accepted quote, payment and confirmed work are distinct states. Custom projects use quotation unless an approved price and terms are explicitly published.

## Brand and media
Use violet, cyan/light blue, white and dark steel. Keep the welder-and-sparks concept. Maintain three replaceable workshop media slots. Current slots point to the supplied `/videos/gear.mp4`, `/videos/outside.mp4` and `/videos/enter.mp4`; confirm footage accuracy and permissions before launch. CSS/illustration fallbacks are not evidence of completed client projects. Respect mobile layouts, visible focus, WCAG 2.2 AA contrast and reduced-motion preferences.

## PWA contract
Follow The Plug's cloning guide and `docs/PWA-FOUNDATION.md`; inspect actual files before editing. Current implementation uses `src/app/layout.tsx`, `src/app/manifest.ts`, `public/manifest.webmanifest`, `src/app/pwa-register.tsx`, `public/sw.js`, `src/app/offline/page.tsx`, and `src/app/pwa.css`. Do not assume the two manifest definitions or icon declarations are interchangeable: compare their values and references after every identity change.

Source-inspection finding (not device-test evidence): both manifests currently declare only `/africhiko-mark.svg` with `sizes: "any"`; layout metadata also points its Apple icon at that SVG. The app's install behavior captures `beforeinstallprompt` and uses a branded fallback when no native prompt is available. This is not proof that every supported browser can install or that the Apple home-screen icon is correct. Add and validate appropriate raster icons (at minimum 192×192 and 512×512 PNG variants, plus an Apple touch icon where needed), include a maskable option if designed for it, and align layout metadata, both manifests and service-worker precache. Verify file signatures, dimensions, MIME type and actual HTTP responses; filenames alone do not prove a valid image. Reference: [MDN — Define app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons).

Required behavior:
- Preserve the native `beforeinstallprompt` action when the browser supplies it; invoke it directly from the user's install-button click.
- Do not make installation a prerequisite for browsing, basket use or enquiry.
- Keep installed/standalone detection separate from install prompt availability. Do not show install promotion as proof that installation is possible.
- Embedded-browser handoff must preserve the intended URL/path where supported; do not trap a customer in an install gate or force them to the homepage.
- iOS/Safari needs its own manual Add to Home Screen guidance because `beforeinstallprompt` is not a universal cross-browser API. Keep the website fully usable without that action.
- Version the app's cache namespace. Cache only public shell/content; never cache private account, enquiry, admin, token or API responses. Offline UI must clearly distinguish cached browsing from a successful server submission.
- Treat service-worker registration, cache activation, offline navigation, update handling, installability, installed-state detection and push delivery as separate behaviors requiring separate evidence.
- Do not assume the presence of a service worker alone proves offline readiness. Test fresh install, first visit, repeat visit, offline navigation, reconnect/retry and stale-cache recovery.
- Avoid duplicate install listeners, stacked dialogs, prompt loops, `alert()`, dead buttons and claims that an app was installed without OS/browser confirmation.

Official browser references: [MDN manifest icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons), [Chrome/web.dev install criteria](https://web.dev/articles/install-criteria), and [web.dev service workers](https://web.dev/learn/pwa/service-workers). Browser support and install UX vary; source inspection is not device evidence.

## Admin workflows and security
Admin requires Firebase Auth plus server/database-side role authorization via `admins/{uid}` with `owner`/`staff`. Hiding an admin link is not security. Services are public-read only when active; only admins write services. Enquiries are owner-readable and admin-readable; only admins update status. Project-reference files are owner/admin scoped and limited to images/PDFs under 4 MB. Never let a customer write an admin role or edit their own status. Rules in the repository are not deployed rules until an authorized deployment is verified. Do not weaken deny-default behavior to make a screen work.

Current source shape: Firestore rules define `admins`, `services` and `enquiries` with a final deny-all rule; Storage rules define owner/admin-scoped `projectReferences/{uid}/{fileName}` with a 4 MB limit and image/PDF MIME checks. These are source-level observations only. Verify runtime behavior and deployed rules separately; do not infer successful upload, persistence or authorization from these files alone. The middleware currently returns 404 for `/api/*` and quarantines inherited Plug raster icon routes. Do not re-enable an API route without rebuilding and reviewing its authorization, validation, persistence and failure behavior for Africhiko.

## Repository reality and known gaps
- `CLONING.md` is not currently present in Africhiko `main`. The mandatory source guide is The Plug's `CLONING.md` on `docs/flagship-repo-audit-2026-10-12`; read it before any clone/reset or foundation-level change. Do not silently treat a missing destination copy as evidence that the source process was followed.
- `package.json` defines `verify:identity`, `verify:clone-readiness`, `lint` and `build`; the build invokes identity verification. There is no declared test script in the inspected package manifest. Do not report a test suite as run unless one is added and executed.
- `scripts/verify-africhiko-readiness.mjs` is a static source-marker and rule-shape check. Its success is not an end-to-end test and does not prove backend configuration, deployed rules, file upload, customer submission or admin authorization.
- `scripts/verify-identity.mjs` checks configured identity, manifest alignment, SVG existence, service-worker cache namespace and inherited identity residue. A passing identity check does not validate raster icon availability or browser installation.
- `.github/workflows/quality.yml` runs npm ci, identity verification, source readiness, TypeScript, lint and production build on main pushes and pull requests. Inspect the actual run for the exact commit before claiming CI passed.
- Customer portal source lives primarily in `src/components/AfrichikoPortal.tsx`; route wrappers include `/services`, `/basket`, `/enquiry`, `/account` and `/admin`. Trace each action into Firebase/Auth/Storage and back to the resulting UI before calling the workflow complete.
- The customer portal contains a localStorage basket (`africhiko-basket-v1`) and starter services used when Firebase web configuration is absent. Verify how the UI communicates local-only/fallback behavior; do not let starter data or a locally retained basket imply that a server enquiry was submitted.
- Supplied workshop videos are under `public/videos/`; media playback is best-effort and may be affected by browser autoplay/reduced-motion/network conditions. Verify on actual target devices.
- Do not infer the production domain, Vercel project, Firebase deployment state or current production SHA from repository names or environment-variable defaults. Confirm them read-only before any production-specific claim.

## Verification and evidence
Run only commands that actually exist and record PASS / FAIL / NOT RUN / BLOCKED. Expected baseline commands, where dependencies and runtime permit:
```bash
npm ci
npm run verify:identity
npm run verify:clone-readiness
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```
If operating through GitHub-only tools, report which checks were observed in CI and which could not be run locally. For every significant verification result, record the commit SHA, environment/device/browser, exact action, result and evidence link.

Minimum customer/PWA release evidence:
1. Fresh visitor can browse without installing or registering.
2. Search/category filtering and basket add/edit/remove behave correctly on narrow and wide layouts.
3. Enquiry validation preserves user input and displays actionable errors.
4. Optional attachment accepts only intended file types/size; upload authorization, resulting URL access and failure recovery are tested.
5. Submission creates one persistent enquiry; retry/double-click behavior is understood; acknowledgement text matches the actual backend result.
6. The customer can find the submitted enquiry again if account functionality is offered, and cannot read another customer's enquiry.
7. Android Chrome native install prompt, accepted/dismissed outcomes and installed launch are tested on device.
8. iPhone Safari Add to Home Screen, icon appearance and installed launch are tested on device.
9. WhatsApp/Instagram in-app browser handoff preserves the intended route and works with browser fallbacks.
10. Offline public browsing and reconnect behavior are tested separately from online submission.
11. Unauthorized admin/API/database/storage access is denied in a safe test environment.
12. Deployed smoke test is tied to a known deployment SHA; do not deploy as part of this work without explicit authorization.

Use PASS / FAIL / NOT RUN / BLOCKED. Distinguish source inspection, static checks, CI, local runtime tests, deployed tests and real-device tests. A source commit or build does not prove Firebase runtime, rules deployment, PWA install, uploads or deployed customer/admin flows.

## Delivery, Git and deployment
The product owner handles Vercel deployment by default. Do not deploy, change production infrastructure, mutate live data, deploy Firebase rules/indexes or incur material costs without explicit authorization. Inspect branch, commit, remotes, dirty state and CI before writing. Preserve unrelated work. Review the diff, commit only verified changes, and report the exact resulting commit/branch/push status. Never claim an unexecuted test passed.
