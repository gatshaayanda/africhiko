import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="orderPage">
      <div className="orderWrap">
        <div className="orderHeader">
          <Link href="/" className="logo"><span className="logoMark">P</span><span>Africhiko</span></Link>
        </div>
        <section className="orderCard confirm">
          <div className="confirmIcon">📶</div>
          <span className="kicker">Offline mode</span>
          <h1>Africhiko is still here.</h1>
          <p>The app shell and public finds you have already loaded may remain available on this device. Saved information can be out of date.</p>
          <p>Prices, stock and offers can change while you are offline. Project enquiries and contact messages are not sent until a connection is available and Africhiko confirms the action.</p>
          <div className="actions centered">
            <Link className="button buttonPrimary" href="/request">Start an enquiry</Link>
            <Link className="button buttonLight" href="/">Open Africhiko</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
