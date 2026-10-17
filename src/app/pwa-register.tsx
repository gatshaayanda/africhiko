"use client";
import {useEffect,useRef,useState} from "react";
type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}>};
declare global{interface Window{__africhikoInstallPrompt?:InstallPromptEvent;__africhikoInstallListenerInstalled?:boolean}}
export default function PwaRegister({initialEmbedded=false,initialAndroid=false}:{initialEmbedded?:boolean;initialAndroid?:boolean}){
 const [offline,setOffline]=useState(false),[installed,setInstalled]=useState(false),[promptReady,setPromptReady]=useState(false),[help,setHelp]=useState(false),[embedded,setEmbedded]=useState(false),[update,setUpdate]=useState<ServiceWorker|null>(null),[isIOS,setIsIOS]=useState(false);
 const promptRef=useRef<InstallPromptEvent|null>(null);
 useEffect(()=>{
  const standalone=()=>window.matchMedia("(display-mode: standalone)").matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
  const syncPrompt=()=>{const captured=window.__africhikoInstallPrompt;if(captured&&!standalone()){promptRef.current=captured;setPromptReady(true)}};
  setInstalled(standalone());
  setIsIOS(/iPad|iPhone|iPod/i.test(navigator.userAgent));
  syncPrompt();
  const promptReadyEvent=()=>syncPrompt();
  const appInstalled=()=>{setInstalled(true);setPromptReady(false);setHelp(false);promptRef.current=null;window.__africhikoInstallPrompt=undefined};
  const onOnline=()=>setOffline(false),onOffline=()=>setOffline(true),openInstall=()=>void install();
  window.addEventListener("africhiko-install-prompt-ready",promptReadyEvent);window.addEventListener("appinstalled",appInstalled);window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);window.addEventListener("africhiko-open-install",openInstall);
  setOffline(!navigator.onLine);
  if(initialEmbedded&&!standalone()){try{setEmbedded(sessionStorage.getItem("africhiko-embedded-dismissed")!=="1")}catch{setEmbedded(true)}}
  if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").then(reg=>{if(reg.waiting)setUpdate(reg.waiting);reg.addEventListener("updatefound",()=>{const worker=reg.installing;if(worker)worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)setUpdate(worker)})})}).catch(()=>{});navigator.serviceWorker.addEventListener("controllerchange",()=>window.location.reload())}
  return()=>{window.removeEventListener("africhiko-install-prompt-ready",promptReadyEvent);window.removeEventListener("appinstalled",appInstalled);window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline);window.removeEventListener("africhiko-open-install",openInstall)}
 },[initialEmbedded]);
 async function install(){const p=promptRef.current;if(!p){setHelp(true);return}try{await p.prompt();const result=await p.userChoice;if(result.outcome==="accepted"){setHelp(false)}else{setHelp(false)}}catch{setHelp(true)}finally{promptRef.current=null;window.__africhikoInstallPrompt=undefined;setPromptReady(false)}}
 function openBrowser(){const url=window.location.href;if(initialAndroid){window.location.href="intent://"+url.replace(/^https?:\/\//,"")+"#Intent;scheme=https;package=com.android.chrome;end"}else{window.open(url,"_blank","noopener,noreferrer")}}
 function dismissEmbedded(){setEmbedded(false);try{sessionStorage.setItem("africhiko-embedded-dismissed","1")}catch{}}
 function dismissHelp(){setHelp(false)}
 return <>{offline&&<div className="af-pwa-banner" role="status">Offline mode · You can browse cached public pages. Enquiries and account changes need a connection.</div>}{embedded&&<div className="af-embedded-banner" role="status"><span>This page opened inside another app.</span><button type="button" onClick={openBrowser}>{initialAndroid?"Open in Chrome ↗":"Open in browser ↗"}</button><button type="button" aria-label="Continue here without opening another browser" onClick={dismissEmbedded}>Continue here</button></div>}{!installed&&<button type="button" className="af-install-button" onClick={()=>void install()}>{promptReady?"Install Africhiko ↓":isIOS?"Add to Home Screen ↓":"Install help ↓"}</button>}{help&&<div className="af-pwa-overlay"><section className="af-pwa-dialog" role="dialog" aria-modal="true" aria-labelledby="af-install-title"><button className="af-pwa-close" type="button" aria-label="Close install help" onClick={dismissHelp}>×</button><p className="af-eyebrow">AFRICHIKO · OPTIONAL INSTALL</p><h2 id="af-install-title">Keep Africhiko close.</h2>{isIOS?<p>In Safari, tap Share, choose Add to Home Screen, then tap Add. You can keep using the website without installing it.</p>:initialAndroid?<p>For native installation, open Africhiko in Chrome. When Chrome offers installation, tap Install Africhiko. If Chrome does not offer it yet, keep using the website normally and try again later.</p>:<p>This browser has not made a native install prompt available on this visit. Open this site in a supported browser to install it. You can use the website without installing it.</p>}<button className="af-button" type="button" onClick={dismissHelp}>Continue on the website</button></section></div>}{update&&<div className="af-update-banner" role="status"><span>Africhiko update ready.</span><button type="button" onClick={()=>update.postMessage({type:"SKIP_WAITING"})}>Refresh app ↻</button></div>}</>
}
