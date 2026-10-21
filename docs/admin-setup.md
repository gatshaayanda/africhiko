# Africhiko admin setup

Africhiko uses Firebase Authentication and Cloud Firestore. Customer account creation is optional: an enquiry can be submitted as a guest, and the guest's anonymous Firebase identity can later be linked to an email/password credential.

## One-time owner/staff setup

1. Open the Africhiko Firebase project.
2. In Authentication → Sign-in method, enable Anonymous and Email/Password. Enable Google or Phone only if those providers are deliberately introduced into this app.
3. Create the owner's or staff member's Firebase Authentication user.
4. Copy that user's Auth UID.
5. In Firestore, create admins/{uid} where {uid} is that exact Auth UID, with a string field role set to owner or staff.
6. Open /admin and sign in with the authorized email/password account.

Admin documents must be provisioned by a trusted project owner, not by the public app. The Firestore rules do not allow clients to create or modify admin roles.

## Firestore access model

- services: publicly readable catalogue; only an authorized owner/staff member may create, edit or remove catalogue records.
- enquiries: a signed-in guest or customer may create an enquiry only for their own Auth UID. Customers can read only their own enquiries. Owner/staff can read the inbox and update operational status, staff notes and follow-up date.
- admins: a user can read their own role document; clients cannot write role documents.
- Other collections are denied unless an explicit rule is added for a real implemented feature.

Deploy Firestore rules separately with firebase deploy --only firestore:rules after confirming the Firebase CLI is targeting the Africhiko project. Do not deploy Storage rules as part of this task.

## Customer account flow

Customers may submit their first enquiry without creating an account. After successful submission, the app offers account creation. Linking the anonymous user to an email/password credential preserves the same Auth UID, allowing the enquiry to remain associated with the customer's account. If the browser session is lost before linking, the anonymous enquiry is not automatically merged into a different account.
