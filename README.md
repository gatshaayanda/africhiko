# Africhiko

Africhiko is a customer-first steel fabrication and welding enquiry PWA for Botswana.

## Customer journey

1. Browse the service catalogue and indicative starting prices.
2. Add services to a single project request, or describe a custom project.
3. Submit contact details, project location, dimensions, materials and notes for review.
4. After submission, create a customer account to keep enquiries associated with the same Firebase identity, or continue as a guest.

An enquiry is not a confirmed quotation or job. Africhiko reviews the details before discussing a quote.

## Customer account

The account page supports email/password sign-in and account creation. When a guest creates an account during the enquiry journey, the existing anonymous Firebase user is linked to the new credential so the customer identity and associated enquiries are preserved.

## Operations

The `/admin` route is the staff surface for reviewing enquiries and managing fabrication services. It depends on the Africhiko Firebase project configuration and the project's configured staff authorization.

## Stack

- Next.js 15 / React 19 / TypeScript
- Firebase Authentication and Cloud Firestore
- Firebase Storage for project reference uploads and service media
- Progressive Web App support
- Vercel Analytics and Speed Insights
- Vercel deployment from GitHub `main`

## Development

Install dependencies and run the local development server:

```bash
npm install
npm run dev
```

Before QA, configure the `NEXT_PUBLIC_FIREBASE_*` environment variables for the Africhiko Firebase project and verify the relevant Firestore and Storage rules. Run lint, type checks and a production build before considering the branch release-ready.

Never commit `.env.local`, service-account credentials or other private secrets.
