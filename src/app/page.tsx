import Image from "next/image";
import Link from "next/link";

const services = [
  ["🔧", "Tyre fitting", "Get tyres fitted and get back on the road."],
  ["🛞", "Puncture repair", "Bring in a puncture and let the team assess it."],
  ["💨", "Pressure check", "Check your tyre pressure before the next trip."],
  ["🚗", "Tyre sales", "Ask about available tyre sizes, brands and prices."],
  ["🧼", "Light wash", "A practical light wash service when available."],
  ["📍", "Roadside assistance", "Request help and share your location when your phone allows it."],
] as const;

export default function Home() {
  return <main className="site">
    <div className="topbar"><div className="container topbarInner"><span>Gaborone West Phase 1</span><strong>Opposite Padre Pio Medical Centre</strong><span>Namane Tyres</span></div></div>
    <nav className="nav"><div className="container navInner"><Link href="/" className="logo"><span className="logoMark">NT</span><span>Namane Tyres</span></Link><div className="navLinks"><a href="#services">Services</a><a href="#work">Our work</a><a href="#location">Find us</a></div><Link href="/book" className="button buttonPrimary">Request Help</Link></div></nav>

    <section className="hero"><div className="container heroGrid"><div><span className="eyebrow">Tyres · Fitting · Repairs</span><h1>Tyre trouble?<br /><em>Let&apos;s sort it.</em></h1><p>Namane Tyres helps drivers with fitting, punctures, pressure checks, tyre sales, light wash services and roadside assistance in Gaborone.</p><div className="actions"><Link href="/book" className="button buttonPrimary">Request Help</Link><a href="#services" className="button buttonLight">See services</a></div><p className="heroNote">If you are offline, you can still open the app and queue a request on this device.</p></div><div className="heroVisual"><Image src="/namane-assets/work-location.jpg" alt="Namane Tyres work location in Gaborone West Phase 1" fill priority sizes="(max-width: 800px) 100vw, 45vw" /></div></div></section>

    <section id="services" className="section"><div className="container"><div className="sectionHead"><span className="kicker">What we do</span><h2>Simple tyre help.</h2><p>Choose the service you need, or tell us what is wrong and let the team take it from there.</p></div><div className="cards">{services.map(([icon,title,detail]) => <article className="card" key={title}><div className="cardIcon">{icon}</div><h3>{title}</h3><p>{detail}</p></article>)}</div></div></section>

    <section id="work" className="section workSection"><div className="container"><div className="sectionHead"><span className="kicker">The work</span><h2>Real work, real place.</h2><p>Namane Tyres is a roadside tyre business in Gaborone West Phase 1. These are the people, road and working environment behind the service.</p></div><div className="mediaGrid"><figure className="mediaCard"><Image src="/namane-assets/passing-car.jpg" alt="Roadside view near Namane Tyres" width={1600} height={1000} sizes="(max-width: 800px) 100vw, 50vw" /><figcaption>Roadside location in the neighbourhood.</figcaption></figure><figure className="mediaCard"><video controls preload="metadata" playsInline poster="/namane-assets/work-location.jpg"><source src="/namane-assets/zoom-in-work-on-tyres.mp4" type="video/mp4" />Your browser does not support this video.</video><figcaption>Tyre work at the business.</figcaption></figure></div></div></section>

    <section className="requestBand"><div className="container requestBandInner"><div><span className="kicker">Need a hand?</span><h2>Tell Namane Tyres what&apos;s happening.</h2><p>Give us your name, phone, vehicle and problem. Add your location when useful.</p></div><Link href="/book" className="button buttonPrimary">Request Assistance</Link></div></section>

    <section id="location" className="section locationSection"><div className="container locationGrid"><div><span className="kicker">Find us</span><h2>Gaborone West Phase 1.</h2><p><strong>Plot 16739, Gaborone West Phase 1, Gaborone, Botswana</strong><br />Roadside, opposite Padre Pio Medical Centre.</p><p>For directions or a job that needs help on the road, use Request Help and share your location if your phone permits it.</p></div><div className="locationCard"><span>📍</span><strong>Namane Tyres</strong><p>Plot 16739<br />Gaborone West Phase 1<br />Gaborone, Botswana</p><a className="button buttonDark" href="https://www.google.com/maps/search/?api=1&query=Plot%2016739%20Gaborone%20West%20Phase%201%20Gaborone%20Botswana">Open directions</a></div></div></section>

    <footer className="footer"><div className="container footerInner"><div><strong>Namane Tyres</strong><span>Tyre fitting · Repairs · Sales · Assistance</span></div><Link href="/book" className="button buttonPrimary">Request Help</Link></div></footer>
  </main>;
}
