"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { addDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { app, auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

type Message = { id: string; senderUid: string; senderRole: "admin" | "customer"; body: string; createdAt?: string; createdAtServer?: { toDate?: () => Date } };

export async function sendAfrichikoPush(enquiryId: string, title: string, message: string, link: string) {
  const user = auth.currentUser;
  if (!user || !hasFirebaseWebConfig) return;
  try {
    const token = await user.getIdToken();
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ enquiryId, title, message, link }),
    });
  } catch (error) {
    // The enquiry/message remains saved; push is an additional delivery channel.
    console.warn("Africhiko push could not be requested:", error);
  }
}

export function NotificationSettings({ user, role }: { user: User | null; role: "customer" | "admin" }) {
  const [state, setState] = useState<"idle" | "working" | "enabled" | "error">("idle");
  const [message, setMessage] = useState("");
  const [registeredToken, setRegisteredToken] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  async function enable() {
    if (!user) { setState("error"); setMessage("Sign in first so this device can be linked to your Africhiko account."); return; }
    if (!hasFirebaseWebConfig) { setState("error"); setMessage("Firebase is not configured in this environment."); return; }
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) { setState("error"); setMessage("Push notifications are not configured yet. Add Africhiko's public VAPID key to NEXT_PUBLIC_FIREBASE_VAPID_KEY in Vercel, then redeploy."); return; }
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("error"); setMessage("This browser does not support web push. Try current Chrome or install Africhiko from Safari on an iPhone/iPad before enabling notifications."); return;
    }
    setState("working"); setMessage("");
    try {
      const supported = await isSupported();
      if (!supported) throw new Error("Firebase messaging is not supported by this browser.");
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications were not allowed. You can enable them in this browser's site settings and try again.");
      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) throw new Error("The browser did not return a notification token. Check the VAPID key and try again.");
      const idToken = await user.getIdToken();
      const response = await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
        body: JSON.stringify({ token, userAgent: navigator.userAgent }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This device could not be registered.");
      setRegisteredToken(token);
      setState("enabled");
      setMessage(role === "admin" ? "This device is registered for workshop enquiry and message alerts." : "This device is registered for enquiry progress and workshop message alerts.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not enable notifications. Check browser permission and Firebase setup.");
    }
  }

  async function sendTest() {
    if (!user || !registeredToken || testBusy) return;
    setTestBusy(true);
    setMessage("");
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
        body: JSON.stringify({ token: registeredToken }),
      });
      const result = await response.json().catch(() => ({})) as { sent?: boolean; error?: string };
      if (!response.ok || !result.sent) throw new Error(result.error || "Firebase Cloud Messaging did not accept the test notification.");
      setMessage("Firebase Cloud Messaging accepted the test send. Put this app in the background and check the device notification tray; acceptance does not guarantee delivery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The test notification could not be requested.");
      setState("error");
    } finally { setTestBusy(false); }
  }

  return <section className="af-notification-settings" aria-label="Push notification settings">
    <div><p className="af-eyebrow">KEEP IN THE LOOP</p><h3>{role === "admin" ? "Workshop alerts" : "Enquiry alerts"}</h3>
      <p>{role === "admin" ? "Get a browser notification when a customer sends an enquiry message." : "Get updates when the workshop changes your enquiry status or replies to your message."}</p>
      {message && <p className={"af-form-message " + (state === "error" ? "af-error" : "")} role="status" aria-live="polite">{message}</p>}
    </div>
    <div className="af-notification-actions"><button type="button" className="af-button af-button-outline" disabled={state === "working" || state === "enabled"} onClick={() => void enable()}>{state === "working" ? "Setting up…" : state === "enabled" ? "Notifications enabled ✓" : "Enable notifications ↗"}</button>{state === "enabled" && <button type="button" className="af-button" disabled={testBusy} onClick={() => void sendTest()}>{testBusy ? "Requesting test…" : "Send a test notification"}</button>}</div>
  </section>;
}

export function EnquiryConversation({ enquiryId, user, role }: { enquiryId: string; user: User | null; role: "customer" | "admin" }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user || !hasFirebaseWebConfig || !enquiryId) { setMessages([]); return; }
    return onSnapshot(collection(db, "enquiries", enquiryId, "messages"), snapshot => {
      setMessages(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Message)).sort((a, b) => {
        const at = a.createdAtServer?.toDate?.()?.getTime() ?? Date.parse(a.createdAt || "");
        const bt = b.createdAtServer?.toDate?.()?.getTime() ?? Date.parse(b.createdAt || "");
        return at - bt;
      }));
    }, () => setError("Messages could not be loaded. Check your enquiry access and connection."));
  }, [enquiryId, user?.uid]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!user || !body || busy) return;
    if (body.length > 2000) { setError("Keep messages under 2,000 characters."); return; }
    setBusy(true); setError("");
    try {
      await addDoc(collection(db, "enquiries", enquiryId, "messages"), {
        senderUid: user.uid,
        senderRole: role,
        body,
        createdAt: new Date().toISOString(),
        createdAtServer: serverTimestamp(),
      });
      setDraft("");
      await sendAfrichikoPush(enquiryId, role === "admin" ? "Message from Africhiko" : "New customer message", body.slice(0, 180), role === "admin" ? "/account" : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message was not sent. Please retry.");
    } finally { setBusy(false); }
  }

  return <section className="af-conversation" aria-label="Enquiry messages">
    <h4>Messages with {role === "admin" ? "the customer" : "the workshop"}</h4>
    <div className="af-conversation-list" aria-live="polite">
      {messages.map(item => <article key={item.id} className={"af-message " + (item.senderUid === user?.uid ? "af-message-own" : "")}>
        <strong>{item.senderRole === "admin" ? "Africhiko workshop" : "Customer"}</strong>
        <p>{item.body}</p>
        <small>{item.createdAtServer?.toDate?.()?.toLocaleString() || item.createdAt || "Just sent"}</small>
      </article>)}
      {!messages.length && <p className="af-form-footnote">No messages yet. Use this space to ask a question or share an update about this enquiry.</p>}
    </div>
    <form className="af-conversation-compose" onSubmit={send}>
      <label className="af-sr-only" htmlFor={"message-" + enquiryId}>Write a message</label>
      <textarea id={"message-" + enquiryId} rows={2} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder={role === "admin" ? "Reply to the customer…" : "Ask the workshop a question…"} required />
      <button className="af-button" disabled={busy || !draft.trim()}>{busy ? "Sending…" : "Send message ↗"}</button>
    </form>
    {error && <p className="af-form-message af-error" role="alert">{error}</p>}
  </section>;
}
