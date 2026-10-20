# NAMANE TYRES — Agent Operating Contract

## Product
Namane Tyres is the real customer-facing digital front door and lightweight operating surface for Thapelo Namane Tyre Fitting Business in Gaborone, Botswana.

Business location:
- Plot 16739, Gaborone West Phase 1, Gaborone, Botswana
- Roadside, opposite Padre Pio Medical Centre

Core services: tyre fitting, puncture repair, pressure checks, tyre sales, light wash services and roadside assistance.

This is a real small-business product, not a demo, template, QA app, or generic SaaS.

## Roles
- Product owner / final reviewer: user
- Technical navigator + implementation: ChatGPT through repository tooling
- GitHub is the source of truth
- No Codex dependency

## Workflow
START → INSPECT → BUILD → VERIFY → CHECKPOINT → CONTINUE/RECOVER.

Golden rule: **Unexpected result = STOP → inspect reality → then act.**

Before changing code, inspect the repository, Git state, Firebase configuration, deployed state when relevant, and the actual business workflow. Do not blindly patch production.

## Product model
Customer → Request Assistance / Service Enquiry → Owner → Job → Complete

Tyre inventory → Customer enquiry → Request → Job / Sale

First useful workflow:
1. Customer opens Namane Tyres.
2. Customer chooses Request Help.
3. Customer provides name, phone, vehicle, problem, notes and location where useful.
4. The app truthfully saves the request online or queues it offline.
5. Owner sees the request in Operations.
6. Owner accepts it and moves the job through the real work.
7. Job is completed.

## Public customer experience
The public site must identify Namane Tyres and its Gaborone location, make Request Help prominent, explain real services without inventing prices or guarantees, provide direct phone/WhatsApp fallbacks when configured, work on a phone first, and remain useful when connectivity is poor.

Do not require a customer account just to request help.

Do not invent opening hours, prices, tyre brands, stock, testimonials, promotions, response times, emergency guarantees, or contact numbers.

## Request workflow
Operational statuses:
- New
- Accepted
- In Progress
- Ready / Awaiting Customer
- Complete
- Cancelled

A request submission is not the same as business acceptance.

Customer-facing truth:
- Online save: **Sent to Namane Tyres.**
- Offline queued save: **Saved on this phone — waiting to send.**
- Failure: explain that the request was not recorded and provide a human fallback.

Never say the business received a request until synchronization/receipt is actually established.

Capture GPS only with user permission. If location permission is denied or unavailable, the request can still be submitted with a useful text location/notes.

## Offline-first PWA
Offline is a product capability, not a fake status.

Maintain:
- installable PWA manifest
- registered service worker
- cached app shell
- offline route
- cached public assets after successful visits
- Firestore persistent local cache for structured data
- queued customer request writes through Firestore supported offline persistence
- visible online/offline state
- truthful queued/synchronized wording

The service worker must not cache private Firebase API responses indiscriminately. Do not cache large videos or media blobs in the app shell. Cache public static assets only after successful network responses.

Previously visited public pages remain available. A new request may be queued by Firestore when supported. Admin data may be readable from Firestore local cache after it has previously been loaded. Actions requiring connectivity must say so rather than pretending they completed.

## Firebase
Use the dedicated Firebase project: namane-tyres.

Never use Meating Place, Avram, Translend, AdminHub, or another project's Firebase identifiers, credentials, collections, seed data, or rules.

Browser Firebase configuration must use NEXT_PUBLIC_FIREBASE_* environment variables. Never commit .env.local, service-account JSON, or private credentials.

## Firestore authorization
Recommended boundary:
- public customer request create only, with strict field validation
- customer cannot read/update/delete requests
- admins/{uid} is provisioned outside the client with role owner or staff
- owner/staff can read and update operational requests
- inventory and other private operational data are admin-only unless a future public read requirement is explicitly designed

Never weaken rules to hide a UI or configuration problem.

## Data integrity
Keep request records understandable after the business changes its catalogue. Preserve customer-entered service/tyre text or snapshots rather than depending only on mutable current inventory.

Use server-authoritative timestamps where practical, but do not make the offline customer flow depend on a server round trip just to display a truthful local queued state.

## Media
Business media may live under public/namane-assets/ for stable static content or Firebase Storage when owner-managed media is actually needed. Do not put large media blobs in Firestore. Do not make a child/family image the public identity of the business or expose unnecessary personal information.

## Admin / Operations
/admin is the real owner/staff operations surface. Keep it small and practical: incoming assistance requests, request details and contact actions, status changes, tyre inventory and useful operational notes.

Do not build a generic CRM, ERP, accounting system, fake payment flow, or customer account platform.

## Technical baseline
- Next.js 15
- React 19
- TypeScript
- Firebase Auth
- Firestore with persistent local cache
- Firebase Storage where actually needed
- Vercel
- installable PWA + service worker
- Vercel Analytics / Speed Insights

## Build discipline
Before a meaningful checkpoint run npx tsc --noEmit, npm run lint and npm run build. Do not run npm audit fix --force as blind cleanup. Never commit .env.local or private Firebase credentials.

## Repository boundaries
Other Admin Hub projects may be technical references only. Active domain terminology, metadata, routes, navigation, Firebase config, service worker cache names and customer-facing errors must be Namane Tyres.

## Final review
A feature is complete only when it represents the real Namane Tyres business, the customer flow is understandable, offline/online states are truthful, Firebase uses the dedicated namane-tyres project, Firestore rules protect private data, no fabricated business facts were introduced, checks are addressed, and the deployed result matches customer → owner → job.

The goal is a useful digital front door and lightweight operating surface for a real tyre business — not the most complicated system possible.


## Contacts and admin directory
Contacts are an owner-managed business directory, not app users:
- Existing WhatsApp/business contacts may be imported by an authorized admin.
- A contact becomes operationally relevant when a request/job is associated with the same phone number.
- Do not automatically create Firebase Auth users from contact imports.
- Owner/staff can add, edit, search and delete contacts from /admin.
- Contact history is derived from assistance requests matching the normalized phone number.
- WhatsApp VCF imports are parsed locally in the authenticated browser.
- Contact photos are intentionally ignored.
- The original VCF and generated contact exports are private and must never be committed.

The inspected WhatsApp export contained 112 vCards, 112 valid Botswana phone numbers, 95 unique phone numbers and 16 duplicate phone-number groups. Re-importing must update existing phone-keyed records rather than create duplicates.

## Admin authentication
- V1 uses Firebase email/password authentication only.
- Google sign-in is intentionally deferred.
- Access requires an authenticated UID with admins/{uid}.role equal to owner or staff.
- Auth users and their admin role documents are provisioned outside the public client; the app must not expose self-registration or client-side admin provisioning.

