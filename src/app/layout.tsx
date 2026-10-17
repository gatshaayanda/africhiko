import type {Metadata,Viewport} from "next";
import {headers} from "next/headers";
import {Analytics} from "@vercel/analytics/next";
import {SpeedInsights} from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import Script from "next/script";
import "./globals.css"; import "./pwa.css";
const siteUrl=process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:3000";
const EMBEDDED_BROWSER_PATTERN=/WhatsApp|Instagram|FBAN|FBAV|Messenger|Line[/]|Twitter|TikTok|Snapchat/i;
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:"Africhiko | Welding & Steel Fabrication",template:"%s | Africhiko"},description:"Welding and steel fabrication services in Gaborone, Botswana.",applicationName:"Africhiko",keywords:["Africhiko","steel fabrication","fabrication","Botswana","fabrication"],alternates:{canonical:"/"},openGraph:{type:"website",url:siteUrl,siteName:"Africhiko",title:"Africhiko | Welding & Steel Fabrication",description:"Steel work, made your way."},twitter:{card:"summary",title:"Africhiko | Welding & Steel Fabrication",description:"Steel work, made your way."},icons:{icon:"/africhiko-mark.svg",apple:"/africhiko-mark.svg"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:"Africhiko",statusBarStyle:"default"}};
export const viewport:Viewport={themeColor:"#6d28d9",colorScheme:"light"};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers();
 const userAgent=requestHeaders.get("user-agent")||"";
 const requestedWith=requestHeaders.get("x-requested-with")||"";
 // A social referrer does not prove this browser is embedded: Chrome opened from WhatsApp
 // must not be trapped in the in-app-browser install gate.
 const embedded=EMBEDDED_BROWSER_PATTERN.test(userAgent)
   || (/Android/i.test(userAgent)&&/\bwv\b/i.test(userAgent))
   || /^(com\.whatsapp|com\.instagram\.android|com\.facebook\.katana|com\.facebook\.lite|com\.facebook\.orca)$/i.test(requestedWith);
 const android=/Android/i.test(userAgent);
 return <html lang="en"><body style={embedded?{overflow:"hidden"}:undefined}><Script id="africhiko-early-install-capture" strategy="beforeInteractive">{`
(function () {
  window.addEventListener("beforeinstallprompt", function (event) {
    var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone || window.__africhikoPwaListenerReady === true) return;
    event.preventDefault();
    window.__africhikoInstallPrompt = event;
  });
})();
`}</Script><PwaRegister initialEmbedded={embedded} initialAndroid={android}/>{children}<Analytics/><SpeedInsights/></body></html>
}
