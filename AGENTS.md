# Africhiko — Repository Operating Contract

## Role and workflow
The product owner is the final reviewer. Work directly in this repository when authorized. GitHub source and actual code are the source of truth. Follow: UNDERSTAND → INSPECT → IMPLEMENT → VERIFY → CHECKPOINT. For new-app inheritance, The Plug is the mandatory foundation; follow its `CLONING.md`, `AGENTS_REPO_LABELED.md`, `docs/ADMIN-HUB-APP-FACTORY-SOP.md`, and `docs/CLONE-RESET-CHECKLIST.md` from branch `docs/flagship-repo-audit-2026-10-12`. Do not copy credentials, customer records, brand assets or infrastructure.

## Business brief
Africhiko Proprietary Limited is a Botswana welding and steel fabrication business. Supplied contact details: Plot 17879, Gaborone West Phase 1, Gaborone; P.O. Box 2115, Bontleng, Gaborone; +267 73373085 / +267 74300085; +267 3931412; chiknowledge773@gmail.com. UIN BW00004097727 is owner-supplied and not independently verified. Products include sliding gates, burglar bars/security products, trailers, carports/sheds, double-decker bunk beds, laser-cut metal elements and custom fabrication. Do not invent fixed prices, stock, certifications, reviews, customers, projects, lead times or guarantees.

## Customer-first requirements
Primary journey: DISCOVER → BROWSE → DESCRIBE → REVIEW → SUBMIT → ACKNOWLEDGEMENT → FOLLOW UP. Search/filter services, editable basket, structured project details (intended use, dimensions, quantity, materials/finish, location, notes and optional image/PDF reference), validated contact form, clear status and working phone/WhatsApp/email links. Guest enquiry must not require registration. Preserve entered details and never claim a save unless Firebase confirms it. Enquiry, quotation, accepted quote, payment and confirmed work are distinct states. Custom projects use quotation unless an approved price and terms are explicitly published.

## Brand and media
Use violet, cyan/light blue, white and dark steel. Keep the welder-and-sparks concept. Maintain three replaceable workshop media slots. CSS concept illustrations are not evidence of real projects. Respect mobile layouts, visible focus, WCAG 2.2 AA contrast and reduced-motion preferences.

## Admin and security
Admin requires Firebase Auth plus server/database-side role authorization via `admins/{uid}` with `owner`/`staff`. Hiding an admin link is not security. Services are public-read only when active; only admins write services. Enquiries are owner-readable and admin-readable; only admins update status. Project-reference files are owner/admin scoped and limited to images/PDFs under 4 MB. Never let a customer write an admin role or edit their own status. Rules in the repository are not deployed rules until an authorized deployment is verified. Do not weaken deny-default behavior to make a screen work.

## PWA
Follow The Plug's PWA cloning guide. Website use must work without installation. Preserve native install prompt, embedded-browser handoff, iOS/browser fallback, unique identity/icon/cache namespace, offline public-shell behavior, and honest offline submission messaging. Installation, installed-state, offline, and push delivery each require separate evidence. Never cache private account, enquiry or admin responses in the public shell.

## Verification
Run only commands that actually exist and record PASS / FAIL / NOT RUN / BLOCKED. Target checks: `npm ci`, `npm run verify:identity`, `npm run verify:clone-readiness`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`. A source commit or build does not prove Firebase runtime, rules deployment, PWA install, uploads or deployed customer/admin flows. The product owner handles Vercel deployment by default; do not deploy or mutate live infrastructure without explicit authorization.
