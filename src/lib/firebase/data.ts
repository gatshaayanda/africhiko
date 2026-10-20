"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export const REQUEST_STATUSES = [
  "New",
  "Accepted",
  "In Progress",
  "Ready / Awaiting Customer",
  "Complete",
  "Cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type AssistanceRequest = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  vehicle: string;
  problem: string;
  notes: string;
  locationText: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  status: RequestStatus;
};

export type TyreInventoryItem = {
  id: string;
  size: string;
  brand: string;
  condition: "New" | "Used" | "Retreaded" | "Other";
  quantity: number;
  price: string;
  available: boolean;
  notes: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  whatsapp: boolean;
  whatsappBusiness: boolean;
  businessName: string;
  businessDescription: string;
  notes: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt">;

const requestsCollection = collection(db, "assistanceRequests");
const inventoryCollection = collection(db, "tyreInventory");
const contactsCollection = collection(db, "contacts");

export function normalizePhone(value: string) {
  let phone = value.trim().replace(/[^\d+]/g, "");
  if (phone.startsWith("267") && !phone.startsWith("+")) phone = "+" + phone;
  if (/^7\d{7}$/.test(phone)) phone = "+267" + phone;
  return phone;
}

export function createAssistanceRequest(data: Omit<AssistanceRequest, "id">) {
  const reference = doc(requestsCollection);
  const writePromise = setDoc(reference, data);
  return { id: reference.id, writePromise };
}

export async function getAssistanceRequests(): Promise<AssistanceRequest[]> {
  const snapshot = await getDocs(requestsCollection);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<AssistanceRequest, "id">),
  }));
}

export async function updateAssistanceStatus(id: string, status: RequestStatus) {
  await updateDoc(doc(db, "assistanceRequests", id), { status });
}

export async function getTyreInventory(): Promise<TyreInventoryItem[]> {
  const snapshot = await getDocs(inventoryCollection);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<TyreInventoryItem, "id">),
  }));
}

export async function saveTyreInventoryItem(item: TyreInventoryItem) {
  await setDoc(doc(db, "tyreInventory", item.id), item);
}

export async function deleteTyreInventoryItem(id: string) {
  await deleteDoc(doc(db, "tyreInventory", id));
}

export async function getContacts(): Promise<Contact[]> {
  const snapshot = await getDocs(contactsCollection);
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<Contact, "id">) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveContact(input: ContactInput, id?: string) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("A valid Botswana phone number is required.");

  const contactId = id || phone;
  const now = new Date().toISOString();
  const previous = id
    ? ((await getDocs(contactsCollection)).docs.find((item) => item.id === id)?.data() as Partial<Contact> | undefined)
    : undefined;

  await setDoc(
    doc(db, "contacts", contactId),
    {
      ...input,
      phone,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    },
    { merge: true },
  );

  return contactId;
}

export async function deleteContact(id: string) {
  await deleteDoc(doc(db, "contacts", id));
}

export async function importContacts(
  incoming: Array<Omit<Contact, "id" | "createdAt" | "updatedAt">>,
) {
  const existingSnapshot = await getDocs(contactsCollection);
  const existingByPhone = new Map<string, Contact>();

  existingSnapshot.docs.forEach((item) => {
    const data = item.data() as Omit<Contact, "id">;
    existingByPhone.set(normalizePhone(data.phone), { id: item.id, ...data });
  });

  const now = new Date().toISOString();
  const merged = new Map<string, Contact>();

  for (const raw of incoming) {
    const phone = normalizePhone(raw.phone);
    if (!phone) continue;

    const existing = existingByPhone.get(phone);
    const next: Contact = {
      id: existing?.id || phone,
      name: raw.name || existing?.name || "Unknown contact",
      phone,
      whatsapp: raw.whatsapp || existing?.whatsapp || false,
      whatsappBusiness: raw.whatsappBusiness || existing?.whatsappBusiness || false,
      businessName: raw.businessName || existing?.businessName || "",
      businessDescription: raw.businessDescription || existing?.businessDescription || "",
      notes: raw.notes || existing?.notes || "",
      source: raw.source || existing?.source || "whatsapp_import",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    merged.set(phone, next);
  }

  const batch = writeBatch(db);
  for (const contact of merged.values()) {
    batch.set(doc(db, "contacts", contact.id), contact, { merge: true });
  }
  await batch.commit();

  return {
    imported: merged.size,
    totalExisting: existingSnapshot.size,
  };
}
