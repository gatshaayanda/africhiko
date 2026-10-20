"use client";

import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [offline, setOffline] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const online = () => setOffline(false);
    const offlineNow = () => setOffline(true);
    const installPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallable(true);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineNow);
    window.addEventListener("beforeinstallprompt", installPrompt);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineNow);
      window.removeEventListener("beforeinstallprompt", installPrompt);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallable(false);
  }

  return <>{offline && <div className="offlineBanner" role="status">Offline mode · saved pages remain available. New requests may be queued on this device and sent when you reconnect.</div>}{installable && <button className="pwaInstall" type="button" onClick={() => void install()}>Install Namane Tyres</button>}</>;
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}
