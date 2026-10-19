# Africhiko

Africhiko Proprietary Limited is a Botswana welding and steel fabrication business.

## Customer journey
Discover fabrication services → describe a project → review the enquiry → submit a quotation request → receive an acknowledgement → follow up with Africhiko.

Services include trailers, sliding gates, burglar bars and security products, carports and sheds, double-decker bunk beds, laser-cut metal elements and custom fabrication. Prices, availability and delivery dates are confirmed through a quotation; submitting an enquiry is not an accepted quote or confirmed job.

## Development
Use Node.js 22 and npm.

```bash
npm ci
npm run verify:identity
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Configure a dedicated Africhiko Firebase project and environment variables before enabling authenticated enquiries, uploads or administration. Never reuse The Plug's production credentials, customer data or infrastructure.

## PWA
Africhiko must remain usable as a website without installation. Android/Chromium shows its install action only when the browser provides `beforeinstallprompt`, and the action invokes that native prompt directly. iOS installation uses the platform's Add to Home Screen flow. Installed-state, offline behavior and real-device installation must be verified separately.

## Business details supplied by the owner
- Plot 17879, Gaborone West Phase 1, Gaborone
- P.O. Box 2115, Bontleng, Gaborone
- +267 73373085
- chiknowledge773@gmail.com

These details are owner-supplied and are not represented as independently verified.
