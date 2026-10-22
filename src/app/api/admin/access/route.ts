import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Server configuration is missing FIREBASE_ADMIN_KEY.");
  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_ADMIN_KEY must contain the service-account JSON.");
  }
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const configuredWord = process.env.AFRICHIKO_ADMIN_WORD;
    if (!configuredWord) {
      return NextResponse.json({ error: "Admin access is not configured yet. Set AFRICHIKO_ADMIN_WORD in the server environment." }, { status: 503 });
    }
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Sign-in session is missing. Please retry." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { word?: unknown };
    if (typeof body.word !== "string" || !safeEqual(body.word, configuredWord)) {
      return NextResponse.json({ error: "That access word is not correct." }, { status: 401 });
    }
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    if (decoded.firebase?.sign_in_provider !== "anonymous") {
      return NextResponse.json({ error: "Use a fresh workshop access session." }, { status: 401 });
    }
    const db = getFirestore(app);
    const adminRef = db.collection("admins").doc(decoded.uid);
    await db.runTransaction(async transaction => {
      const existing = await transaction.get(adminRef);
      const role = String(existing.data()?.role || "").toLowerCase();
      if (existing.exists && !["owner", "staff"].includes(role)) {
        throw new Error("This session already has a non-admin role and cannot be promoted.");
      }
      if (!existing.exists) transaction.create(adminRef, { role: "owner", createdAt: new Date().toISOString(), provisionedBy: "server-admin-word" });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin access verification failed.";
    const status = /FIREBASE_ADMIN_KEY|service-account JSON/.test(message) ? 503 : /already has a non-admin/.test(message) ? 403 : 401;
    return NextResponse.json({ error: status === 503 ? "Server admin credentials are missing or invalid. Configure FIREBASE_ADMIN_KEY." : status === 403 ? message : "Admin access could not be verified. Check the access word and try again." }, { status });
  }
}
