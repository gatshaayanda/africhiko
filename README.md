# Africhiko

**Africhiko Proprietary Limited — welding and steel fabrication in Gaborone, Botswana.**

This repository starts from the mandatory `gatshaayanda/the-plug` foundation and is being adapted into Africhiko's service storefront and project-enquiry workflow. The supplied company details are owner-provided; they have not been independently verified.

## Customer journey
Discover services → search/filter → add services to a basket → describe project and attach a reference → review the enquiry summary → submit for review → follow up. Customers may browse and submit a first enquiry without creating an account. A request is not a quotation, accepted quote, payment or confirmed job.

## Admin
`/admin` requires Firebase Authentication and a matching `admins/{uid}` record with role `owner` or `staff`. Authorized staff can manage service descriptions/prices and review/update enquiry status. Provision admin records only through a trusted Firebase Console/Admin SDK process; the client cannot grant its own role.

## Development
```bash
npm ci
npm run dev
npm run verify:identity
npm run verify:clone-readiness
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Copy `.env.example` to an ignored local `.env.local` and supply the dedicated Africhiko Firebase web configuration. Do not commit environment files. Set `NEXT_PUBLIC_BASE_URL` to the actual canonical URL before a deployment. Firebase rules in this repository are source only; deploying rules is a separate authorized action.

## PWA
Website use does not require installation. The app retains a native `beforeinstallprompt` path where supported, a browser handoff for embedded browsers, platform guidance when no native prompt is available, and a distinct Africhiko service-worker/cache namespace. The offline page explicitly states that enquiries are not sent offline. Real-device install/offline behavior remains to be tested.

## Media
The three workshop tiles currently use CSS concept illustrations. Replace them with approved Africhiko photographs/videos when supplied; no placeholder image is represented as a real client project.
