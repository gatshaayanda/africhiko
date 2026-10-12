import {createHash,timingSafeEqual} from "node:crypto";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {NextResponse} from "next/server";

export const runtime="nodejs";

function getAdminApp(){
 const existing=getApps()[0];if(existing)return existing;
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("Missing FIREBASE_ADMIN_KEY environment variable.");
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY must contain valid service-account JSON.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
function matchesWord(input:string,expected:string){
 const a=createHash("sha256").update(input).digest();
 const b=createHash("sha256").update(expected).digest();
 return timingSafeEqual(a,b)&&input.length>0;
}
export async function POST(request:Request){
 try{
  const expected=process.env.THE_PLUG_OPERATIONS_WORD;
  if(!expected)return NextResponse.json({error:"Operations access is not configured yet. Set THE_PLUG_OPERATIONS_WORD in Vercel."},{status:503});
  const body=await request.json().catch(()=>null) as {word?:unknown}|null;
  const word=typeof body?.word==="string"?body.word:"";
  if(!matchesWord(word,expected))return NextResponse.json({error:"Access denied. Check the access word and try again."},{status:401});
  const app=getAdminApp();
  const snapshot=await getFirestore(app).collection("admins").get();
  const owner=snapshot.docs.find(doc=>["owner","staff"].includes(String(doc.data().role??"").toLowerCase()));
  if(!owner)return NextResponse.json({error:"No authorized Operations account was found in the admins collection."},{status:403});
  const token=await getAuth(app).createCustomToken(owner.id);
  return NextResponse.json({token},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("Operations login failed:",error instanceof Error?error.message:"unknown error");
  return NextResponse.json({error:"Operations sign-in is temporarily unavailable. Check the server configuration."},{status:500});
 }
}
