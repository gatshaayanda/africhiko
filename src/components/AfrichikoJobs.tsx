"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { uploadFiles } from "@/lib/uploadthing";

const JOB_STATUSES = ["Received", "Assessing", "Awaiting approval", "In fabrication", "Ready for collection", "Completed", "On hold"] as const;
type JobStatus = typeof JOB_STATUSES[number];
type ProgressUpdate = { id: string; status: JobStatus; note: string; createdAt: string; mediaUrl?: string };
type WorkJob = {
  id: string; shareId: string; reference: string; source: "Walk-in" | "Phone" | "Existing customer";
  customerName: string; phone: string; projectTitle: string; serviceType: string; summary: string;
  status: JobStatus; updates: ProgressUpdate[]; createdAt: string; updatedAt: string;
};
type Drafts = Record<string, { status: JobStatus; note: string; file: File | null }>;

const initialDraft = { customerName: "", phone: "", projectTitle: "", serviceType: "Custom fabrication", summary: "", source: "Walk-in" as const };
const sharedRecord = (job: WorkJob) => ({
  projectTitle: job.projectTitle, serviceType: job.serviceType, summary: job.summary,
  status: job.status, updates: job.updates.slice(-50), createdAt: job.createdAt,
  updatedAt: job.updatedAt, published: true,
});

export default function AfrichikoJobs() {
  const [jobs, setJobs] = useState<WorkJob[]>([]);
  const [draft, setDraft] = useState(initialDraft);
  const [edits, setEdits] = useState<Drafts>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lastShare, setLastShare] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return onSnapshot(collection(db, "workJobs"), snapshot => {
      const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as WorkJob);
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setJobs(rows);
      setLoading(false);
    }, snapshotError => { setError("Workshop jobs could not be loaded (" + snapshotError.code + "): " + snapshotError.message); setLoading(false); });
  }, []);

  const shareUrl = (shareId: string) => typeof window === "undefined" ? "" : window.location.origin + "/work/" + shareId;
  async function createJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.customerName.trim() || !draft.phone.trim() || !draft.projectTitle.trim() || !draft.summary.trim()) {
      setError("Customer, phone, project title and work description are required."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      const now = new Date().toISOString();
      const jobRef = doc(collection(db, "workJobs"));
      const shareId = crypto.randomUUID().replace(/-/g, "");
      const job: WorkJob = {
        id: jobRef.id, shareId, reference: "AFW-" + jobRef.id.slice(-7).toUpperCase(),
        source: draft.source, customerName: draft.customerName.trim().slice(0, 120),
        phone: draft.phone.trim().slice(0, 40), projectTitle: draft.projectTitle.trim().slice(0, 160),
        serviceType: draft.serviceType.trim().slice(0, 120), summary: draft.summary.trim().slice(0, 3000),
        status: "Received", updates: [], createdAt: now, updatedAt: now,
      };
      const batch = writeBatch(db);
      batch.set(jobRef, job);
      batch.set(doc(db, "sharedWork", shareId), sharedRecord(job));
      await batch.commit();
      setDraft(initialDraft);
      setLastShare(shareUrl(shareId));
      setNotice(job.reference + " created. The customer progress link is ready to share.");
      formRef.current?.reset();
    } catch (e) {
      setError(e instanceof Error ? "Job was not saved: " + e.message : "Job could not be saved. Nothing was confirmed.");
    } finally { setSaving(false); }
  }

  function updateEdit(job: WorkJob, patch: Partial<Drafts[string]>) {
    setEdits(current => ({ ...current, [job.id]: { status: current[job.id]?.status || job.status, note: current[job.id]?.note || "", file: current[job.id]?.file || null, ...patch } }));
  }

  async function saveProgress(job: WorkJob) {
    const edit = edits[job.id] || { status: job.status, note: "", file: null };
    if (!edit.note.trim() && !edit.file && edit.status === job.status) {
      setError("Change the status, add a progress note or choose a progress photo first."); return;
    }
    setSavingId(job.id); setError(""); setNotice("");
    try {
      let mediaUrl = "";
      if (edit.file) {
        if (!edit.file.type.startsWith("image/") || edit.file.size > 4 * 1024 * 1024) throw new Error("Choose an image up to 4 MB.");
        const uploaded = await uploadFiles("fileUploader", { files: [edit.file] });
        const item = uploaded[0] as (typeof uploaded)[number] & { ufsUrl?: string; appUrl?: string };
        mediaUrl = item?.url || item?.ufsUrl || item?.appUrl || "";
        if (!mediaUrl) throw new Error("The photo upload did not return a usable link. No progress update was saved.");
      }
      const now = new Date().toISOString();
      const update: ProgressUpdate = {
        id: crypto.randomUUID(), status: edit.status,
        note: edit.note.trim().slice(0, 1000) || (edit.status !== job.status ? "Status updated to " + edit.status + "." : "Progress photo shared."),
        createdAt: now, ...(mediaUrl ? { mediaUrl } : {}),
      };
      const next: WorkJob = { ...job, status: edit.status, updates: [...job.updates, update].slice(-50), updatedAt: now };
      const batch = writeBatch(db);
      batch.set(doc(db, "workJobs", job.id), next);
      batch.set(doc(db, "sharedWork", job.shareId), sharedRecord(next));
      await batch.commit();
      setEdits(current => ({ ...current, [job.id]: { status: next.status, note: "", file: null } }));
      setNotice(job.reference + " progress saved and shared with the customer.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Progress could not be saved.");
    } finally { setSavingId(""); }
  }

  async function copyLink(url: string) {
    try { await navigator.clipboard.writeText(url); setNotice("Customer progress link copied."); }
    catch { setError("Copy was blocked by this browser. Open the link and copy it from the address bar."); }
  }

  const active = jobs.filter(job => !["Completed"].includes(job.status)).length;
  return <section className="af-admin-panel af-jobs-panel" id="admin-work-queue">
    <p className="af-eyebrow">WORKSHOP / WALK-IN QUEUE</p>
    <h2>Jobs & customer progress</h2>
    <p>Log walk-ins, phone customers and agreed projects here. Update the workshop stage as work moves forward, then share the private progress link with the customer. Quote enquiries remain separate until the work is agreed.</p>
    <div className="af-jobs-stats"><div><strong>{jobs.length}</strong><span>All jobs</span></div><div><strong>{active}</strong><span>Active jobs</span></div><div><strong>{jobs.filter(job => job.status === "Ready for collection").length}</strong><span>Ready for collection</span></div></div>
    {error && <p className="af-form-message af-error" role="alert">{error}</p>}
    {notice && <p className="af-form-message" role="status">{notice}</p>}
    {lastShare && <div className="af-jobs-share"><strong>New customer link</strong><a href={lastShare} target="_blank" rel="noreferrer">{lastShare}</a><div className="af-inline-actions"><button type="button" className="af-button af-button-outline" onClick={() => void copyLink(lastShare)}>Copy link</button><a className="af-button" href={"https://wa.me/?text=" + encodeURIComponent("Africhiko workshop progress: " + lastShare)} target="_blank" rel="noreferrer">Share on WhatsApp ↗</a></div></div>}
    <form ref={formRef} className="af-form af-job-create" onSubmit={createJob}>
      <h3>Register a walk-in or new job</h3>
      <div className="af-form-grid">
        <label>Customer name<input required maxLength={120} value={draft.customerName} onChange={e => setDraft({ ...draft, customerName: e.target.value })} /></label>
        <label>Phone / WhatsApp<input required type="tel" maxLength={40} value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></label>
        <label>How did they reach the workshop?<select value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value as typeof draft.source })}><option>Walk-in</option><option>Phone</option><option>Existing customer</option></select></label>
        <label>Work type<input required maxLength={120} value={draft.serviceType} onChange={e => setDraft({ ...draft, serviceType: e.target.value })} placeholder="Gate fabrication, repairs…" /></label>
      </div>
      <label>Project / job title<input required maxLength={160} value={draft.projectTitle} onChange={e => setDraft({ ...draft, projectTitle: e.target.value })} placeholder="e.g. Double swing security gate" /></label>
      <label>Work description<textarea required rows={3} maxLength={3000} value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })} placeholder="Describe the agreed work, dimensions or important details the customer should know." /></label>
      <button className="af-button" disabled={saving}>{saving ? "Saving job…" : "Add to workshop queue"}</button>
      <p className="af-form-footnote">The job is only added after Firestore confirms both the private workshop record and customer-safe progress page.</p>
    </form>
    <div className="af-jobs-list-heading"><h3>Workshop work board</h3><span>{jobs.length} records · live updates</span></div>
    {loading ? <p>Loading workshop jobs…</p> : jobs.length ? <div className="af-jobs-list">{jobs.map(job => {
      const edit = edits[job.id] || { status: job.status, note: "", file: null };
      const link = shareUrl(job.shareId);
      return <article className="af-job-card" key={job.id}>
        <div className="af-job-card-head"><div><span className="af-job-ref">{job.reference} · {job.source}</span><h3>{job.projectTitle}</h3><p>{job.customerName} · {job.phone}</p></div><span className="af-job-status">{job.status}</span></div>
        <p className="af-job-summary">{job.serviceType} · {job.summary}</p>
        <small>Created {new Date(job.createdAt).toLocaleString()} · Updated {new Date(job.updatedAt).toLocaleString()}</small>
        {job.updates?.length ? <div className="af-job-history"><strong>Latest shared updates</strong>{job.updates.slice(-3).reverse().map(item => <div key={item.id}><span>{item.status} · {new Date(item.createdAt).toLocaleString()}</span><p>{item.note}</p>{item.mediaUrl && <a href={item.mediaUrl} target="_blank" rel="noreferrer">Open progress photo ↗</a>}</div>)}</div> : <p className="af-form-footnote">No progress updates shared yet.</p>}
        <div className="af-job-editor">
          <label>Workshop stage<select value={edit.status} onChange={e => updateEdit(job, { status: e.target.value as JobStatus })}>{JOB_STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
          <label>Progress update for customer<textarea rows={2} maxLength={1000} value={edit.note} onChange={e => updateEdit(job, { note: e.target.value })} placeholder="e.g. Frame cut and prepared; welding starts next." /></label>
          <label>Progress photo (optional)<input type="file" accept="image/*" onChange={e => updateEdit(job, { file: e.target.files?.[0] || null })} /><small>Image only · maximum 4 MB.</small></label>
          <div className="af-inline-actions"><button type="button" className="af-button" disabled={savingId === job.id} onClick={() => void saveProgress(job)}>{savingId === job.id ? "Saving progress…" : "Save & share update"}</button><button type="button" className="af-button af-button-outline" onClick={() => void copyLink(link)}>Copy customer link</button><a className="af-button af-button-outline" href={"https://wa.me/?text=" + encodeURIComponent("Africhiko workshop progress: " + link)} target="_blank" rel="noreferrer">WhatsApp ↗</a></div>
        </div>
      </article>;
    })}</div> : <div className="af-empty-state"><p>No workshop jobs yet. Add the first walk-in or agreed project above.</p></div>}
  </section>;
}
