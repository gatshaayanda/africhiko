import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="af-site">
      <header className="af-header">
        <Link href="/" className="af-brand">
          <span className="af-brand-mark">A<span>✦</span></span>
          <span><strong>AFRICHIKO</strong><small>WELDING · FABRICATION</small></span>
        </Link>
      </header>
      <section className="af-page-intro af-compact">
        <p className="af-eyebrow">CONNECTION INTERRUPTED</p>
        <h1>Your project.<br/><em>Still in reach.</em></h1>
        <p>You are offline. Previously viewed service information may remain available on this device, but it may be out of date.</p>
        <p>Project enquiries are not submitted until Africhiko confirms the request has been saved. Reconnect before sending or updating a project brief.</p>
        <div className="af-hero-actions">
          <Link className="af-button" href="/enquiry">Return to project enquiry</Link>
          <Link className="af-button af-button-ghost" href="/">Open Africhiko home</Link>
        </div>
      </section>
    </main>
  );
}
