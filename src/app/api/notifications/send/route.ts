import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { notificationServices } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

const INVALID_TOKEN_CODES = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

export async function POST(request: Request) {
  try {
    const match = (request.headers.get("authorization") || "").match(/^Bearer\\s+(.+)$/i);
    if (!match) return NextResponse.json({ error: "Sign in before sending a notification." }, { status: 401 });
    const { auth, db, messaging } = notificationServices();
    const decoded = await auth.verifyIdToken(match[1]);
    const body = await request.json().catch(() => ({})) as { enquiryId?: unknown; kind?: unknown; messageId?: unknown };
    if (typeof body.enquiryId !== "string" || !body.enquiryId || !["new-enquiry", "status", "message"].includes(String(body.kind))) {
      return NextResponse.json({ error: "A valid enquiry event is required." }, { status: 400 });
    }
    const enquirySnap = await db.collection("enquiries").doc(body.enquiryId).get();
    if (!enquirySnap.exists) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    const enquiry = enquirySnap.data()!;
    const roleSnap = await db.collection("admins").doc(decoded.uid).get();
    const isAdmin = roleSnap.exists && ["owner", "staff"].includes(String(roleSnap.data()?.role || "").toLowerCase());
    const kind = body.kind as "new-enquiry" | "status" | "message";
    let title = "";
    let message = "";
    let eventKey = "";
    let recipientUids: string[] = [];

    if (kind === "new-enquiry") {
      if (isAdmin || enquiry.customerId !== decoded.uid || enquiry.status !== "New") {
        return NextResponse.json({ error: "Only the owner of a newly saved enquiry can trigger its arrival alert." }, { status: 403 });
      }
      title = "New Africhiko enquiry";
      message = "A customer has submitted a project enquiry.";
      eventKey = "new-" + body.enquiryId;
    } else if (kind === "status") {
      if (!isAdmin) return NextResponse.json({ error: "Only workshop staff can send enquiry status alerts." }, { status: 403 });
      title = "Africhiko enquiry update";
      message = "Your enquiry status is now: " + String(enquiry.status || "Updated") + ".";
      eventKey = "status-" + body.enquiryId + "-" + String(enquiry.status || "updated");
    } else {
      if (typeof body.messageId !== "string" || !body.messageId) return NextResponse.json({ error: "The saved message reference is missing." }, { status: 400 });
      const messageSnap = await db.collection("enquiries").doc(body.enquiryId).collection("messages").doc(body.messageId).get();
      if (!messageSnap.exists) return NextResponse.json({ error: "The saved message was not found." }, { status: 404 });
      const savedMessage = messageSnap.data()!;
      const senderRole = isAdmin ? "admin" : "customer";
      if (savedMessage.senderUid !== decoded.uid || savedMessage.senderRole !== senderRole || (!isAdmin && enquiry.customerId !== decoded.uid)) {
        return NextResponse.json({ error: "You cannot notify participants about this message." }, { status: 403 });
      }
      title = isAdmin ? "Message from Africhiko" : "New customer message";
      message = String(savedMessage.body || "").slice(0, 500);
      eventKey = "message-" + body.messageId;
    }

    if (isAdmin) {
      if (typeof enquiry.customerId === "string") recipientUids = [enquiry.customerId];
    } else {
      const admins = await db.collection("admins").get();
      recipientUids = admins.docs.filter(item => ["owner", "staff"].includes(String(item.data().role || "").toLowerCase())).map(item => item.id);
    }
    if (!recipientUids.length) return NextResponse.json({ sent: false, reason: "no-recipients" });

    const link = isAdmin ? "/account" : "/admin";
    const publicUrl = process.env.AFRICHIKO_PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://africhiko.vercel.app";
    let successCount = 0;
    let failureCount = 0;
    let alreadyRequested = 0;
    for (const uid of [...new Set(recipientUids)]) {
      const tokensSnap = await db.collection("notificationTokens").doc(uid).collection("tokens").get();
      const docs = tokensSnap.docs.filter(item => typeof item.data().token === "string" && item.data().token);
      if (!docs.length) continue;
      const deliveryId = createHash("sha256").update(eventKey + "-" + uid).digest("hex");
      const deliveryRef = db.collection("notificationDeliveries").doc(deliveryId);
      const claimed = await db.runTransaction(async transaction => {
        const existing = await transaction.get(deliveryRef);
        if (existing.exists) return false;
        transaction.create(deliveryRef, { eventKey, recipientUid: uid, status: "sending", createdAt: new Date().toISOString() });
        return true;
      });
      if (!claimed) { alreadyRequested++; continue; }
      try {
        const result = await messaging.sendEachForMulticast({
          tokens: docs.map(item => String(item.data().token)),
          notification: { title, body: message },
          data: { title, body: message, link, enquiryId: body.enquiryId },
          webpush: { fcmOptions: { link: publicUrl + link }, notification: { icon: "/africhiko-icon.svg", badge: "/africhiko-icon.svg", tag: "africhiko-" + body.enquiryId } },
        });
        successCount += result.successCount;
        failureCount += result.failureCount;
        await Promise.all(result.responses.map((response, index) => {
          if (response.success || !response.error?.code || !INVALID_TOKEN_CODES.has(response.error.code)) return Promise.resolve();
          return docs[index].ref.delete();
        }));
        if (result.successCount > 0) {
          await deliveryRef.set({ status: "sent", sentAt: new Date().toISOString() }, { merge: true });
        } else {
          await deliveryRef.delete();
        }
      } catch (error) {
        await deliveryRef.delete().catch(() => undefined);
        throw error;
      }
    }
    return NextResponse.json({ sent: successCount > 0, successCount, failureCount, reason: successCount ? undefined : alreadyRequested ? "already-requested" : "no-registered-devices" });
  } catch (error) {
    console.error("Africhiko push notification failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send the notification." }, { status: 400 });
  }
}
