"use client";

import {collection,doc,getDoc,getDocs,onSnapshot,query,setDoc,updateDoc,where} from "firebase/firestore";
import type {Unsubscribe} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

export const PLUG_REQUEST_STATUSES = [
  "New Request",
  "Quote Ready",
  "Awaiting Deposit",
  "Deposit Received",
  "Sourcing",
  "In Transit",
  "Ready",
  "Delivered",
  "Collected",
  "Cancelled",
] as const;
export type PlugRequestStatus = typeof PLUG_REQUEST_STATUSES[number];

export type PlugAttachment = {url:string;name:string;type:string;size:number};
export type PlugRequest = {
  id:string;
  customerId:string;
  customerName:string;
  phone:string;
  product:string;
  size:string;
  colour:string;
  notes:string;
  attachment?:PlugAttachment|null;
  createdAt:string;
  updatedAt:string;
  status:PlugRequestStatus;
  quotedPrice?:number;
  depositRequired?:number;
  depositPaid?:number;
  deliveryEstimate?:string;
  deliveryMethod?:"delivery"|"collection";
  deliveryDetails?:string;
  adminNote?:string;
  customerApprovedAt?:string;
  customerApprovedPrice?:number;
  customerApprovalSource?:string;
  customerApprovalUid?:string;
};

const requests = collection(db,"sourcingRequests");

export async function createPlugRequest(data:Omit<PlugRequest,"id">){
  const ref = doc(requests);
  await setDoc(ref,data);
  return ref.id;
}

export async function getPlugRequest(id:string):Promise<PlugRequest|null>{
  const snapshot=await getDoc(doc(db,"sourcingRequests",id));
  return snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<PlugRequest,"id">}:null;
}

export function subscribeToPlugRequest(id:string,onChange:(request:PlugRequest|null)=>void,onError:(error:Error)=>void):Unsubscribe{
  return onSnapshot(doc(db,"sourcingRequests",id),snapshot=>{
    onChange(snapshot.exists()?{id:snapshot.id,...snapshot.data() as Omit<PlugRequest,"id">}:null);
  },error=>onError(error instanceof Error?error:new Error("Request tracking is unavailable.")));
}

export async function getCustomerPlugRequests(uid:string):Promise<PlugRequest[]>{
  const snapshot=await getDocs(query(requests,where("customerId","==",uid)));
  return snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<PlugRequest,"id">}))
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}

export function subscribeToCustomerPlugRequests(uid:string,onChange:(items:PlugRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{
  return onSnapshot(query(requests,where("customerId","==",uid)),snapshot=>{
    onChange(snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<PlugRequest,"id">}))
      .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
  },error=>onError(error instanceof Error?error:new Error("Your sourcing requests are unavailable.")));
}

export function subscribeToAllPlugRequests(onChange:(items:PlugRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{
  return onSnapshot(requests,snapshot=>{
    onChange(snapshot.docs.map(item=>({id:item.id,...item.data() as Omit<PlugRequest,"id">}))
      .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
  },error=>onError(error instanceof Error?error:new Error("The sourcing queue is unavailable.")));
}

export async function updatePlugRequest(id:string,patch:Partial<Omit<PlugRequest,"id"|"customerId"|"createdAt">>){
  await updateDoc(doc(db,"sourcingRequests",id),{...patch,updatedAt:new Date().toISOString()});
}

export async function getPlugRequestCount(uid:string){
  const snapshot=await getDocs(query(requests,where("customerId","==",uid)));
  return snapshot.size;
}
