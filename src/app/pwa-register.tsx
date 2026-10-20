"use client";
import {useEffect,useRef,useState} from "react";
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}>};
declare global{interface Window{__africhikoInstallPrompt?:InstallPromptEvent;__africhikoPwaListenerReady?:boolean}}
function isIosSafari(){if(typeof window==="undefined")return false;const nav=window.navigator;const ios=/iPad|iPhone|iPod/i.test(nav.userAgent)||(nav.platform==="MacIntel"&&nav.maxTouchPoints>1);return ios&&/Safari/i.test(nav.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(nav.userAgent)}
export default function PwaRegister({initialEmbedded=false,initialAndroid=false}:{initialEmbedded?:boolean;initialAndroid?:boolean}){
 const [offline,setOffline]=useState(false),[installed,setInstalled]=useState(false),[promptReady,setPromptReady]=useState(false),[canShowManualInstall,setCanShowManualInstall]=useState(false),[iosHelpOpen,setIosHelpOpen]=useState(false),[installDismissed,setInstallDismissed]=useState(false),[embedded,setEmbedded]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null);
 const promptRef=useRef<InstallPromptEvent|null>(null);
 useEffect(()=>{
  const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
  const onBeforeInstallPrompt=(event:Event)=>{if(standalone())return;event.preventDefault();promptRef.current=event as InstallPromptEvent;setInstallDismissed(false);setPromptReady(true)};
  const syncPrompt=()=>{const captured=window.__africhikoInstallPrompt;if(captured&&!standalone()){delete window.__africhikoInstallPrompt;onBeforeInstallPrompt(captured)}};
  setInstalled(standalone());
  setCanShowManualInstall(isIosSafari());
  window.__africhikoPwaListenerReady=true;
  syncPrompt();
  window.addEventListener("beforeinstallprompt",onBeforeInstallPrompt);
  const appInstalled=()=>{setInstalled(true);setPromptReady(false);promptRef.current=null;window.__africhikoInstallPrompt=undefined};
  const onOnline=()=>setOffline(false),onOffline=()=>setOffline(true),openInstall=()=>void install();
  window.addEventListener("appinstalled",appInstalled);window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);window.addEventListener("africhiko-open-install",openInstall);
  setOffline(!navigator.onLine);
  if(initialEmbedded&&!standalone()){try{setEmbedded(sessionStorage.getItem("africhiko-embedded-dismissed")!=="1")}catch{setEmbedded(true)}}
  if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").then(reg=>{if(reg.waiting)setUpdate(reg.waiting);reg.addEventListener("updatefound",()=>{const worker=reg.installing;if(worker)worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setUpdate(worker)})})}).catch(()=>{});navigator.serviceWorker.addEventListener("controllerchange",()=>window.location.reload())}
  return()=>{window.removeEventListener("beforeinstallprompt",onBeforeInstallPrompt);window.__africhikoPwaListenerReady=false;window.removeEventListener("appinstalled",appInstalled);window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);window.removeEventListener("africhiko-open-install",openInstall)}
 },[initialEmbedded]);
 async function install(){const p=promptRef.current;if(!p){if(isIosSafari())setIosHelpOpen(true);return}try{await p.prompt();await p.userChoice}catch{/* Native prompt is browser-owned; never substitute a fake install screen. */}finally{promptRef.current=null;window.__africhikoInstallPrompt=undefined;setPromptReady(false)}}
 function openBrowser(){const url=window.location.href;if(initialAndroid){window.location.href="intent://"+url.replace(/^https?:\/\//,"")+"#Intent;scheme=https;package=com.android.chrome;end"}else{window.open(url,"_blank","noopener,noreferrer")}}
 function dismissEmbedded(){setEmbedded(false);try{sessionStorage.setItem("africhiko-embedded-dismissed","1")}catch{}}
 return <>{offline&&<div className="af-pwa-banner" role="status">Offline mode · You can browse cached public pages. Enquiries and account changes need a connection.</div>}{embedded&&<div className="af-embedded-banner" role="status"><span>This page opened inside another app.</span><button type="button" onClick={openBrowser}>{initialAndroid?"Open in Chrome ↗":"Open in browser ↗"}</button><button type="button" aria-label="Continue here without opening another browser" onClick={dismissEmbedded}>Continue here</button></div>}{!installed&&!embedded&&!installDismissed&&(promptReady||canShowManualInstall)&&<div className="af-install-control">{<button type="button" className="af-install-button" onClick={()=>void install()}>{promptReady?"Install Africhiko ↓":"Add to Home Screen ↓"}</button>}<button type="button" className="af-install-dismiss" aria-label="Dismiss install option" onClick={()=>{setInstallDismissed(true);setIosHelpOpen(false)}}>×</button></div>}{iosHelpOpen&&<div className="af-pwa-overlay"><section className="af-pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="af-ios-install-title"><button className="af-pwa-close" type="button" aria-label="Close install guidance" onClick={()=>setIosHelpOpen(false)}>×</button><p className="af-eyebrow">AFRICHIKO · IPHONE & IPAD</p><h2 id="af-ios-install-title">Add to Home Screen.</h2><p>In Safari, tap <b>Share</b>, choose <b>Add to Home Screen</b>, then tap <b>Add</b>. Open Africhiko from the new Home Screen icon.</p></section></div>}{update&&<div className="af-update-banner" role="status"><span>Africhiko update ready.</span><button type="button" onClick={()=>update.postMessage({type:"SKIP_WAITING"})}>Refresh app ↻</button></div>}</>
}
