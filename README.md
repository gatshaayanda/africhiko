# The Plug

**The Plug — Sneakers & Apparel Sourcing**

Mobile-first sourcing and customer operations PWA for sneaker and apparel requests in Botswana.

## Customer flow
Home → Catalogue → Request a product → Request tracking → Customer account

Customers can browse available products, ask The Plug to source a specific sneaker or apparel item, follow request progress, and message the business.

## Operations
/admin is protected by Firebase Authentication plus admins/{uid} with role owner/staff.

## Development
npm install
npm run dev

Quality gates:
npx tsc --noEmit
npm run lint
npm run verify:identity
npm run build

See AGENTS.md for the implementation contract.

## Notifications
Customer and operations notifications use Firebase Cloud Messaging. Notification permission is requested only from the user's explicit settings action.

## Customer journey analytics

The admin dashboard records server-side journey events for request-flow entry, account confirmation, request submission, sharing and invites, notification choices, and external catalogue/Instagram visits. Admin activity is excluded from customer journey counts. Event access is governed by Firestore rules; review the rules and analytics route together when changing event names or payloads.

## Storefront launch QA

Run this checklist against the exact preview commit before merging or announcing a public launch.

### Customer
- [ ] Open the home page on mobile and desktop; confirm published, in-date public finds/offers render with their images and prices.
- [ ] Save a find or offer, open Saved Finds, refresh, and confirm the snapshot remains available.
- [ ] Remove a saved item and confirm it disappears from Saved Finds; confirm saving it again works.
- [ ] Start a request from a product card and confirm the product title, listed-price snapshot, and item type carry into the form and submitted private request.
- [ ] Confirm request copy makes clear that submitting is not payment, a stock reservation, or a confirmed sale.
- [ ] Confirm a request is visible in the customer tracking flow and the admin queue after submission.
- [ ] Test source-request entry, navigation, install/PWA behavior, and browser back on a phone-sized viewport.

### Admin
- [ ] Sign in as an authorized admin; confirm a non-admin account cannot access admin data or write storefront content.
- [ ] Create a draft find and a draft offer with category, price, image, and display order; confirm drafts do not appear publicly.
- [ ] Edit the title, price, category, image, audience, status, and active dates; verify each saved value after refresh.
- [ ] Publish an in-date public item and confirm it appears on the storefront; pause/archive/delete it and verify the expected public behavior.
- [ ] Confirm image upload, saved image URL, preview, replacement, and removal work with the configured Firebase Storage rules.
- [ ] Open journey analytics and compare 7/30/90-day and all-time views; verify product interest, bookmarks, and monthly demand signals.
- [ ] Treat analytics as interaction signals, not unique people, paid orders, confirmed sales, or proof of stock.

### Release boundary
Saved Finds are stored in the current browser/device and are not synced across devices. Product requests are purchase intent only; Frank confirms availability, final price, and payment directly. Do not describe this release as online payment checkout.
