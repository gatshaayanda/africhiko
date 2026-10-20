# Namane Tyres admin setup

V1 admin access uses Firebase Email/Password authentication. Google sign-in is intentionally deferred.

## One-time owner setup

1. In the dedicated Firebase project namane-tyres, open Authentication → Sign-in method.
2. Enable Email/Password.
3. Create the owner's Firebase Authentication user with the owner's email and password.
4. Copy that user's Firebase Auth UID.
5. In Firestore, create:
   - Collection: admins
   - Document ID: the owner's Auth UID
   - Field: role = owner
6. Open /admin and sign in with that email/password.

Do not create an admin document for an arbitrary UID. The Firestore rules only allow users whose authenticated UID has an admins/{uid} document with role owner or staff.

## Import the existing WhatsApp contacts

The admin directory has an Import VCF action.

The current WhatsApp export was inspected locally and contains:
- 112 vCards
- 112 valid Botswana phone numbers
- 95 unique phone numbers
- 16 duplicate phone-number groups
- WhatsApp Business metadata on some records

The importer:
- parses the VCF in the browser
- normalizes Botswana numbers to +267...
- deduplicates by phone number
- preserves WhatsApp Business name/description when present
- ignores contact photos
- writes contacts only after the authorized admin is signed in
- updates an existing phone-keyed record instead of creating a duplicate

The original VCF remains local and is ignored by Git.

## Adding new contacts

Use Add contact in the Customer contacts tab. New records can be added at any time without creating a Firebase Auth account.

A contact is not automatically an app user. Customer request history is matched to the contact by normalized phone number.
