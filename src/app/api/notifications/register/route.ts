import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return NextResponse.json({ error: "Sign in before enabling notifications." }, { status: 401 });
    const { auth, db } = notificationServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const body = await request.json().catch(() => ({})) as { token?: unknown; userAgent?: unknown };
    if (typeof body.token !== "string" || body.token.length < 20 || body.token.length > 4096) {
      return NextResponse.json({ error: "The browser did not provide a valid notification token." }, { status: 400 });
    }
    const tokenId = createHash("sha256").update(body.token).digest("hex");
    await db.doc(`notificationTokens/${decoded.uid}/tokens/${tokenId}`).set({
      token: body.token,
      updatedAt: new Date().toISOString(),
      userAgent: typeof body.userAgent === "string" ? body.userAgent.slice(0, 300) : "",
    }, { merge: true });
    return NextResponse.json({ registered: true });
  } catch (error) {
    console.error("Africhiko notification registration failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not register this device." }, { status: 400 });
  }
}
