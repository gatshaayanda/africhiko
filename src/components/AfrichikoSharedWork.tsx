"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type SharedUpdate = { id: string; status: string; note: string; createdAt: string; mediaUrl?: string };
type SharedJob = { projectTitle: string; serviceType: string; summary: string; status: string; updates: SharedUpdate[]; createdAt: string; updatedAt: string; published: boolean };

export default function AfrichikoSharedWork({ shareId }: { shareId: string }) {
  const [job, setJob] = useState<SharedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    if (!/^[a-f0-9]{32}$/i.test(shareId)) { setUnavailable(true); setLoading(false); return; }
    void getDoc(doc(db, "sharedWork", shareId)).then(snapshot => {
      if (!active) return;
      if (snapshot.exists() && snapshot.data().published === true) setJob(snapshot.data() as SharedJob);
      else setUnavailable(true);
    }).catch(() => { if (active) setUnavailable(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [shareId]);

  return <main className="af-site af-shared-work">
    <header className="af-shared-header"><Link href="/" className="af-brand"><span className="af-brand-mark">A<span>✦</span></span>Africhiko</Link><span>WORKSHOP PROGRESS</span></header>
    <section className="af-shared-card">
      <p className="af-eyebrow">AFRICHIKO / CUSTOMER UPDATE</p>
      {loading ? <><h1>Opening your<br/><em>workshop update.</em></h1><p>Loading the latest progress shared by Africhiko.</p></> : unavailable || !job ? <><h1>Update<br/><em>unavailable.</em></h1><p>This progress link may be incorrect or the workshop has withdrawn it. Contact Africhiko directly for an update.</p><Link className="af-button" href="/">Back to Africhiko</Link></> : <>
        <span className="af-shared-status">{job.status}</span>
        <h1>{job.projectTitle}</h1>
        <p className="af-shared-service">{job.serviceType}</p>
        <p>{job.summary}</p>
        <p className="af-shared-updated">Last updated {new Date(job.updatedAt).toLocaleString()}</p>
        <div className="af-shared-timeline"><h2>Workshop progress</h2>{job.updates?.length ? [...job.updates].reverse().map(item => <article key={item.id}><span>{item.status}</span><time>{new Date(item.createdAt).toLocaleString()}</time><p>{item.note}</p>{item.mediaUrl && <a href={item.mediaUrl} target="_blank" rel="noreferrer"><Image src={item.mediaUrl} alt="Africhiko workshop progress" width={1200} height={800} unoptimized/></a>}</article>) : <p>Africhiko has received this job. Progress updates will appear here when the workshop shares them.</p>}</div>
        <p className="af-shared-footnote">This page shows only the project details and progress updates Africhiko has chosen to share. Customer contact details and internal workshop notes are not displayed.</p>
        <Link href="/" className="af-button af-button-outline">Visit Africhiko</Link>
      </>}
    </section>
  </main>;
}
