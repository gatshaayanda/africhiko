"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setAuthorized(false);
        setChecking(false);
        return;
      }
      try {
        const role = await getDoc(doc(db, "admins", nextUser.uid));
        const allowed = role.exists() && ["owner", "staff"].includes(String(role.data().role));
        setAuthorized(allowed);
        if (!allowed) await signOut(auth);
      } catch {
        setAuthorized(false);
        await signOut(auth);
      } finally {
        setChecking(false);
      }
    });
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const role = await getDoc(doc(db, "admins", credential.user.uid));
      if (!role.exists() || !["owner", "staff"].includes(String(role.data().role))) {
        await signOut(auth);
        throw new Error("This account is not enabled for Namane Tyres Operations.");
      }
      setAuthorized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not sign you in. Please check your details.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="adminPage"><div className="adminShell"><div className="emptyState"><div>🔐</div><h1>Opening Operations</h1><p>Checking access…</p></div></div></main>;

  if (user && authorized) {
    return <div className="adminAuthorized"><div className="adminAccountBar"><span>Signed in as {user.email ?? "authorized staff"}</span><button className="button buttonLight" type="button" onClick={() => void signOut(auth)}>Sign out</button></div>{children}</div>;
  }

  return <main className="adminPage"><div className="adminShell"><section className="adminPanel" style={{ maxWidth: 520, margin: "80px auto" }}><span className="kicker">NAMANE TYRES · Operations</span><h1>Sign in to Operations</h1><p>Use an authorized owner or staff account to manage customer requests and tyre inventory.</p><form className="adminForm" onSubmit={signIn}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p role="alert">{error}</p>}<button className="button buttonPrimary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form></section></div></main>;
}
