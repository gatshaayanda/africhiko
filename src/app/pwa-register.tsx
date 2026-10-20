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

function isInstallDismissedRecently() {
  try {
    const dismissedAt = window.localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (!dismissedAt) return false;
    const timestamp = Date.parse(dismissedAt);
    return Number.isFinite(timestamp) && Date.now() - timestamp < INSTALL_DISMISS_MS;
  } catch {
    return false;
  }
}

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
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installInProgress, setInstallInProgress] = useState(false);
  const [canShowManualInstall, setCanShowManualInstall] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const embeddedActionRef = useRef<HTMLButtonElement | null>(null);
  const reloadForUpdate = useRef(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const env = environment();
    setIsStandalone(env.standalone);
    setIsIOS(env.ios);
    const dismissed = isInstallDismissedRecently();
    setInstallDismissed(dismissed);
    setCanShowManualInstall(env.ios);
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
      setCanInstall(true);
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
        void install();
        return;
      }
      // The browser owns the native install prompt. Only iOS needs a manual
      // installation path because Safari does not expose beforeinstallprompt.
      if (current.ios && !isInstallDismissedRecently()) {
        setInstallHelpOpen(true);
        setCanShowManualInstall(true);
      }
    };
    const syncInstalledState = () => {
      const current = environment();
      setIsStandalone(current.standalone);
      setIsIOS(current.ios);
      if (current.standalone) {
        installPromptRef.current = null;
        setCanInstall(false);
        setInstallHelpOpen(false);
        setInstallState("hidden");
      }
    };
    const appInstalled = () => {
      installPromptRef.current = null;
      setCanInstall(false);
      setCanShowManualInstall(false);
      setInstallDismissed(true);
      setIsStandalone(true);
      setInstallHelpOpen(false);
      setInstallState("hidden");
      clearDismissal();
    };
    window.addEventListener("africhiko-open-install", requestInstall);
    window.addEventListener("appinstalled", appInstalled);
    window.addEventListener("pageshow", syncInstalledState);
    document.addEventListener("visibilitychange", syncInstalledState);

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
      } catch (error) {
        console.error("[Africhiko PWA] Service worker registration/update failed.", error);
      }
    };

    void register();
    const controllerChange = () => { if (reloadForUpdate.current) window.location.reload(); };
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChange);

    return () => {
      window.removeEventListener("africhiko-open-install", requestInstall);
      window.removeEventListener("appinstalled", appInstalled);
      window.removeEventListener("pageshow", syncInstalledState);
      document.removeEventListener("visibilitychange", syncInstalledState);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChange);
    };
  }, [initialEmbedded, initialAndroid]);

  useEffect(() => {
    if (installState !== "embedded") return;

    const isEmbeddedGate = installState === "embedded";
    const previousOverflow = document.body.style.overflow;
    if (isEmbeddedGate) document.body.style.overflow = "hidden";
    if (installState === "embedded") embeddedActionRef.current?.focus();
    else document.querySelector<HTMLButtonElement>(".afInstallPrimary")?.focus();

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
      const current = environment();
      if (current.ios) {
        setInstallHelpOpen(true);
        setCanShowManualInstall(true);
      }
      return;
    }
    setInstallInProgress(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "dismissed") { rememberDismissal(); setInstallDismissed(true); }
    } catch (error) {
      // The event is one-shot and browser-controlled. Record failures for
      // diagnosis; never replace the native prompt with a fake install screen.
      console.error("[Africhiko PWA] Native install prompt failed.", error);
    } finally {
      setInstallInProgress(false);
      installPromptRef.current = null;
      setCanInstall(false);
      setCanShowManualInstall(false);
      setInstallHelpOpen(false);
      setInstallDismissed(true);
      setInstallState("hidden");
    }
  }

  function dismissInstall() {
    rememberDismissal();
    // Keep the captured native event available while the card is merely hidden.
    // The event is consumed only when the user explicitly chooses Install.
    setCanInstall(Boolean(installPromptRef.current));
    setCanShowManualInstall(isIOS);
    setInstallDismissed(true);
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

  const embeddedInstallStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.82)", backdropFilter: "blur(4px)", overscrollBehavior: "contain" };
  const showInstallPrompt = !isStandalone && installState !== "embedded" && !installDismissed && (canInstall || canShowManualInstall);
  const showInstallReopen = !isStandalone && installState !== "embedded" && installDismissed && (canInstall || canShowManualInstall);
  const installCard = installState === "embedded" ? (
    <div style={embeddedInstallStyle} role="alertdialog" aria-modal="true" aria-labelledby="plug-embedded-title" aria-describedby="plug-embedded-message">
      <div className="pwaInstallInfo" style={{position: "relative", left: "auto", right: "auto", bottom: "auto", width: "100%", maxWidth: 520, margin: 0}}>
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
    {offline && <div className="offlineBanner" role="status" aria-live="polite"><span aria-hidden="true">⚡</span> Offline · Previously viewed service information may still be available on this device. Project enquiries need a connection.</div>}
    {!offline && reconnecting && <div className="offlineBanner reconnectingBanner" role="status" aria-live="polite"><span aria-hidden="true">↻</span> Reconnected · Africhiko is checking for the latest service information.</div>}
    {showInstallReopen && (
      <button type="button" className="afInstallReopen" aria-label="Reopen Africhiko install prompt" onClick={() => { clearDismissal(); setInstallDismissed(false); }}>
        Install Africhiko
      </button>
    )}
    {showInstallPrompt && (
      <aside className="afInstallPrompt" role="region" aria-label="Install Africhiko">
        <div className="afInstallPromptHeader">
          <div>
            <strong>{canInstall ? "Install Africhiko" : "Add Africhiko to your Home Screen"}</strong>
            <p>{canInstall ? "Keep Africhiko one tap away." : "Quick access to your fabrication enquiries."}</p>
          </div>
          <button type="button" className="afInstallPromptClose" aria-label="Dismiss install prompt" onClick={dismissInstall}>×</button>
        </div>
        {canInstall ? (
          <button type="button" className="afInstallPromptAction" onClick={() => { void install(); }}>Install Africhiko</button>
        ) : (
          <button type="button" className="afInstallPromptAction" aria-expanded={installHelpOpen} onClick={() => setInstallHelpOpen(value => !value)}>
            {installHelpOpen ? "Hide instructions" : "How to install"}
          </button>
        )}
        {installHelpOpen && isIOS && !canInstall && (
          <p className="afInstallPromptHelp">Tap your browser’s <strong>Share</strong> button, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</p>
        )}
      </aside>
    )}
    {installCard}
    {updateReady && !canInstall && !installInProgress && <div className="pwaUpdate" role="status" aria-live="polite"><div><strong>Africhiko update is ready</strong><span>Refresh when you are ready.</span></div><button type="button" className="button buttonPrimary" onClick={applyUpdate}>Refresh</button></div>}
  </>;
}
