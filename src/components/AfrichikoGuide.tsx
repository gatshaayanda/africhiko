"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Send, Sparkles, X } from "lucide-react";

type View = "home" | "account" | "admin";
type Message = { id: number; from: "guide" | "you"; text: string };

type Props = { view?: View };

export default function AfrichikoGuide({ view: viewOverride }: Props = {}) {
  const pathname = usePathname();
  const view: View = viewOverride || (pathname === "/account" ? "account" : pathname === "/admin" ? "admin" : "home");
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (view !== "home") return;
    try {
      if (sessionStorage.getItem("africhiko-guide-teaser") === "dismissed" || sessionStorage.getItem("africhiko-guide-teaser") === "shown") return;
      const timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          setTeaser(true);
          sessionStorage.setItem("africhiko-guide-teaser", "shown");
        }
      }, 10000);
      return () => window.clearTimeout(timer);
    } catch { /* The guide still works if session storage is unavailable. */ }
  }, [view]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.clearTimeout(focusTimer); window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  if (view === "admin" && !viewOverride) return null;

  function say(text: string) {
    setMessages(current => [...current, { id: Date.now() + Math.random(), from: "guide", text }].slice(-6));
  }

  function sendText(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages(current => [...current, { id: Date.now(), from: "you", text }].slice(-6));
    setInput("");
    const normalized = text.toLowerCase();
    if (/weather|rain|hot|wind/.test(normalized)) say("The Gaborone workshop weather card shows current conditions and its last update. It’s a useful guide, not a promise about conditions at your project site.");
    else if (/quote|price|cost|gate|carport|steel|weld|repair|fabricat/.test(normalized)) say("Tell Africhiko about the job and any measurements or reference photos. The workshop reviews your details before confirming a quotation.");
    else if (/track|status|progress|enquir|request/.test(normalized)) say(view === "admin" ? "Open Enquiry operations to review requests and update their progress." : "Open My Africhiko to review enquiries linked to your Google account. Guest enquiries may need to be linked separately.");
    else if (/human|contact|phone|email|workshop/.test(normalized)) say("You can contact the workshop using the verified phone number or email shown in the site footer.");
    else if (/admin|service catalogue|announcement|publish|manage/.test(normalized)) say(view === "admin" ? "Use the shortcuts below to jump to the relevant Operations section." : "The Operations tools are for authorized workshop staff. You can still submit a project enquiry as a customer.");
    else say("I’m Africhiko’s scripted project guide, not a live person or AI assistant. Try asking about a quote, your enquiry, weather, or contacting the workshop.");
  }

  const intro = view === "admin"
    ? "What needs your attention, Boss?"
    : view === "account"
      ? "Dumela! Need help with a project?"
      : "Dumela! What are you planning to build?";

  return <div className="af-guide-root">
    {!open && teaser && <aside className="af-guide-teaser" aria-label="Africhiko project guide invitation">
      <div><strong>Not sure where to start?</strong><p>I can point you to the right next step.</p><button type="button" onClick={() => { setTeaser(false); setOpen(true); }}>Help me choose <ArrowRight size={14}/></button></div>
      <button type="button" className="af-guide-dismiss" aria-label="Dismiss guide invitation" onClick={() => { setTeaser(false); try { sessionStorage.setItem("africhiko-guide-teaser", "dismissed"); } catch {} }}><X size={15}/></button>
    </aside>}
    {open && <button type="button" className="af-guide-backdrop" aria-label="Close Africhiko guide" onClick={() => setOpen(false)} />}
    {open && <section ref={panelRef} className="af-guide-panel" role="dialog" aria-modal="true" aria-labelledby="af-guide-title">
      <header className="af-guide-head"><span className="af-guide-avatar"><Sparkles size={18}/></span><div><small>AFRICHIKO · PROJECT GUIDE</small><h2 id="af-guide-title">{view === "admin" ? "Operations sidekick" : "Your next step"}</h2><p>Quick help · Real page links</p></div><button type="button" aria-label="Close guide" onClick={() => { setOpen(false); launcherRef.current?.focus(); }}><X size={19}/></button></header>
      <div className="af-guide-intro"><strong>{intro}</strong><p>{view === "admin" ? "Jump to a real workshop tool or ask a quick question." : "Choose a useful shortcut or ask a quick question. You can always continue without chat."}</p></div>
      <nav className="af-guide-actions" aria-label="Guide shortcuts">
        {view === "admin" ? <>
          <a href="#admin-enquiries" onClick={() => setOpen(false)}>Review enquiries <ArrowRight size={15}/></a>
          <a href="#admin-services" onClick={() => setOpen(false)}>Manage services <ArrowRight size={15}/></a>
          <a href="#admin-announcements" onClick={() => setOpen(false)}>Announcements <ArrowRight size={15}/></a>
          <a href="#admin-work" onClick={() => setOpen(false)}>Completed work <ArrowRight size={15}/></a>
        </> : <>
          <Link href="/enquiry" onClick={() => setOpen(false)}>Start a project <ArrowRight size={15}/></Link>
          <Link href="/account#customer-enquiries" onClick={() => setOpen(false)}>My enquiries <ArrowRight size={15}/></Link>
          <Link href="/#work" onClick={() => setOpen(false)}>See completed work <ArrowRight size={15}/></Link>
        </>}
      </nav>
      <div className="af-guide-thread" aria-live="polite" aria-relevant="additions text">{messages.map(message => <p key={message.id} className={`af-guide-message af-guide-message-${message.from}`}>{message.text}</p>)}</div>
      <form className="af-guide-composer" onSubmit={sendText}><input value={input} onChange={event => setInput(event.target.value)} aria-label="Ask the Africhiko project guide" placeholder="Ask about a quote, project or status…" maxLength={300}/><button type="submit" disabled={!input.trim()} aria-label="Send message"><Send size={17}/></button></form>
      <p className="af-guide-disclaimer">Scripted guidance. It does not send messages or change enquiry status.</p>
    </section>}
    <button ref={launcherRef} type="button" className={`af-guide-launcher${open ? " is-open" : ""}`} aria-expanded={open} aria-haspopup="dialog" aria-label={open ? "Close Africhiko guide" : "Open Africhiko project guide"} onClick={() => { setTeaser(false); setOpen(value => !value); if (!messages.length) say("Hi! I can help you find a real page or understand the next step. I’m a scripted guide, not a live person or AI assistant."); }}>
      {open ? <X size={20}/> : <MessageCircle size={21}/>}<span>{open ? "Close" : "Need a hand?"}</span>
    </button>
  </div>;
}
