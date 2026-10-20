"use client";
// Restored installation baseline: keep the branded action visible and invoke the captured browser prompt directly.
import {useEffect,useRef,useState} from "react";
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}>};
declare global{interface Window{__africhikoInstallPrompt?:InstallPromptEvent;__africhikoPwaListenerReady?:boolean}}
export default function PwaRegister({initialEmbedded=false,initialAndroid=false}:{initialEmbedded?:boolean;initialAndroid?:boolean}){
 const [offline,setOffline]=useState(false),[installed,setInstalled]=useState(false),[promptReady,setPromptReady]=useState(false),[help,setHelp]=useState(false),[embedded,setEmbedded]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null),[isIOS,setIsIOS]=useState(false);
 const promptRef=useRef<InstallPromptEvent|null>(null);
 useEffect(()=>{
  const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
  const onBeforeInstallPrompt=(event:Event)=>{if(standalone())return;event.preventDefault();promptRef.current=event as InstallPromptEvent;setPromptReady(true)};
  const syncPrompt=()=>{const captured=window.__africhikoInstallPrompt;if(captured&&!standalone()){delete window.__africhikoInstallPrompt;onBeforeInstallPrompt(captured)}};
  setInstalled(standalone());
  setIsIOS(/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1));
  window.__africhikoPwaListenerReady=true;
  syncPrompt();
  window.addEventListener("beforeinstallprompt",onBeforeInstallPrompt);
  const appInstalled=()=>{setInstalled(true);setPromptReady(false);setHelp(false);promptRef.current=null;window.__africhikoInstallPrompt=undefined};
  const onOnline=()=>setOffline(false),onOffline=()=>setOffline(true),openInstall=()=>void install();
  window.addEventListener("appinstalled",appInstalled);window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);window.addEventListener("africhiko-open-install",openInstall);
  setOffline(!navigator.onLine);
  if(initialEmbedded&&!standalone()){try{setEmbedded(sessionStorage.getItem("africhiko-embedded-dismissed")!=="1")}catch{setEmbedded(true)}}
  if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").then(reg=>{if(reg.waiting)setUpdate(reg.waiting);reg.addEventListener("updatefound",()=>{const worker=reg.installing;if(worker)worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setUpdate(worker)})})}).catch(()=>{});navigator.serviceWorker.addEventListener("controllerchange",()=>window.location.reload())}
  return()=>{window.removeEventListener("beforeinstallprompt",onBeforeInstallPrompt);window.__africhikoPwaListenerReady=false;window.removeEventListener("appinstalled",appInstalled);window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);window.removeEventListener("africhiko-open-install",openInstall)}
 },[initialEmbedded]);
 async function install(){const p=promptRef.current;if(!p){setHelp(true);return}try{await p.prompt();const result=await p.userChoice;if(result.outcome==="accepted"){setHelp(false)}else{setHelp(false)}}catch{setHelp(true)}finally{promptRef.current=null;window.__africhikoInstallPrompt=undefined;setPromptReady(false)}}
 function openBrowser(){const url=window.location.href;if(initialAndroid){window.location.href="intent://"+url.replace(/^https?:\/\//,"")+"#Intent;scheme=https;package=com.android.chrome;end"}else{window.open(url,"_blank","noopener,noreferrer")}}
 function dismissEmbedded(){setEmbedded(false);try{sessionStorage.setItem("africhiko-embedded-dismissed","1")}catch{}}
 function dismissHelp(){setHelp(false)}
 return <>{offline&&<div className="af-pwa-banner" role="status">Offline mode · You can browse cached public pages. Enquiries and account changes need a connection.</div>}{embedded&&<div className="af-embedded-banner" role="status"><span>This page opened inside another app.</span><button type="button" onClick={openBrowser}>{initialAndroid?"Open in Chrome ↗":"Open in browser ↗"}</button><button type="button" aria-label="Continue here without opening another browser" onClick={dismissEmbedded}>Continue here</button></div>}{!installed&&<button type="button" className="af-install-button" onClick={()=>void install()}>{promptReady?"Install Africhiko ↓":isIOS?"Add to Home Screen ↓":"Install Africhiko ↓"}</button>}{help&&<div className="af-pwa-overlay"><section className="af-pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="af-install-title"><button className="af-pwa-close" type="button" aria-label="Close install help" onClick={dismissHelp}>×</button><p className="af-eyebrow">AFRICHIKO · INSTALL</p><h2 id="af-install-title">Install Africhiko.</h2>{isIOS?<p>To add Africhiko on iPhone or iPad, open this page in Safari, tap Share, then choose Add to Home Screen. The website works without installing it.</p>:initialAndroid&&embedded?<p>Africhiko opened inside another app. Open it in Chrome, then use Chrome’s ⋮ menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p>:initialAndroid?<p>Chrome has not provided its native install prompt. In Chrome, tap the ⋮ menu and look for <b>Install app</b> or <b>Add to Home screen</b>. If neither option appears, Chrome has not marked this site installable in this session. Africhiko still works as a website.</p>:<p>This browser has not provided a native install prompt. Open Africhiko in a supported browser. The website remains available without installation.</p>}{initialAndroid&&embedded&&<button className="af-button" type="button" onClick={openBrowser}>Open in Chrome ↗</button>}<button className="af-button" type="button" onClick={dismissHelp}>Continue on the website</button></section></div>}{update&&<div className="af-update-banner" role="status"><span>Africhiko update ready.</span><button type="button" onClick={()=>update.postMessage({type:"SKIP_WAITING"})}>Refresh app ↻</button></div>}</>
}
