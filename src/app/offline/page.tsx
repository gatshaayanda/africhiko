import Link from "next/link";

export default function OfflinePage() {
  return <main className="bookPage"><nav className="nav"><div className="container navInner"><Link href="/" className="logo"><span className="logoMark">NT</span><span>Namane Tyres</span></Link></div></nav><div className="formWrap"><div className="formCard confirm"><div className="confirmIcon">📶</div><span className="kicker">Offline mode</span><h1>Still usable.</h1><p>Previously loaded Namane Tyres pages and public assets can remain available on this device.</p><p>You can open Request Help and queue a request through Firestore supported offline persistence. It is not considered received by the business until synchronization completes.</p><div className="actions centered"><Link className="button buttonPrimary" href="/book">Request Help</Link><Link className="button buttonLight" href="/">Open Namane Tyres</Link></div></div></div></main>;
}
