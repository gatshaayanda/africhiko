import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="orderPage">
      <div className="orderWrap">
        <div className="orderHeader">
          <Link href="/" className="logo"><span className="logoMark">P</span><span>The Plug</span></Link>
        </div>
        <section className="orderCard confirm">
          <div className="confirmIcon">📶</div>
          <span className="kicker">Offline mode</span>
          <h1>The Plug is still here.</h1>
          <p>The app shell and public finds you have already loaded may remain available on this device. Saved information can be out of date.</p>
          <p>Prices, stock and offers can change while you are offline. Requests, account updates and messages are not sent until a connection is available and The Plug confirms the action.</p>
          <div className="actions centered">
            <Link className="button buttonPrimary" href="/request">Open request</Link>
            <Link className="button buttonLight" href="/">Open The Plug</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
