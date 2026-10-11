import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
export const runtime="nodejs";
function app(){
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("The Plug notifications are not configured yet. Add FIREBASE_ADMIN_KEY in Vercel.");
 const existing=getApps()[0];if(existing)return existing;
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
export async function POST(request:Request){
 try{
  const header=request.headers.get("authorization")||"";
  const match=header.match(/^Bearer\s+(.+)$/i);
  if(!match)throw new Error("Missing Firebase authentication token.");
  const a=app(),decoded=await getAuth(a).verifyIdToken(match[1]);
  const body=await request.json().catch(()=>({})) as {deviceToken?:unknown};
  if(typeof body.deviceToken!=="string"||!body.deviceToken)throw new Error("This device is not registered for The Plug notifications yet.");
  const db=getFirestore(a),tokenId=encodeURIComponent(body.deviceToken);
  const tokenDoc=await db.collection("notificationTokens").doc(decoded.uid).collection("tokens").doc(tokenId).get();
  if(!tokenDoc.exists||tokenDoc.data()?.token!==body.deviceToken)throw new Error("This device token is not registered to your signed-in account. Enable notifications again and retry.");
  const adminDoc=await db.collection("admins").doc(decoded.uid).get();
  const isAdmin=adminDoc.exists&&["owner","staff"].includes(String(adminDoc.data()?.role??"").toLowerCase());
  const title=isAdmin?"The Plug operations alerts are on":"The Plug notifications are on";
  const bodyText=isAdmin?"This device is ready for sourcing-request and customer-reply alerts.":"This device is ready for sourcing-request updates and replies from The Plug.";
  const link=isAdmin?"/admin":"/account";
  const base=(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug-pearl.vercel.app");
  const result=await getMessaging(a).send({
   token:body.deviceToken,
   notification:{title,body:bodyText},
   data:{title,body:bodyText,link,test:"true"},
   webpush:{fcmOptions:{link:base+link},notification:{tag:"the-plug-test",icon:"/plug-icon.svg",badge:"/plug-icon.svg"}}
  });
  return NextResponse.json({sent:Boolean(result)});
 }catch(error){
  console.error("The Plug test notification failed:",error);
  return NextResponse.json({sent:false,error:error instanceof Error?error.message:"The Plug could not send a test notification."},{status:400});
 }
}
