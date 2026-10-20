# Namane Tyres

Namane Tyres is the customer-facing digital front door and lightweight operations surface for Thapelo Namane Tyre Fitting Business in Gaborone, Botswana.

## Business

- Plot 16739, Gaborone West Phase 1, Gaborone, Botswana
- Roadside, opposite Padre Pio Medical Centre
- Tyre fitting
- Puncture repair
- Pressure checks
- Tyre sales
- Light wash services
- Roadside assistance

## Customer flow

Customer → Request Assistance → Owner → Job → Complete

Customers do not need an account to request help. The request form accepts name, phone, vehicle, problem, optional landmark/notes and optional device location.

## Offline-first behaviour

The app is an installable PWA with a service worker and Firestore persistent local cache.

Customer-facing states are intentionally truthful:

- Online request: **Sent to Namane Tyres.**
- Offline request: **Saved on this phone — waiting to send.**
- Failed save: the app does not claim that Namane Tyres received it.

Firestore synchronizes queued writes when connectivity returns.

## Operations

`/admin` is protected by Firebase Authentication plus an `admins/{uid}` role document with `owner` or `staff`.

Operations currently covers:

- incoming assistance requests
- request status: New, Accepted, In Progress, Ready / Awaiting Customer, Complete, Cancelled
- phone and WhatsApp contact actions
- tyre inventory: size, brand, condition, quantity, price, availability and notes

## Media

Stable business-owned media lives under `public/namane-assets/`.

The public site uses real Namane Tyres imagery rather than inherited template media. Large videos are deliberately excluded from the service-worker app shell cache.

## Stack

- Next.js 15 / React 19 / TypeScript
- Firebase Authentication
- Cloud Firestore with persistent local cache
- Firebase Storage rules ready for future owner-managed media
- Installable PWA + service worker
- Vercel Analytics + Speed Insights
- Vercel deployment from GitHub `main`

## Development

Node version is pinned in `.nvmrc`.

Run:

```bash
npm install
npm run dev
```

Quality gates:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Never commit `.env.local`, service-account credentials or other private secrets.

See [AGENTS.md](AGENTS.md) for the product and implementation contract.
