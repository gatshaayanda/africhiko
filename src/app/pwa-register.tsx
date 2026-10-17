"use client";

// Keep embedded-browser install enforcement explicit at the top-level PWA boundary.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type InstallState = "hidden" | "native" | "embedded";

const INSTALL_DISMISSED_KEY = "africhiko:install:dismissed-at";
const INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function environment() {
  if (typeof window === "undefined") return { standalone: true, ios: false, android: false, embedded: false };
  const ua = navigator.userAgent || "";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const embedded = /WhatsApp|Instagram|FBAN|FBAV|Messenger|Line\/|Twitter|TikTok|Snapchat/i.test(ua) ||
    (/Android/i.test(ua) && /; wv\)/i.test(ua));
  return { standalone, ios, android, embedded };
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, new Date().toISOString());
  } catch {
    // Installation remains optional when storage is unavailable.
  }
}

function clearDismissal() {
  try { window.localStorage.removeItem(INSTALL_DISMISSED_KEY); } catch {}
}

export default function PwaRegister({ initialEmbedded = false, initialAndroid = false }: { initialEmbedded?: boolean; initialAndroid?: boolean }) {
  const [offline, setOffline] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const installPromptRef = useRef<InstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>(initialEmbedded ? "embedded" : "hidden");
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [embeddedAndroid, setEmbeddedAndroid] = useState(initialEmbedded && initialAndroid);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const embeddedActionRef = useRef<HTMLButtonElement | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const env = environment();
    const embedded = initialEmbedded || env.embedded;
    setEmbeddedAndroid((initialEmbedded && initialAndroid) || (env.embedded && env.android));

    const online = () => {
      setOffline(false);
      setReconnecting(true);
      window.setTimeout(() => {
        setReconnecting(false);
      }, 1200);
    };
    const off = () => {
      setReconnecting(false);
      setOffline(true);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      const current = environment();
      if (current.standalone) return;
      event.preventDefault();
      const prompt = event as InstallPromptEvent;
      installPromptRef.current = prompt;
      // Retain the one-shot native event for the user's explicit Install click.
      // Do not interrupt page load with a second, custom install screen.
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", off);
    const promptWindow = window as Window & { __africhikoInstallPrompt?: Event; __africhikoPwaListenerReady?: boolean };
    // The browser can emit beforeinstallprompt before React hydrates. Adopt the
    // event captured by the tiny beforeInteractive script before listening normally.
    promptWindow.__africhikoPwaListenerReady = true;
    const earlyPrompt = promptWindow.__africhikoInstallPrompt;
    if (earlyPrompt) {
      delete promptWindow.__africhikoInstallPrompt;
      onBeforeInstallPrompt(earlyPrompt);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    if (env.standalone && !embedded) {
      setInstallState("hidden");
    } else if (embedded) {
      // Embedded browsers are a compatibility gate, not an install promotion.
      setInstallState("embedded");
    }

    const requestInstall = () => {
      const current = environment();
      if (current.standalone) return;
      if (current.embedded) {
        setInstallState("embedded");
        return;
      }
      if (installPromptRef.current) {
        // Invoke the browser's native prompt directly from the customer's click.
        void install();
        return;
      }
      // Match the working Odi install flow: never let a visible install CTA silently
      // do nothing when this browser has not emitted beforeinstallprompt.
      setInstallHelpOpen(true);
      setInstallState("native");
    };
    const appInstalled = () => {
      installPromptRef.current = null;
      setInstallHelpOpen(false);
      setInstallState("hidden");
      clearDismissal();
    };
    window.addEventListener("africhiko-open-install", requestInstall);
    window.addEventListener("appinstalled", appInstalled);

    let registration: ServiceWorkerRegistration | null = null;
    const inspect = () => {
      if (registration?.waiting && navigator.serviceWorker.controller) setUpdateReady(registration.waiting);
    };
    const register = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        inspect();
        registration.addEventListener("updatefound", () => {
          const worker = registration?.installing;
          if (!worker) return;
          worker.addEventListener("statechange", inspect);
        });
        await registration.update();
        inspect();
      } catch {}
    };

    void register();
    const controllerChange = () => { if (reloadForUpdate.current) window.location.reload(); };
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChange);

    return () => {
      window.removeEventListener("africhiko-open-install", requestInstall);
      window.removeEventListener("appinstalled", appInstalled);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChange);
    };
  }, [initialEmbedded, initialAndroid]);

  useEffect(() => {
    if (installState !== "embedded" && installState !== "native") return;

    const isEmbeddedGate = installState === "embedded";
    const previousOverflow = document.body.style.overflow;
    if (isEmbeddedGate) document.body.style.overflow = "hidden";
    if (installState === "embedded") embeddedActionRef.current?.focus();
    else document.querySelector<HTMLButtonElement>(".plugInstallPrimary")?.focus();

    const keepDialogFocused = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEmbeddedGate) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          dismissInstall();
        }
      }
      if (event.key === "Tab" && isEmbeddedGate) {
        event.preventDefault();
        embeddedActionRef.current?.focus();
      }
    };

    window.addEventListener("keydown", keepDialogFocused, true);
    return () => {
      if (isEmbeddedGate) document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keepDialogFocused, true);
    };
  }, [installState, installHelpOpen]);

  async function install() {
    const prompt = installPromptRef.current;
    if (!prompt) {
      // Native install events are browser-controlled. Show the same explicit
      // platform-specific fallback as Odi rather than silently returning.
      const env = environment();
      setInstallHelpOpen(true);
      setInstallState("native");
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "dismissed") rememberDismissal();
    } catch {
      // The event is one-shot and browser-controlled. Do not replace it with
      // generic Chrome-menu instructions when the native prompt fails.
    } finally {
      installPromptRef.current = null;
      setInstallHelpOpen(false);
      setInstallState("hidden");
    }
  }

  function dismissInstall() {
    rememberDismissal();
    setInstallHelpOpen(false);
    setInstallState("hidden");
  }

  function openBrowser() {
    const url = window.location.href;
    const env = environment();
    if (env.android) {
      window.location.href = "intent://" + url.replace(/^https?:\/\//, "") + "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function applyUpdate() {
    // Always provide a visible outcome. Normally controllerchange reloads as soon
    // as the waiting worker activates; the timeout covers a stale/nonresponsive worker.
    reloadForUpdate.current = true;
    if (updateReady) {
      try {
        updateReady.postMessage({ type: "SKIP_WAITING" });
      } catch {
        // The full navigation below remains the recovery path.
      }
    }
    window.setTimeout(() => {
      if (reloadForUpdate.current) window.location.reload();
    }, 1800);
  }

  const installShellStyle: CSSProperties = { position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 1000, maxWidth: 720, margin: "0 auto", padding: 16, borderRadius: 18, background: "#FFFFFF", color: "#111318", boxShadow: "0 12px 40px rgba(0,0,0,.18)", border: "1px solid rgba(17,19,24,.12)" };
  const embeddedInstallStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.82)", backdropFilter: "blur(4px)", overscrollBehavior: "contain" };
  const installCard = installState === "native" ? (
    <div style={installShellStyle} role="presentation">
      <section className="plugInstallModal" role="dialog" aria-modal="false" aria-labelledby="plug-install-title" aria-describedby="plug-install-message">
        <div className="plugInstallTop"><span className="plugInstallMark">A</span><span className="plugInstallTag">AFRICHIKO · BOTSWANA</span><button type="button" className="plugInstallClose" aria-label="Close install prompt" onClick={dismissInstall}>×</button></div>
        <div className="plugInstallKicker">WELDING & STEEL FABRICATION</div>
        <h2 id="plug-install-title">Africhiko.<br/><em>One tap away.</em></h2>
        <p id="plug-install-message">If your browser provides a native install prompt, this button opens it directly. Installation is optional; Africhiko also works as a website.</p>
        {installHelpOpen ? (
          <div className="plugInstallSteps" role="status" aria-live="polite">
            <strong>Native install prompt unavailable</strong>
            <p>Your browser has not offered its install prompt in this session. Africhiko still works here as a website. You can try installation again later in a supported browser.</p>
            <button type="button" className="plugInstallPrimary" onClick={dismissInstall}>Continue on the website</button>
          </div>
        ) : (
          <>
            <div className="plugInstallModalBenefits"><span><b>01</b><strong>Quick access</strong><small>Open Africhiko from your home screen.</small></span><span><b>02</b><strong>Your requests</strong><small>Return to your sourcing journey and account.</small></span><span><b>03</b><strong>Private by account</strong><small>Keep your project information close.</small></span></div>
            <button type="button" className="plugInstallPrimary" onClick={() => void install()}>Install Africhiko →</button>
            <button type="button" className="plugInstallSecondary" onClick={dismissInstall}>Not now</button>
          </>
        )}
        <p className="plugInstallFootnote">No app-store search needed. Your browser will guide the installation.</p>
      </section>
    </div>
  ) : installState === "embedded" ? (
    <div style={embeddedInstallStyle} role="alertdialog" aria-modal="true" aria-labelledby="plug-embedded-title" aria-describedby="plug-embedded-message">
      <div className="pwaInstallInfo" style={{...installShellStyle, position: "relative", left: "auto", right: "auto", bottom: "auto", width: "100%", maxWidth: 520, margin: 0}}>
        <div>
          <strong id="plug-embedded-title"><span aria-hidden="true">🌐 </span>OPEN AFRICHIKO IN YOUR BROWSER</strong>
          <span id="plug-embedded-message">{embeddedAndroid ? <>Tap below to open Africhiko in Chrome. Then open the <b>⋮ menu</b> and choose <b>Install app</b>.</> : <>Africhiko opened inside another app. Use that app’s menu to open this page in your browser, then look for <b>Install app</b> in the browser menu.</>}</span>
        </div>
        <div className="pwaInstallActions" style={{display:"flex",justifyContent:"flex-end"}}>
          <button ref={embeddedActionRef} type="button" style={{background:"#6D28D9",color:"#fff"}} onClick={openBrowser}>{embeddedAndroid ? "OPEN IN CHROME" : "OPEN IN BROWSER"}</button>
        </div>
      </div>
    </div>
  ) : null;

  return <>
    {offline && <div className="offlineBanner" role="status" aria-live="polite"><span aria-hidden="true">⚡</span> Offline · Saved public finds may still be available on this device. Requests and account changes need a connection.</div>}
    {!offline && reconnecting && <div className="offlineBanner reconnectingBanner" role="status" aria-live="polite"><span aria-hidden="true">↻</span> Reconnected · Africhiko is syncing and checking for the latest information.</div>}
    {!environment().standalone && installState !== "embedded" && (
      <button
        type="button"
        className="plugPwaInstallButton"
        onClick={() => {
          if (installPromptRef.current) {
            void install();
            return;
          }
          const env = environment();
              setInstallHelpOpen(true);
          setInstallState("native");
        }}
      >
        Install Africhiko ↓
      </button>
    )}
    {installCard}
    {updateReady && <div className="pwaUpdate" role="status" aria-live="polite"><div><strong>Africhiko update is ready</strong><span>Refresh when you are ready.</span></div><button type="button" className="button buttonPrimary" onClick={applyUpdate}>Refresh</button></div>}
  </>;
}
