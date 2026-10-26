"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db, hasFirebaseWebConfig } from "@/lib/firebase/client";

const ALLOWED_ADMIN_EMAILS = ["chikohoraknowledge4@gmail.com", "gatshaayanda@gmail.com"];
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

async function verifyAdminAccess(user: User) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
    throw new Error("This Google account is not authorized for Africhiko workshop operations.");
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/admin/access", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.error === "string" ? result.error : "Africhiko could not verify admin access.");
  }

  const role = await getDoc(doc(db, "admins", user.uid));
  if (!role.exists() || !["owner", "staff"].includes(String(role.data().role))) {
    throw new Error("Your account has no authorized Africhiko workshop role.");
  }
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthorized(false);
      setError("");
      if (!nextUser) {
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        await verifyAdminAccess(nextUser);
        setAuthorized(true);
      } catch (err) {
        setAuthorized(false);
        setError(err instanceof Error ? err.message : "We could not verify this Google account.");
        await signOut(auth);
      } finally {
        setChecking(false);
      }
    });
  }, []);

  async function signIn() {
    if (!hasFirebaseWebConfig) {
      setError("Admin sign-in is not configured yet. Please contact the site owner.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // The auth-state listener verifies the allowlist and server-provisions the role.
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      setError(code === "auth/popup-closed-by-user"
        ? "Google sign-in was cancelled."
        : err instanceof Error ? err.message : "Google sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="adminPage"><div className="adminShell"><div className="emptyState"><div>🔐</div><h1>Opening Operations</h1><p>Checking access…</p></div></div></main>;

  if (user && authorized) {
    return <div className="adminAuthorized"><div className="adminAccountBar"><span>Signed in as {user.email ?? "authorized staff"}</span><button className="button buttonLight" type="button" onClick={() => void signOut(auth)}>Sign out</button></div>{children}</div>;
  }

  return <main className="adminPage"><div className="adminShell"><section className="adminPanel" style={{ maxWidth: 520, margin: "80px auto" }}><span className="kicker">AFRICHIKO · Operations</span><h1>Sign in to Operations</h1><p>Continue with one of the two authorized Africhiko Google accounts to manage fabrication enquiries and workshop content.</p>{error && <p role="alert">{error}</p>}<button className="button buttonPrimary" type="button" onClick={() => void signIn()} disabled={busy}>{busy ? "Opening Google sign-in…" : "Continue with Google ↗"}</button><p style={{ fontSize: 13, marginTop: 16 }}>Workshop access is limited to the two approved Africhiko email accounts.</p></section></div></main>;
}
