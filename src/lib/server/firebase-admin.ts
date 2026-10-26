import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function adminApp() {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Firebase Admin is not configured. Add FIREBASE_ADMIN_KEY to the server environment.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("FIREBASE_ADMIN_KEY is not valid JSON."); }
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

export function notificationServices() {
  const app = adminApp();
  return { auth: getAuth(app), db: getFirestore(app), messaging: getMessaging(app) };
}
