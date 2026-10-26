import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

const INVALID_TOKEN_CODES = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return NextResponse.json({ error: "Sign in before sending a notification." }, { status: 401 });
    const { auth, db, messaging } = notificationServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const body = await request.json().catch(() => ({})) as { enquiryId?: unknown; title?: unknown; message?: unknown; link?: unknown };
    if (typeof body.enquiryId !== "string" || !body.enquiryId || typeof body.title !== "string" || typeof body.message !== "string") {
      return NextResponse.json({ error: "A valid enquiry and notification message are required." }, { status: 400 });
    }
    const enquirySnap = await db.collection("enquiries").doc(body.enquiryId).get();
    if (!enquirySnap.exists) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    const enquiry = enquirySnap.data()!;
    const roleSnap = await db.collection("admins").doc(decoded.uid).get();
    const isAdmin = roleSnap.exists && ["owner", "staff"].includes(String(roleSnap.data()?.role || "").toLowerCase());
    if (!isAdmin && enquiry.customerId !== decoded.uid) return NextResponse.json({ error: "You cannot notify this enquiry's participants." }, { status: 403 });

    const recipientUids: string[] = [];
    if (isAdmin) {
      if (typeof enquiry.customerId === "string") recipientUids.push(enquiry.customerId);
    } else {
      const admins = await db.collection("admins").get();
      recipientUids.push(...admins.docs.filter(item => ["owner", "staff"].includes(String(item.data().role || "").toLowerCase())).map(item => item.id));
    }
    if (!recipientUids.length) return NextResponse.json({ sent: false, reason: "no-recipients" });
    const title = body.title.slice(0, 120);
    const message = body.message.slice(0, 500);
    const link = isAdmin ? "/account" : "/admin";
    const publicUrl = process.env.AFRICHIKO_PUBLIC_URL || "https://africhiko.vercel.app";
    let successCount = 0;
    let failureCount = 0;
    for (const uid of [...new Set(recipientUids)]) {
      const tokensSnap = await db.collection("notificationTokens").doc(uid).collection("tokens").get();
      const docs = tokensSnap.docs.filter(item => typeof item.data().token === "string" && item.data().token);
      if (!docs.length) continue;
      const result = await messaging.sendEachForMulticast({
        tokens: docs.map(item => String(item.data().token)),
        data: { title, body: message, link: typeof body.link === "string" && body.link.startsWith("/") ? body.link : link, enquiryId: body.enquiryId },
        webpush: { fcmOptions: { link: publicUrl + link }, notification: { icon: "/africhiko-icon.svg", badge: "/africhiko-icon.svg", tag: "africhiko-" + body.enquiryId } },
      });
      successCount += result.successCount;
      failureCount += result.failureCount;
      await Promise.all(result.responses.map((response, index) => {
        if (response.success || !response.error?.code || !INVALID_TOKEN_CODES.has(response.error.code)) return Promise.resolve();
        return docs[index].ref.delete();
      }));
    }
    return NextResponse.json({ sent: successCount > 0, successCount, failureCount, reason: successCount ? undefined : "no-registered-devices" });
  } catch (error) {
    console.error("Africhiko push notification failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send the notification." }, { status: 400 });
  }
}
