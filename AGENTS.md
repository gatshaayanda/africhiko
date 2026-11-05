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
Inspect the actual implementation and environment before claiming an integration is present. Keep the two media workflows distinct: enquiry-form reference attachments have historically used Firebase Storage, while the walk-in/shared-work progress-photo workflow is documented as using the Africhiko UploadThing uploader. Verify the current source and configuration for the exact workflow before changing or describing either integration. Do not migrate storage providers or change Firebase Storage/UploadThing authorization as part of unrelated UX work.

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


## Workshop walk-in queue and shared job progress — 2026-11-01

- The owner/staff Operations surface includes a separate Workshop / Walk-in Queue for work that has actually been agreed or accepted in person/by phone. An enquiry is not automatically a job, quote, or accepted order.
- Private operational records live in `workJobs/{jobId}`; only authorized Africhiko admins can read or write them.
- Customer progress pages live in `sharedWork/{shareId}`. The share ID is a random 32-character identifier. Public documents contain only the project title, work type, customer-facing summary, current stage, timestamps and explicitly shared progress notes/photos. Never copy customer phone numbers, full names, email addresses, internal notes, or private job data into this collection.
- Supported stages: Received, Assessing, Awaiting approval, In fabrication, Ready for collection, Completed and On hold. Staff updates are mirrored atomically to the private job and public share record.
- Public customer route: `/work/[shareId]`. Customers can view progress and photos; no account is required. Sharing is prepared through the customer's WhatsApp app or copied as a link. The app does not claim that WhatsApp messages were sent.
- Progress images use the existing Africhiko UploadThing file uploader, with a 4 MB image limit. Upload completion is required before a photo is added to the shared timeline.
- Firestore rules permit public direct reads only of published `sharedWork` documents; `workJobs` remains admin-only. Do not weaken these rules or add customer contact details to public records.
- The approved PWA installation, manifest, icons, service-worker registration, cache namespace, offline behaviour and install UX are protected and must remain untouched by this feature.
- QA: create a walk-in job as an authorized owner; confirm it appears live in the queue; update its stage and add a note/photo; copy and open the share URL in a signed-out/private browser; verify the customer page shows only approved project/progress content; verify phone/name/email/internal notes are absent; verify an unauthorized account cannot read `workJobs` or write either collection.


## Visible work, loading and operational transparency — 2026-11-05

This standard applies across Africhiko's public catalogue, quote/enquiry journey, customer account, private conversations, published-work feed, workshop walk-in queue, shared job-progress pages and Admin Hub. It improves clarity and recovery around real application work; it is not permission to replace working architecture.

### Product principle
- Make genuine application work understandable in plain language: loading services, checking a quote request, saving an enquiry, retrieving project history, uploading a reference/progress photo, sending a private reply, updating a workshop stage or synchronising a pending change.
- Keep the experience concise, customer-first, mobile-first and consistent with Africhiko's own brand. Do not copy JTS salon language, palette or business workflows.
- Never manufacture effort, add artificial delays, fake progress, invent activity or slow the application to make it appear more substantial.
- Prefer one clear next action and useful contextual feedback over decorative progress theatre or additional dashboards.

### Loading and asynchronous states
- Important asynchronous sections must distinguish initial loading, loaded content, a genuinely empty result, refresh/revalidation where relevant, and failure.
- Prefer content-shaped skeletons for known layouts and restrained activity indicators for indeterminate operations. Never show a fabricated percentage for Firestore reads, authentication, message delivery or other work without measurable progress from the underlying provider.
- Use task-specific descriptions where useful, such as loading services, retrieving project enquiries, checking workshop jobs or refreshing published work.
- Do not show an empty state before the initial read/subscription has resolved. Avoid blank screens and endless spinners after terminal errors.
- Keep independent data sources independently understandable. A failed work-feed query must not imply the enquiry inbox failed; a queue subscription error must not hide already-loaded services or other operational areas.
- Provide contextual retry/recovery for transient failures. Preserve usable content and entered data where safe.
- Respect reduced-motion preferences; animation must be subtle and never essential to understanding state.

### Enquiry, quote and offline persistence truth
- Distinguish a local form draft, a locally persisted/offline-pending change (only where the actual persistence API confirms it), a backend-acknowledged enquiry, a request reviewed by Africhiko, a quotation issued, and a job/order explicitly accepted.
- An enquiry submission is not a quotation, confirmed order, accepted job or promise of a completion date. Keep the existing customer journey and account-creation choice intact.
- Do not claim that an enquiry is saved merely because the submit button was clicked or a local optimistic update appeared. Use the actual Firestore write acknowledgement and report failure accurately.
- Where offline persistence and pending-write state can be observed reliably, explain that the request is waiting to synchronise and update the customer only when backend acknowledgement is confirmed. Reconnection alone is not proof of synchronisation.
- If a write fails, preserve recoverable customer input/local reference where safe, explain what failed and offer a safe retry. Inspect record identity/idempotency before changing retry logic; prevent accidental duplicate enquiries.
- Do not alter Firestore schema, security rules, authentication, customer UID ownership or offline persistence merely to improve presentation. Any data-contract change requires separate review and a migration/compatibility plan.

### Private messaging and media attachments
- Conversation views must distinguish initial loading, loaded messages, a genuinely empty thread, refresh/error and retry. Never show “No messages yet” while the first read is unresolved.
- Keep customer and staff views connected to the same authorized enquiry conversation. Preserve customer ownership, staff authorization, unread/read state and existing message/thread identity.
- Message persistence, notification acceptance, device display and recipient read state are separate events. Say a message is saved/sent only after the corresponding write is acknowledged; never claim a push notification was displayed or read based only on FCM acceptance or token registration.
- Upload completion, attachment association and message submission are separate steps. Show a percentage only when the active upload provider supplies measurable progress. Do not conflate the enquiry attachment storage flow with the UploadThing workflow used for shared-work progress photos; verify the exact implementation before editing either.
- Failed sends, uploads or read-state updates need contextual errors and safe retry. Avoid discarding a draft or completed upload when a later step fails.
- Public shared-work records must contain only explicitly approved customer-facing project/progress information. Never expose names, phone numbers, email addresses, internal notes, private enquiry data or storage credentials.

### Public catalogue, work feed and shared progress
- Public services/catalogue, published work and shared progress pages must distinguish loading, available content, no published/available content and temporary failure.
- Offer retry where a transient retrieval failure can reasonably be retried; do not disguise permission/configuration errors as an empty catalogue or empty job history.
- Use genuine authorized fabrication/workshop media only. Do not fabricate reviews, popularity, completed jobs, customer interest or project outcomes.
- Keep service names, prices, quote actions and project-status wording consistent with the actual catalogue and authoritative records.
- A public shared-progress page may show only the fields and media deliberately copied into its public share document. Never use a public share ID as permission to expose private workJobs or enquiries records.

### Admin and workshop operations feedback
- Give independently loaded areas—enquiries, services, work feed, announcements, workshop queue, shared-job updates and reporting—their own truthful loading, empty and failure states where appropriate.
- A subscription/read failure in one panel must not imply the entire Admin Hub is unavailable. Show the affected operation and a relevant recovery action.
- Confirm consequential actions with precise outcomes only after the corresponding operation succeeds: enquiry status saved, quote updated, service saved, work-feed item published, workshop stage updated, progress note/photo attached or private reply saved.
- Disable duplicate submissions while an action is genuinely in progress, show visible working feedback, and restore controls after success/failure. Never leave a dead button or report fake success.
- Keep the distinction between an enquiry and an accepted walk-in/workshop job. A request must not silently become a job.
- Preserve role-controlled admin access and existing Firestore security boundaries. Never weaken rules to suppress permission errors or make private collections public.
- Financial/operational reporting must distinguish an enquiry, quotation, accepted job, recorded transaction and independently verified payment. Do not label a quote or expected job value as revenue.

### Error recovery, diagnostics and identity
- Errors should identify the affected task, state whether entered data or previously saved content remains safe, and offer a supported next step such as retry, reconnect or contact Africhiko.
- Keep technical diagnostics out of ordinary customer copy. Authorized admin diagnostics may expose a restrained error code/message where useful, but never tokens, credentials, private records or sensitive backend payloads.
- Do not silently swallow failures that leave the user uncertain. Log only minimal non-sensitive diagnostics; never log credentials, tokens, message contents, private enquiry notes or unnecessary personal data.
- Keep all customer-facing loading, error, offline, notification and recovery surfaces under Africhiko's identity. Remove inherited third-party identity only when the relevant surface is safely touched; do not perform risky infrastructure renames.

### Analytics and privacy
- Keep public discovery analytics, an individual customer's own enquiry/account information, and authorized business/admin reporting as separate information boundaries.
- Analytics events must remain coarse, privacy-safe, best-effort and PII-free. Never send names, email addresses, phone numbers, Auth UIDs, enquiry/job IDs, free-text notes, message contents, exact project locations, private media URLs, tokens or payment evidence.
- Do not equate views, clicks, interest signals or feed engagement with enquiries, accepted jobs, completed work or revenue. Reconcile business metrics against authorized source records and label definitions accurately.
- Use the existing Vercel Analytics/Speed Insights and documented event contract. Do not add another analytics vendor, duplicate page-view tracking or a client-writable public event collection without explicit approval.
- Analytics failure must never block an enquiry, message, upload, status update or other business operation.

### PWA, offline and service-worker protection
- PWA installation, beforeinstallprompt, install-card lifecycle/UX, manifest, icons, service-worker registration/scope, cache namespace, offline routes/caching, notification integration and update lifecycle are protected infrastructure.
- This standard does not authorize changing installation, service-worker activation/reload behaviour, cache strategy, notification delivery or offline data handling.
- Any separately approved PWA/update work must be isolated and tested against the approved Africhiko installation experience. For unrelated loading, messaging, analytics or admin work, leave protected installation/service-worker files untouched.
- A browser permission grant or saved push token is not proof that a notification was delivered or read.

### Implementation sequence
1. Inspect the exact component, data source, subscription/write lifecycle, current state, integration and security boundary before editing. Reuse existing APIs and event names where possible.
2. Correct misleading loading, empty, success and error states without changing business/data contracts.
3. Improve enquiry acknowledgement and offline-pending/synchronised/failed feedback only where the actual Firestore lifecycle can be observed reliably.
4. Standardize private conversation initial-loading, empty, send, unread/read and retry feedback; verify the customer/staff thread remains the same.
5. Make upload progress truthful for the provider actually used in each workflow; keep upload, attachment association and message submission distinct.
6. Standardize public catalogue/feed/shared-progress and independent Admin Hub loading/recovery states.
7. Audit analytics event names/properties and privacy before adding any missing events.
8. Treat PWA/service-worker lifecycle discrepancies as separate work requiring explicit approval and dedicated QA.

### Release gates
- Test initial loading versus genuinely empty results for every affected subscription.
- Test transient read failure, permission/configuration failure where safely reproducible, and successful retry; confirm independent sections remain usable.
- Test enquiry submission online, offline only where supported, reconnection, eventual acknowledgement, failed write and retry without duplicate records.
- Test customer/staff conversation first load, empty thread, existing messages, replies, unread/read state, failed send and attachment upload/recovery.
- Test catalogue, published work and shared-progress loading, empty and unavailable states on mobile.
- Test Admin Hub action feedback for enquiry updates, service saves, publishing, workshop stage/note/photo updates and private replies.
- Verify public shared-work records exclude private customer/contact/internal fields; verify unauthorized users cannot read private enquiries or workJobs.
- Verify no PII leaks into analytics/logs and analytics failures cannot block business operations.
- Preserve guest enquiry flow, Google account linking, customer UID continuity, Firestore rules/schema/auth, storage authorization, UploadThing authorization and protected PWA/install/offline behaviour unless a separately approved task explicitly changes them.
- Run identity verification, npx tsc --noEmit, lint and production build when an execution environment is available. Inspect the final diff and verify the resulting branch/commit. Then perform preview/device QA for the affected customer and admin journeys; source/build success is not a substitute for end-to-end QA.
