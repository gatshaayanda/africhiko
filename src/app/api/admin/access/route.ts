import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const runtime = "nodejs";
const ALLOWED_ADMIN_EMAILS = new Set(["chikohoraknowledge4@gmail.com", "gatshaayanda@gmail.com"]);

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Server configuration is missing FIREBASE_ADMIN_KEY.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw); }
  catch { throw new Error("FIREBASE_ADMIN_KEY must contain the service-account JSON."); }
  if (typeof serviceAccount.private_key === "string") serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

export async function POST(request: Request) {
  try {
    const match = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!match) return NextResponse.json({ error: "Sign in with an authorized Africhiko email first." }, { status: 401 });
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(match[1]);
    const email = String(decoded.email || "").trim().toLowerCase();
    if (!ALLOWED_ADMIN_EMAILS.has(email) || decoded.firebase?.sign_in_provider === "anonymous") {
      return NextResponse.json({ error: "This account is not authorized for Africhiko workshop operations." }, { status: 403 });
    }
    const db = getFirestore(app);
    const adminRef = db.collection("admins").doc(decoded.uid);
    await db.runTransaction(async transaction => {
      const existing = await transaction.get(adminRef);
      const role = String(existing.data()?.role || "").toLowerCase();
      if (existing.exists && !["owner", "staff"].includes(role)) throw new Error("This account has a conflicting role.");
      if (!existing.exists) transaction.create(adminRef, { role: "owner", email, createdAt: new Date().toISOString(), provisionedBy: "email-allowlist" });
      else if (String(existing.data()?.email || "").toLowerCase() !== email) transaction.set(adminRef, { email }, { merge: true });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access verification failed.";
    const status = /FIREBASE_ADMIN_KEY|service-account JSON/.test(message) ? 503 : /conflicting role/.test(message) ? 403 : 401;
    return NextResponse.json({ error: status === 503 ? "Server admin credentials are missing or invalid. Configure FIREBASE_ADMIN_KEY." : status === 403 ? message : "Admin access could not be verified. Check your authorized email and Firebase password." }, { status });
  }
}
