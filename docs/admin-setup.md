# Africhiko admin setup

Africhiko uses Firebase Authentication and Cloud Firestore. Customer account creation is optional: an enquiry can be submitted as a guest, and the guest's anonymous Firebase identity can later be linked to an email/password credential.

## Authorized workshop admins

Only these two email addresses are allowed to administer Africhiko:

- `chikohoraknowledge4@gmail.com`
- `gatshaayanda@gmail.com`

1. In the Africhiko Firebase project, open Authentication → Sign-in method and enable Google. Anonymous authentication may remain enabled for guest customer enquiries.
2. Confirm both allowlisted Google accounts can sign in to the Africhiko Firebase project. The email returned by Google must exactly match one of the two allowlisted addresses.
3. Configure the server-only `FIREBASE_ADMIN_KEY` environment variable with the Africhiko Firebase service-account JSON. Never expose it through a `NEXT_PUBLIC_*` variable or commit it to Git.
4. Visit `/admin` and choose **Continue with Google**. The server verifies the Firebase ID token and allowlisted email before provisioning an owner role; the client also checks the resulting owner/staff role.
5. Deploy `firestore.rules` to the Africhiko Firebase project. The rules independently require both an allowlisted authenticated email and an owner/staff role; a role document alone does not grant access.

The old shared-word/anonymous promotion flow is no longer supported. Admin sign-in uses Google, not a typed password form. Do not manually add other accounts as admins; the allowlist is intentionally restricted to the two addresses above.

## Firestore access model

- `services`: publicly readable catalogue; only an authorized owner/staff member may create, edit or remove catalogue records.
- `workFeed` and `announcements`: published records are public; only authorized staff may create, edit or remove them.
- `enquiries`: a signed-in guest or customer may create an enquiry only for their own Auth UID. Customers can read only their own enquiries. Owner/staff can read the inbox and update operational status, staff notes and follow-up date.
- `enquiries/{enquiryId}/messages`: the customer who owns the enquiry and authorized staff can read the conversation; only the authenticated participant can write a message under their own sender UID and role.
- `admins`: a user can read their own role document; clients cannot write role documents.
- Other collections are denied unless an explicit rule is added for a real implemented feature.

Deploy Firestore rules separately with `firebase deploy --only firestore:rules` after confirming the Firebase CLI is targeting the Africhiko project. Do not deploy Storage rules as part of this task.

## Notifications

- Browser permission is controlled by Chrome/site settings. If permission is already denied, the app cannot reopen the prompt; the user must change the site's Notifications permission to Allow, then reload and register the device again.
- FCM accepting a send request does not prove the device displayed the notification. Test with Africhiko in the background and check the notification tray.
- Notification registration requires `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, the public Firebase web configuration, the service worker and server-only `FIREBASE_ADMIN_KEY`. Verify live delivery separately from a successful API response.
- Notification support may be added to `public/sw.js` only additively. Do not change PWA registration, install prompt lifecycle, cache namespace, offline routes, or existing fetch/cache behavior for notification work.

## Customer account flow

Customers may submit their first enquiry without creating an account. After successful submission, the app offers Google account connection. Linking the anonymous user to a Google credential preserves the same Auth UID, allowing the enquiry to remain associated with the customer's account. If the browser session is lost before linking, the anonymous enquiry is not automatically merged into a different account.
