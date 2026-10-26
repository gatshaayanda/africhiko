import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const match = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!match) return NextResponse.json({ sent: false, error: "Sign in before testing notifications." }, { status: 401 });
    const { auth, db, messaging } = notificationServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const body = await request.json().catch(() => ({})) as { token?: unknown };
    if (typeof body.token !== "string" || !body.token) return NextResponse.json({ sent: false, error: "Enable notifications on this device first." }, { status: 400 });
    const tokens = await db.collection("notificationTokens").doc(decoded.uid).collection("tokens").get();
    if (!tokens.docs.some(item => item.data().token === body.token)) return NextResponse.json({ sent: false, error: "This device token is not registered to your account." }, { status: 403 });
    const role = await db.collection("admins").doc(decoded.uid).get();
    const isAdmin = role.exists && ["owner", "staff"].includes(String(role.data()?.role || "").toLowerCase());
    const title = isAdmin ? "Africhiko workshop alerts are on" : "Africhiko notifications are on";
    const message = isAdmin ? "This device is ready for enquiry and customer-message alerts." : "This device is ready for enquiry progress and workshop message alerts.";
    const publicUrl = process.env.AFRICHIKO_PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://africhiko.vercel.app";
    const result = await messaging.send({
      token: body.token,
      notification: { title, body: message },
      data: { title, body: message, link: isAdmin ? "/admin" : "/account", test: "true" },
      webpush: { fcmOptions: { link: publicUrl + (isAdmin ? "/admin" : "/account") }, notification: { tag: "africhiko-test", icon: "/africhiko-icon.svg", badge: "/africhiko-icon.svg" } },
    });
    return NextResponse.json({ sent: Boolean(result), acceptedByFcm: true });
  } catch (error) {
    console.error("Africhiko test notification failed:", error);
    return NextResponse.json({ sent: false, error: error instanceof Error ? error.message : "Africhiko could not request a test notification." }, { status: 400 });
  }
}
