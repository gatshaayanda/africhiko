import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";

export const runtime="nodejs";

function adminApp(){
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("The Plug notifications are not configured yet. Add FIREBASE_ADMIN_KEY in Vercel.");
 const existing=getApps()[0];
 if(existing)return existing;
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
export async function POST(request:Request){
 try{
  const a=adminApp();
  const header=request.headers.get("authorization")||"";
  const match=header.match(/^Bearer\\s+(.+)$/i);
  if(!match)throw new Error("Admin authentication is required.");
  const uid=(await getAuth(a).verifyIdToken(match[1])).uid;
  const db=getFirestore(a);
  const admin=await db.collection("admins").doc(uid).get();
  if(!admin.exists||!["owner","staff"].includes(String(admin.data()?.role??"").toLowerCase())){
   return NextResponse.json({sent:0,error:"Only Plug staff can send request update notifications."},{status:403});
  }
  const {requestId}=await request.json() as {requestId?:unknown};
  if(typeof requestId!=="string"||!requestId)throw new Error("Missing request ID.");
  const snap=await db.collection("sourcingRequests").doc(requestId).get();
  if(!snap.exists)throw new Error("Sourcing request not found.");
  const data=snap.data()??{},customerId=String(data.customerId??"");
  if(!customerId)throw new Error("Sourcing request has no customer.");
  const pref=(await db.collection("notificationPreferences").doc(customerId).get()).data();
  if(!pref?.enabled)return NextResponse.json({sent:0,reason:"customer-not-enabled"});
  const tokens=await db.collection("notificationTokens").doc(customerId).collection("tokens").get();
  const validTokens=tokens.docs.map(doc=>({doc,token:String(doc.data().token??"")})).filter(item=>item.token);
  if(!validTokens.length)return NextResponse.json({sent:0,reason:"customer-no-device"});
  const status=String(data.status??"Your request has been updated.");
  const quote=typeof data.quotedPrice==="number"?" · Quote P"+data.quotedPrice.toFixed(2):"";
  const title="The Plug · "+status;
  const body=String(data.product??"Your sourcing request")+quote+" — open My Plug for details.";
  const base=(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug-pearl.vercel.app").replace(/\\/$/,"");
  const response=await getMessaging(a).sendEachForMulticast({
   tokens:validTokens.map(item=>item.token),
   notification:{title,body},
   data:{title,body,link:"/requests/"+requestId,requestId,type:"request-updated"},
   webpush:{fcmOptions:{link:base+"/requests/"+requestId},notification:{tag:"the-plug-request-"+requestId,icon:"/plug-icon.svg",badge:"/plug-icon.svg"}}
  });
  await Promise.all(response.responses.map(async(result,index)=>{
   if(result.success)return;
   const code=result.error?.code;
   if(code==="messaging/registration-token-not-registered"||code==="messaging/invalid-registration-token"){
    await validTokens[index].doc.ref.delete().catch(()=>{});
   }
  }));
  return NextResponse.json({sent:response.successCount,failed:response.failureCount});
 }catch(error){
  console.error("The Plug request notification failed:",error);
  return NextResponse.json({sent:0,error:error instanceof Error?error.message:"The Plug could not send the request update."},{status:400});
 }
}
