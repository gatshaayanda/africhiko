"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminGate from "@/app/admin/admin-gate";
import {
  deleteContact,
  deleteTyreInventoryItem,
  getAssistanceRequests,
  getContacts,
  getTyreInventory,
  importContacts,
  saveContact,
  saveTyreInventoryItem,
  updateAssistanceStatus,
  type AssistanceRequest,
  type Contact,
  type ContactInput,
  type RequestStatus,
  normalizePhone,
  type TyreInventoryItem,
  REQUEST_STATUSES,
} from "@/lib/firebase/data";
import { parseWhatsAppVCard } from "@/lib/vcard";

function Dashboard() {
  const [tab, setTab] = useState<"requests" | "contacts" | "inventory">("requests");
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [inventory, setInventory] = useState<TyreInventoryItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<TyreInventoryItem | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactInput | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [requestResult, contactResult, inventoryResult] = await Promise.all([
        getAssistanceRequests(),
        getContacts(),
        getTyreInventory(),
      ]);
      setRequests(requestResult);
      setContacts(contactResult);
      setInventory(inventoryResult);
    } catch {
      setNotice("Operations data could not be loaded. If you are offline, only data already cached on this device may be available.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const currentRequest = requests.find((r) => r.id === selectedRequest) ?? null;
  const currentContact = contacts.find((c) => c.id === selectedContact) ?? null;

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      [contact.name, contact.phone, contact.businessName].some((value) => value.toLowerCase().includes(query)),
    );
  }, [contacts, contactSearch]);

  function requestHistory(phone: string) {
    const normalized = normalizePhone(phone);
    return requests
      .filter((request) => normalizePhone(request.phone) === normalized)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function changeStatus(id: string, next: RequestStatus) {
    try {
      await updateAssistanceStatus(id, next);
      setRequests((items) => items.map((r) => (r.id === id ? { ...r, status: next } : r)));
      setNotice("Request updated.");
    } catch {
      setNotice("That status could not be saved. Check the connection and try again.");
    }
  }

  async function saveInventory() {
    if (!draft || !draft.size.trim() || !draft.brand.trim()) return;
    try {
      await saveTyreInventoryItem(draft);
      setInventory((items) => (items.some((i) => i.id === draft.id) ? items.map((i) => (i.id === draft.id ? draft : i)) : [draft, ...items]));
      setDraft(null);
      setNotice("Inventory saved.");
    } catch {
      setNotice("Inventory could not be saved. Check the connection.");
    }
  }

  async function saveContactRecord() {
    if (!contactDraft?.name.trim() || !contactDraft.phone.trim()) {
      setNotice("A contact name and phone number are required.");
      return;
    }

    try {
      const id = await saveContact(contactDraft, editingContactId || undefined);
      const refreshed = await getContacts();
      setContacts(refreshed);
      setSelectedContact(id);
      setContactDraft(null);
      setEditingContactId(null);
      setNotice("Contact saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Contact could not be saved.");
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    setNotice("");
    try {
      const raw = await file.text();
      const parsed = parseWhatsAppVCard(raw);
      if (!parsed.length) throw new Error("No usable Botswana phone contacts were found in that VCF.");
      const result = await importContacts(parsed);
      const refreshed = await getContacts();
      setContacts(refreshed);
      setTab("contacts");
      setNotice("Imported " + result.imported + " unique contacts from the VCF. Existing records were updated instead of duplicated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The contact import failed.");
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
    }
  }

  return (
    <main className="adminPage">
      <div className="adminShell">
        <header className="adminHeader">
          <div>
            <span className="kicker">Namane Tyres · Operations</span>
            <h1>Keep the work moving.</h1>
            <p>Requests, customer contacts and inventory in one place.</p>
          </div>
          <div className="adminHeaderActions">
            <Link className="button buttonLight" href="/">Public site</Link>
            <Link className="button buttonPrimary" href="/book">Request form</Link>
          </div>
        </header>

        <div className="adminStats">
          <article><span>Requests</span><strong>{loading ? "—" : requests.length}</strong></article>
          <article><span>New</span><strong>{loading ? "—" : requests.filter((r) => r.status === "New").length}</strong></article>
          <article><span>Contacts</span><strong>{loading ? "—" : contacts.length}</strong></article>
          <article><span>Available tyres</span><strong>{loading ? "—" : inventory.filter((i) => i.available && i.quantity > 0).length}</strong></article>
        </div>

        <nav className="adminTabs" aria-label="Operations sections">
          <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Requests</button>
          <button className={tab === "contacts" ? "active" : ""} onClick={() => setTab("contacts")}>Customer contacts</button>
          <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>Tyre inventory</button>
        </nav>

        {notice && <div className="adminToast" role="status">{notice}</div>}

        {tab === "requests" && (
          <section className="adminContent twoColumn">
            <div className="adminPanel">
              <div className="panelHeading"><div><span className="kicker">Incoming</span><h2>Assistance requests</h2></div><span>{requests.length} total</span></div>
              {loading ? <div className="emptyState">Loading…</div> : requests.length === 0 ? <div className="emptyState"><h3>No requests yet</h3><p>New customer requests will appear here.</p></div> : (
                <div className="requestList">{[...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
                  <button className={selectedRequest === r.id ? "requestRow selected" : "requestRow"} key={r.id} onClick={() => setSelectedRequest(r.id)}>
                    <div><strong>{r.name}</strong><span>{r.vehicle}</span></div>
                    <div><strong>{r.status}</strong><span>{r.problem.slice(0, 70)}</span></div>
                  </button>
                ))}</div>
              )}
            </div>
            <div className="adminPanel detailPanel">
              {currentRequest ? (
                <>
                  <div className="panelHeading"><div><span className="kicker">Request details</span><h2>{currentRequest.name}</h2></div><select value={currentRequest.status} onChange={(e) => void changeStatus(currentRequest.id, e.target.value as RequestStatus)}>{REQUEST_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
                  <dl className="detailList">
                    <div><dt>Phone</dt><dd><a href={"tel:" + currentRequest.phone}>{currentRequest.phone}</a></dd></div>
                    <div><dt>Vehicle</dt><dd>{currentRequest.vehicle}</dd></div>
                    <div><dt>Problem</dt><dd>{currentRequest.problem}</dd></div>
                    <div><dt>Location</dt><dd>{currentRequest.locationText || (currentRequest.latitude !== undefined ? String(currentRequest.latitude) + ", " + String(currentRequest.longitude) : "Not provided")}</dd></div>
                    <div><dt>Notes</dt><dd>{currentRequest.notes || "None"}</dd></div>
                  </dl>
                  <div className="actions"><a className="button buttonPrimary" href={"https://wa.me/" + currentRequest.phone.replace(/\D/g, "")}>WhatsApp</a><a className="button buttonLight" href={"tel:" + currentRequest.phone}>Call</a></div>
                </>
              ) : <div className="emptyState"><h3>Select a request</h3><p>Open a request to see the customer brief and move it through the real work.</p></div>}
            </div>
          </section>
        )}

        {tab === "contacts" && (
          <section className="adminContent twoColumn">
            <div className="adminPanel">
              <div className="panelHeading">
                <div><span className="kicker">Customer directory</span><h2>{contacts.length} contacts</h2></div>
                <div className="actions">
                  <button className="button buttonPrimary" onClick={() => { setEditingContactId(null); setContactDraft({ name: "", phone: "", whatsapp: false, whatsappBusiness: false, businessName: "", businessDescription: "", notes: "", source: "manual" }); }}>Add contact</button>
                  <button className="button buttonLight" onClick={() => importInput.current?.click()} disabled={importing}>{importing ? "Importing…" : "Import VCF"}</button>
                  <input ref={importInput} type="file" accept=".vcf,text/vcard" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImport(file); }} />
                </div>
              </div>
              <input className="contactSearch" placeholder="Search name, phone or business" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
              {filteredContacts.length === 0 ? <div className="emptyState"><h3>No matching contacts</h3><p>Try another name or number, or add a new contact.</p></div> : (
                <div className="requestList">{filteredContacts.map((contact) => (
                  <button className={selectedContact === contact.id ? "requestRow selected" : "requestRow"} key={contact.id} onClick={() => setSelectedContact(contact.id)}>
                    <div><strong>{contact.name}</strong><span>{contact.phone}</span></div>
                    <div><strong>{contact.whatsappBusiness ? "WhatsApp Business" : "WhatsApp"}</strong><span>{contact.businessName || "Customer contact"}</span></div>
                  </button>
                ))}</div>
              )}
            </div>

            <div className="adminPanel detailPanel">
              {contactDraft ? (
                <>
                  <div className="panelHeading"><div><span className="kicker">{editingContactId ? "Edit contact" : "New contact"}</span><h2>{editingContactId ? "Update customer contact" : "Add customer contact"}</h2></div></div>
                  <ContactForm draft={contactDraft} onChange={setContactDraft} editing={Boolean(editingContactId)} />
                  <div className="actions"><button className="button buttonPrimary" onClick={() => void saveContactRecord()}>Save contact</button><button className="button buttonLight" onClick={() => { setContactDraft(null); setEditingContactId(null); }}>Cancel</button></div>
                </>
              ) : currentContact ? (
                <>
                  <div className="panelHeading"><div><span className="kicker">Contact record</span><h2>{currentContact.name}</h2></div></div>
                  <dl className="detailList">
                    <div><dt>Phone</dt><dd><a href={"tel:" + currentContact.phone}>{currentContact.phone}</a></dd></div>
                    <div><dt>WhatsApp</dt><dd>{currentContact.whatsappBusiness ? "WhatsApp Business" : currentContact.whatsapp ? "WhatsApp" : "Not marked"}</dd></div>
                    {currentContact.businessName && <div><dt>Business</dt><dd>{currentContact.businessName}</dd></div>}
                    {currentContact.businessDescription && <div><dt>Description</dt><dd>{currentContact.businessDescription}</dd></div>}
                    <div><dt>Notes</dt><dd>{currentContact.notes || "None"}</dd></div>
                  </dl>
                  <div className="actions">
                    <a className="button buttonPrimary" href={"https://wa.me/" + currentContact.phone.replace(/\D/g, "")}>WhatsApp</a>
                    <a className="button buttonLight" href={"tel:" + currentContact.phone}>Call</a>
                    <button className="button buttonLight" onClick={() => { setEditingContactId(currentContact.id); setContactDraft({ name: currentContact.name, phone: currentContact.phone, whatsapp: currentContact.whatsapp, whatsappBusiness: currentContact.whatsappBusiness, businessName: currentContact.businessName, businessDescription: currentContact.businessDescription, notes: currentContact.notes, source: currentContact.source }); }}>Edit</button>
                    <button className="button buttonLight" onClick={() => void deleteContact(currentContact.id).then(() => { setContacts((items) => items.filter((item) => item.id !== currentContact.id)); setSelectedContact(null); setNotice("Contact deleted."); }).catch(() => setNotice("Contact could not be deleted."))}>Delete</button>
                  </div>
                  <div className="nested">
                    <span className="kicker">Customer history</span>
                    <h3>{requestHistory(currentContact.phone).length} request{requestHistory(currentContact.phone).length === 1 ? "" : "s"}</h3>
                    {requestHistory(currentContact.phone).length === 0 ? <p>No Namane requests are linked to this phone number yet.</p> : <div className="requestList">{requestHistory(currentContact.phone).map((request) => <button className="requestRow" key={request.id} onClick={() => { setTab("requests"); setSelectedRequest(request.id); }}><div><strong>{request.status}</strong><span>{request.vehicle}</span></div><div><span>{request.problem.slice(0, 70)}</span></div></button>)}</div>}
                  </div>
                </>
              ) : <div className="emptyState"><h3>Select a contact</h3><p>Look up a customer, call or WhatsApp them, review their Namane request history, or add a new contact.</p></div>}
            </div>
          </section>
        )}

        {tab === "inventory" && (
          <section className="adminContent">
            <div className="adminPanel">
              <div className="panelHeading"><div><span className="kicker">Tyre stock</span><h2>Inventory</h2></div><button className="button buttonPrimary" onClick={() => setDraft({ id: crypto.randomUUID(), size: "", brand: "", condition: "New", quantity: 1, price: "", available: true, notes: "" })}>Add tyre</button></div>
              {inventory.length === 0 ? <div className="emptyState"><p>No tyre inventory has been added yet.</p></div> : <div className="inventoryGrid">{inventory.map((item) => <article key={item.id}><div><strong>{item.size}</strong><span>{item.brand} · {item.condition}</span></div><b>{item.quantity} · {item.price || "Price not set"}</b><span>{item.available ? "Available" : "Not available"}</span><div className="actions"><button className="button buttonLight" onClick={() => setDraft({ ...item })}>Edit</button><button className="button buttonLight" onClick={() => void deleteTyreInventoryItem(item.id).then(() => setInventory((items) => items.filter((i) => i.id !== item.id))).catch(() => setNotice("Could not delete inventory item."))}>Delete</button></div></article>)}</div>}
              {draft && <div className="adminPanel nested"><h3>{inventory.some((i) => i.id === draft.id) ? "Edit" : "Add"} tyre</h3><div className="formGrid"><label>Size<input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} /></label><label>Brand<input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} /></label><label>Condition<select value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value as TyreInventoryItem["condition"] })}><option>New</option><option>Used</option><option>Retreaded</option><option>Other</option></select></label><label>Quantity<input type="number" min="0" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} /></label><label>Price<input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label><label>Available<select value={String(draft.available)} onChange={(e) => setDraft({ ...draft, available: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></label><label className="fieldFull">Notes<textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label></div><div className="actions"><button className="button buttonPrimary" onClick={() => void saveInventory()}>Save</button><button className="button buttonLight" onClick={() => setDraft(null)}>Cancel</button></div></div>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ContactForm({ draft, onChange, editing }: { draft: ContactInput; onChange: (value: ContactInput) => void; editing: boolean }) {
  return <div className="formGrid">
    <label>Name<input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} /></label>
    <label>Phone / WhatsApp<input disabled={editing} value={draft.phone} onChange={(e) => onChange({ ...draft, phone: e.target.value })} /></label>
    <label>Business name <span>(optional)</span><input value={draft.businessName} onChange={(e) => onChange({ ...draft, businessName: e.target.value })} /></label>
    <label>WhatsApp Business<select value={String(draft.whatsappBusiness)} onChange={(e) => onChange({ ...draft, whatsappBusiness: e.target.value === "true", whatsapp: true })}><option value="false">No</option><option value="true">Yes</option></select></label>
    <label className="fieldFull">Business description <span>(optional)</span><textarea value={draft.businessDescription} onChange={(e) => onChange({ ...draft, businessDescription: e.target.value })} /></label>
    <label className="fieldFull">Notes <span>(optional)</span><textarea value={draft.notes} onChange={(e) => onChange({ ...draft, notes: e.target.value })} /></label>
  </div>;
}

export default function AdminPage() {
  return <AdminGate><Dashboard /></AdminGate>;
}
