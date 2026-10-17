import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import Script from "next/script";
import "./globals.css"; import "./pwa.css";
const siteUrl=process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:3000";
const EMBEDDED_BROWSER_PATTERN=/WhatsApp|Instagram|FBAN|FBAV|Messenger|Line[/]|Twitter|TikTok|Snapchat/i;
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:"Africhiko | Welding & Steel Fabrication",template:"%s | Africhiko"},description:"Welding and steel fabrication services in Gaborone, Botswana.",applicationName:"Africhiko",keywords:["Africhiko","steel fabrication","fabrication","Botswana"],alternates:{canonical:"/"},openGraph:{type:"website",url:siteUrl,siteName:"Africhiko",title:"Africhiko | Welding & Steel Fabrication",description:"Steel work, made your way."},twitter:{card:"summary",title:"Africhiko | Welding & Steel Fabrication",description:"Steel work, made your way."},icons:{icon:[{url:"/icons/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icons/icon-512.png",sizes:"512x512",type:"image/png"}],apple:"/apple-touch-icon.png"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"Africhiko",statusBarStyle:"default"}};
export const viewport:Viewport={themeColor:"#6d28d9",colorScheme:"light"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers(),userAgent=requestHeaders.get("user-agent")||"",requestedWith=requestHeaders.get("x-requested-with")||"";
 const embedded=EMBEDDED_BROWSER_PATTERN.test(userAgent)||(/Android/i.test(userAgent)&&/\bwv\b/i.test(userAgent))||/^(com\.whatsapp|com\.instagram\.android|com\.facebook\.katana|com\.facebook\.lite|com\.facebook\.orca)$/i.test(requestedWith);
 const android=/Android/i.test(userAgent);
 return <html lang="en"><body><Script id="africhiko-early-install-capture" strategy="beforeInteractive">{`
(function () {
  if (window.__africhikoInstallListenerInstalled) return;
  window.__africhikoInstallListenerInstalled = true;
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone) return;
    event.preventDefault();
    window.__africhikoInstallPrompt = event;
    window.dispatchEvent(new Event("africhiko-install-prompt-ready"));
  });
})();
`}</Script><PwaRegister initialEmbedded={embedded} initialAndroid={android}/>{children}<Analytics/><SpeedInsights/></body></html>
}