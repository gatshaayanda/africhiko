# Africhiko — Labelled Repository Engineering Map

This map describes the target application after the initial The Plug foundation reset. Source code and the deployed environment take precedence over this map if they differ; update this file with material flow/schema changes.

## A — Identity and PWA
- `src/app/layout.tsx`: metadata, canonical base URL, embedded-browser classification, early native `beforeinstallprompt` capture.
- `src/app/manifest.ts` and `public/manifest.webmanifest`: install identity; keep name, short name, theme and icon aligned.
- `public/africhiko-mark.svg`, `src/app/icon.svg`: Africhiko violet/cyan mark.
- `src/app/pwa-register.tsx`: native install prompt, embedded-browser handoff, iOS/browser fallback, connectivity and update state.
- `public/sw.js`: unique `africhiko-shell-v1` and `africhiko-media-v1` caches. Only public shell pages and same-origin image requests are cached. Account/admin/API and write requests are excluded.
- `src/app/offline/page.tsx`: explicit browse-only/offline warning. No enquiry is queued or described as sent offline.
- `scripts/identity.config.json`, `scripts/verify-identity.mjs`: identity contract and source checks.

## B — Storefront and customer journey
- `src/app/page.tsx` → `src/components/AfrichikoPortal.tsx` page mode `home`: opening proposition, three temporary workshop media/illustration slots, searchable service preview and quotation CTA.
- `src/app/services/page.tsx` → portal mode `services`: searchable catalogue and category filters.
- `src/app/basket/page.tsx` → portal mode `basket`: browser-local, editable service selection under `africhiko-basket-v1`. It is not a payment/order.
- `src/app/enquiry/page.tsx` → portal mode `enquiry`: contact/project validation, dimensions, intended use, quantity, materials, location, notes and optional image/PDF upload. The form is guest-first and reports success only after Firestore confirms the write.
- `src/app/account/page.tsx` → portal mode `account`: email/password account create/sign-in and owner-scoped enquiry history. Creating an email credential from the current anonymous Firebase session uses credential linking to preserve that UID; an existing-account collision is not silently merged.
- `src/app/request/page.tsx`: legacy request URL redirects to `/enquiry`.
- `src/components/AfrichikoPortal.tsx`: starter service taxonomy is derived from supplied company offerings and carries no invented prices. The public fallback is for configuration-free local preview; with configured Firebase, the active Firestore catalogue is authoritative.

## C — Data and security
- `middleware.ts`: allowlists the new Africhiko routes, returns 404 for inherited `/api/*` endpoints, and blocks stale Plug raster icons.
- `src/lib/firebase/client.ts`: Firebase client initialization from `NEXT_PUBLIC_FIREBASE_*`; it fails closed unless project ID, auth domain, storage bucket, app ID and sender ID match the dedicated Africhiko Firebase app. Build placeholders do not count as a configured live project.
- `firestore.rules`: default-deny; active services are public-readable, service writes require `admins/{uid}` role owner/staff, enquiry creation requires an authenticated owner session, enquiry reads are owner/admin scoped, and only admins can change status/delete.
- `storage.rules`: project reference uploads are scoped to the owner UID and admins, limited to image/PDF under 4 MB; all other paths denied.
- `firestore.indexes.json`: currently no custom indexes required by the active equality queries.
- These rule files are source only. They have **not** been deployed or runtime-tested. `.github/workflows/firebase-rules-deploy.yml` is manual-only to prevent an ordinary code push from deploying live rules.
- Service document fields: `name`, `category`, `description`, `price` (number or null), `unit`, `active`, `createdAt`, `updatedAt`. Admin can add/edit and deactivate/restore. The explicit “Publish starter catalogue” action creates the initial documents.
- Enquiry document fields: `customerId`, `name`, `phone`, `email`, `location`, `intendedUse`, `dimensions`, `materials`, `notes`, `quantity`, `services`, `attachmentUrl`, `status`, `createdAt`, `createdAtServer`. Status is initialized to New; only admins can update it.
- Admin path: Firebase email/password sign-in → read `admins/{uid}` → allow only owner/staff → service CRUD and enquiry/status inbox. Client cannot create its own admin role. Provision roles through a trusted console/Admin SDK operation.

## D — Verification and known blockers
- `npm run verify:identity`: manifests, identity icon and cache namespace.
- `npm run verify:clone-readiness`: static target-specific route/schema/rule markers.
- CI: `npm ci`, both verifiers, TypeScript, lint, build.
- Static checks do not prove Firebase Authentication providers, Firestore/Storage rules, file uploads, admin roles, installed PWA, offline runtime or deployment. Test those separately after the dedicated environment is configured.
- Set `NEXT_PUBLIC_BASE_URL` to the real URL per environment before deployment. No deployment, live data mutation or Firebase rules deployment is performed by this change.
- Media tiles are generated CSS illustrations, not photographs or evidence of completed customer projects. Replace them with approved workshop media when supplied.
