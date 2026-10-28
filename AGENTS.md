# Africhiko — Project Operating Contract

## Product and source of truth
Africhiko is a customer-first welding and steel-fabrication enquiry PWA for Botswana. The product owner is the final reviewer; the implementer must inspect actual repository state before making changes. GitHub, this file, and the project documentation are the source of truth. Do not carry instructions, identity, Firebase configuration, contacts, or business data over from another project.

## Core customer journey
1. Browse the fabrication catalogue or describe custom work.
2. Build and review a quote request.
3. Submit name, phone, optional email, project location, intended use, dimensions, materials, quantity, services and notes.
4. Receive a truthful confirmation only after Firestore confirms the write.
5. Optionally create an account after submission to keep future enquiries together.
6. Africhiko reviews the request before any quotation or job is confirmed.

Do not force account creation before an enquiry. Do not describe an enquiry as a confirmed quote, order, or accepted job. If a write fails, preserve the entered details and say the enquiry was not confirmed as saved.

## Firebase and data security
- Use the dedicated Africhiko Firebase project (africhiko) and NEXT_PUBLIC_FIREBASE_* environment variables.
- admins/{uid} is provisioned outside the public client with role owner or staff.
- Public users may read the service catalogue, but only authorized staff may write services.
- Enquiry creation must be authenticated (anonymous auth is allowed), validated, and bound to request.auth.uid via customerId.
- Customers may read only enquiries whose customerId equals their Auth UID. Owner/staff can read the inbox and update only operational fields.
- Never open all Firestore access to work around a permission error. Match rules to the exact collections and fields used by the code.
- Guest-to-Google-account linking must preserve the same anonymous Auth UID where supported. Do not claim automatic merging across unrelated accounts.
- Never commit .env.local, production credentials, service-account JSON or secrets.

## Media and integrations
Inspect the actual implementation and environment before claiming an integration is present. The current enquiry form imports Firebase Storage for reference attachments; no UploadThing route/package was present at the last repository inspection. Do not claim UploadThing is active until the code and configuration are implemented and verified. Do not change Firebase Storage rules unless explicitly authorized; this project's current request is focused on Firestore and the customer enquiry journey.

## PWA installation — protected infrastructure
The approved installation experience in Africhiko is a permanent reference for all projects. Do not redesign, rewrite, refactor, replace, remove or alter the install mechanism, beforeinstallprompt lifecycle, event listeners, state, dismissible branded card, responsive positioning, manifest, icons or service-worker behaviour unless the product owner explicitly authorizes that specific installation change. For unrelated work, leave installation files untouched. For iOS Safari, describe Share → Add to Home Screen accurately; do not invent support for Chromium's beforeinstallprompt on iOS.

## Enquiry messaging and push notifications
- Customer and staff messages live under `enquiries/{enquiryId}/messages`; preserve the customer ownership boundary and owner/staff role checks in Firestore rules.
- Push device tokens are registered through authenticated server routes and stored server-side under `notificationTokens/{uid}/tokens`; never expose token collections to arbitrary client reads/writes.
- Use Africhiko Firebase Cloud Messaging only. `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is the public Web Push key; `FIREBASE_ADMIN_KEY` is server-only. Never copy Boemo project credentials, tokens, VAPID keys, or Firebase IDs into Africhiko.
- Push delivery is best-effort and must not turn a successfully saved enquiry/message/status into a reported failure. Verify live push delivery separately from Firestore persistence.
- The approved installation flow and offline caching are protected. Notification support may be added to `public/sw.js` only additively; do not change PWA registration, install prompt lifecycle, cache namespace, offline routes, or existing fetch/cache behavior for notification work.

## Implementation and verification
- Customer experience first; admin/staff workflows second.
- Preserve working features and keep changes focused.
- Include useful validation, loading, empty, error and success feedback; no dead controls or fake success.
- Before a meaningful checkpoint, run `npx tsc --noEmit`, `npm run lint` and `npm run build` when the environment permits. Report checks that were not run honestly.
- In client components, use `ReturnType<typeof window.setTimeout>` for browser timer handles so TypeScript does not confuse DOM numeric timer IDs with Node `Timeout` types.
- A fresh commit can trigger another Vercel deployment attempt, but does not bypass Vercel build-rate limits. Confirm the resulting deployment status before reporting success.
- Do not infer production deployment success from a GitHub push or a successful build.
- Never force-push or rewrite history.
- For each checkpoint report repository, branch, commit, changed files, verification, configuration still needed, exact QA steps and deployment status.

## Analytics and operational decision support

- Use Vercel Web Analytics and Speed Insights already mounted in the root layout for aggregate traffic and performance. Do not add another analytics vendor or duplicate page-view tracking without approval.
- Use `track` from `@vercel/analytics` for a small, documented set of meaningful events: enquiry form viewed, enquiry successfully submitted, submission failure stage, service added to quote, guide opened/shortcut used, customer Google sign-in success, and admin enquiry status updated.
- Event properties must remain coarse and non-identifying. Never send names, email addresses, phone numbers, free-text enquiry/project notes, customer/Auth UIDs, enquiry IDs, media URLs, staff notes, tokens, or other personal/sensitive data to analytics. Do not treat a click or attempt as a completed business outcome.
- Vercel custom event availability/retention depends on the current team plan. Verify event ingestion in the actual Vercel Analytics dashboard; if custom events are gated, do not claim they are visible and do not silently introduce a paid plan or a new analytics provider.
- The Operations dashboard must prioritize actionable business workflow from authoritative Firestore records: new requests, quotations, accepted/completed jobs, follow-ups due/overdue, and old unreviewed enquiries where timestamps are valid. Clearly label the source and definitions; handle missing timestamps without inventing ages.
- Public social proof must use verified, owner-approved facts only. Never expose customer identities, private enquiry data, internal notes, unpublished work, or fabricated popularity/conversion claims.
- For analytics changes, verify event names/properties, confirm no personal data is emitted, test success and failure paths, and check that tracking failures cannot block enquiries or admin operations. Never make analytics a dependency for saving business data.

## Contextual experience

- Use a warm, restrained greeting: customer first name once where available, and a time-aware “Boss” greeting for authorized workshop admin. Do not overuse names or invent activity counts.
- The contextual Africhiko guide is deterministic and honest about its limits. Reuse existing page links and actions; never claim a message was sent, a status changed, or a human/AI replied when no such operation occurred. Keep it keyboard-accessible, dismissible and clear of key mobile actions.
- Current weather is for the Gaborone workshop area only. It now uses Open-Meteo's free public forecast endpoint without an API key, cached for 30 minutes, with update time and attribution and an honest unavailable/retry state. Open-Meteo's free endpoint is intended for non-commercial use; verify the provider's current terms before using this configuration for commercial production or reuse in business apps. Do not put a secret key in client code.
- Admin session UX expires after 24 hours and restores a valid existing session without forcing the Google account chooser. This client-side timeout is not a replacement for server token verification or Firestore rules.

## Project identity
Use Africhiko naming and the dedicated Africhiko project configuration in app-facing text, docs, environment examples and Firebase CLI configuration. Search for and correct inherited identity leaks rather than copying another project's details.

## Admin access and work feed
- Africhiko admin access is restricted to `chikohoraknowledge4@gmail.com` and `gatshaayanda@gmail.com`. The admin UI uses Firebase Google sign-in; never use a shared access word, typed admin password form, or anonymous session to grant admin privileges.
- The server route verifies the Firebase ID token and allowlisted email before provisioning the role. It requires server-only `FIREBASE_ADMIN_KEY` service-account JSON. Google sign-in must be enabled in Firebase Authentication, and both allowlisted Google accounts must be able to authenticate with their exact allowlisted email addresses.
- Firestore rules independently enforce the same email allowlist as well as the owner/staff role. Keep the allowlist synchronized across routes, notification endpoints, and rules.
- Push notifications are best-effort; a successful FCM send response is not proof of device display. Keep permission-denied recovery instructions explicit and preserve the approved service-worker install/cache behavior.
- Work-feed items live in `workFeed`; only published items are public. Interest signals are deduplicated per UID in `workInterests`, and customer identities must never be displayed publicly.
- Preserve the approved PWA installation mechanism and UX during unrelated work.
## My Africhiko account and social proof checkpoint — 2026-10-27

- Customer account now prioritizes project history, status explanations, a recorded-update date when available, a repeat-enquiry action, a useful first-time/empty state, account help, and existing workshop conversations. Status explanations are descriptive, not promises of a completion date or quotation.
- Repeat-enquiry action starts a fresh enquiry and identifies the prior enquiry reference in the notes. It does not duplicate or mutate the previous enquiry. Cross-account recovery and automatic merging are not implemented; preserve the UID ownership rule above.
- Notification test copy distinguishes server acceptance from device display. Never claim delivery merely because FCM accepted a send request.
- Homepage social proof may show the count of published workshop examples only when derived from the live published workFeed; it must not present fabricated popularity, visitor counts, reviews, jobs completed, or conversion claims.
- Vercel Analytics and Speed Insights are already mounted in src/app/layout.tsx; meaningful, coarse analytics events are tracked in src/components/AfrichikoPortal.tsx. Keep exact traffic metrics private to authorized workshop/admin access. Raw visitor counts must never appear publicly or be disclosed per customer.
- Outstanding analytics task: exact Vercel visitor/page-view summaries are not yet embedded inside the Africhiko Admin Hub. Vercel Analytics is available through the Vercel project dashboard; the current production environment has no VERCEL_API_TOKEN configured. If embedding summaries, implement a server-side endpoint that authenticates the Africhiko admin against the existing allowlist/role, calls the Vercel Analytics API using server-only credentials, returns only aggregate metrics, and fails closed with a clear unavailable state. Never expose a Vercel token to client code or create a public analytics endpoint. Verify visitor-vs-pageview definitions and supported retention/plan before labeling metrics.
- Spark Catcher already exists as an optional homepage mini-game. Preserve its placement and implementation unless the product owner explicitly asks for a change.
- PWA installation, manifest, service-worker registration, cache namespace, and offline behavior remain protected and were not part of this account update.

## Checkpoint — 2026-10-27 account UX update

- Repository: gatshaayanda/africhiko; target branch: main.
- Scope: customer project-account UX, account-specific responsive styles, verified published-work count copy, and customer-friendly notification test feedback.
- Guest enquiry creation, Google account linking, Firestore rules, message ownership, admin permissions, and installation infrastructure must remain unchanged.
- Verification requirement: run npx tsc --noEmit, npm run lint, and npm run build against the final commit when a connected build environment is available. GitHub API writes alone do not prove a build passes. Confirm the actual Vercel deployment before calling this production-ready.
- Current verification result for this checkpoint: GitHub's Vercel status reports a build-rate-limit failure; this is not a code-test result. A local clone could not be created in the current execution environment, so TypeScript, lint, and production build have not been run here. Recheck the latest deployment after Vercel permits another build.
- QA: test signed-out account, Google sign-in, loading/empty states, one enquiry per status, conversation send/read, repeat-enquiry reference, notification permission denied/granted/test, mobile layout, guest-first submission, and install flow unchanged.

## Fresh Vercel build retry — 2026-10-28

- Product owner requested a fresh chore commit to test whether a new Git push can trigger a deployment after the Vercel build-rate-limit failure.
- This is a documentation-only retry marker; it does not change application behavior or bypass Vercel plan/build limits.
- After this commit, inspect the actual Vercel/GitHub status. If the provider still reports build-rate-limit failure, stop retrying commits and wait for the limit to reset or for the owner to resolve the Vercel plan/usage restriction.
- Keep exact Vercel visitor analytics private. Public social proof remains limited to verified aggregate published-work counts until a secure admin-only analytics endpoint is implemented.
